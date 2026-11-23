---
title: '使用 iLoader 在 Windows 11 上安装 SideStore：完整图文步骤与故障排查'
description: '在 Windows 11 上用 iLoader 给 iPhone 安装 SideStore 的完整流程：iTunes 与 iLoader 准备、USB 信任、Apple 账户登录、开发者模式与 LocalDevVPN 配置，以及 503、401 等登录故障排查。'
pubDate: '2026-11-23'
heroImage: '../../assets/covers/cover-sideload.png'
---

> 本文以 **Windows 11 + iPhone + iLoader v2.4.2** 为例，记录从电脑准备、安装 SideStore 到首次启动的完整流程，并整理安装过程中常见的登录错误。
>
> **更新日期：2026-11-23。** 下载版本和系统兼容性可能变化，请优先查看文末官方文档及 Releases 页面。

## 一、SideStore 和 iLoader 是什么？

- **SideStore**：一个开源 iOS 侧载工具，可用于安装 App Store 以外的 IPA 应用，并管理应用签名与续签。
- **iLoader**：在电脑端运行的安装工具，可协助把 SideStore 安装到 iPhone。
- **LocalDevVPN**：SideStore 工作流程中使用的本地 VPN/网络组件。首次安装完成后，按 SideStore 当前官方文档的要求配置；安装、更新或刷新应用时通常需要连接它。

侧载并不等于越狱。它也不意味着可以绕过 Apple 的所有签名限制。免费 Apple 账户通常存在同时安装数量、App ID 数量和签名有效期等限制，具体以 SideStore 官方说明和 Apple 当前规则为准。

## 二、准备工作

### 1. 需要准备的东西

- 一台 Windows 11 电脑（建议 64 位）。
- 一部可正常解锁的 iPhone。
- 一根支持数据传输的 USB 线。
- 稳定的网络连接。
- 一个可正常登录、能接收双重认证验证码的 Apple 账户。
- iPhone 已设置锁屏密码。

SideStore 官方安装前提包括 iOS/iPadOS 15 或更高版本、设备锁屏密码，以及初次安装时使用电脑。不同 iOS 版本和 iLoader 版本的兼容范围可能变化，安装前请核对官方文档。

### 2. 下载所需软件

请尽量从官方项目页面下载，不要使用网盘转载包、来历不明的安装器或收费“代安装”网站。

| 软件 | 用途 | 官方下载地址 |
|---|---|---|
| iLoader | Windows 端安装 SideStore | https://iloader.site/download/ |
| iLoader GitHub Releases | 查看版本、历史版本和安装包 | https://github.com/nab138/iloader/releases |
| iTunes for Windows | 提供 iPhone USB 通信所需组件 | https://www.apple.com/itunes/download/win64 |
| SideStore 官方网站 | 项目主页、官方入口 | https://sidestore.io/ |
| SideStore 官方文档 | 安装、配置和故障说明 | https://docs.sidestore.io/docs/ |
| LocalDevVPN | SideStore 本地 VPN 组件 | https://apps.apple.com/app/localdevvpn/id6755608044 |

**版本提醒：** 截至本文整理时，iLoader 官方下载页显示 v2.4.2，发布日期为 2026-11-20。该版本说明提到：它恢复了此前使用的登录客户端信息，以修复 2026-11-19 起出现的 503；但部分 Apple 账户的双重认证在此版本仍可能失败。下载前请再次确认页面显示的最新版本。

## 三、Windows 11 安装前准备

### 第 1 步：安装 iTunes

1. 打开 Apple 官方 iTunes 下载页面：
   https://www.apple.com/itunes/download/win64
2. 下载 Windows 版本安装程序。
3. 双击安装包，按照提示完成安装。
4. 安装完成后，建议重启电脑，或至少退出并重新打开相关程序。
5. 如果电脑已经安装 Apple Devices 等 Apple 设备管理软件，USB 驱动环境可能有所不同；遇到设备识别问题时，优先按 iLoader/SideStore 官方文档建议检查 iTunes、Apple Devices 和驱动组件，避免同时安装多个来源不明的驱动包。

### 第 2 步：安装 iLoader

1. 打开 iLoader 官方下载页面：
   https://iloader.site/download/
2. 选择 Windows 的 MSI 安装包；也可以从 GitHub Releases 下载 Windows x64 安装包：
   https://github.com/nab138/iloader/releases
