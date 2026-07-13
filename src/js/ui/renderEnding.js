import { REPORT_STAT_KEYS, STAT_NAMES } from '../core/constants.js';
import { getUnlockedAchievements } from '../systems/achievementSystem.js';
import { clearSave } from '../systems/saveSystem.js';
import { renderStart } from './renderStart.js';

export function renderEnding(app, data, state, ending) {
  const goal = data.goals.find(item => item.id === state.goal)?.label || state.goal;
  const achievements = getUnlockedAchievements(state);

  app.innerHTML = `
    <main class="container">
      <section class="hero">
        <p class="kicker">ENDING</p>
        <div class="ending-type">${ending.type}</div>
        <h1>${ending.title}</h1>
        <p>${ending.description}</p>
        <p><strong>开局目标：</strong>${goal}　<strong>目标完成度：</strong>${state.goalScore ?? ending.goalScore ?? '???'}</p>
        <div class="report-grid">
          ${REPORT_STAT_KEYS.map(key => `
            <div class="report-item">
              <span>${STAT_NAMES[key]}</span>
              <strong>${state.stats[key]}</strong>
            </div>`).join('')}
        </div>
        <div class="card soft" style="margin-top:18px">
          <h3>结算摘要</h3>
          <p>${ending.summary || '你完成了一段留学生活。它不一定体面，但确实发生过。'}</p>
          <p><strong>获得称号：</strong>${achievements.length ? achievements.join(' / ') : '暂无'}</p>
          <p><strong>触发事件数：</strong>${state.triggeredEvents.length}</p>
        </div>
        <div class="actions">
          <button class="btn primary" id="new-run">再开一局</button>
          <button class="btn danger" id="clear-save">清除当前存档</button>
        </div>
      </section>
    </main>`;

  document.querySelector('#new-run').addEventListener('click', () => {
    clearSave();
    renderStart(app, data);
  });
  document.querySelector('#clear-save').addEventListener('click', () => {
    clearSave();
    alert('当前存档已清除。');
  });
}
