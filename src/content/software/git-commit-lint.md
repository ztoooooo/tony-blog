---
title: Git 提交规范助手
description: 本地运行的提交信息校验工具，拦截不规范 commit message，支持自定义规则模板。
category: 开发工具
platforms: [Windows, macOS, Linux]
version: 0.9.2
icon: 📝
accent: purple
tags: [Git, Conventional Commits, Node]
order: 3
updatedDate: 2026-10-18
---

## 为什么需要它

团队里 commit message 写得五花八门，代码评审时还得先花时间纠正格式。规范靠人自觉是守不住的，得靠工具拦。

## 规则

- 遵循 Conventional Commits：`feat(scope): 描述`
- 描述长度限制 5–72 字符
- 禁止以 `.` `!` `?` 结尾
- 拦截 `fix up`、`squash` 等临时提交进入主干

## 使用

安装为 git hook，提交前自动校验，不合规直接拒绝提交并给出修改建议。
