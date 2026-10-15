---
title: "WAVE VisionLab：用 Agnes Harness 让智能体真正完成可验证的工程实验"
slug: "wave-visionlab-agh-hackathon-u286"
description: "用 Agnes 3.0 Flash 与 AGH 调度 WAVE 的真实工程工具：12 张 RF 频谱图像、连续工具调用、异常恢复与可复核证据。"
category: "Tech Note"
column: "tech-note"
tags: ["WAVE", "Agnes Harness", "Agent", "MCP", "Hackathon"]
date: "2026-10-15"
draft: false
---

> 2026 年江苏省 AI+科学与工程创新实践黑客松 · 本科生组 U286「一吴是处」。本文发布于 2026 年 10 月 15 日，介绍已完成的本机真实运行与验证。

工程实验里，最费时间的步骤往往发生在训练之前：找到正确项目和数据集，检查标注与划分，核对版本，再决定下一步。我们希望智能体能真正调用工具、读取结果，在出错时修正动作，并留下别人能够检查的证据。

**WAVE VisionLab：基于 Agnes Harness 的可验证智能工程实验 Agent**，就是围绕这个目标构建的参赛作品。此次以无线电频谱图像为例，完成真实数据审计与异常恢复闭环。

## 先看 4 分 19 秒动态演示

<video class="u286-demo-video" controls playsinline preload="metadata" poster="/assets/posts/wave-visionlab-agh-hackathon-u286/cinematic-demo-poster.png" style="display:block;width:100%;max-width:100%;height:auto;aspect-ratio:16/9;background:#171b24;border-radius:8px;">
  <source src="/assets/posts/wave-visionlab-agh-hackathon-u286/U286_WAVE_VisionLab_AGH_Cinematic_Demo.mp4" type="video/mp4" />
  你的浏览器暂不支持内嵌视频，请使用下方 MP4 链接观看。
</video>

[直接打开 / 下载演示 MP4](/assets/posts/wave-visionlab-agh-hackathon-u286/U286_WAVE_VisionLab_AGH_Cinematic_Demo.mp4)

视频时长 259.37 秒，H.264 / AAC、1280×720、30 fps，配有自然中文解说。连续空间镜头、光场转场、真实界面聚焦与原始样本展示构成完整演示。它是基于真实截图与已核验原始事件制作的**动态解说回放**，并非连续屏幕录制。



## AGH 负责规划，WAVE 提供工程工具

![WAVE VisionLab 架构示意图](/assets/posts/wave-visionlab-agh-hackathon-u286/architecture.svg)

用户用自然语言提出工程问题。**Agnes 3.0 Flash（模型 ID：`agnes-3.0-flash`）**通过 AGH 的模型提供方接口参与任务决策；AGH 运行任务循环、发起 MCP 工具调用、保存执行轨迹。模型收到实际返回值后继续决定下一步。

WAVE 提供项目、数据集、版本与审计能力，通过 MCP Gateway 校验权限并执行领域工具。此次使用本机回环地址和短期只读 PAT，开放五个工具。AGH 是这条链路的任务规划和执行核心，WAVE 原有内置 Agent 未用于替代 AGH。

技术环境为 Windows、Node.js 24.13.0、源码构建的 Agnes Harness、Python / FastAPI WAVE API 与 SQLite 隔离数据库。AGH 源码版本为 `98bc11572ba162bcdf6ce2b29612a44508faf951`；模型通过 Agnes AI Provider 调用 `https://api.agnes-ai.cn/v1`，核心用途是规划、选择工具、理解审计结果和错误恢复。未获得更细的模型权重版本标识，因此仅报告实际模型 ID。

## 真实执行：五步连续调用

![真实 AGH Trace 页面，展示模型和工具调用时间线](/assets/posts/wave-visionlab-agh-hackathon-u286/agh-real-trace.png)

上图为真实 AGH 会话截图，展示 Trace 时间线和工具记录；页面自身的 Calls 计数与核验报告的 MCP 工具调用对数口径不同。下面的顺序来自原始 `tool/call` 与 `tool/result` 事件配对核验。

| 顺序 | AGH 实际调用 | 工程作用 |
| --- | --- | --- |
| 1 | `projects_list` | 找到可访问项目 |
| 2 | `datasets_list` | 发现实际数据集及其 ID |
| 3 | `project_overview` | 核对项目概览 |
| 4 | `dataset_audit` | 审计真实图像与原始标签 |
| 5 | `versions_list` | 核对项目版本及登记状态 |

这五步均由 AGH 模型在真实会话中发起。独立验证脚本检查了调用顺序、参数、结果以及事件序号；脚本验证结果与 Agent 原始执行轨迹分别保存。

## 数据发现：登记三类，样本出现两类

![RF 样本划分与类别标注数量统计](/assets/posts/wave-visionlab-agh-hackathon-u286/rf-subset-statistics.svg)

