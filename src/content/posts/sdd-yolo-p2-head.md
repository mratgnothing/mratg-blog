---
title: "为什么无人机小目标检测需要 P2 检测头"
description: "从目标尺度、特征图分辨率和误检样本说起。"
category: "Tech Note"
tags:
  - "SDD-YOLO"
  - "Small Object Detection"
  - "arXiv:2603.25218"
date: "2026-06-07"
featured: true
---

## 问题不是“无人机小”，而是特征在网络里消失得太快

在地对空反无人机场景里，无人机经常只占图像里很小的一块区域。它可能是天空中的几个像素点，也可能和鸟、树枝、楼顶设备混在一起。如果检测网络过早下采样，小目标在深层特征图里会变成非常弱的响应，后面的分类和定位分支很难再把它找回来。

我的论文 [SDD-YOLO: A Small-Target Detection Framework for Ground-to-Air Anti-UAV Surveillance with Edge-Efficient Deployment](https://arxiv.org/abs/2603.25218) 正是在这个问题上展开：面向 ground-to-air 反无人机监视场景，把小目标特征分辨率和边缘部署效率一起考虑。

P2 检测头的直觉很简单：让模型在更高分辨率的特征层上保留一个检测出口。相比只依赖 P3/P4/P5，P2 能给小目标更多空间位置和边缘细节，尤其适合远距离无人机、弱纹理目标和复杂天空背景。

<div class="article-callout">
  <strong>SDD-YOLO 的写作角度：</strong>
  这篇文章不把 P2 当成“万能插件”，而是把它放进数据尺度、误检类型、计算成本和边缘部署约束里一起讨论。arXiv 摘要中公开的结果包括 SDD-YOLO-n 在 DroneSOD-30K 上达到 mAP@0.5 86.0%，并报告了 RTX 5090 与 Intel Xeon CPU 上的推理速度。
</div>

## 加入 P2 之后，真正要权衡的是计算预算

高分辨率检测头会带来额外计算量和显存压力。对于桌面 RTX 显卡，这个成本可能还能接受；但如果目标是 Ascend 310、RK3588 这类边缘设备，模型结构不能只追求 mAP，还要考虑算子兼容、推理延迟和后处理成本。

所以更合理的路线是：先在 RTX 环境证明 P2 对小目标召回和定位有帮助，再把模型导出到 ONNX，检查边缘侧部署链路中的瓶颈。如果 P2 带来的增益被部署成本抵消，就需要继续做剪枝、蒸馏或结构重排。

## 下一步我会补充什么

- DroneSOD-30K 中不同目标尺度的统计图和公开说明。
- P2 前后小目标 AP、误检样本和召回变化。
- RTX 与边缘设备上的延迟对比。
- 和知识蒸馏、NWD Loss 的组合实验记录。
