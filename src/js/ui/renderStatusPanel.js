import { STAT_NAMES, MAIN_STAT_KEYS } from '../core/constants.js';
import { getStatLabel } from '../systems/statsSystem.js';
import { getRoomLabel } from '../systems/roomSystem.js';
import { getAdminTaskProgress } from '../systems/adminSystem.js';
import { getAccommodationLabel, getCityLabel } from '../systems/contextSystem.js';
import { getPhaseProgress } from '../engines/progressEngine.js';

export function timelineHeaderHtml(state, data) {
  const phaseInfo = getPhaseProgress(state, data);
  const phaseItems = data.phases.map((phase, index) => {
    const stateClass = index < phaseInfo.phaseIndex ? 'done' : index === phaseInfo.phaseIndex ? 'active' : '';
    return `<span class="timeline-step ${stateClass}">${phase.label}</span>`;
  }).join('');

  return `
    <section class="timeline-band">
      <div class="timeline-main">
        <span class="kicker">ACADEMIC TIMELINE</span>
        <h2>${phaseInfo.phase.label}</h2>
        <p>第 ${state.turn + 1} / ${state.maxTurns} 回合 · 总进度 ${state.progress}% · 当前阶段 ${phaseInfo.phaseProgress}%</p>
      </div>
      <div class="timeline-progress">
        <div class="progress-caption">
          <span>当前阶段</span>
          <strong>${phaseInfo.nextPhase ? `下一阶段：${phaseInfo.nextPhase.label}` : '最终结算'}</strong>
        </div>
        <div class="progress-wrap large"><div class="progress-bar" style="width:${phaseInfo.phaseProgress}%"></div></div>
        <div class="timeline-steps">${phaseItems}</div>
      </div>
    </section>`;
}

export function statusPanelHtml(state, data) {
  const adminProgress = getAdminTaskProgress(state, data);
  const completedAdminTasks = adminProgress.tasks.filter(task => task.completed);
  const adminItems = completedAdminTasks.length
    ? completedAdminTasks.map(task => `
    <div class="check-row done">
      <span>✓</span>
      <strong>${task.label}</strong>
      <small>${task.buff || task.description || '已完成，后续相关风险下降。'}</small>
    </div>`).join('')
    : '<p class="empty-note">还没有完成的行政事项。</p>';
  const rows = MAIN_STAT_KEYS.map(key => `
    <div class="status-row">
      <span>${STAT_NAMES[key]}</span>
      <strong>${getStatLabel(key, state.stats[key], data)}</strong>
    </div>`).join('');
  const phaseInfo = getPhaseProgress(state, data);
  return `
    <aside class="card status-card">
      <h3>${state.playerName}</h3>
      <div class="phase-panel">
        <span>当前时期</span>
        <strong>${phaseInfo.phase.label}</strong>
        <small>第 ${state.turn + 1} / ${state.maxTurns} 回合</small>
      </div>
      <div class="context-panel">
        <div><span>城市</span><strong>${getCityLabel(state, data)}</strong></div>
        <div><span>住宿</span><strong>${getAccommodationLabel(state, data)}</strong></div>
      </div>
      <div class="progress-caption">
        <span>总进度</span>
        <strong>${state.progress}%</strong>
      </div>
      <div class="progress-wrap"><div class="progress-bar" style="width:${state.progress}%"></div></div>
      <div class="admin-panel">
        <div class="progress-caption">
          <span>已完成行政</span>
          <strong>${adminProgress.completedCount}/${adminProgress.totalCount}</strong>
        </div>
        <div class="admin-list">${adminItems}</div>
      </div>
      ${rows}
      <div class="status-row"><span>房间</span><strong>${getRoomLabel(state, data)}</strong></div>
      <div class="status-row"><span>目标完成度</span><strong>${state.goalScore ?? '???'}</strong></div>
    </aside>`;
}
