import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { createCharacter } from '../src/js/systems/characterCreation.js';
import { getNextEvent } from '../src/js/engines/eventEngine.js';
import { applyChoice } from '../src/js/engines/effectEngine.js';
import { advanceProgress, updatePhase } from '../src/js/engines/progressEngine.js';
import { determineEnding } from '../src/js/engines/endingEngine.js';

const RUNS = Number(process.env.SIM_RUNS || 1_000_000);
const SEED = Number(process.env.SIM_SEED || 20260713);
const LOG_EVERY_STEP = process.env.SIM_LOG_STEPS !== '0';
const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'tests');
const STATS = ['money', 'sanity', 'gpa', 'english', 'lifeSkill', 'social', 'visa', 'career', 'identity'];
const MODES = ['random', 'safe', 'goal'];

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const stepLogPath = path.join(OUT_DIR, `${stamp}-steps-${RUNS}.jsonl.gz`);
const runLogPath = path.join(OUT_DIR, `${stamp}-runs-${RUNS}.jsonl.gz`);
const summaryPath = path.join(OUT_DIR, `${stamp}-summary-${RUNS}.json`);

let rngState = SEED >>> 0;
Math.random = seededRandom;

const data = loadData();
const playableGoals = data.goals.filter(goal => !goal.hidden);
const eventById = new Map(data.events.map(event => [event.id, event]));
const stepLog = LOG_EVERY_STEP ? gzipWriter(stepLogPath) : null;
const runLog = gzipWriter(runLogPath);
const summary = createSummary();

for (let run = 1; run <= RUNS; run += 1) {
  const context = createRunContext(run);
  const state = createCharacter({
    playerName: `sim_${run}`,
    gender: 'unspecified',
    duration: context.duration,
    major: context.major,
    background: context.background,
    goal: context.goal,
    allocations: context.allocations
  }, data);

  const runEvents = [];
  const adminByEnd = new Set();

  while (state.turn < state.maxTurns && state.progress < 100) {
    updatePhase(state, data);
    const beforeStats = { ...state.stats };
    const beforeFlags = new Set(state.flags || []);
    const event = getNextEvent(state, data.events, data);
    const choiceIndex = chooseChoiceIndex(event, context.goal, context.mode);
    const choice = event.choices[choiceIndex];
    const resultText = applyChoice(state, event, choice, data);
    const afterStats = { ...state.stats };
    const statDelta = diffStats(beforeStats, afterStats);
    const flagsAdded = (state.flags || []).filter(flag => !beforeFlags.has(flag));

    const stepRecord = {
      run,
      step: state.turn + 1,
      mode: context.mode,
      duration: context.duration,
      goal: context.goal,
      major: context.major,
      background: context.background,
      city: state.city,
      accommodation: state.accommodation,
      phase: state.phase,
      progress: state.progress,
      eventId: event.id,
      category: event.category,
      type: event.type,
      sourceFile: event.sourceFile || null,
      choiceIndex,
      choiceText: choice.text,
      effects: choice.effects || {},
      statDelta,
      statsAfter: afterStats,
      flagsAdded,
      resultText
    };

    if (stepLog) await writeLogLine(stepLog, stepRecord);
    recordStep(summary, state, event, choice, choiceIndex, statDelta);
    runEvents.push(event.id);
    for (const task of data.adminTasks) {
      if (state.flags.includes(task.flag)) adminByEnd.add(task.id);
    }

    advanceProgress(state, data);
  }

  const ending = determineEnding(state, data);
  const runRecord = {
    run,
    mode: context.mode,
    duration: context.duration,
    goal: context.goal,
    major: context.major,
    background: context.background,
    city: state.city,
    accommodation: state.accommodation,
    endingId: ending.id,
    endingType: ending.type,
    goalScore: state.goalScore,
    finalStats: state.stats,
    adminCompleted: adminByEnd.size,
    triggeredEvents: runEvents.length,
    fallbackEvents: runEvents.filter(id => id.startsWith('fallback_')).length
  };

  await writeLogLine(runLog, runRecord);
  recordRun(summary, runRecord);

  if (run % 100_000 === 0) {
    console.error(`simulated ${run}/${RUNS}`);
  }
}

