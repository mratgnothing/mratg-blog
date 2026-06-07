export const projects = [
  {
    title: "SDD-YOLO",
    label: "Research Flagship",
    icon: "drone",
    image: "/assets/project-sdd.jpg",
    alt: "Pixel art drone detection research cover.",
    className: "featured project-hero-card",
    description:
      "面向地对空反无人机场景的小目标检测框架，arXiv:2603.25218，关注 P2 高分辨率检测头、DFL-free / NMS-free 推理和边缘高效部署。",
    tags: ["YOLO", "P2 Head", "Distillation", "Anti-UAV"],
    links: [
      { label: "arXiv Paper", href: "https://arxiv.org/abs/2603.25218" },
      { label: "GitHub Org", href: "https://github.com/SDD-YOLO" },
    ],
  },
  {
    title: "WAVE-cloud",
    label: "Platform",
    icon: "wave",
    image: "/assets/project-wave.jpg",
    alt: "Pixel art cloud vision engineering platform cover.",
    className: "project-side-card",
    description:
      "华为挑战杯方向的视觉工程平台，面向数据、训练、部署与 Agent 协作，当前重点是云端平台和 Ascend 验证链路。",
    tags: ["PM", "Agent", "Docker", "Ascend"],
    links: [
      { label: "GitHub Repo", href: "https://github.com/Ascend-Computing-Visual-Platform/WAVE-cloud" },
      { label: "Private" },
    ],
  },
  {
    title: "EdgeDistillDet",
    label: "Tooling",
    icon: "chip",
    image: "/assets/project-edge.jpg",
    alt: "Pixel art edge AI distillation workbench cover.",
    className: "project-small-card",
    description:
      "小目标检测训练、评估、知识蒸馏与边缘部署工作台，目标是把模型实验变成可复用的工程流程。",
    tags: ["Evaluation", "FPS", "ONNX", "NPU"],
    links: [
      { label: "GitHub Repo", href: "https://github.com/SDD-YOLO/EdgeDistillDet" },
      { label: "Private" },
    ],
  },
  {
    title: "Physics Experiment Agent",
    label: "AI Education",
    icon: "atom",
    image: "/assets/project-physics.jpg",
    alt: "Pixel art physics experiment AI agent cover.",
    className: "project-small-card",
    description:
      "面向大学物理实验的数据分析与诊断 Agent，尝试把 RAG、代码执行、流式输出和可视化反馈接进实验学习。",
    tags: ["LLM", "SSE", "Node.js", "Python"],
    links: [
      { label: "GitHub Repo", href: "https://github.com/mratgnothing/physics-ai-agent" },
      { label: "Public" },
    ],
  },
  {
    title: "Molecule Studio",
    label: "Visualization",
    icon: "cube",
    image: "/assets/project-molecule.jpg",
    alt: "Pixel art molecule visualization project cover.",
    className: "project-small-card",
    description:
      "AI 驱动的 3D 分子可视化与智能检索系统，用 React、Three.js 和开放化学数据做轻量科学展示。",
    tags: ["React", "Three.js", "PubChem", "Science"],
    links: [
      { label: "GitHub Repo", href: "https://github.com/mratgnothing/Molecule-Studio" },
      { label: "Public" },
    ],
  },
  {
    title: "seuphyx",
    label: "Side Project",
    icon: "flask",
    image: "/assets/project-seuphyx.jpg",
    alt: "Pixel art physics data analysis project cover.",
    className: "project-wide-card",
    description:
      "物理实验数据分析和 Streamlit 工具项目，适合沉淀实验教学、数据处理和公开部署的实践记录。",
    tags: ["Streamlit", "Physics", "Report", "Cloud"],
    links: [
      { label: "GitHub Repo", href: "https://github.com/mratgnothing/seuphyx" },
      { label: "Live App", href: "https://seuphyx-experimentcenterseu.streamlit.app/" },
    ],
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
