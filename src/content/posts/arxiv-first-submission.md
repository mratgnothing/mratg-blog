---
title: "水一篇看起来有点唬人的论文"
description: "LaTeX、.bbl、endorsement、版本更新和公开叙述。"
category: "Research Diary"
column: "research-diary"
tags:
  - "arXiv"
  - "SDD-YOLO"
  - "LaTeX"
date: "2026-06-04"
updated: "2026-06-08T12:16:00+08:00"
---

## 第一次写论文，纯水精灵请多包涵

我的 SDD-YOLO 纯水论文已经公开在 arXiv：[arXiv:2603.25218](https://arxiv.org/abs/2603.25218)。

## LaTeX 源码要能脱离本地环境编译

arXiv 不会继承你本地的 Overleaf 状态，也不会自动理解所有路径和临时文件。比较稳妥的做法是：检查主文件、图片路径、宏包、参考文献生成结果和编译日志。很多模板需要提交 `.bbl`，不能只依赖 `.bib`。

## 公开摘要要和项目页面保持一致

论文页、GitHub、个人网站和项目 PPT 最好使用一致的核心叙述：问题是什么、方法解决了什么、实验覆盖什么、代码或数据是否公开。

<div class="article-callout">
  <strong>下一步：</strong>
  也许我会把论文摘要、方法图、实验表格和代码链接整理成一个单独的 SDD-YOLO project page。
</div>

