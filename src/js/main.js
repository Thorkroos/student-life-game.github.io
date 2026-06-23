import { loadGameData } from './core/dataLoader.js';
import { initApp } from './ui/screenManager.js';

async function bootstrap() {
  const app = document.querySelector('#app');
  try {
    const data = await loadGameData();
    initApp(app, data);
  } catch (error) {
    console.error(error);
    app.innerHTML = `
      <main class="container">
        <section class="hero">
          <p class="kicker">LOAD ERROR</p>
          <h1>游戏数据加载失败</h1>
          <p>如果你是直接双击打开 index.html，浏览器可能会阻止读取 JSON 文件。请使用 GitHub Pages 或本地服务器运行。</p>
          <pre>${String(error.message || error)}</pre>
        </section>
      </main>`;
  }
}

bootstrap();
