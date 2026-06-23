import { loadGame, clearSave } from '../systems/saveSystem.js';
import { renderCreator } from './renderCreator.js';
import { startTurn } from '../core/gameLoop.js';

export function renderStart(app, data) {
  const saved = loadGame();
  app.innerHTML = `
    <main class="container">
      <section class="hero">
        <p class="kicker">STUDENT LIFE SIMULATOR</p>
        <h1>开局一张地毯</h1>
        <p>你刚落地澳洲，房间里有一张地毯、一个枕头和一盏落地灯。接下来，你要在学业、金钱、精神、签证、career、社交和恋爱之间做选择。</p>
        <p>这不是一个“留下就是赢”的游戏。你的开局目标，决定你的结局到底算 HE 还是 BE。</p>
        <div class="actions">
          <button class="btn primary" id="new-game">开始新游戏</button>
          <button class="btn" id="continue-game" ${saved ? '' : 'disabled'}>继续存档</button>
          <button class="btn danger" id="clear-save" ${saved ? '' : 'disabled'}>清除存档</button>
        </div>
        <p class="footer-note">提示：第一版为可运行原型，事件和结局可继续扩展。</p>
      </section>
    </main>`;

  document.querySelector('#new-game').addEventListener('click', () => renderCreator(app, data));
  document.querySelector('#continue-game').addEventListener('click', () => {
    const state = loadGame();
    if (state) startTurn(app, data, state);
  });
  document.querySelector('#clear-save').addEventListener('click', () => {
    clearSave();
    renderStart(app, data);
  });
}
