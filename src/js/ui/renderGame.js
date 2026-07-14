import { statusPanelHtml, timelineHeaderHtml } from './renderStatusPanel.js';
import { saveGame, clearSave } from '../systems/saveSystem.js';
import { renderStart } from './renderStart.js';

export function renderGame(app, data, state, event, handlers = {}) {
  const selectedGoal = data.goals.find(item => item.id === state.goal)?.label || state.goal;
  const selectedMajor = data.majors.find(item => item.id === state.major)?.label || state.major;
  const resultText = handlers.resultText || '';
  const chosenText = handlers.chosenText || '';
  const choicesDisabled = Boolean(resultText);

  app.innerHTML = `
    <main class="container">
      <div class="topbar">
        <div>
          <span class="badge">${selectedMajor}</span>
          <span class="badge">${selectedGoal}</span>
          <span class="badge">${event?.category || 'basic'} / ${event?.type || 'life'}</span>
          <span class="badge">事件池 ${state.availableEventCount ?? '-'}</span>
        </div>
        <div class="actions" style="margin:0">
          <button class="btn small" id="manual-save">保存</button>
          <button class="btn small danger" id="quit-game">回到首页</button>
        </div>
      </div>
      ${timelineHeaderHtml(state, data)}
      <section class="grid game-grid">
        ${statusPanelHtml(state, data)}
        <article class="card event-card">
          <h2 class="event-title">${event?.title || '普通的一天'}</h2>
          <div class="event-text">${event?.text || ''}</div>
          ${chosenText ? `<p class="footer-note">你的选择：${chosenText}</p>` : ''}
          ${resultText ? `<div class="result-text">${resultText}</div>` : ''}
          <div class="choice-list">
            ${resultText
              ? `<button class="btn primary" id="next-turn">进入下一阶段</button>`
              : (event?.choices || []).map((choice, index) => `<button class="choice-btn" data-choice="${index}" ${choicesDisabled ? 'disabled' : ''}>${choice.text}</button>`).join('')
            }
          </div>
        </article>
        <aside class="card soft hint-card">
          <h3>当前提示</h3>
          <p>${getHint(state)}</p>
          <p class="footer-note">候选事件：${(state.availableEventIds || []).slice(0, 4).join(' / ') || 'fallback'}</p>
          <p class="footer-note">具体数值隐藏，通关后会显示完整报告。</p>
        </aside>
      </section>
    </main>`;

  document.querySelector('#manual-save').addEventListener('click', () => {
    saveGame(state);
    alert('已保存到浏览器本地存档。');
  });
  document.querySelector('#quit-game').addEventListener('click', () => {
    if (confirm('回到首页？当前进度已保存。')) renderStart(app, data);
  });

  if (resultText) {
    document.querySelector('#next-turn').addEventListener('click', handlers.onNext);
  } else {
    document.querySelectorAll('[data-choice]').forEach(btn => {
      btn.addEventListener('click', () => handlers.onChoice(event.choices[Number(btn.dataset.choice)]));
    });
  }
}

function getHint(state) {
  const s = state.stats;
  if (s.sanity <= 25) return '你的精神状态已经很危险，接下来的选项可能会变得不太理性。';
  if (s.money <= 25) return '钱快见底了，打工、二手家具和向家里开口都可能进入事件池。';
  if (s.visa <= 30) return '签证压力开始变大，后期可能触发倒计时事件。';
  if (s.identity >= 75) return '你越来越清楚自己想要什么，这会影响最终结局。';
  return '每个选择都有收益，也有代价。别只看眼前的加减。';
}
