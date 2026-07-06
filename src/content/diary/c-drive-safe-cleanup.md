---
title: "一次保守的 C 盘清理"
datetime: "2026-06-22T11:10:00+08:00"
mood: "careful"
tags:
  - "Windows"
  - "Workflow"
draft: false
---

今天让 Codex 查了一次 C 盘。桌面上的清理脚本已经扫不出什么东西，但 C 盘还是只剩二十来 GB。

最后没有乱删，整次检查按白名单走：先看现有脚本，再看 NVIDIA 更新缓存、VS 安装残留、Conda、Docker、浏览器缓存和 Windows 临时目录。真正确认安全的大头只有两个：NVIDIA App 的 `ota-artifacts`，还有一个 Visual Studio 安装展开残留目录。

清理前后重新量了一次空间，C 盘从大约 19.86 GB 可用变成 26.48 GB，可回收的白名单项基本清空。

这件事给我的提醒是：所谓“清缓存”最危险的地方在于太容易把名字像缓存的真实数据一起删掉。保守一点慢很多，但至少不会把电脑维护变成一次事故。
