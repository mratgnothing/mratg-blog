# Content Inbox

Paste new Markdown and images here, then run:

```bash
npm run import:inbox
```

Article layout:

```text
content-inbox/posts/my-new-article/
├─ index.md
└─ photo.jpg
```

Diary layout:

```text
content-inbox/diary/today-note/
├─ index.md
└─ photo.jpg
```

Use relative image links in Markdown, for example:

```md
![图片说明](./photo.jpg)
```

The import script copies images into `public/assets/posts/<slug>/`, rewrites links
to `/assets/posts/...`, and fills missing dates with the current local time.
