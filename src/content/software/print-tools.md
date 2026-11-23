---
title: 票据打印工具
description: 纯前端票据打印小工具，支持图片透视矫正与多格式套打印面，浏览器打开即用，无需上传任何数据。
category: 开发工具
platforms: [Web, Windows, macOS]
version: 1.4.2
icon: 🧾
accent: blue
homepage: https://ztoooooo.github.io/print-tools/
download: https://github.com/ztoooooo/print-tools/releases
tags: [Vue, pdf.js, OpenCV, 纯前端]
order: 1
featured: true
updatedDate: 2026-11-23
---

## 解决什么问题

拍歪的票据、格式各异的报销单、需要在指定位置打印特定面额的票据 —— 这类活儿手工排版非常折磨。

这个工具把流程压缩成三步：**上传 → 矫正 → 打印**。

## 核心能力

- **透视矫正**：用 OpenCV.js 自动识别票据四角，把斜拍的照片拉正成规整矩形
- **PDF 解析**：基于 pdf.js 直接在浏览器内提取页面，无需后端
- **面额套打**：按预设模板把内容定位到打印区域，支持批量连续打印
- **纯前端**：所有处理都在浏览器本地完成，票据不会上传到任何服务器

## 技术栈

Vue 3 + Vite + TypeScript + Element Plus + pdf.js + OpenCV.js，构建产物是纯静态文件，丢到任意静态托管即可。

部署踩过的坑也记在博客里了：[Cloudflare Workers 部署实战](/blog/cloudflare-workers-deploy/)。
