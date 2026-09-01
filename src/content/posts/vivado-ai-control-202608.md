---
title: "把 Vivado 2017 接进我的 AI 工具链"
description: "从扫描本机环境到沉淀 vivado-ai-control Skill：尝试让 ChatGPT / Codex 真正完成 FPGA 工程中的仿真、综合、实现与板级工作。"
category: "Tech Note"
column: "tech-note"
tags:
  - "Vivado"
  - "FPGA"
  - "DevSpace"
  - "Codex"
  - "Automation"
date: "2026-08-25"
updated: "2026-09-02T00:10:00+08:00"
draft: false
---

过去我使用 AI 写 Verilog 时，边界通常停在“生成代码”这一层：模型可以告诉我状态机怎么写、约束怎么配，但真正打开 Vivado、建立工程、跑仿真、看综合结果、修 timing，最后仍然要手工完成。八月底我开始尝试把这条边界继续往前推。

本机一直保留着 Vivado 2017.4 和一批 FPGA 工作区，所以第一步不是重新安装环境，而是确认 AI 是否能通过 DevSpace 直接进入现有目录，再调用 Vivado 的 Tcl 能力。相比录制鼠标脚本，Tcl 更适合自动化：工程创建、文件导入、仿真、综合、实现、报告导出、bitstream 生成，基本都有稳定的命令接口。

这件事真正有价值的地方，是把“代码生成”升级成“闭环验证”。以后遇到一个 FPGA 作业，理想流程应该是：先分析题目和器件约束，再生成 RTL / testbench / XDC；然后真实调用 Vivado 仿真；如果波形或综合报告不符合预期，继续修代码；最后再进入板级下载和验证。AI 不能只在文本里宣称“应该能工作”，而要尽可能把软件真正跑到通过为止。

为了让以后不用重复摸索，我把这些经验整理成了 `vivado-ai-control` Skill。它约定 DevSpace 是默认执行入口，Vivado 2017.4 Tcl 是主要控制面，只有遇到明确能力缺口时才退回 Codex。这样以后再给一个 Vivado 题目，目标不再是收到一段参考代码，而是收到一个经过实际工具链验证的工程结果。

9 月初新的课程作业也刚好成为下一次实战。板卡暂时还没接上电脑，所以先做系统流程、状态设计、模块拆分和仿真计划；等硬件回来，再把最后的 bitstream、Hardware Manager 和板级验证补上。这个节奏反而很适合检验自动化到底能走多远。
