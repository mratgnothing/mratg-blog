# Mr.ATG Pixel Blog

Astro version of the Mr.ATG pixel-style personal site.

## Write New Content

最快的方式是把 Markdown 和图片放进 `content-inbox/`，然后一次导入：

```bash
npm run import:inbox
```

文章放在 `content-inbox/posts/任意文件夹/index.md`，日记放在
`content-inbox/diary/任意文件夹/index.md`。图片可以和 Markdown 放在同一个
文件夹，正文里用 `./image.jpg` 这样的相对路径即可；导入脚本会复制图片到
`public/assets/posts/对应-slug/`，并把链接改成 `/assets/posts/...`。

文章缺少 `date` 或 `updated` 时会自动使用当前日期/时间；日记缺少
`datetime` 时会自动使用当前时间。导入后的非草稿内容会自动进入首页最近文章
或日记时间线。

Use the local generator for articles:

```bash
npm run new:post -- --title "文章标题" --description "首页卡片摘要" --category "Tech Note" --column tech-note --tags "SDD-YOLO,Ascend"
```

It creates a draft Markdown file in `src/content/posts/`. The `column` value
controls which `/columns/.../` archive page receives the article. Edit the file,
then set `draft: false` or run with `--publish` when the article is ready.
Update the `updated` field whenever you revise the article; the homepage uses it
to choose the recent article cards.

Create a new writing column:

```bash
npm run new:column -- --name "栏目名称" --description "栏目说明" --accent teal --group writing
```

Columns live in `src/content/columns/` and are shown on the homepage writing
board or journal shelf. Current column slugs include `tech-note`, `deployment`,
`team-log`, `research-diary`, `games`, `music`, `travel`, and `horizon`.

For a Horizon journal entry:

```bash
npm run new:post -- --title "健身半学期，引体终于做了16个" --slug "pull-up-16-half-semester" --description "半学期健身记录：从引体向上吃力到一次做满 16 个。" --category "Horizon" --column horizon --tags "Fitness,Life" --publish
```

Articles still use normal Markdown frontmatter:

```md
---
title: "文章标题"
description: "首页卡片摘要"
category: "Tech Note"
column: "tech-note"
tags:
  - "SDD-YOLO"
date: "2026-06-08"
updated: "2026-06-08T14:30:00+08:00"
---

## 小标题

正文内容。
```

The homepage automatically lists the most recently updated non-draft posts. The
full archive is available at `/posts/`.

Create a short diary item:

```bash
npm run new:diary -- --title "今天的小记录" --datetime "2026-06-08T21:40:00+08:00" --tags "Life,Campus"
```

Diary files live in `src/content/diary/`. They are shown together on the
homepage timeline by exact time, so they are best for a few sentences rather
than full articles.

## Add Images To Articles

Put article images under `public/assets/posts/`, then reference them with a root
path:

```md
<figure class="article-figure">
  <img src="/assets/posts/example.jpg" alt="Describe the image." loading="lazy" />
  <figcaption>这里写图片说明。</figcaption>
</figure>
```

Do not use local absolute paths such as `C:\...` or `D:\...` in Markdown,
because they will not work after deployment.

For NetEase Cloud Music playlists, use the official outchain player:

```md
<div class="music-embed">
  <iframe title="网易云音乐歌单播放器" src="https://music.163.com/outchain/player?type=0&id=PLAYLIST_ID&auto=0&height=430" width="100%" height="450" frameborder="0" allow="encrypted-media"></iframe>
  <p><a href="https://music.163.com/#/playlist?id=PLAYLIST_ID" target="_blank" rel="noreferrer">打开网易云歌单</a></p>
</div>
```

## Comments

Every article and diary entry has a comment box. Public comments, likes, and
article annotations are served through `/api/...`. The Cloudflare Pages
deployment uses Pages Functions plus the `MRATG_ENGAGEMENT` KV namespace. The
browser keeps a local fallback copy so the UI still works during local preview
or a temporary backend outage.

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

## Cloudflare Pages

Primary deployment target: Cloudflare Pages

Build command: `npm run build`

Build output directory: `dist`

Wrangler config: `wrangler.jsonc`

Production KV binding: `MRATG_ENGAGEMENT`

Deploy manually after building:

```bash
npm run build
npx wrangler pages deploy dist --project-name=mratg-pixel-blog-git
```