3. 下载完成后，双击 `.msi` 文件。
4. 如果 Windows 弹出用户账户控制提示，确认安装文件来自官方项目后再允许。
5. 按安装向导提示完成安装。
6. 从开始菜单启动 iLoader。

**注意：** 不要从搜索结果中的仿冒网站下载 iLoader。优先使用项目官网或其 GitHub Releases 页面。

## 四、用 iLoader 安装 SideStore

### 第 1 步：连接 iPhone

1. 使用 USB 数据线将 iPhone 连接到 Windows 11 电脑。
2. 解锁 iPhone，保持屏幕亮起。
3. 如果手机弹出“要信任此电脑吗？”，点击“信任”。
4. 输入 iPhone 锁屏密码。
5. 安装期间不要拔掉数据线，也不要让手机长时间锁屏。

### 第 2 步：确认 iLoader 识别设备

1. 打开 iLoader。
2. 在设备列表中点击刷新（Refresh，如果界面提供该按钮）。
3. 等待 iPhone 出现在设备列表中。
4. 核对设备名称，确认选中的是自己的 iPhone。

如果设备没有出现：

- 换一根确认支持数据传输的 USB 线。
- 更换电脑 USB 接口，尽量不要先经过 USB Hub。
- 解锁 iPhone，重新插拔数据线，并重新点击刷新。
- 确认 iTunes 已安装。
- 关闭 iTunes 后重新打开 iLoader。
- 检查 Windows 是否识别到 Apple 移动设备驱动。
- 必要时重启电脑和 iPhone 后再试。

### 第 3 步：在 iLoader 中登录 Apple 账户

1. 在 iLoader 的 Apple 账户登录区域输入 Apple 账户邮箱。
2. 输入密码。
3. 点击 Login。
4. 如果 Apple 要求双重认证，查看 iPhone、受信任设备或短信收到的验证码。
5. 按 iLoader 的提示输入验证码并提交。
6. 等待登录成功提示。

**安全提醒：** 只在确认是从官方渠道取得的 iLoader 客户端中输入 Apple 账户信息。不要把密码或验证码发给任何人。若对账户安全有顾虑，可考虑使用专门用于侧载的 Apple 账户，并开启双重认证、设置恢复方式。

### 第 4 步：选择设备并安装 SideStore

1. 在 iLoader 的设备列表中选中自己的 iPhone。
2. 找到 SideStore 安装选项。
3. 选择 **SideStore (Stable)** 或界面中含义相同的稳定版安装选项。
4. 确认开始安装。
5. 等待 iLoader 下载并安装所需文件。
6. 安装过程中保持手机解锁、USB 连接稳定，不要关闭 iLoader。
7. 等待出现安装成功提示（例如 SideStore Installed）。

如果安装失败，先记录完整错误文字和发生步骤，不要连续反复提交登录。可以先升级到 iLoader 官方最新稳定版，再根据错误类型排查。

## 五、iPhone 首次启动和信任设置

### 第 1 步：信任开发者

1. 在 iPhone 打开“设置”。
2. 进入“通用”。
3. 打开“VPN 与设备管理”（部分系统版本的中文名称或菜单位置可能略有差异）。
4. 在“开发者 App”区域找到与安装时 Apple 账户相关的项目。
5. 点击该项目并选择“信任”或系统显示的“允许并重新启动”。
6. 按系统提示完成确认。

### 第 2 步：开启开发者模式（如系统要求）

对于 iOS 16 及之后的系统，侧载应用可能需要启用开发者模式：

1. 打开“设置”。
2. 进入“隐私与安全性”。
3. 找到“开发者模式”。
4. 打开开关。
5. 按提示重新启动 iPhone。
6. 重启后按系统提示确认启用，并输入锁屏密码。

如果系统没有显示该选项，或菜单与本文不同，不要自行安装所谓“开发者模式补丁”；请对照当前 iOS 版本的 Apple/SideStore 官方说明。

### 第 3 步：安装并配置 LocalDevVPN

1. 在 iPhone 上打开 App Store。
2. 搜索 LocalDevVPN，或使用上方官方 App Store 链接。
3. 安装并打开应用。
4. 按提示允许添加 VPN 配置，并输入锁屏密码。
5. 在需要刷新、安装或更新 SideStore 应用时，按官方说明连接 LocalDevVPN。

LocalDevVPN 不是普通意义上的商业代理 VPN。不要把它与自己购买的 VPN 节点混为一谈，也不要在不清楚用途时随意更改其配置。

