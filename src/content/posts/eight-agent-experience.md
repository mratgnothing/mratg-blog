---
title: "8 款 Agent 使用体验"
description: "从 Codex、Claude Code 到 Manus、Cursor、Antigravity、Trae、MiMo Code 和 CodeArts，记录一轮真实使用后的主观排序。"
category: "Horizon"
column: "horizon"
tags:
  - "AI"
  - "Agent"
  - "Workflow"
  - "Codex"
date: "2026-06-14"
updated: "2026-06-14T11:19+08:00"
draft: false
---

![8 个 Agent 桌面入口总览](/assets/posts/eight-agent-experience/agent-overview.png)

最近这段时间，我基本把主流能摸到的 Agent 平台都轮了一遍：Codex、Claude Code、Manus、Cursor、Antigravity、Trae、MiMo Code，还有华为 CodeArts Agent。

## Codex：目前最顶级的通用 Agent 助手

Codex 无疑是我现在用过的最顶级通用 Agent 助手。

它强的地方不是单点，而是整体体验足够完整。内置 GPT Image 2 带来的顶级生图能力，让它不只是能写代码、改文件、跑命令，还能直接参与视觉资产和内容生产；并行多任务让复杂工作可以拆开推进；丰富的第三方插件又把 GitHub、Figma、Google Drive、Netlify、数据分析、文档处理这些外部能力接了进来。

也就是说，Codex 的优势不是某个环节最强，而是通用任务闭环最强。它能同时处理代码、图片、文档、网页、部署、报告和自动化，像一个默认已经装好工具箱的工作台。

我现在会把复杂长流程任务优先交给 Codex：比如给博客加内容、处理图文资产、跑构建验证、整理项目上下文、准备发布。它不是只回答问题，而是能把事情一路做到结束。

## Claude Code：编码最强的 harness

![Claude Code 终端界面](/assets/posts/eight-agent-experience/claude-code.png)

如果单论写代码，Claude Code 依然是我心里的最强 harness。

它的 MCP 生态同样很丰富，全局记忆和项目记忆也很完善。只要把项目上下文维护好，它定位代码、理解约束、延续上一次工作状态的效率非常高。再加上并行多 Agent 模式，复杂工程任务可以被拆成多个方向同时推进，吞吐量很离谱。

CLI 形态一开始看起来门槛高，但熟练之后反而越用越顺手。因为它天然高度可定制，路径、脚本、上下文、权限、工具链都可以按自己的习惯固定下来。对纯编码任务来说，这种低摩擦感非常重要。

我的感受是：Codex 是最强通用助手，Claude Code 是最强编码机器。前者像一个全能工作台，后者像一把越磨越顺手的工程刀。

## Manus：可视化和办公文档能力很突出

![Manus 页面](/assets/posts/eight-agent-experience/manus.png)

Manus 是 Agent 领域比较早把“给 Agent 配一台电脑”这件事做出来的平台。

它的体验很直观：Agent 不只是调用工具，而是在一个可见的环境里操作。你能看到它打开页面、处理文件、移动流程，必要时也能让它操纵用户自己的电脑。这种可视化是 Manus 的优势，尤其适合不想只盯着命令行和日志的人。

另外，Manus 在处理和生成 PPT、Word 这类办公文档时相当出色。很多 Agent 在代码和网页任务上表现不错，但到了演示文稿、Word 报告、格式整理就容易变成半成品。Manus 在这类“桌面办公流”上明显更自然。

如果任务重点是可见操作、办公文档、PPT/Word 成品交付，Manus 的体验仍然很有竞争力。

## Cursor：体验最新模型的好平台

![Cursor IDE 页面](/assets/posts/eight-agent-experience/cursor.png)

Cursor 的优势在于它首先是一个基于 VS Code 的 IDE。

这意味着我的编辑器配置、快捷键、插件和项目习惯都能比较方便地迁移过去，上手成本很低。它也经常能比较快地接入新模型，所以想体验最新模型能力时，Cursor 是一个很好的平台。

不过如果把它放到“Agent 能力”这个维度上，它还是不如 Codex、Claude Code 和 Manus 那么完整。它更像一个增强型 IDE：写代码、补全、解释、局部修改都很舒服，但复杂长流程任务的执行感和闭环能力没有前面几个强。

所以我对 Cursor 的定位很明确：它适合高频编码和模型体验，但不是我现在最信任的通用 Agent。

## Antigravity：免费额度补给站

Antigravity 的免费额度相对比较多，而且形态也比较杂：既有类似 Codex 的对话 Agent，也有类似 Cursor 的 IDE。

它对我最大的价值是补充额度。Codex、Claude Code 或其它平台额度用完的时候，用 Antigravity 的免费 Gemini 和 Claude 继续顶一会儿，是很实用的选择。尤其 Antigravity、Gemini、Google AI Studio 这几个平台的额度计算是独立的，组合起来就是一套很香的备用弹药。

它不一定是我最常用、最信任的主力工具，但作为“额度池”和模型入口，非常有存在感。

## Trae：主要优势是性价比

Trae 的优势主要是性价比。

简单任务我会交给 Trae 的免费国产模型代劳，比如轻量改文案、简单查代码、做一些不会牵涉复杂上下文的局部修改。这样 Codex、Claude Code 这类更强的平台就可以专注处理复杂长流程任务。

这类工具的定位其实很清楚：不是所有事情都值得动用最强模型。低风险、短上下文、可快速验收的任务，用便宜或者免费的模型就够了。

## MiMo Code：潜力有，但现在还不成熟

![MiMo Code 页面](/assets/posts/eight-agent-experience/mimo-code.png)

MiMo Code 这个平台基于 opencode 开发，据说只有 5 人团队开发了 14 天。这个速度很猛，但现在确实还不够成熟。

我遇到的问题主要集中在第三方插件和模型接入上。很多插件接入都有 bug，体验不像一个已经打磨好的平台。更麻烦的是 MiMo 独特的 thinking 返回机制，会让 DeepSeek 这类推理模型直接趴窝。

具体说，推理模型返回了 `reasoning_content`，但 MiMo 再把工具结果发回模型时，没有把这段 reasoning 原样带回去。NewAPI 会按协议直接 400 拒绝。于是本来应该是“接入模型就能用”，实际变成了自己写脚本、自己修返回、自己排协议问题。

它有想象空间，也有社区速度，但目前离稳定可用还有很大完善空间。

## CodeArts Agent：不想多说

华为 CodeArts Agent 就不想展开喷了，给到拉完了。

它的体验基本就是 VS Code 套壳，然后加了 GLM5 和 DeepSeek v3 这两款已经很老的模型。模型性能和产品打磨都很难让人满意。一个 Agent 产品如果只停留在 IDE 壳、旧模型、弱执行链路上，就很难承担真正的复杂任务。

只能说，这种产品能发布出来本身就很匪夷所思，也确实挺符合我对某些企业文化的刻板印象。

## 我的当前排序

如果按我自己的使用习惯来排：

Codex 是最强通用 Agent，适合复杂长流程和多模态生产；Claude Code 是最强编码 harness，适合高强度工程任务；Manus 适合可视化操作和办公文档；Cursor 是舒服的模型 IDE；Antigravity 是免费额度补给站；Trae 是性价比工具；MiMo Code 还在早期；CodeArts Agent 暂时不进入推荐列表。

工具不是越多越好，而是要知道谁该干什么。现在我的策略就是：最难的任务交给 Codex 和 Claude Code，办公文档看 Manus，IDE 内体验模型看 Cursor，额度不够就开 Antigravity，简单活给 Trae，MiMo Code 继续观察，CodeArts 先放一边。
