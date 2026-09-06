# Mr.ATG Pixel Blog Astro Project Context

Last reviewed: 2026-06-12

This file is the project-wide context document for Codex and future maintainers. Read this before answering architecture, progress, content, design, deployment, or maintenance questions about this repository.

## Project Summary

`mratg-pixel-blog-astro` is a static Astro 5 personal site for Mr.ATG. It presents a pixel-style portfolio/blog around computer vision, edge AI, AI engineering systems, and personal topics such as games, music, travel, campus life, and fitness.

The deployed site target is `https://mra-t-g-blog.cn`. The only deployment target is Cloudflare Pages project `mratg-pixel-blog-git`, connected to GitHub repository `mratgnothing/mratg-blog` on the `main` branch. The build output is static HTML in `dist/`, and Cloudflare Pages publishes that directory after `npm run build`.

## Tech Stack

- Framework: Astro `^5.8.0`
- Language mode: ESM JavaScript/TypeScript with `.astro` components
- Styling: one global stylesheet at `src/styles.css`
- Content: Astro content collections using Markdown files under `src/content/`
- Runtime JavaScript: `public/script.js`
- Backend API: Cloudflare Pages Functions under `functions/api/`
- Shared engagement storage: Cloudflare KV binding `MRATG_ENGAGEMENT`
- Deployment: Cloudflare Pages static hosting with Pages Functions

## Required Codex Workflow

Before answering or changing this project, Codex should:

1. Read `PROJECT_CONTEXT.md` for current architecture, content model, progress, and constraints.
2. Read `AGENTS.md` for local operating rules.
3. Check current files before making claims because content and visual assets change frequently.
4. Treat `output/`, `dist/`, `.astro/`, `node_modules/`, `.npm-cache/`, and log files as generated or local runtime artifacts unless the task is specifically about them.
5. Preserve user changes already present in the working tree. This repo currently has local edits to images, styles, search, layout, and helper scripts.

## Directory Map

```text
.
├─ astro.config.mjs          Astro static-site config and production site URL.
├─ wrangler.jsonc            Cloudflare Pages project, output directory, and KV bindings.
├─ package.json              npm scripts and dependencies.
├─ PUBLISHING.md             Publishing and content authoring workflow.
├─ README.md                 Short project usage guide.
├─ PROJECT_CONTEXT.md        Global project architecture and progress context.
├─ AGENTS.md                 Codex-first project operating instructions.
├─ public/
│  ├─ script.js              Client-side animation, search, engagement, comments.
│  ├─ assets/                Site and article images.
│  └─ fonts/                 Pixel display font files.
├─ functions/api/            Cloudflare Pages API endpoints for comments, likes, annotations.
├─ content-inbox/            Paste-in folders for Markdown and images before import.
├─ scripts/
│  ├─ import-inbox.mjs       Imports pasted Markdown/image folders into content collections.
│  ├─ new-content.mjs        Generator for posts, columns, and diary entries.
│  ├─ optimize-images.py     Local image optimization helper.
│  ├─ inspect-images.py      Local image inspection helper.
│  ├─ convert-font.py        Font conversion helper.
│  └─ get-psi.mjs            PageSpeed Insights helper.
└─ src/
   ├─ content.config.ts      Astro content collection schemas.
   ├─ styles.css             Global visual system.
   ├─ components/            Reusable Astro components.
   ├─ content/               Markdown content collections.
   ├─ data/projects.ts       Project and research metadata.
   ├─ layouts/BaseLayout.astro
   ├─ lib/tags.ts            Tag slug helpers.
   └─ pages/                 Static and dynamic routes.
```

## Content Model

Content is managed through Astro content collections in `src/content.config.ts`.

### Posts

Location: `src/content/posts/*.md`

Required frontmatter:

- `title`
- `description`
- `category`
- `date`

Optional/defaulted frontmatter:

- `column`
- `tags`
- `updated`
- `featured`
- `draft`

Published posts are those without `draft: true`. Homepage recent cards sort by `updated`, falling back to `date`.

Current state: 15 post files exist. `new-post-template.md` is draft; the other 14 are published. Main content themes include SDD-YOLO, Ascend 310 deployment, WAVE-cloud, ONNX debugging, team engineering, Singapore travel, music, games, and fitness.

