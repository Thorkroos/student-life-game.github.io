import { createCharacter } from '../systems/characterCreation.js';
import { saveGame } from '../systems/saveSystem.js';
import { startTurn } from '../core/gameLoop.js';
import { MAIN_STAT_KEYS, STAT_NAMES } from '../core/constants.js';

const ALLOC_KEYS = [...MAIN_STAT_KEYS, 'identity'];

export function renderCreator(app, data) {
  const allocations = Object.fromEntries(ALLOC_KEYS.map(key => [key, 0]));
  let remaining = data.gameConfig.freePoints;
  const playableGoals = data.goals.filter(item => !item.hidden);

  const options = (items) => items.map(item => {
    const difficulty = item.difficulty ? `（${item.difficulty}）` : '';
    return `<option value="${item.id}">${item.label}${difficulty}</option>`;
  }).join('');

  app.innerHTML = `
    <main class="container">
      <div class="topbar">
        <div><span class="badge">角色创建</span></div>
        <button class="btn small" id="back-start">返回</button>
      </div>
      <section class="grid creator-grid">
        <div class="card">
          <h2>你的开局</h2>
          <div class="form-row">
            <label>昵称</label>
            <input id="player-name" value="无名留学生" />
          </div>
          <div class="form-row">
            <label>性别/称呼</label>
            <select id="gender">
              <option value="unspecified">不特别说明</option>
              <option value="female">女主视角</option>
              <option value="male">男主视角</option>
              <option value="custom">自定义/模糊</option>
            </select>
          </div>
          <div class="form-row">
            <label>留学时长</label>
            <select id="duration">${options(data.durations)}</select>
            <div id="duration-desc" class="option-desc"></div>
          </div>
          <div class="form-row">
            <label>专业大类</label>
            <select id="major">${options(data.majors)}</select>
            <div id="major-desc" class="option-desc"></div>
          </div>
          <div class="form-row">
            <label>家庭背景</label>
            <select id="background">${options(data.backgrounds)}</select>
            <div id="background-desc" class="option-desc"></div>
          </div>
          <div class="form-row">
            <label>出国目标</label>
            <select id="goal">${options(playableGoals)}</select>
            <div id="goal-desc" class="option-desc"></div>
          </div>
          <div class="actions">
            <button class="btn primary" id="start-game">落地澳洲</button>
          </div>
        </div>
        <aside class="card soft">
          <h2>自由分配点数</h2>
          <p>剩余点数：<strong id="remaining">${remaining}</strong></p>
          <div id="alloc-list"></div>
          <p class="footer-note">开局还会有轻微随机波动。城市和住宿会随机分配，并影响部分隐藏事件。</p>
        </aside>
      </section>
    </main>`;

  function updateDescriptions() {
    setDesc('duration', data.durations);
    setDesc('major', data.majors);
    setDesc('background', data.backgrounds);
    setDesc('goal', playableGoals);
  }

  function setDesc(id, items) {
    const selected = document.querySelector(`#${id}`).value;
    const item = items.find(x => x.id === selected);
    const difficulty = item?.difficulty ? `难度：${item.difficulty}。` : '';
    document.querySelector(`#${id}-desc`).textContent = `${difficulty}${item?.description || ''}`;
  }

  function renderAlloc() {
    const wrap = document.querySelector('#alloc-list');
    wrap.innerHTML = ALLOC_KEYS.map(key => `
      <div class="alloc-row slider-row">
        <label for="alloc-${key}">${STAT_NAMES[key]}</label>
        <input class="alloc-slider" id="alloc-${key}" type="range" min="0" max="20" value="${allocations[key]}" data-alloc="${key}" />
        <span class="stat-value">${allocations[key]}</span>
      </div>`).join('');
    document.querySelector('#remaining').textContent = remaining;
    wrap.querySelectorAll('[data-alloc]').forEach(slider => slider.addEventListener('input', () => {
      const key = slider.dataset.alloc;
      const current = allocations[key];
      let next = Number(slider.value);
      const delta = next - current;
      if (delta > remaining) next = current + remaining;
      allocations[key] = Math.max(0, Math.min(20, next));
      remaining -= allocations[key] - current;
      renderAlloc();
    }));
  }

  ['duration', 'major', 'background', 'goal'].forEach(id => {
    document.querySelector(`#${id}`).addEventListener('change', updateDescriptions);
  });
  document.querySelector('#back-start').addEventListener('click', async () => {
    const { renderStart } = await import('./renderStart.js');
    renderStart(app, data);
  });
  document.querySelector('#start-game').addEventListener('click', () => {
    const form = {
      playerName: document.querySelector('#player-name').value.trim(),
      gender: document.querySelector('#gender').value,
      duration: document.querySelector('#duration').value,
      major: document.querySelector('#major').value,
      background: document.querySelector('#background').value,
      goal: document.querySelector('#goal').value,
      allocations
    };
    const state = createCharacter(form, data);
    saveGame(state);
    startTurn(app, data, state);
  });

  updateDescriptions();
  renderAlloc();
}
