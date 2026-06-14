---
title: "WAVE-cloud Agent demo 前应该检查什么"
description: "把前端、后端、Agent 和 Docker 串起来之前，先确认每个接口都有证据。"
category: "Team Log"
column: "team-log"
tags:
  - "WAVE-cloud"
  - "Agent"
date: "2026-06-08"
updated: "2026-06-08T13:36:00+08:00"
---

## Demo 不是把页面点通就结束

WAVE-cloud 的 Agent demo 如果要在团队里稳定复用，需要先把可验证证据准备好。前端能显示一个流程，不等于后端任务真实落库；后端返回成功，也不等于 Agent 的工具调用真的完成；Docker 能启动，也不等于换一台机器就能复现。

我会把 demo 前检查拆成四栏：前端、后端、Agent、部署。

## 每一栏都要有最小证据

前端至少要有页面入口、错误态和任务状态刷新。后端至少要有健康检查、核心接口和日志定位路径。Agent 至少要能说明工具输入、输出和失败回退。部署至少要保留 Docker build、compose up 和浏览器访问记录。

这听起来像文档工作，但本质上是降低团队协作成本。一个 demo 如果只能在某个人电脑上跑，它对项目节奏的帮助很有限。

## PM 视角关注风险

作为 PM，我更想看到“哪里还没闭环”，而不是只看“哪些已经完成”。Demo checklist 的价值就在这里：它能把风险暴露在演示之前，而不是在演示现场临时发现。
