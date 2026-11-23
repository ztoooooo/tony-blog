// 通过 CDP 在精确视口下截图（headless --window-size 与实际布局视口不一致，故用 CDP）
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import { writeFileSync } from 'node:fs';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL = process.env.PROBE_URL || 'https://blog.uuoooo.com/blog/cloudflare-workers-deploy/';
const PREFIX = process.env.OUT_PREFIX || 'article';
const PORT = 9337;

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars',
  `--remote-debugging-port=${PORT}`,
  '--user-data-dir=C:/Temp/cdp-shot-profile',
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

  for (const [w, h, label, name] of [
    [1440, 1500, '桌面 1440', ''],
    [390, 1300, '手机 390', '-mobile'],
  ]) {
    const file = `D:/workbuddy-workspaces/workspaces/tony-blog/preview/${PREFIX}${name}.png`;
    await send('Emulation.setDeviceMetricsOverride', {
      width: w, height: h, deviceScaleFactor: 1, mobile: w < 600,
    }, sessionId);
    let ok = false;
    for (let attempt = 0; attempt < 4 && !ok; attempt++) {
      await send('Page.navigate', { url: URL, ignoreCache: true }, sessionId);
      for (let i = 0; i < 30; i++) {
        const { result: r } = await send('Runtime.evaluate', {
          expression: `(() => { const c = document.querySelector('main .container');
            if (!c || !document.querySelector('.nav-shell')) return false;
            return getComputedStyle(c).width !== '0px'; })()`,
          returnByValue: true,
        }, sessionId);
        if (r.value) { ok = true; break; }
        await sleep(500);
      }
    }
    await sleep(1200);
    const { data } = await send('Page.captureScreenshot', { format: 'png' }, sessionId);
    writeFileSync(file, Buffer.from(data, 'base64'));
    console.log(`已保存 ${label} → ${file}`);
  }
} finally {
  chrome.kill();
}
