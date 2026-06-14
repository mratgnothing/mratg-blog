---
title: "配置 MiMo Code 红温了"
datetime: "2026-06-14T11:19+08:00"
mood: "red hot"
tags:
  - "AI"
  - "Agent"
  - "MiMo Code"
draft: false
---

配置 MiMo Code 红温了。

MiMo 原生还没有自定义 API，我自己写脚本倒腾了半天，结果又撞上它独特的 thinking 返回机制。DeepSeek 之类的推理模型会返回 `reasoning_content`，但 MiMo 再把工具结果发回模型时没有把这段 reasoning 原样带回去，NewAPI 就按 400 拒绝了。

更难受的是，MiMo 的第三方插件还很不完善，很多地方不像是“配置一下就能用”，更像是“先自己修到能跑”。只能说这玩意还远没有达到能用的程度。
