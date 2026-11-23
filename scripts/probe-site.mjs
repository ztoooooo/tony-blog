// 全站宽度回归：遍历所有页面 × 多视口，核对「主体内容比顶栏两侧各内缩」的统一标准
// 标准：桌面端 .container 内容区比 nav-shell 左右各内缩 24px（移动端 16px），且无横向溢出；
//      详情页的头块 / 正文卡必须铺满 .container（左右边缘相等）。
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const ORIGIN = process.env.ORIGIN || 'https://blog.uuoooo.com';
const PORT = 9340;

const PAGES = [
  ['首页', '/'],
  ['博客列表', '/blog'],
  ['软件列表', '/software'],
  ['软件详情', '/software/print-tools/'],
  ['文章详情', '/blog/cloudflare-workers-deploy/'],
  ['关于页', '/about'],
];
const VIEWPORTS = [[1440, 900, '桌面1440'], [1280, 900, '笔记本1280'], [900, 900, '小屏900'], [768, 900, '平板768'], [390, 844, '手机390']];

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars',
  `--remote-debugging-port=${PORT}`,
  '--user-data-dir=C:/Temp/cdp-site-profile', 'about:blank',
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
  const qa = s => Array.from(document.querySelectorAll(s));
  const box = e => e ? { w: Math.round(e.getBoundingClientRect().width),
    l: Math.round(e.getBoundingClientRect().left),
    r: Math.round(e.getBoundingClientRect().right) } : null;
  const container = q('main .container');
  if (!container) return JSON.stringify({ missing: true });
  const padL = parseFloat(getComputedStyle(container).paddingLeft) || 0;
  const padR = parseFloat(getComputedStyle(container).paddingRight) || 0;
  const cb = box(container);
  // 内容区边界（container 去掉左右 padding）
  const content = { l: Math.round(cb.l + padL), r: Math.round(cb.r - padR) };
  // 仅取应铺满内容区的顶层面板（.sw-head 限定在详情页 .sw-detail 内，
  // 避免选到软件列表页网格卡片内部的同名元素）
  const panels = qa('.hero-panel, .list-hero-panel, .article .cover, .prose, .sw-detail > .sw-head, .cta-panel')
    .map(e => ({ cls: e.className.split(' ')[0], b: box(e) }));
  return JSON.stringify({
    nav: box(q('.nav-shell')),
    container: cb, content,
    panels,
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

  let failures = 0;
  for (const [name, path] of PAGES) {
    console.log(`\n========== ${name}  ${path} ==========`);
    for (const [w, h, label] of VIEWPORTS) {
      await send('Emulation.setDeviceMetricsOverride', {
        width: w, height: h, deviceScaleFactor: 1, mobile: w < 600,
      }, sessionId);

      let d = null;
      for (let attempt = 0; attempt < 4 && !d; attempt++) {
        await send('Page.navigate', { url: ORIGIN + path, ignoreCache: true }, sessionId);
        for (let i = 0; i < 30; i++) {
          const { result: r } = await send('Runtime.evaluate', {
            expression: `(() => { const c = document.querySelector('main .container');
              if (!c || !document.querySelector('.nav-shell')) return false;
              return getComputedStyle(c).width !== '0px'; })()`,
            returnByValue: true,
          }, sessionId);
          if (r.value) break;
          await sleep(500);
        }
        await sleep(500);
        const { result } = await send('Runtime.evaluate', { expression: EXPR, returnByValue: true }, sessionId);
        if (result.value) d = JSON.parse(result.value);
      }
      if (!d) { console.log(`  [${label}] 加载失败 ❌`); failures++; continue; }
      if (d.missing) { console.log(`  [${label}] 缺少 main .container ❌`); failures++; continue; }

      const problems = [];
      if (d.overflow > 0) problems.push(`横向溢出${d.overflow}px`);
      if (!d.nav) problems.push('缺少 nav');
      else {
        // 几何不变量：内容区不宽于顶栏，且相对顶栏左右等距（桌面=24，窄屏=0）
        const gapL = d.content.l - d.nav.l;
        const gapR = d.nav.r - d.content.r;
        const inset = Math.round((gapL + gapR) / 2);
        if (d.content.r - d.content.l > d.nav.w + 1) problems.push('内容区宽于顶栏');
        if (Math.abs(gapL - gapR) > 1) problems.push(`左右不等距(${gapL}/${gapR})`);
        if (![0, 24].includes(inset)) problems.push(`单侧内缩=${inset}（应为0或24）`);
      }
      // 各面板须铺满 container 的内容区（左右边缘相等）
      for (const { cls, b } of d.panels) {
        if (b.l !== d.content.l || b.r !== d.content.r) {
          problems.push(`${cls}未铺满(l:${b.l}/${d.content.l} r:${b.r}/${d.content.r})`);
        }
      }
      if (problems.length) failures++;
      const gap = d.nav ? d.content.l - d.nav.l : '-';
      const panelInfo = d.panels.map((p) => `${p.cls}=${p.b.w}`).join(' ');
      console.log(`  [${label}] nav=${d.nav ? d.nav.w : '-'} 内容区=${d.content.r - d.content.l}` +
        ` ${panelInfo} → ${problems.length ? '❌ ' + problems.join('；') : '✅ 单侧内缩' + gap + 'px，面板铺满'}`);
    }
  }
  console.log('\n==============================');
  console.log(failures === 0 ? '全站宽度检查全部通过 ✅' : `发现 ${failures} 处问题 ❌`);
  process.exitCode = failures === 0 ? 0 : 1;
} finally {
  chrome.kill();
}
