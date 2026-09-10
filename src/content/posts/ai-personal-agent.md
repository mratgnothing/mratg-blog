---
title: "我想要的 AI 手机，不是更大的模型，而是一层 Personal Agent"
description: "从端侧 3B–7B 小模型出发，重新思考手机、操作系统、跨设备 Agent 与 Apple/Android 的长期路线：真正重要的不是 TOPS，而是上下文、权限、工具和持续运行能力。"
category: "Tech Note"
column: "tech-note"
tags:
  - "Agent"
  - "On-device AI"
  - "Android"
  - "iOS"
  - "Edge AI"
  - "Personal AI"
date: "2026-09-10"
updated: "2026-09-10T13:24+08:00"
draft: false
---

最近我一直在想一个问题：如果手机本地常驻一个足够便宜的小模型，它能不能不再只是“回答问题”，而是成为一个真正跟着我生活和工作的个人 Agent？

我最初的设想很直接：每天自动处理通知和消息，识别重要事项，把明确的时间安排写进日历，把零散文件归档，会议时完成转写和摘要；遇到简单任务就在手机本地直接处理，遇到代码、长文档、项目仓库、复杂检索或重推理，再把上下文整理成一个任务包，交给电脑上的强 Agent。

继续往下想以后，我反而觉得“手机上跑一个 7B 模型”并不是这个构想最重要的部分。真正决定它是否好用的，是操作系统能不能为 Agent 提供持续、可靠、可控的上下文与工具。

## 不是把大模型塞进手机，而是做一个分层系统

我现在更倾向把它理解成一套 **Personal AI Operating Layer**。

手机处在最靠近人的位置。它天然拥有最连续的生活上下文：通知、日历、联系人、位置、语音、照片、文件、网页、正在使用的应用和各种临时输入。因此手机最适合承担的并不是复杂推理，而是“感知、整理、判断、调度”。

一个 3B～7B 的本地模型可以不断完成这些低成本工作：

- 判断一条信息属于什么项目；
- 提取人名、地点、时间和截止日期；
- 判断是否需要回复、创建 Todo 或加入日历；
- 对通知去重、聚类和排序；
- 对会议录音做转写、摘要和行动项提取；
- 给下载文件和截图自动分类；
- 判断任务是否超出手机自身能力；
- 将复杂任务压缩成结构化上下文，再转发给电脑端 Agent。

而电脑则负责另一类事情：代码、仓库操作、长文档、深度检索、浏览器自动化、复杂数学和需要较长上下文的推理。

理想中的链路大概是：

```text
手机上的事件 / 消息 / 文件 / 语音
                ↓
          本地小模型
                ↓
     分类 · 摘要 · 提取 · 路由
                ↓
      ┌─────────┴─────────┐
      │                   │
   简单任务             复杂任务
      │                   │
手机本地工具执行      整理 Task Bundle
                          ↓
                    PC / Cloud Agent
                          ↓
              Codex / Claude / GPT / MCP
                          ↓
                   完成任务并返回结果
```

这比试图在手机上塞一个“全能大模型”合理得多。

## 小模型不需要越来越聪明，而要越来越了解我

这个思路还有一个很重要的变化：端侧模型的核心竞争力未必是参数量。

例如系统看到“MATLAB 实验作业六”，真正需要知道的可能只是：这属于课程任务；相关文件在哪；最终需要 MATLAB 代码、图像和 LaTeX 报告；截止日期是什么；这种任务通常需要电脑执行。

一旦个人上下文已经结构化，本地模型并不需要完成作业本身。它只需要做出正确的判断：

```text
识别任务
→ 找到相关上下文
→ 判断复杂度
→ 创建日程 / Todo
→ 把完整任务交给电脑 Agent
```

因此未来真正改变体验的可能不是“7B 变成 14B”，而是：

**上下文 + 工具 + 权限 + 自动触发。**

模型只是其中的一层。

## 现在的瓶颈其实是操作系统

