import { clamp } from '../core/random.js';
import { applyStatEffects } from '../systems/statsSystem.js';
import { addFurnitureAndUpdateComfort } from '../systems/roomSystem.js';

export function applyChoice(state, event, choice, data) {
  applyStatEffects(state, choice.effects || {}, data.gameConfig);

  for (const flag of choice.flagsAdd || []) {
    if (!state.flags.includes(flag)) state.flags.push(flag);
  }
  for (const flag of choice.flagsRemove || []) {
    state.flags = state.flags.filter(item => item !== flag);
  }
  for (const item of choice.furnitureAdd || []) {
    addFurnitureAndUpdateComfort(state, item, data);
  }

  if (event && event.id && !state.triggeredEvents.includes(event.id)) {
    state.triggeredEvents.push(event.id);
  }

  if (event?.type) {
    state.recentTypes = [event.type, ...(state.recentTypes || [])].slice(0, 3);
  }

  for (const key of Object.keys(state.stats)) {
    state.stats[key] = clamp(state.stats[key], data.gameConfig.statMin, data.gameConfig.statMax);
  }

  return choice.resultText || '你做出了选择。生活没有立刻给你答案，但数值已经悄悄变了。';
}