await closeWriter(stepLog);
await closeWriter(runLog);

summary.meta = {
  runs: RUNS,
  seed: SEED,
  generatedAt: new Date().toISOString(),
  stepLogPath: LOG_EVERY_STEP ? stepLogPath : null,
  runLogPath,
  summaryPath
};
summary.staticAnalysis = staticAnalysis(data, summary);
summary.findings = buildFindings(data, summary);

fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf8');
console.log(JSON.stringify(summary.meta, null, 2));

function loadData() {
  const read = rel => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
  const eventIndex = read('src/data/events/eventIndex.json');
  const events = Object.values(eventIndex)
    .flat()
    .flatMap(file => read(`src/data/events/${file}`).map(event => ({ ...event, sourceFile: file })));
  return {
    gameConfig: read('src/data/config/gameConfig.json'),
    phases: read('src/data/config/phases.json'),
    statLabels: read('src/data/config/statLabels.json'),
    durations: read('src/data/character/durations.json'),
    majors: read('src/data/character/majors.json'),
    backgrounds: read('src/data/character/backgrounds.json'),
    goals: read('src/data/character/goals.json'),
    cities: read('src/data/config/cities.json'),
    accommodations: read('src/data/config/accommodations.json'),
    adminTasks: read('src/data/config/adminTasks.json'),
    endings: read('src/data/endings/endings.json'),
    endingRules: read('src/data/endings/endingRules.json'),
    furniture: read('src/data/room/furniture.json'),
    events
  };
}

function createRunContext(run) {
  const mode = MODES[run % MODES.length];
  const duration = pick(data.durations).id;
  const goal = pick(playableGoals).id;
  const major = pick(data.majors).id;
  const background = pick(data.backgrounds).id;
  return {
    mode,
    duration,
    goal,
    major,
    background,
    allocations: allocatePoints(mode, goal)
  };
}

function allocatePoints(mode, goalId) {
  const allocations = Object.fromEntries(STATS.map(key => [key, 0]));
  let points = data.gameConfig.freePoints;
  const goal = data.goals.find(item => item.id === goalId);

  if (mode === 'goal') {
    const weighted = Object.entries(goal.scoreWeights || {})
      .filter(([key]) => key !== 'love' && key in allocations)
      .sort((a, b) => b[1] - a[1]);
    for (const [key] of weighted) {
      const add = Math.min(20, points);
      allocations[key] += add;
      points -= add;
      if (!points) return allocations;
    }
  }

  if (mode === 'safe') {
    for (const key of ['sanity', 'money', 'gpa', 'visa']) {
      const add = Math.min(10, points);
      allocations[key] += add;
      points -= add;
    }
  }

  while (points > 0) {
    const key = pick(STATS);
    if (allocations[key] >= 20) continue;
    allocations[key] += 1;
    points -= 1;
  }
  return allocations;
}

function chooseChoiceIndex(event, goalId, mode) {
  const choices = event.choices || [];
  if (!choices.length) return 0;
  if (mode === 'random') return randInt(0, choices.length - 1);

  let bestIndex = 0;
  let bestScore = -Infinity;
  for (let index = 0; index < choices.length; index += 1) {
    const score = scoreChoice(choices[index], goalId, mode) + seededRandom() * 0.0001;
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  }
  return bestIndex;
}

function scoreChoice(choice, goalId, mode) {
  const effects = choice.effects || {};
  if (mode === 'safe') {
    return (effects.sanity || 0) * 0.35
      + (effects.money || 0) * 0.22
      + (effects.gpa || 0) * 0.15
      + (effects.visa || 0) * 0.15
      + (effects.lifeSkill || 0) * 0.12
      + (effects.career || 0) * 0.04;
  }

  const goal = data.goals.find(item => item.id === goalId);
  let score = 0;
  for (const [key, value] of Object.entries(effects)) {
    score += (goal?.scoreWeights?.[key] || 0) * value;
  }
  return score + (effects.sanity || 0) * 0.06 + (effects.lifeSkill || 0) * 0.03;
}

