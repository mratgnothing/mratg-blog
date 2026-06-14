export interface ProjectLink {
  label: string;
  href?: string;
}

export interface ProjectDetailSection {
  title: string;
  body: string;
  bullets?: string[];
}

export interface ProjectDetail {
  role: string;
  period: string;
  repository: string;
  sourceNote: string;
  stats: { label: string; value: string }[];
  sections: ProjectDetailSection[];
  resources: ProjectLink[];
}

export interface Project {
  title: string;
  slug: string;
  label: string;
  icon: string;
  image: string;
  alt: string;
  className: string;
  description: string;
  tags: string[];
  links: ProjectLink[];
  detail: ProjectDetail;
}

export const projectHref = (project: Project) => `/projects/${project.slug}/`;

export const projects: Project[] = [
  {
    title: "SDD-YOLO",
    slug: "sdd-yolo",
    label: "Research Flagship",
    icon: "drone",
    image: "/assets/project-sdd.jpg",
    alt: "Pixel art drone detection research cover.",
    className: "featured project-hero-card",
    description:
      "面向地对空反无人机场景的小目标检测框架，arXiv:2603.25218，关注 P2 高分辨率检测头、DFL-free / NMS-free 推理和边缘高效部署。",
    tags: ["SDD-YOLO", "Edge AI", "Research"],
    links: [
      { label: "arXiv Paper", href: "https://arxiv.org/abs/2603.25218" },
      { label: "PDF", href: "https://arxiv.org/pdf/2603.25218" },
    ],
    detail: {
      role: "第一作者 / 模型与实验主线",
      period: "2026",
      repository: "论文公开，代码组织预留",
      sourceNote: "内容依据 arXiv:2603.25218 PDF 与摘要整理。",
      stats: [
        { label: "任务", value: "G2A Anti-UAV" },
        { label: "数据集", value: "DroneSOD-30K" },
        { label: "核心结构", value: "P2 head + YOLO26" },
        { label: "结果", value: "86.0 mAP@0.5" },
      ],
      sections: [
        {
          title: "项目定位",
          body:
            "SDD-YOLO 是面向地对空反无人机监控的小目标检测研究。问题核心不是普通目标检测，而是远距离无人机在画面中只有极低像素占比、背景包含云层和鸟类等干扰，同时部署端还要求实时推理。项目把数据集、结构改造、训练策略和边缘推理约束放在同一条研究线上处理。",
        },
        {
          title: "方法主线",
          body:
            "模型以 YOLO26 的端到端检测思想为基础，加入 4 倍下采样的 P2 高分辨率检测头，用更细的特征图保留微小目标的几何细节；同时采用 DFL-free 与 NMS-free 的设计，减少对边缘 NPU 不友好的算子和后处理开销。",
          bullets: [
            "P2 high-resolution head：缓解 P3 对 8px 级目标压缩过强的问题。",
            "Dual attention：抑制鸟、云、建筑边缘等空域背景误检。",
            "MuSGD + ProgLoss + STAL：改善稀疏小目标信号带来的梯度震荡。",
            "Feature-aligned distillation：用更强 teacher 向 nano student 迁移小目标特征表达。",
          ],
        },
        {
          title: "数据与实验",
          body:
            "论文构建了 DroneSOD-30K，覆盖不同天气、光照、复杂背景和微小目标样本。实验中 SDD-YOLO-n Final 在 DroneSOD-30K 上达到 86.0% mAP@0.5，并在 RTX 5090 上达到 226 FPS，在 Intel Xeon CPU 上达到 35 FPS。",
        },
        {
          title: "后续材料",
          body:
            "博客后续适合补充三类内容：数据集构建与标注 QC、P2 head 和 DFL-free 的结构拆解、以及从 PyTorch 到 ONNX / ATC / RKNN 的部署链路记录。",
        },
      ],
      resources: [
        { label: "arXiv Abstract", href: "https://arxiv.org/abs/2603.25218" },
        { label: "arXiv PDF", href: "https://arxiv.org/pdf/2603.25218" },
        { label: "SDD-YOLO Org", href: "https://github.com/SDD-YOLO" },
        { label: "Related Article", href: "/posts/sdd-yolo-p2-head/" },
      ],
    },
  },
  {
    title: "WAVE-cloud",
    slug: "wave-cloud",
    label: "Platform",
    icon: "wave",
    image: "/assets/project-wave.jpg",
    alt: "Pixel art cloud vision engineering platform cover.",
    className: "project-side-card",
    description:
      "华为挑战杯方向的视觉工程平台，面向数据、训练、部署与 Agent 协作，当前重点是云端平台和 Ascend 验证链路。",
    tags: ["WAVE-cloud", "Agent", "Engineering"],
    links: [
      { label: "GitHub Repo", href: "https://github.com/Ascend-Computing-Visual-Platform/WAVE-cloud" },
      { label: "Org Project" },
    ],
    detail: {
      role: "项目经理 / 云端平台与 Agent 协作推进",
      period: "2026 Huawei Challenge Cup",
      repository: "Ascend-Computing-Visual-Platform/WAVE-cloud",
      sourceNote: "内容依据 WAVE-cloud README 与 docs/README.md 整理。",
      stats: [
        { label: "前端", value: "React 19 + Vite" },
        { label: "后端", value: "FastAPI" },
        { label: "运行", value: "Docker Compose" },
        { label: "目标", value: "端云一体 AI 工作站" },
      ],
      sections: [
        {
          title: "项目定位",
          body:
            "WAVE-cloud 是端云一体化低代码 AI 工作站的 Web 控制台 monorepo。它把数据集标注、低代码构图、训练监控、任务迁移和团队协作放到一个云端控制台中，并为华为 IAM/OIDC、OBS、GaussDB、CodeArts 等生态能力预留接入位。",
        },
        {
          title: "系统结构",
          body:
            "仓库由 frontend/ 与 backend/ 两条主线组成：前端负责工作台、路由、API 客户端与可视化交互；后端负责 FastAPI 路由、认证、数据与训练任务 API、实时事件和后续华为云服务接入。Docker Compose 用于同时启动 API 与前端开发服务。",
          bullets: [
            "前端本地默认运行在 127.0.0.1:5173。",
            "后端 API 默认运行在 127.0.0.1:5000。",
            "docs/README.md 是维护者和 Agent 的架构入口。",
            "Ascend 310 POC、Copilot、租户分级、OBS 接入等材料分散在 docs/ 专题文档中。",
          ],
        },
        {
          title: "个人贡献视角",
          body:
            "这个项目更偏工程组织与平台化：需要同时追踪前端、后端、Agent、测试部署和华为生态兼容度。对个人站点来说，它代表的是从模型实验走向团队平台、交付节奏和端云协同的能力。",
        },
        {
          title: "后续记录方向",
          body:
            "适合继续公开沉淀的内容包括：Ascend 310 OM 推理链路、云端训练任务生命周期、Agent 审批流、Docker 部署排障、以及面向比赛答辩的系统架构材料。",
        },
      ],
      resources: [
        { label: "GitHub Repo", href: "https://github.com/Ascend-Computing-Visual-Platform/WAVE-cloud" },
        { label: "Architecture Index", href: "https://github.com/Ascend-Computing-Visual-Platform/WAVE-cloud/blob/main/docs/README.md" },
        { label: "Team Article", href: "/posts/wave-team-engineering/" },
        { label: "Agent Checklist", href: "/posts/wave-cloud-agent-demo-checklist/" },
      ],
    },
  },
  {
    title: "EdgeDistillDet",
    slug: "edgedistilldet",
    label: "Tooling",
    icon: "chip",
    image: "/assets/project-edge.jpg",
    alt: "Pixel art edge AI distillation workbench cover.",
    className: "project-small-card",
    description:
      "小目标检测训练、评估、知识蒸馏与边缘部署工作台，目标是把模型实验变成可复用的工程流程。",
    tags: ["Edge AI", "ONNX", "Engineering"],
    links: [
      { label: "GitHub Repo", href: "https://github.com/SDD-YOLO/EdgeDistillDet" },
      { label: "Org Project" },
    ],
    detail: {
      role: "工具链设计 / Web 工作台与边缘评估方向",
      period: "2026",
      repository: "SDD-YOLO/EdgeDistillDet",
      sourceNote: "内容依据 EdgeDistillDet README 整理。",
      stats: [
        { label: "核心", value: "Adaptive KD" },
        { label: "评估", value: "UnifiedBenchmark" },
        { label: "剖析", value: "RK3588 / Ascend310" },
        { label: "界面", value: "FastAPI + React" },
      ],
      sections: [
        {
          title: "项目定位",
          body:
            "EdgeDistillDet 是面向边缘场景的微小目标自适应蒸馏与检测评估系统。它不是单个训练脚本，而是围绕训练、评估、部署剖析和本地 Web 工作台组织的一套工作流。",
        },
        {
          title: "核心能力",
          body:
            "工具链基于 Ultralytics YOLOv8，包含自适应知识蒸馏、多设备评估、边缘部署可行性剖析和可视化工作台。README 中的能力表把 AdaptiveKDTrainer、UnifiedBenchmark、EdgeProfiler 和 FastAPI + React 工作台作为四个核心模块。",
          bullets: [
            "AdaptiveKDTrainer：余弦温度退火、动态 alpha、小目标加权 KL/Focal 损失。",
            "UnifiedBenchmark：GPU/CPU FPS 与边缘效能综合评分。",
            "EdgeProfiler：内置设备数据库，估算理论 FPS、内存、量化收益和可行性等级。",
            "Web 工作台：配置中心、训练控制台、模型编辑器、指标监控和 AI Agent。",
          ],
        },
        {
          title: "为什么重要",
          body:
            "SDD-YOLO 解决模型结构问题，EdgeDistillDet 则处理工程复现问题：如何让不同模型、数据集、设备和部署目标进入同一个评估口径。它适合承接 ONNX、RKNN、Ascend、CPU/GPU FPS 和压缩策略的横向对比。",
        },
        {
          title: "后续记录方向",
          body:
            "可以继续补充训练配置模板、Web UI 使用指南、边缘设备剖析报告、知识蒸馏实验对比和 AI Agent 自动诊断训练失败的日志。",
        },
      ],
      resources: [
        { label: "GitHub Repo", href: "https://github.com/SDD-YOLO/EdgeDistillDet" },
        { label: "Quick Start Docs", href: "https://github.com/SDD-YOLO/EdgeDistillDet/blob/main/docs/guides/quick_start.md" },
        { label: "Edge Deployment Knowledge", href: "https://github.com/SDD-YOLO/EdgeDistillDet/blob/main/docs/knowledge_base/edge_deployment.md" },
        { label: "ONNX Note", href: "/posts/onnx-output-diff-note/" },
      ],
    },
  },
  {
    title: "Physics Experiment Agent",
    slug: "physics-ai-agent",
    label: "AI Education",
    icon: "atom",
    image: "/assets/project-physics.jpg",
    alt: "Pixel art physics experiment AI agent cover.",
    className: "project-small-card",
    description:
      "面向大学物理实验的数据分析与诊断 Agent，尝试把 RAG、代码执行、流式输出和可视化反馈接进实验学习。",
    tags: ["AI", "Agent", "Physics"],
    links: [
      { label: "GitHub Repo", href: "https://github.com/mratgnothing/physics-ai-agent" },
      { label: "Public" },
    ],
    detail: {
      role: "全栈实现 / Prompt 与执行链路设计",
      period: "2026",
      repository: "mratgnothing/physics-ai-agent",
      sourceNote: "内容依据 physics-ai-agent README 整理。",
      stats: [
        { label: "后端", value: "Node.js + Express" },
        { label: "计算", value: "Python 3" },
        { label: "输出", value: "NDJSON stream" },
        { label: "部署", value: "Docker / Render" },
      ],
      sections: [
        {
          title: "项目定位",
          body:
            "Physics Experiment Agent 是面向大学物理实验的智能诊断 Agent。它接收实验讲义和原始数据，提取物理模型、变量、单位、误差来源和实验约束，再生成并执行 Python 分析脚本，最后基于真实计算结果给出诊断报告。",
        },
        {
          title: "工作流",
          body:
            "系统的关键设计不是让 LLM 直接编故事，而是要求它生成可运行代码，并把最终诊断绑定到服务器实际执行得到的输出、图像和 JSON 结果上。",
          bullets: [
            "上传实验手册和可选原始数据。",
            "用讲义理解模型抽取公式、假设、变量和误差项。",
            "生成 Python 脚本，执行拟合、残差分析、指标计算和可视化。",
            "收集 analysis_result.json 与图像等 artifacts。",
            "生成中文实验诊断和改进建议，并支持分段追问。",
          ],
        },
        {
          title: "工程约束",
          body:
            "后端用 Express 处理上传、流式进度、LLM 调用、代码校验和 Python 子进程执行；前端是静态 HTML，配合 Tailwind CDN、Marked、DOMPurify 和 MathJax 渲染报告。生成代码有安全校验，禁止危险模块、系统调用和 eval/exec 等模式。",
        },
        {
          title: "后续记录方向",
          body:
            "这个项目适合继续写成 AI 教育工具系列：如何把 LLM 输出转化成可执行证据、如何约束生成代码、如何把公式和图像一起反馈给学生，以及如何做更强的 Python 执行沙箱。",
        },
      ],
      resources: [
        { label: "GitHub Repo", href: "https://github.com/mratgnothing/physics-ai-agent" },
        { label: "README", href: "https://github.com/mratgnothing/physics-ai-agent/blob/master/README.md" },
        { label: "Dockerfile", href: "https://github.com/mratgnothing/physics-ai-agent/blob/master/Dockerfile" },
        { label: "Agent Tag", href: "/tags/agent/" },
      ],
    },
  },
  {
    title: "Molecule Studio",
    slug: "molecule-studio",
    label: "Visualization",
    icon: "cube",
    image: "/assets/project-molecule.jpg",
    alt: "Pixel art molecule visualization project cover.",
    className: "project-small-card",
    description:
      "AI 驱动的 3D 分子可视化与智能检索系统，用 React、Three.js 和开放化学数据做轻量科学展示。",
    tags: ["AI", "Science"],
    links: [
      { label: "GitHub Repo", href: "https://github.com/mratgnothing/Molecule-Studio" },
      { label: "Public" },
    ],
    detail: {
      role: "前端实现 / 3D 可视化与检索链路",
      period: "2026",
      repository: "mratgnothing/Molecule-Studio",
      sourceNote: "内容依据 Molecule-Studio README 整理。",
      stats: [
        { label: "前端", value: "React 18 + Vite" },
        { label: "3D", value: "Three.js" },
        { label: "数据", value: "PubChem PUG REST" },
        { label: "AI", value: "OpenAI-compatible API" },
      ],
      sections: [
        {
          title: "项目定位",
          body:
            "Molecule Studio 是一个面向学习、展示和轻量科研辅助的智能分子工作室。它支持英文名、中文常见名、分子式、SMILES 和自然语言描述检索化合物，并在浏览器中实时展示三维分子结构。",
        },
        {
          title: "主要能力",
          body:
            "系统通过 PubChem PUG REST API 获取 CID、3D/2D 结构、原子、化学键、坐标和分子属性，再用 Three.js 渲染 CPK 配色的球棍模型。右侧信息面板展示分子式、分子量、原子数、键数、IUPAC 名称、CID、SMILES 和选中原子的细节。",
          bullets: [
            "标准检索：英文名、中文名、分子式、SMILES。",
            "自然语言查询：本地规则优先，必要时调用 OpenAI 兼容接口解析候选分子。",
            "3D 交互：旋转、平移、缩放、点击原子查看属性。",
            "教学辅助：元素标签、原子编号、示例分子快捷入口。",
          ],
        },
        {
          title: "稳定性处理",
          body:
            "README 强调系统不会只依赖单个 LLM 解析结果，而是构造多个候选并逐个尝试 PubChem 查询；同时修复了复杂分子坐标解析问题，优先从 PubChem conformer 坐标中获取结构。",
        },
        {
          title: "后续记录方向",
          body:
            "适合继续扩展分子收藏、PNG 导出、SMILES 复制、多分子对比、球棍/空间填充/线框模型切换，以及更完整的元素周期表支持。",
        },
      ],
      resources: [
        { label: "GitHub Repo", href: "https://github.com/mratgnothing/Molecule-Studio" },
        { label: "README", href: "https://github.com/mratgnothing/Molecule-Studio/blob/main/README.md" },
        { label: "PubChem PUG REST", href: "https://pubchem.ncbi.nlm.nih.gov/docs/pug-rest" },
        { label: "Science Tag", href: "/tags/science/" },
      ],
    },
  },
  {
    title: "SEUPhyX Platform",
    slug: "seuphyx",
    label: "Side Project",
    icon: "flask",
    image: "/assets/project-seuphyx.jpg",
    alt: "Pixel art physics data analysis project cover.",
    className: "project-wide-card",
    description:
      "东南大学物理实验数据处理工具，当前主线是密立根油滴实验的 AI 聚类、符号回归、报告生成和 Streamlit 公开部署。",
    tags: ["SEUPhyX", "Physics", "AI"],
    links: [
      { label: "GitHub Repo", href: "https://github.com/mratgnothing/seuphyx" },
      { label: "Live App", href: "https://seuphyx-experimentcenterseu.streamlit.app/" },
    ],
    detail: {
      role: "主开发 / 教学工作流与算法解释",
      period: "2026",
      repository: "mratgnothing/seuphyx",
      sourceNote: "内容依据 seuphyx README 整理。",
      stats: [
        { label: "应用", value: "Millikan oil drop" },
        { label: "界面", value: "Streamlit" },
        { label: "算法", value: "Q clustering + symbolic regression" },
        { label: "部署", value: "Streamlit Cloud" },
      ],
      sections: [
        {
          title: "项目定位",
          body:
            "SEUPhyX 是东南大学物理实验中心物理实验数据处理 Python 包。当前主要应用是密立根油滴实验人工智能辅助数据处理系统，用 Streamlit 提供网页交互界面，把学生数据录入、机器学习 Q 聚类、符号回归、传统方法对照和 PDF 报告生成串成完整工作流。",
        },
        {
          title: "当前主流程",
          body:
            "系统先由实验读数 t 和 U 计算连续电荷估计 q，再在 q 分布上做无监督聚类，不预设元电荷或整数倍关系。聚类之后用半峰宽筛选高置信点，最后对多个 q 簇的 U-t 曲线学习共享符号表达式，并把发现结果与公认元电荷做后验对照。",
          bullets: [
            "数据记录：一次输入多组油滴数据，写入 oil_drop.csv。",
            "AI 聚类：K-Means、Gaussian Mixture、DBSCAN、KDE 峰发现。",
            "符号回归：全局候选式、两阶段联合回归、神经网络 teacher 蒸馏。",
            "报告生成：输出包含学生信息、q 簇、拟合结果和图像的 PDF 报告。",
          ],
        },
        {
          title: "教学价值",
          body:
            "这个项目的关键不是替代实验，而是让学生在不知道电荷非连续性和元电荷数值的前提下，观察 AI 如何从复杂实验数据中发现结构。传统分类页仍保留为对照流程，但不再是当前 AI 聚类与符号回归的前置条件。",
        },
        {
          title: "后续记录方向",
          body:
            "后续可以继续公开记录视觉自动测量、报告模板、Streamlit Cloud 部署限制、学生文件持久化，以及从油滴视频中自动追踪速度的实验数据采集流程。",
        },
      ],
      resources: [
        { label: "GitHub Repo", href: "https://github.com/mratgnothing/seuphyx" },
        { label: "Live App", href: "https://seuphyx-experimentcenterseu.streamlit.app/" },
        { label: "README", href: "https://github.com/mratgnothing/seuphyx/blob/main/README.md" },
        { label: "Devlog", href: "/posts/seuphyx-devlog-ai-clustering-symbolic/" },
      ],
    },
  },
];

