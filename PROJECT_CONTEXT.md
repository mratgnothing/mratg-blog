# Mr.ATG Pixel Blog Astro Project Context

Last reviewed: 2026-06-12

This file is the project-wide context document for Codex and future maintainers. Read this before answering architecture, progress, content, design, deployment, or maintenance questions about this repository.

## Project Summary

`mratg-pixel-blog-astro` is a static Astro 5 personal site for Mr.ATG. It presents a pixel-style portfolio/blog around computer vision, edge AI, AI engineering systems, and personal topics such as games, music, travel, campus life, and fitness.

The deployed site target is `https://mratg.netlify.app`. The build output is static HTML in `dist/`, and Netlify publishes that directory after `npm run build`.

## Tech Stack

- Framework: Astro `^5.8.0`
- Language mode: ESM JavaScript/TypeScript with `.astro` components
- Styling: one global stylesheet at `src/styles.css`
- Content: Astro content collections using Markdown files under `src/content/`
- Runtime JavaScript: `public/script.js`
- Deployment: Netlify static hosting
- Node version on Netlify: `20`

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
├─ netlify.toml              Netlify build command and publish directory.
├─ package.json              npm scripts and dependencies.
├─ PUBLISHING.md             Publishing and content authoring workflow.
├─ README.md                 Short project usage guide.
├─ PROJECT_CONTEXT.md        Global project architecture and progress context.
├─ AGENTS.md                 Codex-first project operating instructions.
├─ public/
│  ├─ script.js              Client-side animation, search, engagement, comments.
│  ├─ assets/                Site and article images.
│  └─ fonts/                 Pixel display font files.
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

- `/` uses `src/pages/index.astro`. It builds the hero, project grid, research timeline, writing board, journal shelf, diary preview, and contact panel.
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
- `ProjectCard.astro`: renders project metadata from `src/data/projects.ts`.
- `PostCard.astro`: shared post preview card.
- `TagLink.astro`: tag link component using tag slug helpers.
- `EngagementBar.astro`: local engagement controls wired through client script.
- `CommentBox.astro`: local comment UI using browser `localStorage`.
- `SiteFooter.astro`: footer.

## Client-Side Behavior

`public/script.js` controls:

- scroll reveal animations via `IntersectionObserver`
- cursor glow on larger screens
- animated starfield canvas
- pixel burst click effect
- global search filtering from embedded JSON
- comment storage and rendering through `localStorage`
- lightweight engagement interactions

The comment system is local-only. It is good for preview or personal notes, but it is not shared across visitors after deployment unless a backend or hosted comment service is added.

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

Netlify settings:

- Build command: `npm run build`
- Publish directory: `dist`
- Node version: `20`

Config locations:

- `astro.config.mjs`: `site`, `output: "static"`, and Vite watch ignore for `.edge-qa`.
- `netlify.toml`: Netlify build settings.

## Current Progress Snapshot

As of this review:

- Static Astro site structure is implemented.
- Homepage has hero, projects, research, writing, journal, diary, and contact sections.
- Content collections are configured and populated.
- Dynamic post, column, diary, and tag routes are implemented.
- Search, local comments, engagement UI, and visual animations exist.
- Homepage, tag archive, and post pages now include richer pixel-game polish: generated voxel scene assets, transparent voxel sticker decorations, a featured tag blackboard constrained to a readable safe area, three-column article pages, local view counts, local text annotations, platform-aware share actions, and local comments.
- Netlify static deployment config exists.
- Image/font optimization helper scripts exist.
- `output/` contains local browser verification artifacts and should stay ignored.

## Known Constraints And Risks

- Comments and engagement are client-local only, backed by `localStorage`.
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
