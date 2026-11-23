// 文章详情页多视口回归检查：顶栏/封面/正文卡对齐 + 文字列宽 + 无溢出
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL = process.env.PROBE_URL || 'https://blog.uuoooo.com/blog/cloudflare-workers-deploy/';
const PORT = 9336;

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars',
  `--remote-debugging-port=${PORT}`,
  '--user-data-dir=C:/Temp/cdp-probe4-profile',
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

const EXPR = `(() => {
  const q = s => document.querySelector(s);
  const box = e => e ? { w: Math.round(e.getBoundingClientRect().width),
    l: Math.round(e.getBoundingClientRect().left),
    r: Math.round(e.getBoundingClientRect().right) } : null;
  return JSON.stringify({
    nav: box(q('.nav-shell')), cover: box(q('.cover')), prose: box(q('.prose')),
    p: box(q('.prose p')), pre: box(q('.prose pre')),
    winW: window.innerWidth,
    overflow: document.documentElement.scrollWidth - window.innerWidth
  });
})()`;

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

  let allOk = true;
  for (const [w, h, label] of [[1440,900,'桌面 1440'], [1280,900,'笔记本 1280'], [900,900,'小屏 900'], [768,900,'平板 768'], [390,844,'手机 390']]) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: w, height: h, deviceScaleFactor: 1, mobile: w < 600,
    }, sessionId);

    let d = null;
    for (let attempt = 0; attempt < 4 && !d; attempt++) {
      await send('Page.navigate', { url: URL, ignoreCache: true }, sessionId);
      for (let i = 0; i < 30; i++) {
        const { result: r } = await send('Runtime.evaluate', {
          expression: `(() => { const p = document.querySelector('.prose p');
            if (!p || !document.querySelector('.nav-shell')) return false;
            return getComputedStyle(document.querySelector('.prose')).maxWidth !== 'none'; })()`,
          returnByValue: true,
        }, sessionId);
        if (r.value) break;
        await sleep(500);
      }
      await sleep(600);
      const { result } = await send('Runtime.evaluate', { expression: EXPR, returnByValue: true }, sessionId);
      if (result.value) d = JSON.parse(result.value);
      else console.error(`  ! ${label} 加载失败，重试`);
    }
    if (!d) { console.log(`[${label}] 加载失败 ❌`); allOk = false; continue; }

    const same = (a, b) => a && b && a.l === b.l && a.r === b.r;
    const fmt = b => (b ? `w=${b.w} (${b.l} → ${b.r})` : '（无此元素）');
    const ok = same(d.nav, d.cover) && same(d.nav, d.prose) && d.overflow <= 0;
    if (!ok) allOk = false;
    console.log(`\n[${label}] 视口 ${d.winW}px`);
    console.log(`  顶栏   : ${fmt(d.nav)}`);
    console.log(`  封面   : ${fmt(d.cover)}`);
    console.log(`  正文卡 : ${fmt(d.prose)}`);
    console.log(`  文字列 : ${fmt(d.p)}   代码块: ${d.pre ? d.pre.w : '-'}`);
    console.log(`  → ${ok ? '与顶栏严格对齐 ✅' : '未对齐 ❌'} | 横向溢出: ${d.overflow > 0 ? d.overflow + 'px ❌' : '无 ✅'}`);
  }
  console.log('\n最终结论：', allOk ? '全部通过 ✅' : '存在失败 ❌');
} finally {
  chrome.kill();
}