export const researchItems = [
  {
    number: "01",
    title: "SDD-YOLO paper board",
    body:
      "论文已公开于 arXiv cs.CV：SDD-YOLO: A Small-Target Detection Framework for Ground-to-Air Anti-UAV Surveillance with Edge-Efficient Deployment。后续可以补充代码、数据集说明和可视化实验面板。",
    href: "https://arxiv.org/abs/2603.25218",
  },
  {
    number: "02",
    title: "DroneSOD-30K dataset note",
    body: "用博客文章解释数据来源、清洗规则、标注 QC、类别定义、困难样本和公开限制，形成数据集可信度。",
  },
  {
    number: "03",
    title: "Edge deployment report",
    body: "把 PyTorch、ONNX、ATC、OM、AscendCL/pyACL、FPS 和精度差异做成可复现部署链路。",
  },
];

export const journalTopics = [
  { icon: "game", title: "Games", body: "像素游戏、开放世界、最近玩的作品和设计观察。" },
  { icon: "music", title: "Music", body: "歌单、专辑、演出、写代码时的背景音乐。" },
  { icon: "travel", title: "Travel", body: "新加坡和未来旅途中的城市、技术与文化观察。" },
  { icon: "map", title: "Horizon", body: "地理、国际关系、校园活动和长期兴趣。" },
];