### 第 4 步：首次打开 SideStore

1. 回到 iPhone 主屏幕，打开 SideStore。
2. 首次启动时，按实际需要允许本地网络和通知权限。
3. 如 SideStore 要求登录 Apple 账户，输入用于签名的 Apple 账户。
4. 按提示完成 Apple 双重认证。
5. 进入“My Apps（我的应用）”页面。
6. 如果 SideStore 提示需要刷新或完成初始设置，先连接 LocalDevVPN，再按界面提示操作。

**配对文件说明：** SideStore 的运行和刷新流程可能涉及设备配对文件（pairing file）。iLoader 的安装流程会处理相关文件；如果你使用的是其他安装方式，必须严格按照 SideStore 官方文档获取并放置配对文件。不要下载陌生人分享的配对文件，也不要把自己的配对文件公开上传。

## 六、安装 IPA 应用和后续维护

### 安装 IPA

1. 从可信的开发者或项目官方渠道取得 IPA 文件。
2. 将 IPA 保存到 iPhone“文件”App 可访问的位置。
3. 打开 SideStore。
4. 进入“My Apps”或应用安装入口。
5. 按界面选择 IPA 文件并确认安装。
6. 安装完成后，检查应用是否能正常启动。

不要因为 IPA 能安装就认定它安全。侧载应用可能拥有访问照片、文件、网络或其他数据的权限；安装前应核实开发者、源码、发布渠道和权限要求。

### 定期刷新

- 免费 Apple 账户签名通常有有效期限制，常见为 7 天；请以 SideStore 当前界面和官方文档为准。
- 需要刷新应用时，连接 LocalDevVPN，再进入 SideStore 的“My Apps”页面执行刷新。
- 不要等到所有应用都过期后才处理。
- 免费账户还可能受到 App ID 数量和可同时安装应用数量限制。

## 七、今天实际遇到的问题记录与解决思路

以下内容根据本次排查过程整理。**目前没有证据证明所有问题都已解决**，所以将已确认信息、未完成测试和下一步操作分开记录。

### 问题 1：iLoader 登录时报 HTTP 503 Service Temporarily Unavailable

**当时环境**

- 电脑系统：Windows 11
- 最初使用的 iLoader：v2.4.1
- 后续更新到：v2.4.2
- 报错：`HTTP 503 Service Temporarily Unavailable`

**已经做过的检查**

- TCP 测试：`True`
- DNS：能够正常返回 IP 地址
- 手机热点测试：当时尚未测试
- iLoader：已更新到 v2.4.2

**原因分析**

HTTP 503 通常表示服务端暂时无法处理请求，也可能与客户端请求格式、上游服务或服务端临时故障有关。它不等同于“密码错误”，也不能仅凭 503 就认定是本机 DNS 或网络故障。

尤其重要的是：iLoader 官方 v2.4.2 发布说明明确写明，该版本恢复了之前的客户端信息，以修复 2026-11-19 开始出现的 503 登录问题。因此，v2.4.1 遇到 503 时，升级到 v2.4.2 是有官方依据的第一步。

**建议排查顺序**

1. 确认 iLoader 版本为官方最新稳定版，优先检查 v2.4.2 或更新版本。
2. 完全退出旧版 iLoader，再启动新版；必要时卸载旧版后从官方渠道重新安装。
3. 确认电脑日期、时间和时区自动同步。
4. 暂时关闭可能拦截连接的代理、VPN 或安全软件网络过滤功能，再测试一次；测试结束后恢复必要的安全防护。
5. 使用手机热点进行对照测试。若热点能登录而原网络不能，重点检查原网络出口、DNS、代理或防火墙；若两种网络都失败，则继续关注 iLoader/Apple 登录服务端状态。
6. 如果升级后变成双重认证错误，记录错误码、发生在输入密码前还是验证码后，以及 iLoader 具体版本。
7. 不要短时间内反复尝试大量登录，以免触发账户安全验证或临时限制。

**当前记录状态：** 已确认 TCP 和 DNS 基础测试正常，已升级到 v2.4.2；手机热点对照测试结果尚未提供，因此不能据此确认网络问题已经排除。v2.4.2 官方说明也提示，部分 Apple 账户的双重认证可能仍失败。

### 问题 2：SideStore 登录 Apple 账户提示 401

**报错**

`401 Unauthorized`（或界面显示 401）。

**这通常意味着什么？**

