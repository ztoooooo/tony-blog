# Tony 的技术笔记

[![Deploy to Cloudflare Workers](https://github.com/ztoooooo/tony-blog/actions/workflows/deploy.yml/badge.svg)](https://github.com/ztoooooo/tony-blog/actions/workflows/deploy.yml)

基于 **Astro + Cloudflare Workers Static Assets** 的纯静态个人博客，采用 Apple 毛玻璃设计语言（半透明玻璃材质、系统字体栈、明暗双主题）。

- 在线地址：<https://blog.uuoooo.com>
- 零服务器、零 Cookie、零追踪，全球边缘节点分发。

## 技术栈

- [Astro](https://astro.build/) 静态生成（Content Collections 管理文章与软件库）
- Cloudflare Workers Static Assets 托管，自定义域自动签发证书
- GitHub Actions 自动构建部署：push 到 `main` 即发布

## 本地开发

需要 Node.js ≥ 22.23.4（推荐 24）。

```bash
npm install      # 安装依赖
npm run dev      # 本地预览 http://localhost:4321
npm run build    # 构建到 ./dist
npm run deploy   # 本地构建并直接部署到 Cloudflare（需本机 wrangler 登录）
```

## 写内容

### 博客文章

在 `src/content/blog/` 下新建 Markdown 文件，文件名即网址（建议英文短横线），头部 frontmatter：

```yaml
---
title: 文章标题
description: 一句话摘要
pubDate: 2026-11-23
updatedDate: 2026-11-24      # 可选
heroImage: ../../assets/covers/cover-edge.png   # 可选封面
---
```

### 软件库

在 `src/content/software/` 下，每个软件一个 Markdown 文件。复制 `_template.md` 改名即可，记得删掉 `reference: template` 这一行（带它的文件不会出现在软件库）。常用字段：

| 字段 | 说明 |
| --- | --- |
| `title` / `description` | 名称 / 一句话简介 |
| `category` | 分类，列表页可按此筛选 |
| `platforms` | 平台数组，如 `[Web, Windows, macOS]` |
| `version` | 版本号 |
| `icon` | emoji 图标（也可用 `logo` 指定图片） |
| `accent` | 主题色：blue / purple / pink / teal / green / orange / red |
| `homepage` / `download` | 项目主页 / 下载地址（可选） |
| `tags` | 标签数组 |
| `order` | 排序权重，数字越小越靠前 |
| `featured` | `true` 时在列表页以大卡片展示 |
| `updatedDate` | 更新时间 |

下架软件：删除对应 `.md` 即可。

## 自动部署（push 即发布）

工作流定义在 `.github/workflows/deploy.yml`：每次 push 到 `main`，CI 自动 `npm ci → build → wrangler deploy`。部署需要在仓库配置 Cloudflare 凭证：

1. 打开 Cloudflare 控制台 → 右上角头像 → **My Profile → API Tokens → Create Token**。
2. 选择 **Edit Cloudflare Workers** 模板，Account Resources 选你的账户，Zone Resources 按需选择域名（含 `uuoooo.com`），创建后复制 Token。
3. 在 GitHub 仓库 **Settings → Secrets and variables → Actions → New repository secret**：
   - `CLOUDFLARE_API_TOKEN`：上一步的 Token（必填）
   - `CLOUDFLARE_ACCOUNT_ID`：账户 ID（可选，Cloudflare 控制台右侧栏可复制）
4. 配置后到 **Actions** 页面重跑最近一次工作流，或直接 push 一次提交即可自动发布。

> 未配置 Token 时，工作流会完成构建但跳过部署（显示绿色成功并给出提示），不会报错。

## 目录结构

```text
├── .github/workflows/deploy.yml   # 自动部署工作流
├── public/                        # 静态资源（favicon 等）
├── scripts/                       # 本地宽度回归 / 截图的 CDP 探针
├── src/
│   ├── assets/covers/             # 文章封面
│   ├── components/                # 页头、页脚、卡片等组件
│   ├── content/
│   │   ├── blog/                  # 博客 Markdown
│   │   └── software/              # 软件库 Markdown
│   ├── layouts/                   # 页面布局
│   ├── pages/                     # 路由页面
│   └── styles/global.css          # 设计 token 与全局样式
├── astro.config.mjs
└── wrangler.jsonc                 # Workers / 自定义域配置
```
