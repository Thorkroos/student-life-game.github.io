import { createEmptyState } from '../core/gameState.js';
import { clamp, randomJitter, randInt } from '../core/random.js';
import { STAT_KEYS } from '../core/constants.js';

export function createCharacter(form, data) {
  const state = createEmptyState();
  const duration = data.durations.find(item => item.id === form.duration);
  const major = data.majors.find(item => item.id === form.major);
  const background = data.backgrounds.find(item => item.id === form.background);
  const goal = data.goals.find(item => item.id === form.goal);
  const city = pickRandom(data.cities);
  const accommodation = pickRandom(data.accommodations);

  state.playerName = form.playerName || '无名留学生';
  state.gender = form.gender || 'unspecified';
  state.duration = form.duration;
  state.major = form.major;
  state.background = form.background;
  state.goal = form.goal;
  state.disableLoveContent = Boolean(data.gameConfig.disableLoveContent);
  state.city = city?.id || '';
  state.accommodation = accommodation?.id || '';
  state.maxTurns = duration?.maxTurns || 40;

  for (const key of STAT_KEYS) {
    state.stats[key] = key === 'love' ? 0 : data.gameConfig.defaultBaseStat;
  }

  applyEffects(state, major?.effects || {});
  applyEffects(state, background?.effects || {});
  applyEffects(state, goal?.effects || {});
  applyEffects(state, city?.effects || {});
  applyEffects(state, accommodation?.effects || {});
  applyEffects(state, form.allocations || {});

  for (const key of STAT_KEYS) {
    if (key !== 'love') state.stats[key] += randomJitter(4);
    state.stats[key] = clamp(state.stats[key], data.gameConfig.statMin, data.gameConfig.statMax);
  }

  state.flags.push(
    `major_${state.major}`,
    `background_${state.background}`,
    `goal_${state.goal}`,
    `city_${state.city}`,
    `accommodation_${state.accommodation}`
  );
  return state;
}

function pickRandom(items = []) {
  if (!items.length) return null;
  return items[randInt(0, items.length - 1)];
}

function applyEffects(state, effects) {
  for (const [key, value] of Object.entries(effects)) {
    if (key in state.stats) state.stats[key] += value;
  }
}
