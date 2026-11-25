#!/usr/bin/env node
// 一键发布：构建 -> 提交 -> 推送 -> 轮询 GitHub Actions -> 验证线上 URL。
// 用法：
//   node scripts/release.mjs [--message "提交说明"] [--no-commit] [--no-verify]
// 约定：push 到 main 后由 .github/workflows/deploy.yml 自动部署，无需本机 wrangler 登录。
// 网络：HTTP 统一走 curl（系统代理生效）；git 已配置 SSH over 443，推送自带重试。
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const opt = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : '';
};
const DO_COMMIT = !flag('no-commit');
const DO_VERIFY = !flag('no-verify');

const log = (s) => console.log(`\x1b[36m▶\x1b[0m ${s}`);
const ok = (s) => console.log(`\x1b[32m✓\x1b[0m ${s}`);
const fail = (s) => { console.error(`\x1b[31m✗ ${s}\x1b[0m`); process.exit(1); };
// 同步睡眠（毫秒）：脚本是串行流程，用 Atomics.wait 阻塞最简单，不依赖外部 sleep 命令
const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

function sh(cmd, cmdArgs, opts = {}) {
  const r = spawnSync(cmd, cmdArgs, { cwd: ROOT, encoding: 'utf8', ...opts });
  if (r.status !== 0) {
    fail(`${cmd} ${cmdArgs.join(' ')} 失败\n${r.stderr || r.stdout}`);
  }
  return (r.stdout || '').trim();
}
function curlJson(url) {
  const r = spawnSync('curl', ['-sS', '--fail', '--max-time', '25',
    '-H', 'Accept: application/vnd.github+json', url], { cwd: ROOT, encoding: 'utf8' });
  if (r.status !== 0) fail(`请求失败: ${url}\n${r.stderr}`);
  try { return JSON.parse(r.stdout); } catch { fail(`返回非 JSON: ${url}\n${r.stdout.slice(0, 200)}`); }
}
function curlCode(url) {
  const r = spawnSync('curl', ['-s', '-o', '/dev/null', '-w', '%{http_code}', '--max-time', '25', url],
    { cwd: ROOT, encoding: 'utf8' });
  return r.status === 0 ? r.stdout.trim() : '000';
}

// ---------- 0. 环境自检 ----------
log('环境自检');
const remote = sh('git', ['remote', 'get-url', 'origin']);
const m = remote.match(/[:/]([^/]+)\/([^/]+?)(?:\.git)?$/);
if (!m) fail(`无法从 remote 解析 owner/repo: ${remote}`);
const [, owner, repo] = m;
const branch = sh('git', ['branch', '--show-current']);
if (branch !== 'main') fail(`当前分支是 ${branch}，发布请切到 main。`);
const astroBin = resolve(ROOT, 'node_modules/astro/bin/astro.mjs');
if (!existsSync(astroBin)) fail('缺少依赖，先执行 npm install。');
const site = (readFileSync(resolve(ROOT, 'astro.config.mjs'), 'utf8').match(/site:\s*['"]([^'"]+)['"]/) || [])[1];
if (!site) fail('astro.config.mjs 里读不到 site。');
ok(`仓库 ${owner}/${repo}，分支 ${branch}，站点 ${site}`);

// ---------- 1. 构建（本地先拦住构建错误，不把坏提交推上去）----------
log('构建 astro build');
sh(process.execPath, [astroBin, 'build']);
ok('构建通过');

// ---------- 2. 提交 ----------
const status = sh('git', ['status', '--porcelain']);
if (!status) {
  log('工作区无改动，跳过提交，直接确认线上状态。');
} else if (DO_COMMIT) {
  console.log(status.split('\n').map((l) => `  ${l}`).join('\n'));
  sh('git', ['add', '-A']);
  // 已暂存内容摘要，用于生成 Conventional Commit
  const names = sh('git', ['diff', '--cached', '--name-only']);
  const message = opt('message') || defaultMessage(names);
  sh('git', ['commit', '-m', message]);
  ok(`已提交: ${message}`);
} else {
  fail('存在未提交改动且指定了 --no-commit；请先自行提交。');
}