我们导入 12 张原始 RF 频谱图像及对应 YOLO 标签，train / valid / test 分别为 6 / 3 / 3 张。图像与源文件 SHA-256 一致。样本含 44 个标注：Bluetooth 25 个，WiFi 19 个。

项目版本登记了 3 个类别，此子集实际只出现 2 类。这是一个需要反馈给实验计划的数据质量发现，**不能据此断言完整数据集缺少 Drone_Signal 类**。版本 ready 也只说明工程登记状态，不能证明训练已完成或准确率达标。

## 出错之后，模型如何继续

![真实 AGH 会话中的失败恢复总结](/assets/posts/wave-visionlab-agh-hackathon-u286/agh-real-recovery.png)

| 场景 | 实际触发条件 | 已核验行为 |
| --- | --- | --- |
| 正常 | 有效项目与数据集 | 五步调用完成，返回 12 张图像、44 个标注与版本信息 |
| 边界 | `project_id=99999999` | 工具返回实际 `not_found`；AGH 将其识别为错误，未当作正常空列表 |
| 失败恢复 | `dataset_id=does-not-exist-u286` | 审计失败后调用 `datasets_list`，根据真实返回 ID 再次审计成功 |

三轮共保留 **234 条 AGH 原始事件、10 组工具调用与结果、2 次预期错误**。三类场景通过独立核验，这一结果仅适用于此次具体用例，不是大规模鲁棒性或准确率评测。

## 证据如何复核

[查看公开验证摘要 JSON](/assets/posts/wave-visionlab-agh-hackathon-u286/verification-summary.json)。该文件是从既有验证报告提取的公开汇总，**不是 AGH 原始轨迹**。完整原始执行记录与验证脚本保留在非公开赛事附件中，未公开模型 Key、WAVE PAT、运行账户配置或完整 WAVE 源码。

原始完整轨迹 SHA-256：

```text
152df99c18911a21c114a8e75f1e153bf8bf6684491a6132bf99b99bf73d80e1
```

复现思路是先在隔离环境准备样本和数据服务，配置只读 MCP 与自有合规模型账户，再向 AGH 提出同样的审计问题，并导出原生事件，核对工具调用与实际结果。具体安装和运行步骤、验证脚本与样本来源随赛事材料提供；本博客提供项目介绍、视频及公开证据摘要，不是开放的 WAVE 在线实验服务。

## 既有工作、本次改造与局限

WAVE 是此前已开发的工程平台；项目、数据集、版本、权限和 MCP 工具基础能力属于既有工作。本次新增和整理的是 AGH 接入、参赛 Skill、隔离运行配置、真实 RF 样本联调、三类测试、原始轨迹导出与独立验证、演示及复现材料。我们没有将既有平台的全部功能作为本次新增成果。

此次没有训练模型、开展检测推理性能测量或租用 GPU，因此没有可报告的 mAP、识别准确率或训练加速比。仅 12 张图像的结果不能推广到完整数据集；近似重复、图像清晰度、人工标注准确性等未测量指标也不作结论。后续可在明确审批后扩展完整数据审计、训练和设备工作流。

## 团队分工

本作品参赛成员为孙潇珩（队长）和陈鹏宇。孙潇珩负责需求与展示统筹、材料审核和提交协调；陈鹏宇负责 AGH/WAVE 接入、真实样本整理、三类验证与证据复核。

## 第三方来源与许可

- 智能体框架：[Agnes Harness 官方仓库](https://github.com/AgnesAI-Labs/agnes-harness)，项目自身代码采用 Apache-2.0；第三方组件以其各自许可为准。本作品使用官方源码运行，未宣称独立开发 AGH。
- 数据：[Dataset_Drones_Bluetooth_Wifi，Mendeley Data，version 1](https://data.mendeley.com/datasets/y4w96kzsb5/1)，DOI：[10.17632/y4w96kzsb5.1](https://doi.org/10.17632/y4w96kzsb5.1)。作者：Radhoine ALOUI、saber mgannem、Bilel Hamdi、Sofien Mhatli、Tijeni Delleji、Ignacio Llamas-Garro；许可为 CC BY 4.0。此次仅选取原始图像及标注子集并编制划分清单，未改写图像与标签。
- 本文架构图和数据统计图是依据实际实现及核验数据制作的说明图；AGH 界面图为实际会话截图。WAVE 为既有工程基础，上游代码与第三方组件遵循各自许可。

[赛事官网与参赛规程](https://agnes-ai.cn/hackathon)

<style>body:has(.u286-demo-video) .article-hero h1{font-size:clamp(1.7rem,3.3vw,3rem);line-height:1.4;word-break:normal;overflow-wrap:normal;text-wrap:pretty} @media(max-width:600px){body:has(.u286-demo-video) .article-hero h1{font-size:1.65rem;line-height:1.45}body:has(.u286-demo-video) .article-meta{gap:8px}}</style>
