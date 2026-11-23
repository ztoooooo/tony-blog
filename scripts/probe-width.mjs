// 用 CDP 实测文章详情页封面与正文卡片的真实像素宽度
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL = process.env.PROBE_URL || 'https://blog.uuoooo.com/blog/cloudflare-workers-deploy/';
const PORT = 9333;

const chrome = spawn(CHROME, [
  '--headless=new',
  '--disable-gpu',
  '--hide-scrollbars',
  `--remote-debugging-port=${PORT}`,
  '--user-data-dir=C:/Temp/cdp-probe-profile',
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

  const probe = async (w, h, label) => {
    await send('Emulation.setDeviceMetricsOverride', {
      width: w, height: h, deviceScaleFactor: 1, mobile: w < 600,
    }, sessionId);
    await send('Page.navigate', { url: URL }, sessionId);
    await sleep(2600);
    const { result } = await send('Runtime.evaluate', {
      expression: `(() => {
        const g = s => { const e = document.querySelector(s); if (!e) return null;
          const r = e.getBoundingClientRect();
          return { w: Math.round(r.width), left: Math.round(r.left), right: Math.round(r.right) }; };
        return JSON.stringify({
          cover: g('.cover'), prose: g('.prose'), head: g('.article-head'),
          docW: document.documentElement.scrollWidth, winW: window.innerWidth
        });
      })()`,
      returnByValue: true,
    }, sessionId);
    const d = JSON.parse(result.value);
    const diff = d.cover && d.prose ? d.cover.w - d.prose.w : 'n/a';
    console.log(`\n[${label}] viewport=${d.winW}px`);
    console.log(`  cover : w=${d.cover.w} left=${d.cover.left} right=${d.cover.right}`);
    console.log(`  prose : w=${d.prose.w} left=${d.prose.left} right=${d.prose.right}`);
    console.log(`  head  : w=${d.head.w} left=${d.head.left} right=${d.head.right}`);
    console.log(`  宽度差 cover-prose = ${diff}px  |  横向溢出 = ${d.docW > d.winW ? '有 ' + (d.docW - d.winW) + 'px' : '无'}`);
    return diff === 0 && d.docW <= d.winW;
  };

  const r1 = await probe(1280, 900, '桌面 1280');
  const r2 = await probe(390, 844, '移动 390');
  const r3 = await probe(768, 900, '平板 768');
  console.log('\n结论：', r1 && r2 && r3 ? '全部对齐且无溢出 ✅' : '仍有问题 ❌');
} finally {
  chrome.kill();
}
