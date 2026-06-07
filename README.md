# Mr.ATG Pixel Blog

Astro version of the Mr.ATG pixel-style personal site.

## Write A New Post

Create a Markdown file in `src/content/posts/`:

```md
---
title: "文章标题"
description: "首页卡片摘要"
category: "Tech Note"
tags:
  - "SDD-YOLO"
date: "2026-06-08"
---

## 小标题

正文内容。
```

The homepage automatically lists non-draft posts in newest-first order.

## Local Commands

```bash
npm install
npm run dev
npm run build
npm run preview
```

Astro projects should be previewed through a local server, not by opening
`file:///.../index.html`. During editing, use `npm run dev` and open the printed
localhost URL. Before publishing, use `npm run build` and then `npm run preview`
to inspect the production build.

## Netlify

Netlify build command: `npm run build`

Netlify publish directory: `dist`