### Columns

Location: `src/content/columns/*.md`

Schema fields:

- `title`
- `description`
- `accent`: `berry`, `teal`, `gold`, `violet`, or `green`
- `group`: `writing` or `journal`
- `order`
- `draft`

Current columns:

- Writing: `tech-note`, `deployment`, `team-log`, `research-diary`
- Journal: `games`, `music`, `travel`, `horizon`

### Diary

Location: `src/content/diary/*.md`

Schema fields:

- `title`
- `datetime`
- `mood`
- `tags`
- `draft`

Current state: 4 published diary entries. Diary entries render on the homepage timeline and at `/diary/`.

## Routes

- `/` uses `src/pages/index.astro`. It builds the hero, clickable public-topic ticker, project grid, research timeline, writing board, journal shelf, diary preview, and contact panel.
- `/projects/[slug]/` renders detailed static pages for homepage projects from `src/data/projects.ts`, including project summaries, key metrics, resource links, sharing, and comments.
- `/posts/` lists all non-draft posts.
- `/posts/[slug]/` renders one post with tags, dates, engagement, and comments.
- `/columns/[slug]/` renders a column and all posts whose `column` matches the column slug.
- `/diary/` renders all diary entries.
- `/tags/[tag]/` aggregates posts, projects, and diary entries by normalized tag slug.
- `/404` is the not-found page.

## Key Components

- `BaseLayout.astro`: HTML shell, metadata, global stylesheet, favicon, font preload, LCP image preload, starfield canvas, and `/script.js`.
- `SiteHeader.astro`: global navigation and search entry.
- `GlobalSearch.astro`: builds a client-side JSON search index from posts and diary entries.
- `ProjectCard.astro`: renders clickable project metadata from `src/data/projects.ts`.
- `PostCard.astro`: shared post preview card.
- `TagLink.astro`: tag link component using tag slug helpers.
- `EngagementBar.astro`: local engagement controls wired through client script.
- `CommentBox.astro`: public comment UI backed by Cloudflare Pages Functions and KV on the primary deployment, with browser fallback.
- `SiteFooter.astro`: footer.

## Client-Side Behavior

`public/script.js` controls:

- scroll reveal animations via `IntersectionObserver`
- cursor glow on larger screens
- animated starfield canvas
- pixel burst click effect
- global search filtering from embedded JSON
- public comments, likes, and annotations through `/api/thread`, `/api/comment`, `/api/like`, and `/api/annotation`
- browser `localStorage` fallback when the backend is unavailable

The comment, like, and annotation system is shared across visitors on Cloudflare Pages through Pages Functions and the `MRATG_ENGAGEMENT` KV binding. Preview deployments use a separate KV namespace.

## Visual Direction

The site is a pixel-inspired personal lab, not a generic blog template. Preserve:

- pixel art imagery and display font usage
- warm, high-contrast visual identity with varied colors
- project-first portfolio framing
- mixed technical and personal content
- responsive layout checks for desktop and mobile

Avoid replacing the visual system with a plain card-heavy SaaS layout. For targeted UI work, check `src/styles.css`, `public/script.js`, and the relevant `.astro` page together.

## Assets

Site-level assets live in `public/assets/`. Article assets live under `public/assets/posts/`.

Use root-relative paths in Markdown and Astro, for example:

```md
<img src="/assets/posts/example.jpg" alt="Description" loading="lazy" />
```

Do not use `C:\...` or `D:\...` paths in content because they will fail after deployment.

## Content Authoring Commands

```bash
npm run import:inbox
npm run new:post -- --title "文章标题" --description "首页卡片摘要" --category "Tech Note" --column tech-note --tags "SDD-YOLO,Ascend"
npm run new:column -- --name "栏目名称" --description "栏目说明" --accent teal --group writing
npm run new:diary -- --title "今天的小记录" --datetime "2026-06-08T21:40:00+08:00" --tags "Life,Campus"
```

For the paste-in workflow, put each article under `content-inbox/posts/<folder>/index.md`
and each diary item under `content-inbox/diary/<folder>/index.md`. Images can sit next to
the Markdown file and be referenced with relative paths such as `./photo.jpg`; the import
script copies them into `public/assets/posts/<slug>/` and rewrites the Markdown to use
root-relative asset URLs. Missing post dates and diary datetimes default to the current
local time, so homepage recent content refreshes automatically after rebuild.

