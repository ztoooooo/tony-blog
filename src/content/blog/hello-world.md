---
title: '你好，世界：这个博客是怎么搭起来的'
description: '开篇记录：用 Astro 静态生成 + Cloudflare Workers 零成本搭建个人博客的完整思路。'
pubDate: 'Nov 23 2026'
heroImage: '../../assets/covers/cover-aurora.png'
---

欢迎来到我的技术笔记。这篇开篇不讲大道理，直接聊聊这个博客本身是怎么跑起来的，以及为什么最终选了 **Astro + Cloudflare Workers** 这套组合。

## 为什么是 Astro

市面上的静态站点生成器很多，Hugo、Hexo、Next.js 各有拥趸。我选 Astro 的理由很直接：

- **内容驱动、默认零 JS**：博客这种以文字为主的场景，Astro 在构建时就把页面渲染成静态 HTML，客户端几乎不加载多余的 JavaScript，首屏速度极快。
- **组件自由度高**：需要交互时可以按需混入 React、Vue、Svelte 组件（群岛架构），不会被单一框架绑死，个性化空间大。
- **Markdown 体验好**：原生支持 Markdown / MDX，frontmatter、RSS、站点地图都是官方集成，开箱即用。

## 为什么部署在 Cloudflare Workers

传统做法是把静态产物丢到对象存储再套 CDN，而 Cloudflare 现在把 Pages 的静态托管能力整合进了 **Workers Static Assets**：

1. 本地 `npm run build` 产出 `dist/` 目录；
2. 在 `wrangler.jsonc` 里用 `assets.directory` 指向产物；
3. 一条 `wrangler deploy` 推到全球 330+ 边缘节点。

纯静态站点甚至不需要写任何 Worker 代码，静态资源请求免费且不限量，自定义域和 HTTPS 证书全自动签发。对个人博客来说，基本是零成本、零运维。

## 写作工作流

日常更新也很简单：

```bash
# 新建一篇 Markdown 文章放到 src/content/blog/
npm run build      # 本地构建验证
npx wrangler deploy # 一键发布到边缘
```

后续我会把 Java、前端工程化、Cloudflare 实践以及各种效率工具的折腾过程陆续整理到这里。下一篇就先讲讲 Cloudflare Workers 的实际部署细节。
