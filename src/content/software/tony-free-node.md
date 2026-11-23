---
title: Tony 公益节点
description: 基于 Cloudflare Workers 的免费代理节点，自适应优选 IP，订阅一键导入小火箭 / Clash。
category: 网络工具
platforms: [iOS, Android, Windows, macOS]
version: 1.0.0
icon: 🌍
accent: teal
homepage: https://vpn.uuoooo.com/
tags: [Cloudflare Workers, VLESS, 订阅]
order: 2
featured: true
updatedDate: 2026-11-23
---

## 它是什么

跑在 Cloudflare 边缘网络上的免费代理节点。借助 CDN 的全球分发能力，实现免流量、免服务器成本的线路。

支持 **VLESS / Trojan / Shadowsocks** 三种协议，WebSocket + TLS 传输。

## 特点

- **自适应优选**：自动测速选择延迟最低的 Cloudflare 优选 IP，订阅里直接给出可用节点
- **订阅式分发**：一条订阅链接，客户端自动更新，节点变化无需手动改
- **零成本**：完全跑在 Workers 免费额度内，静态请求不计入调用次数

## 使用方式

在客户端（Shadowrocket / Clash / sing-box）里添加订阅链接，导入后直接选节点使用。

> ⚠️ 免费节点仅供学习与自用，请遵守当地法律法规与相关服务条款。