HTTP 401 表示请求没有通过身份验证。它可能与账户验证流程、登录会话、双重认证、客户端兼容性或服务端认证响应有关。仅凭 401 无法判断一定是密码错误，也不能直接认定是 Apple 账户被封。

**建议按顺序排查**

1. 确认 iLoader 已完成安装，SideStore 是从可信的官方流程安装的。
2. 检查 iPhone 日期与时间是否设置为自动。
3. 确认 Apple 账户和密码能在 Apple 官方网站正常登录。
4. 确认双重认证流程完整结束，不要把验证码输到不相关的页面。
5. 检查 SideStore 是否为官方稳定版；如需更新，按官方文档操作，避免覆盖或删除必要的配对文件。
6. 连接稳定 Wi-Fi，并按 SideStore 官方要求连接 LocalDevVPN 后再尝试刷新或登录。
7. 如果 401 发生在 SideStore 内部的 Apple 登录界面，而不是 iLoader 登录界面，记录具体页面、操作步骤和完整错误文本；这两种登录流程不能简单视为同一个故障。
8. 暂停连续重复登录。确认账户安全后再间隔一段时间重试。

**当前记录状态：** 已知 SideStore 登录 Apple 账户时出现 401；目前缺少发生页面、是否已通过双重认证、SideStore 版本和 LocalDevVPN 连接状态等信息，暂时无法确定根因。iLoader v2.4.2 对部分 Apple 账户双重认证仍可能存在问题的官方说明，不能直接证明它就是 SideStore 401 的原因。

### 问题 3：后续建议补充的验证记录

- [ ] 用手机热点测试 iLoader 登录，并记录结果。
- [ ] 确认 iLoader v2.4.2 的登录是否成功。
- [ ] 确认 iPhone 是否已信任开发者 App。
- [ ] 确认开发者模式是否已按系统要求启用。
- [ ] 确认 LocalDevVPN 是否成功连接。
- [ ] 记录 SideStore 401 出现在哪个页面、在哪一步出现。
- [ ] 记录 SideStore 的版本号和 iOS 版本号。

## 八、安全注意事项

1. 只从 iLoader、SideStore、Apple 和 App Store 官方入口下载软件。
2. 不要向他人发送 Apple 账户密码、双重认证验证码、设备配对文件或证书文件。
3. 不要安装来源不明的 IPA，尤其是要求输入 Apple 账户密码、支付信息或安装额外描述文件的应用。
4. 侧载可能影响设备安全与隐私；安装前检查开发者身份、权限和项目可信度。
5. 不要把关闭 Windows Defender、关闭 iPhone 安全设置或安装未知证书作为常规解决方案。
6. 如果怀疑 Apple 账户凭据泄露，应立即通过 Apple 官方账户页面修改密码并检查受信任设备。

## 九、官方资料与下载入口

- iLoader 下载页：<https://iloader.site/download/>
- iLoader 官方文档：<https://iloader.site/docs/>
- iLoader GitHub Releases：<https://github.com/nab138/iloader/releases>
- SideStore 官网：<https://sidestore.io/>
- SideStore 官方文档：<https://docs.sidestore.io/docs/>
- SideStore 安装前提：<https://github.com/SideStore/SideStore-Docs/blob/main/docs/installation/prerequisites.mdx>
- Apple iTunes for Windows：<https://www.apple.com/itunes/download/win64>
- LocalDevVPN App Store：<https://apps.apple.com/app/localdevvpn/id6755608044>

## 十、总结

在 Windows 11 上通过 iLoader 安装 SideStore，核心流程是：

**安装 iTunes → 安装官方 iLoader → USB 连接并信任 iPhone → iLoader 登录 Apple 账户 → 选择 SideStore Stable 安装 → 在 iPhone 信任开发者并按需启用开发者模式 → 配置 LocalDevVPN → 打开 SideStore 并完成首次设置。**

本次排查中最值得记录的是 iLoader 的 503：官方 v2.4.2 更新说明明确提到修复了 2026-11-19 起出现的 503。至于 SideStore 的 401，目前仍需要结合具体登录页面、双重认证过程、SideStore 版本和 LocalDevVPN 状态继续定位，不能仅凭错误码下结论。

---

*本文为个人安装记录与排错整理，不代表 Apple、SideStore 或 iLoader 项目的官方支持声明。软件版本、系统菜单和兼容性可能变化，请以官方项目文档为准。*
