#!/usr/bin/env node
// 新文章标准化导入：把任意源 Markdown 转成符合 blog collection schema 的文章文件。
// 用法：
//   node scripts/new-post.mjs <源文件.md> [--slug my-post] [--date 2026-11-25]
//        [--title "标题"] [--description "摘要"] [--cover 封面.png] [--dry-run] [--force]
// 不传的字段自动推断；--dry-run 只打印结果不写盘。
import { readFileSync, writeFileSync, copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, basename, resolve, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BLOG_DIR = resolve(ROOT, 'src/content/blog');
const COVER_DIR = resolve(ROOT, 'src/assets/covers');

// ---------- 参数解析 ----------
const args = process.argv.slice(2);
const flags = {};
const positional = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a.startsWith('--')) {
    const key = a.slice(2);
    const next = args[i + 1];
    if (next === undefined || next.startsWith('--')) {
      flags[key] = true;
    } else {
      flags[key] = next;
      i++;
    }
  } else {
    positional.push(a);
  }
}
const sourcePath = positional[0];
if (!sourcePath) {
  console.error('用法: node scripts/new-post.mjs <源文件.md> [--slug x] [--date YYYY-MM-DD] [--cover 图] [--dry-run]');
  process.exit(1);
}
const dryRun = Boolean(flags['dry-run']);
const force = Boolean(flags.force);

// ---------- 读取源文件 ----------
const absSource = isAbsolute(sourcePath) ? sourcePath : resolve(process.cwd(), sourcePath);
if (!existsSync(absSource)) {
  console.error(`源文件不存在: ${absSource}`);
  process.exit(1);
}
const raw = readFileSync(absSource, 'utf8').replace(/^﻿/, ''); // 去 BOM

// ---------- 拆分 frontmatter 与正文 ----------
function parseFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { data: {}, body: text };
  const data = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!kv) continue;
    let val = kv[2].trim();
    if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
      val = val.slice(1, -1);
    }
    data[kv[1]] = val;
  }
  return { data, body: text.slice(m[0].length) };
}
const { data: srcData, body: rawBody } = parseFrontmatter(raw);

// ---------- 正文清理 ----------
function cleanBody(body) {
  const lines = body.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let inFence = false;
  let h1Removed = false;
  for (let line of lines) {
    if (/^\s*```/.test(line)) inFence = !inFence; // 切换代码围栏
    // 删除与标题重复的第一个 H1（仅非代码块）
    if (!inFence && !h1Removed && /^\s*#\s+.+/.test(line)) {
      h1Removed = true;
      continue;
    }
    // 非代码块内：清理行尾两个及以上空格（Markdown 硬换行）
    if (!inFence) line = line.replace(/[ \t]{2,}$/, '');
    out.push(line);
  }
  return out.join('\n').replace(/^\n+/, '').replace(/\s+$/, '') + '\n';
}
const body = cleanBody(rawBody);

// ---------- 字段推断 ----------
// title：命令行 > 源 frontmatter > 正文第一个 H1
const h1Match = rawBody.match(/^\s*#\s+(.+?)\s*$/m);
const title = (flags.title || srcData.title || h1Match?.[1] || '').trim();
if (!title) {
  console.error('无法确定标题：用 --title 指定，或在源文件里写 H1 / frontmatter title。');
  process.exit(1);
}

// description：命令行 > 源 frontmatter(description/summary/excerpt) > 正文首段纯文本
function firstParagraph(text) {
  let inFence = false;
  for (const block of text.split(/\n{2,}/)) {
    for (const line of block.split('\n')) {
      if (/^\s*```/.test(line)) inFence = !inFence;
      if (inFence) continue;
      const t = line.trim();
      if (t && !/^[#>\-*>\d.]/.test(t) && !t.startsWith('![')) return t;
    }
  }
  return '';
}
const descSource = flags.description || srcData.description || srcData.summary || srcData.excerpt || firstParagraph(body);
const description = String(descSource).replace(/\s+/g, ' ').trim().slice(0, 110);
if (!description) {
  console.error('无法生成摘要：用 --description 指定。');
  process.exit(1);
}

// 日期：命令行 > 源 date/pubDate > 今天（本地 YYYY-MM-DD）
function todayLocal() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
const dateStr = flags.date || srcData.pubDate || srcData.date || todayLocal();
if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
  // 尝试交给系统 date 归一化
  const normalized = execFileSync(process.execPath, ['-e', `console.log(new Date(${JSON.stringify(dateStr)}).toISOString().slice(0,10))`])
    .toString().trim();
  if (normalized === 'Invalid Date' || /Invalid|NaN/.test(normalized)) {
    console.error(`日期无法识别: ${dateStr}，请用 --date YYYY-MM-DD`);
    process.exit(1);
  }
}
const pubDate = /^\d{4}-\d{2}-\d{2}$/.test(dateStr)
  ? dateStr
  : execFileSync(process.execPath, ['-e', `console.log(new Date(${JSON.stringify(dateStr)}).toISOString().slice(0,10))`]).toString().trim();

// slug：命令行 > 源文件名（去日期前缀、小写、非字母数字转横线）
function slugify(name) {
  return name
    .replace(/\.mdx?$/i, '')
    .replace(/^\d{4}-\d{2}-\d{2}-/, '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
const slug = flags.slug || slugify(basename(absSource));
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
  console.error(`slug 不合法: "${slug}"，需为小写字母数字与横线（如 my-post）。用 --slug 指定。`);
  process.exit(1);
}

// 封面：复制到 src/assets/covers 并生成相对引用
let heroImageRef = '';
if (flags.cover) {
  const coverAbs = isAbsolute(flags.cover) ? flags.cover : resolve(process.cwd(), flags.cover);
  if (!existsSync(coverAbs)) {
    console.error(`封面文件不存在: ${coverAbs}`);
    process.exit(1);
  }
  const coverName = basename(coverAbs);
  const coverDest = resolve(COVER_DIR, coverName);
  if (existsSync(coverDest) && !force) {
    console.log(`封面已存在，直接复用: src/assets/covers/${coverName}`);
  } else if (!dryRun) {
    mkdirSync(COVER_DIR, { recursive: true });
    copyFileSync(coverAbs, coverDest);
  }
  heroImageRef = `../../assets/covers/${coverName}`;
} else if (srcData.heroImage || srcData.cover) {
  console.log('源文件引用了封面但未用 --cover 传入本地图片，已跳过封面（heroImage 可选）。');
}

// ---------- 组装输出 ----------
const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const fm = [
  '---',
  `title: ${q(title)}`,
  `description: ${q(description)}`,
  `pubDate: '${pubDate}'`,
  ...(heroImageRef ? [`heroImage: '${heroImageRef}'`] : []),
  '---',
  '',
].join('\n');
const output = fm + body;
const destPath = resolve(BLOG_DIR, `${slug}.md`);

if (existsSync(destPath) && !force) {
  console.error(`目标已存在: src/content/blog/${slug}.md（加 --force 覆盖）`);
  process.exit(1);
}

console.log('———— 标准化结果 ————');
console.log(fm);
console.log(`正文 ${body.split('\n').length} 行，URL 将为 /blog/${slug}/`);
if (dryRun) {
  console.log('\n[dry-run] 未写盘。去掉 --dry-run 正式生成。');
} else {
  mkdirSync(BLOG_DIR, { recursive: true });
  writeFileSync(destPath, output, 'utf8');
  console.log(`\n已生成: src/content/blog/${slug}.md`);
  if (heroImageRef) console.log(`封面: ${heroImageRef}`);
  console.log('下一步: npm run release  （构建 + 提交 + 推送 + 自动部署验证）');
}
