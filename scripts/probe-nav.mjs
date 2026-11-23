// 实测顶栏 nav-shell 与文章区域各块的实际宽度
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL = process.env.PROBE_URL || 'https://blog.uuoooo.com/blog/cloudflare-workers-deploy/';
const PORT = 9334;

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars',
  `--remote-debugging-port=${PORT}`,
  '--user-data-dir=C:/Temp/cdp-probe2-profile',
  'about:blank',
], { stdio: 'ignore' });

let ws, id = 0;
const pending = new Map();
const send = (method, params = {}, sessionId) =>
  new Promise((res, rej) => {
    const msgId = ++id;
    pending.set(msgId, { res, rej });
    ws.send(JSON.stringify({ id: msgId, method, params, sessionId }));
  });

async function connect() {
  for (let i = 0; i < 40; i++) {
    try {
      const list = await fetch(`http://127.0.0.1:${PORT}/json/list`).then((r) => r.json());
      const page = list.find((t) => t.type === 'page');
      if (page) return page.webSocketDebuggerUrl;
    } catch {}
    await sleep(250);
  }
  throw new Error('CDP 未就绪');
}

try {
  const wsUrl = await connect();
  ws = new WebSocket(wsUrl);
  await new Promise((r) => (ws.onopen = r));
  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.id && pending.has(msg.id)) {
      const { res, rej } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result);
    }
  };

  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });

  for (const w of [1440, 1280, 900]) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: w, height: 900, deviceScaleFactor: 1, mobile: false,
    }, sessionId);
    await send('Page.navigate', { url: URL }, sessionId);
    await sleep(2500);
    const { result } = await send('Runtime.evaluate', {
      expression: `(() => {
        const g = s => { const e = document.querySelector(s); if (!e) return null;
          const r = e.getBoundingClientRect();
          return { w: Math.round(r.width), l: Math.round(r.left), r: Math.round(r.right) }; };
        return JSON.stringify({
          nav: g('.nav-shell'), article: g('.article'), cover: g('.cover'),
          prose: g('.prose'), winW: window.innerWidth
        });
      })()`,
      returnByValue: true,
    }, sessionId);
    const d = JSON.parse(result.value);
    console.log(`\n[视口 ${d.winW}px]`);
    console.log(`  顶栏 nav-shell : w=${d.nav.w} (${d.nav.l} → ${d.nav.r})`);
    console.log(`  文章 .article  : w=${d.article.w} (${d.article.l} → ${d.article.r})`);
    console.log(`  封面 .cover    : w=${d.cover.w} (${d.cover.l} → ${d.cover.r})`);
    console.log(`  正文 .prose    : w=${d.prose.w} (${d.prose.l} → ${d.prose.r})`);
    console.log(`  cover 与 nav 宽度差 = ${d.cover.w - d.nav.w}px`);
  }
} finally {
  chrome.kill();
}
