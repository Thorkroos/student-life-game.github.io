import { STAT_NAMES, MAIN_STAT_KEYS } from '../core/constants.js';
import { getStatLabel } from '../systems/statsSystem.js';
import { getRoomLabel } from '../systems/roomSystem.js';
import { getPhaseLabel } from '../engines/progressEngine.js';

export function statusPanelHtml(state, data) {
  const rows = MAIN_STAT_KEYS.map(key => `
    <div class="status-row">
      <span>${STAT_NAMES[key]}</span>
      <strong>${getStatLabel(key, state.stats[key], data)}</strong>
    </div>`).join('');
  const phase = getPhaseLabel(state, data);
  return `
    <aside class="card">
      <h3>${state.playerName}</h3>
      <div class="pill">${phase} · Turn ${state.turn}/${state.maxTurns}</div>
      <div class="progress-wrap"><div class="progress-bar" style="width:${state.progress}%"></div></div>
      ${rows}
      <div class="status-row"><span>房间</span><strong>${getRoomLabel(state, data)}</strong></div>
      <div class="status-row"><span>目标完成度</span><strong>${state.goalScore ?? '???'}</strong></div>
    </aside>`;
}