function createSummary() {
  const eventStats = Object.fromEntries(data.events.map(event => [event.id, {
    count: 0,
    byPhase: {},
    byMode: {},
    choices: {},
    sourceFile: event.sourceFile,
    category: event.category,
    type: event.type
  }]));

  return {
    meta: {},
    totals: {
      runs: 0,
      realEvents: 0,
      fallbackEvents: 0,
      datingEvents: 0
    },
    endings: {},
    byGoal: {},
    byMode: {},
    byDuration: {},
    byCity: {},
    byAccommodation: {},
    finalStats: Object.fromEntries(STATS.map(key => [key, { sum: 0, min: 101, max: -1, low15: 0, high85: 0 }])),
    adminCompletion: {
      sum: 0,
      distribution: {}
    },
    eventStats,
    phaseEventCounts: {},
    effectTotals: Object.fromEntries(STATS.map(key => [key, 0])),
    effectAbsTotals: Object.fromEntries(STATS.map(key => [key, 0])),
    extremeChoices: []
  };
}

function recordStep(summary, state, event, choice, choiceIndex, statDelta) {
  if (event.id.startsWith('fallback_')) summary.totals.fallbackEvents += 1;
  else summary.totals.realEvents += 1;
  if (event.type === 'dating') summary.totals.datingEvents += 1;

  const eventStat = summary.eventStats[event.id] || (summary.eventStats[event.id] = {
    count: 0,
    byPhase: {},
    byMode: {},
    choices: {},
    sourceFile: event.sourceFile || null,
    category: event.category,
    type: event.type
  });
  eventStat.count += 1;
  increment(eventStat.byPhase, state.phase);
  increment(eventStat.choices, String(choiceIndex));
  increment(summary.phaseEventCounts, state.phase);

  for (const [key, value] of Object.entries(statDelta)) {
    summary.effectTotals[key] += value;
    summary.effectAbsTotals[key] += Math.abs(value);
    if (Math.abs(value) >= 10) {
      summary.extremeChoices.push({
        eventId: event.id,
        choiceText: choice.text,
        stat: key,
        delta: value
      });
      if (summary.extremeChoices.length > 200) summary.extremeChoices.shift();
    }
  }
}

function recordRun(summary, run) {
  summary.totals.runs += 1;
  increment(summary.endings, run.endingType);
  incrementNested(summary.byGoal, run.goal, run.endingType);
  incrementNested(summary.byMode, run.mode, run.endingType);
  incrementNested(summary.byDuration, run.duration, run.endingType);
  incrementNested(summary.byCity, run.city, run.endingType);
  incrementNested(summary.byAccommodation, run.accommodation, run.endingType);

  summary.adminCompletion.sum += run.adminCompleted;
  increment(summary.adminCompletion.distribution, String(run.adminCompleted));

  for (const key of STATS) {
    const value = run.finalStats[key];
    const stat = summary.finalStats[key];
    stat.sum += value;
    stat.min = Math.min(stat.min, value);
    stat.max = Math.max(stat.max, value);
    if (value <= 15) stat.low15 += 1;
    if (value >= 85) stat.high85 += 1;
  }
}

function staticAnalysis(data, summary) {
  const addedFlags = new Set(data.events.flatMap(event => event.choices.flatMap(choice => choice.flagsAdd || [])));
  const requiredFlags = new Set(data.events.flatMap(event => event.conditions?.requiredFlags || []));
  const blockedFlags = new Set(data.events.flatMap(event => event.conditions?.blockedFlags || []));
  const hiddenEvents = data.events.filter(event => event.category === 'hidden').map(event => event.id);
  const normalEvents = data.events.filter(event => event.category !== 'hidden' && !event.id.startsWith('fallback_'));
  const hardToTriggerNormal = normalEvents
    .filter(event => (summary.eventStats[event.id]?.count || 0) < RUNS * 0.001)
    .map(event => ({
      id: event.id,
      title: event.title,
      category: event.category,
      type: event.type,
      count: summary.eventStats[event.id]?.count || 0,
      sourceFile: event.sourceFile,
      phase: event.phase
    }));

  return {
    addedFlags: [...addedFlags].sort(),
    requiredFlags: [...requiredFlags].sort(),
    blockedFlags: [...blockedFlags].sort(),
    requiredFlagsNeverAdded: [...requiredFlags].filter(flag => !addedFlags.has(flag)).sort(),
    hiddenEvents,
    hardToTriggerNormal,
    statLabelChecks: checkStatLabels(data.statLabels)
  };
}