Generated posts default to draft unless `--publish` is passed. Update `updated` when revising posts so homepage ordering stays correct.

## Local Development

Use these commands:

```bash
npm install
npm run dev
npm run build
npm run preview
```

On Windows, if PowerShell blocks `npm.ps1`, use `npm.cmd` with the same arguments.

Astro routes and root-relative assets should be checked through a local server, not by opening generated HTML through `file:///`.

## Deployment

Cloudflare Pages settings:

- Build command: `npm run build`
- Build output directory: `dist`
- Project name: `mratg-pixel-blog-git`
- GitHub source: `mratgnothing/mratg-blog`, production branch `main`
- Production KV binding: `MRATG_ENGAGEMENT` -> `06e590dd149b40f68a1531991cdef9e3`
- Preview KV binding: `MRATG_ENGAGEMENT` -> `4e6f62530e75411682373b6eb428cf54`

Config locations:

- `astro.config.mjs`: `site`, `output: "static"`, and Vite watch ignore for `.edge-qa`.
- `wrangler.jsonc`: Cloudflare Pages project and KV bindings.

## Current Progress Snapshot

As of this review:

- Static Astro site structure is implemented.
- Homepage has hero, clickable public-topic links, projects, research, writing, journal, diary, and contact sections.
- Content collections are configured and populated.
- Dynamic post, project, column, diary, and tag routes are implemented.
- Six project detail pages exist for SDD-YOLO, WAVE-cloud, EdgeDistillDet, Physics Experiment Agent, Molecule Studio, and SEUPhyX Platform.
- Search, public comments, engagement UI, and visual animations exist.
- Homepage, tag archive, and post pages now include richer pixel-game polish: generated voxel scene assets, transparent voxel sticker decorations, a featured tag blackboard constrained to a readable safe area, three-column article pages, local view counts, local text annotations, platform-aware share actions, and local comments.
- Cloudflare Pages deployment config exists, including Pages Functions and KV-backed engagement APIs.
- Image/font optimization helper scripts exist.
- `output/` contains local browser verification artifacts and should stay ignored.

## Known Constraints And Risks

- Comments, likes, and article annotations use Cloudflare Pages Functions plus KV on the primary deployment, with `localStorage` only as a fallback.
- The Cloudflare KV implementation stores one JSON document per thread. It is suitable for this personal site, but high-traffic moderation, complex queries, or strict concurrent writes should move to D1 or another relational/stronger-consistency store.
- Large image/font assets can affect performance; use the optimization helpers before publishing new large media.
- The repo can contain many generated browser profile files under `output/`; do not scan that folder as source.
- There are existing local modifications in the working tree. Do not assume a clean Git state.
- `rg.exe` is known to fail with `Access is denied` in this Windows environment; use PowerShell native commands such as `Get-ChildItem`, `Select-String`, and `Get-Content -LiteralPath` for file discovery and source reading.

## Maintenance Priorities

1. Keep `PROJECT_CONTEXT.md` current when architecture, routes, content model, deployment, or major progress changes.
2. Keep README and PUBLISHING focused on user-facing workflows; keep this file focused on architecture and Codex context.
3. Before publishing, run `npm run build` and inspect the production preview with `npm run preview`.
4. For frontend changes, verify both desktop and mobile layout.
5. For content changes, check frontmatter schema, draft status, column slug, dates, tags, and asset paths.

## 高校风云联网版（2026-09-06）

游戏路由新增真人匹配、AI 练习、匿名会话重连与超时托管。服务代码位于 `workers/gaoxiao/`，由独立 Cloudflare Worker 和 SQLite Durable Objects 执行；同域路由 `/api/gaoxiao/*`。默认等待 20 秒，满桌即开始；每次行动限时 90 秒。网站仍发布到原 Pages 项目。

当前自动化玩法是 `quick-v1` 快速版，保留 48 校与完整 336 张卡牌档案；复杂高校技能、政策、人才拍卖等尚未完整自动化。规则差异、AI 行为、接口、验证和上线顺序以 `docs/gaoxiao-online.md` 为准。不要把该快速版称为实体 v0.5 全规则实现，也不要把本地测试通过写成已上线。
