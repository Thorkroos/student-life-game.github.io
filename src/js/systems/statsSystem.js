import { clamp } from '../core/random.js';

export function applyStatEffects(state, effects, config) {
  for (const [key, value] of Object.entries(effects || {})) {
    if (key === 'love' && state.disableLoveContent !== false) continue;
    if (!(key in state.stats)) continue;
    state.stats[key] = clamp(state.stats[key] + Number(value), config.statMin, config.statMax);
  }
}

export function getStatLabel(statKey, value, data) {
  const labels = data.statLabels[statKey] || [];
  const matched = labels.find(item => value >= item.min);
  return matched?.label || String(value);
}

export function formatStatChanges(effects = {}) {
  return Object.entries(effects)
    .filter(([, value]) => Number(value) !== 0)
    .map(([key, value]) => `${key} ${value > 0 ? '+' : ''}${value}`);
}