function buildFindings(data, summary) {
  const findings = [];
  const heByGoal = {};
  for (const goal of playableGoals) {
    const bucket = summary.byGoal[goal.id] || {};
    const total = Object.values(bucket).reduce((sum, value) => sum + value, 0);
    const heRate = total ? (bucket.HE || 0) / total : 0;
    heByGoal[goal.id] = Number(heRate.toFixed(4));
    if (heRate < 0.35) {
      findings.push({
        type: 'goal_difficulty',
        severity: 'medium',
        message: `${goal.label} HE rate is ${(heRate * 100).toFixed(1)}%; consider marking as difficult or easing route events.`
      });
    }
  }

  const normalLow = summary.staticAnalysis?.hardToTriggerNormal || [];
  if (normalLow.length) {
    findings.push({
      type: 'low_frequency_events',
      severity: 'medium',
      message: `${normalLow.length} non-hidden events triggered in less than 0.1% of runs.`,
      eventIds: normalLow.map(event => event.id).slice(0, 30)
    });
  }

  if (summary.totals.datingEvents > 0) {
    findings.push({
      type: 'love_content_visibility',
      severity: 'high',
      message: `Dating events triggered ${summary.totals.datingEvents} times despite love content being hidden.`
    });
  }

  return {
    heByGoal,
    items: findings
  };
}

function checkStatLabels(labels) {
  const checks = {};
  for (const [key, ranges] of Object.entries(labels)) {
    checks[key] = {
      sortedDescending: ranges.every((item, index) => index === 0 || item.min <= ranges[index - 1].min),
      coversZero: ranges.some(item => item.min === 0),
      topMin: ranges[0]?.min ?? null,
      bottomLabel: ranges[ranges.length - 1]?.label ?? null
    };
  }
  return checks;
}

function diffStats(before, after) {
  const diff = {};
  for (const key of Object.keys(after)) {
    const delta = after[key] - before[key];
    if (delta !== 0) diff[key] = delta;
  }
  return diff;
}

function increment(target, key) {
  target[key] = (target[key] || 0) + 1;
}

function incrementNested(target, key, nestedKey) {
  target[key] ||= {};
  increment(target[key], nestedKey);
}

function pick(items) {
  return items[randInt(0, items.length - 1)];
}

function randInt(min, max) {
  return Math.floor(seededRandom() * (max - min + 1)) + min;
}

function seededRandom() {
  rngState = (rngState + 0x6D2B79F5) >>> 0;
  let t = rngState;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function gzipWriter(filePath) {
  const file = fs.createWriteStream(filePath);
  const gzip = zlib.createGzip({ level: 6 });
  gzip.setMaxListeners(0);
  gzip.pipe(file);
  return {
    file,
    gzip,
    buffer: '',
    bufferLimit: 1024 * 1024
  };
}

async function writeLogLine(writer, record) {
  writer.buffer += `${JSON.stringify(record)}\n`;
  if (writer.buffer.length >= writer.bufferLimit) {
    await flushWriter(writer);
  }
}

function flushWriter(writer) {
  if (!writer || !writer.buffer) return Promise.resolve();
  const chunk = writer.buffer;
  writer.buffer = '';
  if (writer.gzip.write(chunk)) return Promise.resolve();
  return new Promise(resolve => {
    writer.gzip.once('drain', resolve);
  });
}

async function closeWriter(writer) {
  if (!writer) return Promise.resolve();
  await flushWriter(writer);
  return new Promise((resolve, reject) => {
    writer.file.once('finish', resolve);
    writer.file.once('error', reject);
    writer.gzip.once('error', reject);
    writer.gzip.end();
  });
}
