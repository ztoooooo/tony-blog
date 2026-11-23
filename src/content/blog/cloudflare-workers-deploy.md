---
title: 'Cloudflare Workers 静态托管实战：从构建到自定义域'
description: '记录用 Wrangler 把 Astro 静态站点部署到 Workers，并绑定自定义域名的关键步骤与权限要点。'
pubDate: 'Nov 23 2026'
heroImage: '../../assets/covers/cover-edge.png'
---

把一个纯静态网站部署到 Cloudflare Workers，比很多人想象的简单。这篇把关键步骤和一个容易踩的权限坑记下来。

## 一、准备 Wrangler 配置

项目根目录放一个 `wrangler.jsonc`，核心是 `assets` 字段：

```json
{
  "name": "tony-blog",
  "compatibility_date": "2026-11-23",
  "assets": {
    "directory": "./dist"
  }
}
```

注意纯静态站点**不需要 `main` 入口**，Workers 会直接把 `dist` 目录作为静态资源对外提供。

## 二、登录与部署

```bash
npx wrangler login      # 浏览器 OAuth 授权
npm run build           # Astro 构建出 dist/
npx wrangler deploy     # 上传并发布
```

部署成功后会得到一个 `*.workers.dev` 的临时域名，可以先验证页面是否正常。

## 三、绑定自定义域

在 `wrangler.jsonc` 里加上路由声明：

```json
"routes": [
  { "pattern": "blog.example.com", "custom_domain": true }
]
```

再次 `wrangler deploy`，Cloudflare 会**自动创建 DNS 记录并签发边缘证书**，无需手动配置，几分钟内 HTTPS 即可访问。

## 四、一个真实的权限坑

Workers 自定义域走的是 `workers_routes:write` 权限，OAuth 登录默认包含，所以能全自动完成；但 **Cloudflare Pages 的自定义域依赖 DNS 编辑权限（`dns:write`），而 Wrangler 的 OAuth scope 只有 `zone:read`**，导致 Pages 项目加自定义域时无法自动建 DNS 记录，只能手动去控制台补 CNAME，或用带 DNS 编辑权限的自定义 API Token。

> 经验：纯静态托管优先用 Workers Static Assets，自定义域这一步比 Pages 省心很多。

## 小结

- 纯静态站用 `assets.directory` 即可，无需 Worker 代码；
- 自定义域声明 `custom_domain: true`，DNS 和证书全自动；
- 注意区分 Workers 与 Pages 在 DNS 权限上的差异。

这套流程跑通后，更新文章就是「写 Markdown → build → deploy」三步，足够轻量。
