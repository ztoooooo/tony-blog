---
title: 新增软件说明
description: 这份说明只在本地使用，不参与构建。在 src/content/software/ 目录下新增一个 .md 文件即可在软件库中生成一条记录。
category: 效率工具
platforms: [Web]
icon: 📄
accent: blue
order: 999
reference: template
---

## 这是一份模板文件

把它复制一份改名，或者直接新建一个 `.md` 文件，按下面的格式填写即可。

> 注意：文件名会成为 URL 路径，**建议用英文小写加短横线**（如 `my-tool.md`），标题仍然可以写中文。

## 字段说明

```yaml
---
title: 软件名称          # 必填
description: 一句话简介   # 必填，显示在卡片和详情页摘要
category: 开发工具       # 分类，列表页可按此筛选
platforms: [Web, macOS]  # 支持平台
version: 1.0.0          # 版本号
icon: 🧾                # emoji 图标
logo: ./logo.png        # 可选：用图片代替 emoji（需放在 src/assets/ 下）
accent: blue            # 主题色：blue / purple / pink / teal / green / orange / red
homepage: https://...   # 可选：项目主页
download: https://...   # 可选：下载地址
tags: [Vue, 纯前端]      # 标签
order: 10               # 排序权重，数字越小越靠前
featured: true          # 是否在列表页以大卡片展示
updatedDate: 2026-11-23 # 更新时间
---
```

## 正文

标题下方的 Markdown 会渲染到详情页的正文区域，用来写详细说明、截图、使用方法等。

---

## 如何发布（本地编辑 → 上线）

1. 把本文件**复制一份**到当前目录，改成英文短横线文件名，例如 `my-tool.md`（文件名即网址 `/software/my-tool/`）。
2. 填好上面的 frontmatter 字段，正文写在第二个 `---` 下面。
3. 删除或改回 `reference: template` 这一行——带它的文件不会出现在软件库（本模板就是靠它隐藏的）。
4. 在项目根目录执行一条命令即可构建并上线：

```bash
npm run deploy
```

> 想先本地预览再发布，可先 `npm run dev` 打开 http://localhost:4321/software/ 查看效果。
> 想下架某款软件：直接删除对应的 `.md` 文件，再跑一次 `npm run deploy`。

