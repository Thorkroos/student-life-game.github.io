const BASE = './src/data/';

async function fetchJson(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`无法加载 ${path}: ${response.status}`);
  }
  return response.json();
}

async function loadEventFiles(index) {
  const groups = ['basic', 'hidden', 'advanced'];
  const all = [];
  for (const group of groups) {
    for (const relPath of index[group] || []) {
      const events = await fetchJson(`${BASE}events/${relPath}`);
      all.push(...events.map(event => ({ ...event, sourceFile: relPath })));
    }
  }
  return all;
}

export async function loadGameData() {
  const [
    gameConfig,
    phases,
    statLabels,
    durations,
    majors,
    backgrounds,
    goals,
    eventIndex,
    endings,
    endingRules,
    furniture,
    datingCharacters
  ] = await Promise.all([
    fetchJson(`${BASE}config/gameConfig.json`),
    fetchJson(`${BASE}config/phases.json`),
    fetchJson(`${BASE}config/statLabels.json`),
    fetchJson(`${BASE}character/durations.json`),
    fetchJson(`${BASE}character/majors.json`),
    fetchJson(`${BASE}character/backgrounds.json`),
    fetchJson(`${BASE}character/goals.json`),
    fetchJson(`${BASE}events/eventIndex.json`),
    fetchJson(`${BASE}endings/endings.json`),
    fetchJson(`${BASE}endings/endingRules.json`),
    fetchJson(`${BASE}room/furniture.json`),
    fetchJson(`${BASE}characters/datingCharacters.json`)
  ]);

  const events = await loadEventFiles(eventIndex);

  return {
    gameConfig,
    phases,
    statLabels,
    durations,
    majors,
    backgrounds,
    goals,
    events,
    endings,
    endingRules,
    furniture,
    datingCharacters
  };
}
