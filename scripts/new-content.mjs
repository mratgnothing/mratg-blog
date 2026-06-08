import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const root = process.cwd();
const mode = process.argv[2];
const args = parseArgs(process.argv.slice(3));

if (!["post", "column", "diary"].includes(mode)) {
  console.error("Usage: npm run new:post -- --title \"Title\", npm run new:column -- --name \"Column\", or npm run new:diary -- --title \"Title\"");
  process.exit(1);
}

const rl = readline.createInterface({ input, output });

try {
  if (mode === "post") {
    await createPost();
  } else if (mode === "column") {
    await createColumn();
  } else {
    await createDiary();
  }
} finally {
  rl.close();
}

async function createPost() {
  const title = await requiredValue("title", "文章标题");
  const description = await value("description", "首页摘要", "这里写一句会显示在首页卡片上的摘要。");
  const category = await value("category", "栏目/分类", "Draft");
  const column = await value("column", "专栏 slug", "tech-note");
  const tagsInput = await value("tags", "标签，逗号分隔", "");
  const date = await value("date", "日期 YYYY-MM-DD", localDate());
  const updated = await value("updated", "修改时间 ISO", localDateTime());
  const slug = slugify(args.slug || title);
  const tags = tagsInput.split(",").map((tag) => tag.trim()).filter(Boolean);
  const draft = args.publish ? false : args.draft === "false" ? false : true;
  const filePath = path.join(root, "src", "content", "posts", `${slug}.md`);

  const tagsBlock = tags.length ? `tags:\n${tags.map((tag) => `  - ${quote(tag)}`).join("\n")}` : "tags: []";

  writeNewFile(filePath, `---
title: ${quote(title)}
description: ${quote(description)}
category: ${quote(category)}
column: ${quote(column)}
${tagsBlock}
date: ${quote(date)}
updated: ${quote(updated)}
draft: ${draft}
---

## 第一个小标题

这里写正文。
`);
}

async function createDiary() {
  const title = await requiredValue("title", "日记标题");
  const datetime = await value("datetime", "具体时间 ISO", localDateTime());
  const mood = await value("mood", "状态/心情", "");
  const tagsInput = await value("tags", "标签，逗号分隔", "");
  const slug = slugify(args.slug || title);
  const tags = tagsInput.split(",").map((tag) => tag.trim()).filter(Boolean);
  const filePath = path.join(root, "src", "content", "diary", `${slug}.md`);
  const tagsBlock = tags.length ? `tags:\n${tags.map((tag) => `  - ${quote(tag)}`).join("\n")}` : "tags: []";

  writeNewFile(filePath, `---
title: ${quote(title)}
datetime: ${quote(datetime)}
${mood ? `mood: ${quote(mood)}\n` : ""}${tagsBlock}
---

这里写几句话，记录这一天具体发生了什么。
`);
}

async function createColumn() {
  const title = await requiredValue("name", "栏目名称");
  const description = await value("description", "栏目说明", "这里写这个栏目会持续记录什么。");
  const accent = await value("accent", "强调色 berry/teal/gold/violet/green", "teal");
  const group = await value("group", "栏目组 writing/journal", "writing");
  const order = Number(await value("order", "排序数字", "50"));
  const slug = slugify(args.slug || title);
  const filePath = path.join(root, "src", "content", "columns", `${slug}.md`);

  writeNewFile(filePath, `---
title: ${quote(title)}
description: ${quote(description)}
accent: ${quote(accent)}
group: ${quote(group)}
order: ${Number.isFinite(order) ? order : 50}
draft: false
---

这个栏目用于持续整理相关主题。
`);
}

async function value(name, label, fallback = "") {
  if (args[name]) return args[name];
  if (!input.isTTY && fallback) return fallback;
  const answer = await rl.question(`${label}${fallback ? ` (${fallback})` : ""}: `);
  return answer.trim() || fallback;
}

async function requiredValue(name, label) {
  const answer = await value(name, label);
  if (!answer) {
    console.error(`${label} is required.`);
    process.exit(1);
  }
  return answer;
}

function parseArgs(items) {
  const parsed = {};
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    if (!item.startsWith("--")) continue;
    const key = item.slice(2);
    const next = items[index + 1];
    if (!next || next.startsWith("--")) {
      parsed[key] = true;
    } else {
      parsed[key] = next;
      index += 1;
    }
  }
  return parsed;
}

function slugify(value) {
  const slug = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
  return slug || `note-${localStamp()}`;
}

function quote(value) {
  return JSON.stringify(String(value));
}

function localDate() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

function localDateTime() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return `${date.toISOString().slice(0, 16)}+08:00`;
}

function localStamp() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().replace(/[-:T]/g, "").slice(0, 12);
}

function writeNewFile(filePath, content) {
  if (fs.existsSync(filePath)) {
    console.error(`File already exists: ${filePath}`);
    process.exit(1);
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
  console.log(`Created ${path.relative(root, filePath)}`);
}
