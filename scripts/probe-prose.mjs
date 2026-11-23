// 实测文章正文内部各元素的实际宽度
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL = process.env.PROBE_URL || 'https://blog.uuoooo.com/blog/cloudflare-workers-deploy/';
const PORT = 9335;

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars',
  `--remote-debugging-port=${PORT}`,
  '--user-data-dir=C:/Temp/cdp-probe3-profile',
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

  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440, height: 900, deviceScaleFactor: 1, mobile: false,
  }, sessionId);
  await send('Page.navigate', { url: URL }, sessionId);
  // 轮询等待正文渲染 + 样式表真正生效（网络抖动时需重试导航）
  let ready = false;
  for (let attempt = 0; attempt < 4 && !ready; attempt++) {
    for (let i = 0; i < 30; i++) {
      const { result: r } = await send('Runtime.evaluate', {
        expression: `(() => {
          const p = document.querySelector('.prose p');
          if (!p || !document.querySelector('.nav-shell')) return false;
          const cs = getComputedStyle(document.querySelector('.prose'));
          return cs.maxWidth !== 'none' && document.styleSheets.length > 0;
        })()`, returnByValue: true,
      }, sessionId);
      if (r.value) { ready = true; break; }
      await sleep(500);
    }
    if (!ready) {
      console.error('  ! 页面未就绪，重试导航…');
      await send('Page.navigate', { url: URL, ignoreCache: true }, sessionId);
    }
  }
  if (!ready) { console.error('  ! 页面始终未就绪'); }
  await sleep(500);
  const { result } = await send('Runtime.evaluate', {
    expression: `(() => {
      try {
        const q = s => document.querySelector(s);
        const w = e => e ? Math.round(e.getBoundingClientRect().width) : null;
        const p = q('.prose p'), h2 = q('.prose h2'), pre = q('.prose pre');
        const box = e => e ? { w: Math.round(e.getBoundingClientRect().width),
          l: Math.round(e.getBoundingClientRect().left),
          r: Math.round(e.getBoundingClientRect().right) } : null;
        return JSON.stringify({
          rootFont: getComputedStyle(document.documentElement).fontSize,
          proseCard: w(q('.prose')),
          prosePadL: getComputedStyle(q('.prose')).paddingLeft,
          p: box(p), h2: box(h2), pre: box(pre),
          h2Border: h2 ? getComputedStyle(h2).borderTopWidth : null,
          pMargin: p ? getComputedStyle(p).marginLeft + ' / ' + getComputedStyle(p).marginRight : null,
          nav: w(q('.nav-shell')), cover: w(q('.cover')),
          title: w(q('.article-title')), desc: w(q('.article-desc')),
          foot: w(q('.article-foot')),
          overflow: document.documentElement.scrollWidth - window.innerWidth
        });
      } catch (e) { return JSON.stringify({ error: String(e) }); }
    })()`,
    returnByValue: true,
  }, sessionId);
  console.log(JSON.stringify(JSON.parse(result.value), null, 2));
} finally {
  chrome.kill();
}
