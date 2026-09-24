---
title: "把 FreeCAD 变成 AI 能直接操作的 CAD：一个可复用的专利附图 Skill"
description: "我把 FreeCAD、FreeCADCmd、TechDraw 和 Codex Skill 串成了一套可复用的本地 AI-CAD 工作流，并把安装器与示例开源了。"
category: "Tech Note"
column: "tech-note"
tags:
  - "FreeCAD"
  - "CAD"
  - "AI"
  - "Agent"
  - "Codex"
  - "Patent"
date: "2026-09-24"
updated: "2026-09-24T18:21+08:00"
draft: false
---

最近我在准备实用新型专利的附图，顺手做了一件一直很想做的事：**把一个传统 CAD 软件改造成 AI 能稳定调用的本地工具链。**

最终我选的是 FreeCAD。原因并不复杂：它不只是一个有 GUI 的开源 CAD，更重要的是它本身就提供完整的 Python 对象模型、`FreeCADCmd.exe`、参数化几何和 TechDraw 工程图能力。对 AI 来说，这意味着它不必盯着屏幕找按钮，而是可以直接操作几何对象。

我把这套环境整理成了一个公开仓库：

[GitHub：freecad-ai-patent-drawing-skill](https://github.com/mratgnothing/freecad-ai-patent-drawing-skill)

## 我想解决的其实不是“让 AI 会点 CAD”

如果只是让视觉模型去点击菜单、拖动草图、猜窗口位置，短时间内当然也能做出一点东西，但这种自动化很脆弱：窗口大小一变、主题一换、缩放一改，甚至只是某个面板没有展开，操作就可能跑偏。

所以我的思路从一开始就是：

```text
自然语言需求
  ↓
AI / Codex
  ↓
FreeCAD Python API / FreeCADCmd
  ↓
参数化 3D 模型
  ↓
FCStd + STEP
  ↓
TechDraw 工程图页面
  ↓
FreeCAD GUI 做最后的视觉检查和 SVG/PDF 导出
```

也就是说，**GUI 是最后验收和少量人工排版的地方，而不是 AI 的主要控制接口。**

## 它现在能做到什么

目前这套 Skill 已经可以完成这些任务：

- 根据尺寸和结构描述创建 FreeCAD 参数化模型；
- 自动做拉伸、圆柱、孔、布尔切除、融合、Placement 等常见建模操作；
- 集中维护长度、孔径、间距、角度等参数；
- 自动调用 `recompute()` 并检查 `Shape.isValid()`；
- 保存可继续人工编辑的 `.FCStd`；
- 导出标准 `.step` / `.stp`；
- 自动创建 TechDraw A4 页面；
- 生成正视、俯视、轴测、半剖等工程图视图；
- 用版本号保护原始文件，不直接覆盖唯一源文件；
- 对 FreeCADCmd 的执行结果做额外校验；
- 注册成 Codex Skill，以后只需要用自然语言描述 CAD 任务。

我还做了一个“可调角度传感器安装座”示例。模型里有底座、左右铰接耳、转轴、倾斜安装板、传感器壳体、锁紧旋钮和定位块，一共 8 个部件，同时自动创建 FIG.1 到 FIG.4 的工程图视图。

## 为什么额外做了一层运行器

实际测试里我遇到了一个很值得记录的问题：`FreeCADCmd.exe` 在某些 Python 异常场景下，进程退出码仍然可能是 0。

这意味着，如果自动化系统只判断：

```text
exit code == 0
```

就可能把一次已经异常的 CAD 任务误报成“成功”。

所以这个仓库里的运行器额外做了一个成功标记：只有目标 Python 脚本真正执行到最后，才会写入 marker。PowerShell 外层同时检查退出码和 marker，这样可靠得多。

这也是我越来越喜欢“AI + 专业软件 API”这类工作流的原因：很多真正影响稳定性的细节，并不在模型能力本身，而在工程控制层。

## 安装方法

目前主要针对 Windows 10/11，固定使用 FreeCAD 1.1.3。

如果电脑装了 Git，可以直接：

```powershell
git clone https://github.com/mratgnothing/freecad-ai-patent-drawing-skill.git
cd freecad-ai-patent-drawing-skill
powershell -NoProfile -ExecutionPolicy Bypass -File .\install.ps1
```

默认会安装到：

```text
%USERPROFILE%\AI-CAD
```

如果想像我一样放到 E 盘：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\install.ps1 -InstallRoot "E:\AI-CAD"
```

安装脚本会自动完成：

1. 从 FreeCAD 官方 GitHub Release 下载 Windows portable 版本；
2. 同时下载官方 SHA-256 文件；
3. 对下载包做 SHA-256 校验；
4. 解压 FreeCAD；
5. 部署 AI-CAD 目录、示例和脚本；
6. 设置用户级 `AI_CAD_ROOT` 环境变量；
7. 把 Skill 注册到 `%USERPROFILE%\.codex\skills\freecad-patent-drawing`；
8. 真正调用 FreeCAD API 建一个实体，测试 FCStd 保存和 STEP 导出。

所以安装完成不只是“文件复制结束”，而是会真的跑一次 CAD 冒烟测试。

## 安装后怎么验证

可以运行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "$env:AI_CAD_ROOT\skills\freecad-patent-drawing\scripts\verify_environment.ps1"
```

如果环境正常，会输出类似：

```text
Status   : PASS
Version  : FreeCAD 1.1.3
ApiSmoke : PASS: Part box, recompute, FCStd save, STEP export
```

## 怎么跑示例

```powershell
powershell -NoProfile -ExecutionPolicy Bypass `
  -File "$env:AI_CAD_ROOT\skills\freecad-patent-drawing\scripts\run_freecad_script.ps1" `
  -ScriptPath "$env:AI_CAD_ROOT\examples\demo_adjustable_sensor_mount.py"
```

然后打开生成的 `.FCStd`：

```powershell
& "$env:AI_CAD_ROOT\FreeCAD-1.1.3\FreeCAD.exe" `
  "$env:AI_CAD_ROOT\output\demo_adjustable_sensor_mount_v001.FCStd"
```

在左侧模型树中双击：

```text
Patent Drawing Demo - FIG.1 to FIG.4
```

就能进入 TechDraw 的整张 A4 工程图页面。

## 安装 Skill 之后，可以直接怎么问 AI

例如：

> 用 FreeCAD 画一个 80×50×8 mm 的安装底板，四角各有一个直径 6 mm 的安装孔，中间有一个带 10 mm 横向通孔的支耳。保存 FCStd 和 STEP，并创建正视、俯视和轴测 TechDraw 页面。

或者：

> 打开现有 FCStd，把安装孔从 6 mm 改成 8 mm，不覆盖原文件，保存为下一版本并重新生成工程图。

这时候 AI 不需要一步一步告诉你“点击哪个菜单”，而是可以直接生成并执行 FreeCAD Python 脚本，再用 FreeCADCmd 验证结果。

## 一个很真实的坑：TechDraw 为什么会全部重叠在正中央

我在第一次演示时就踩到了这个坑。

我原来写的是：

```python
view.X = 62
view.Y = 142
page.addView(view)
```

结果打开 A4 页面时，四个视图和所有文字全部挤在纸张正中央。

原因是 `page.addView(view)` 会重新初始化视图在页面上的位置，因此之前写进去的 X/Y 被覆盖了。

正确顺序应该是：

```python
page.addView(view)
view.X = 62
view.Y = 142
```

这个 bug 后来也直接写进了 Skill 的恢复规则和示例测试里。现在仓库中的 demo 还会额外检查 FIG.1~FIG.4 的坐标，防止这个问题回归。

## 为什么我觉得这条路线值得继续做

FreeCAD 只是一个例子。

对于 Vivado、Multisim、CAD、3D 引擎、仿真器甚至科研仪器软件，我越来越倾向于同一种架构：

```text
AI
  + 专业软件原生 API / CLI
  + 可重复脚本
  + 自动验证
  + 最后的 GUI 视觉确认
```

比起单纯追求“AI 能不能像人一样点鼠标”，这种方式更接近一个真正可复现的工程 Agent。

尤其是 CAD：模型不是一张图片，而是带参数、拓扑、实体、约束和版本关系的工程对象。AI 如果只看像素，很难真正掌握这些状态；但如果直接进入 CAD 的对象模型，就完全是另一回事。

## 当前边界

这套东西还没有到“一句话直接交专利”的程度，也不应该这么理解。

目前我会把自动化和人工检查明确分开：

- 参数化建模、布尔运算、保存、STEP 导出、TechDraw 对象创建：尽量自动化；
- 页面最终排版、复杂尺寸、中心线、剖面线、引出线、字体、裁切：GUI 里视觉验收；
- 是否满足某一专利局的形式要求、图纸是否足以支撑权利要求：仍然需要人来判断。

未来我还想继续完善自动标号、引出线、尺寸布局、剖视生成和最终 PDF 质量检查。

如果你也想让 AI 帮你画一些机械结构、课程设计或者专利示意图，可以直接从这个仓库开始：

**[mratgnothing/freecad-ai-patent-drawing-skill](https://github.com/mratgnothing/freecad-ai-patent-drawing-skill)**