这也是我重新看待所谓“AI 手机”之后最大的变化。

如果一个手机有很强的 NPU，却不允许第三方 Agent 读取授权通知、不允许稳定的后台事件触发、不允许跨 App 调用能力，那么这些算力很难变成真正的个人自动化。

反过来，即使只是一个较小的模型，如果系统允许它：

- 获取用户授权后的通知和应用事件；
- 访问 Calendar、Reminders、Mail、Files、Contacts 等数据；
- 调用其他应用公开的结构化工具；
- 在后台由事件唤醒，而不是依赖用户手动打开 App；
- 通过细粒度权限控制读、写和高风险操作；
- 把复杂任务可靠地交给另一台设备；

那么它已经能创造非常明显的效率提升。

因此，我现在判断一台“AI 手机”的标准已经从芯片规格转向了 **Agent Runtime**。

## Apple：可能拥有最完整的成品体验，但不一定最适合自建 Agent

Apple 这两年的方向非常值得观察。

到 iOS 27，Apple 已经把 Foundation Models Framework 明显推向了 agentic application：开发者可以使用 Dynamic Profiles，在连续会话中动态切换模型、工具和指令；Foundation Models 也允许接入符合 `LanguageModel` 协议的其他模型。与此同时，新加入的 Core AI 专门面向 on-device BYOM，让开发者可以把自己的模型部署到 Apple Silicon 上。

App Intents 则继续承担系统工具接口的角色，让应用内容和操作能够被 Siri、Spotlight 与 Apple Intelligence 使用。

从技术积木来看，Apple 已经拥有：

```text
Apple Silicon
      +
Core AI / Foundation Models
      +
App Intents
      +
Spotlight / Siri / Apple Intelligence
      +
iPhone + Mac + Watch + AirPods
```

如果未来这些能力进一步打通，一套体验极好的个人 AI 系统是完全可以想象的。

例如会议开始后，AirPods 和 iPhone 完成录音和本地转写；Agent 自动提取行动项；Calendar 安排后续；Mac 在我回到桌面之前已经打开对应项目并准备好相关文件。

但 Apple 最大的不确定性也非常明显：**这个 Agent 最终到底属于谁？**

Apple 目前的体系更像：

```text
Apple Intelligence / Siri
          ↓
      系统级 Agent
          ↓
       App Intents
          ↓
       第三方应用
```

而我真正想要的是：

```text
我自己的 Personal Agent
          ↓
获得用户明确授权后的系统能力
          ↓
调度不同模型与应用
```

这两者看起来相似，控制权却完全不同。

Apple 很可能做出最成熟、最稳定、最隐私友好的“成品个人 AI”；但如果它始终坚持只有 Apple 自己的 orchestrator 能拥有系统级上下文，那么 iPhone 未必会成为最好的“自建 Personal Agent 平台”。

## Android：现在更接近我想要的研究平台

Android 的思路明显更开放。

它长期存在 NotificationListenerService，可以在用户授权后观察系统通知。新的 AppFunctions 又进一步把应用能力结构化暴露给 Agent：一个 App 可以把自己的数据和动作注册成系统可发现、可调用的 functions，概念上非常接近“移动端 MCP”。

这意味着 Android 正在逐渐形成这样的架构：

```text
            Android OS
                │
        AppFunctions Registry
                │
     ┌──────────┼──────────┐
     ↓          ↓          ↓
   日历       文件       第三方 App
     ↑          ↑          ↑
     └──────────┼──────────┘
                │
          Personal Agent
                │
         本地 LLM / 云模型
```

再加上 Android 本身更自由的 sideload、后台服务、自定义运行时和本地模型工具链，它目前明显更适合拿来研究“真正属于自己的 Agent”。

当然，Android 也不是无限开放。后台执行、功耗、权限、安全和厂商系统限制仍然会成为工程问题。但从 Personal Agent 的角度看，它现在至少提供了更多可以实验的入口。

## 所以现在应该买哪一边？我的答案是：都不急