// ---------- 3. 推送（代理会瞬断，最多重试 5 次）----------
log('推送到 origin/main');
let pushed = false;
for (let i = 1; i <= 5 && !pushed; i++) {
  const r = spawnSync('git', ['push', 'origin', 'main'], { cwd: ROOT, encoding: 'utf8' });
  if (r.status === 0) { pushed = true; }
  else {
    console.log(`  第 ${i} 次推送失败：${(r.stderr || r.stdout).split('\n')[0]}，3 秒后重试…`);
    sleep(3000);
  }
}
if (!pushed) fail('推送连续失败，请检查网络/代理后手动 git push。');
const head = sh('git', ['rev-parse', 'HEAD']);
ok(`已推送 ${head.slice(0, 7)}`);

// ---------- 4. 轮询对应 commit 的 Actions 运行 ----------
log('等待 GitHub Actions 部署');
const api = `https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=8`;
let runId = null;
for (let i = 0; i < 20 && !runId; i++) {
  const data = curlJson(api);
  const run = (data.workflow_runs || []).find((r) => r.head_sha === head && r.event === 'push');
  if (run) runId = run.id;
  else sleep(3000);
}
if (!runId) fail('没找到该 commit 的 workflow run，去 Actions 页面手动确认。');

let conclusion = null;
for (let i = 0; i < 60; i++) {
  const run = curlJson(`https://api.github.com/repos/${owner}/${repo}/actions/runs/${runId}`);
  if (run.status === 'completed') { conclusion = run.conclusion; break; }
  process.stdout.write(`\r  构建中… ${i * 5}s   `);
  sleep(5000);
}
process.stdout.write('\n');
if (conclusion !== 'success') fail(`CI 未成功（conclusion=${conclusion}）：https://github.com/${owner}/${repo}/actions/runs/${runId}`);
ok(`CI 部署成功 run ${runId}`);

// ---------- 5. 验证线上 ----------
if (DO_VERIFY) {
  log('验证线上可访问性');
  const targets = [site, `${site}/blog/`];
  // 若本次提交动了 blog 文章，顺带验证该文章 URL
  const changed = sh('git', ['diff', '--name-only', 'HEAD~1', 'HEAD']).split('\n');
  const post = changed.find((f) => /^src\/content\/blog\/.+\.mdx?$/.test(f));
  if (post) targets.push(`${site}/blog/${post.split('/').pop().replace(/\.mdx?$/, '')}/`);
  let bad = 0;
  for (const u of targets) {
    const code = curlCode(u);
    console.log(`  ${code === '200' ? '✓' : '✗'} ${code}  ${u}`);
    if (code !== '200') bad++;
  }
  if (bad) fail('部分线上地址未返回 200（可能边缘缓存延迟，稍后再验）。');
  ok('线上验证全部 200');
}
console.log(`\n\x1b[32m发布完成 🎉\x1b[0m ${site}`);

// ---------- 提交信息生成 ----------
function defaultMessage(names) {
  const files = names.split('\n').filter(Boolean);
  const hasBlog = files.some((f) => f.startsWith('src/content/blog/'));
  const hasSoft = files.some((f) => f.startsWith('src/content/software/'));
  const hasCode = files.some((f) => /\.(astro|css|ts|mjs|jsonc?|yml)$/.test(f));
  if (hasBlog) {
    const f = files.find((x) => x.startsWith('src/content/blog/'));
    return `feat(blog): 新增文章 ${f.split('/').pop().replace(/\.mdx?$/, '')}`;
  }
  if (hasSoft) return 'feat(software): 更新软件库内容';
  if (hasCode) return 'chore: 更新站点';
  return 'chore: 内容更新';
}