这次思考最后反而让我更加确定：我目前没有必要为了“AI 手机”去购买某一代旗舰。

因为现在真正不成熟的并不是手机算力。

3B、4B、7B 量化模型已经能够在旗舰移动 SoC 上运行，未来性能和能效只会继续提升。真正还没有定型的是：

- 第三方 Agent 能获得多少系统上下文；
- 后台 Agent 是否成为正式的操作系统能力；
- 跨 App 工具协议能否真正普及；
- 微信、QQ、钉钉、飞书等国内高频应用会不会开放 Agent 接口；
- 用户能否自由选择自己的模型和 orchestrator；
- 手机和电脑之间能否建立稳定、安全的 Agent-to-Agent 协议。

因此，与其追逐某一代 NPU 的 TOPS，我更愿意观察未来一两年操作系统本身的变化。

## 我真正等待的“换机触发条件”

以后如果我要专门为了 Personal Agent 换一台手机，我会更关心下面这些指标：

| 项目 | 我希望看到的条件 |
| --- | --- |
| 内存 | 16GB 起步，24GB 更理想 |
| 本地模型 | 7B 4-bit 可以稳定运行 |
| 常用小模型 | 3B～4B 接近即时响应 |
| 功耗 | 持续分类、embedding、ASR 不明显破坏续航 |
| 后台 AI | OS 正式支持事件触发的模型推理 |
| 通知权限 | 能读取用户明确授权的通知 |
| 跨 App 工具 | 有统一的 App Function / Intent 类接口 |
| BYOM | 能自由部署自己的本地模型 |
| 权限系统 | 读、写、敏感操作可细粒度授权与撤销 |
| PC 协同 | 有可靠的 Agent-to-Agent 通道 |
| 国内生态 | 微信、QQ、钉钉等真正开放结构化 Agent 能力 |

这些条件的重要性，在我看来已经远高于摄像头多一颗传感器，或者 NPU benchmark 再高几十个百分点。

## Apple 和 Android，谁会赢？

现在还很难下结论。

我更愿意把二者理解成正在从两个方向向同一个终点靠拢。

Apple 从强封闭、强一体化出发，正在逐渐开放模型、工具和开发者接口；Android 从更自由、更碎片化的生态出发，正在通过 AppFunctions、系统级 AI 与端侧模型，把这些开放能力重新组织成统一的 Agent 平台。

Apple 的终极优势可能是：硬件、操作系统、隐私、AI 与多设备生态全部由同一家公司控制，因此可以做出几乎无缝的用户体验。

Android 的终极优势则可能是：允许用户和开发者真正决定“谁是 Agent、用什么模型、调用什么工具”。

对于我想构建的系统，后者目前更重要。

但如果未来某一代 iOS 真正允许第三方 Personal Agent 在清晰授权下获得足够深的系统能力，那么 Apple 的硬件、能效、Mac 协同和生态整合会立刻变得非常有吸引力。

所以我现在不会因为 iPhone 或 Android 某一代芯片更强就做决定。

我真正等待的是一个更根本的变化：

> **手机不再只是运行 AI 功能的设备，而是成为个人 Agent 的常驻边缘节点。**

到那时，手机也不再只是通信终端。它更像一台全天随身运行的个人 AI 边缘服务器：负责感知世界、理解上下文、处理低成本任务，并把真正复杂的工作交给更强的计算节点。

如果这个方向最终成熟，我认为它带来的效率提升会远大于今天任何一个单独的“AI 手机功能”。

---

### 延伸阅读

- Apple Developer: Foundation Models Framework — https://developer.apple.com/documentation/foundationmodels
- Apple Developer: What’s new in iOS 27 — https://developer.apple.com/wwdc26/guides/ios/
- Apple Developer: App Intents — https://developer.apple.com/documentation/appintents
- Android Developers: AppFunctions — https://developer.android.com/ai/appfunctions
- Android Developers: NotificationListenerService — https://developer.android.com/reference/android/service/notification/NotificationListenerService
