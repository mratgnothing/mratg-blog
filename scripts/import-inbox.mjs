import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const args = parseArgs(process.argv.slice(2));
const inboxRoot = path.resolve(root, args.inbox || "content-inbox");
const mode = args.type || "all";
const imageExtensions = new Set([".avif", ".gif", ".jpeg", ".jpg", ".png", ".webp"]);

if (!["all", "post", "diary"].includes(mode)) {
  console.error('Usage: npm run import:inbox -- --type all|post|diary');
  process.exit(1);
}

const imported = [];

for (const type of mode === "all" ? ["post", "diary"] : [mode]) {
  const typeDir = path.join(inboxRoot, type === "post" ? "posts" : "diary");
  if (!fs.existsSync(typeDir)) continue;

  for (const entry of fs.readdirSync(typeDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    importEntry(type, path.join(typeDir, entry.name));
  }
}

if (imported.length === 0) {
  console.log(`No inbox entries found under ${path.relative(root, inboxRoot)}.`);
  console.log("Create content-inbox/posts/my-title/index.md or content-inbox/diary/today/index.md, then run this command again.");
} else {
  console.log("\nImported:");
  for (const item of imported) {
    console.log(`- ${item.type}: ${path.relative(root, item.file)}`);
  }
  console.log("\nHomepage recent posts/diary update automatically after Astro rebuild.");
}

function importEntry(type, folderPath) {
  const markdownPath = findMarkdown(folderPath);
  if (!markdownPath) {
    console.warn(`Skip ${path.relative(root, folderPath)}: no Markdown file found.`);
    return;
  }

  const raw = fs.readFileSync(markdownPath, "utf8");
  const parsed = parseMarkdown(raw);
  const title = parsed.frontmatter.title || titleFromFilename(markdownPath);
  const slug = uniqueSlug(slugify(parsed.frontmatter.slug || title || path.basename(folderPath)), type);
  const nowDate = localDate();
  const nowTime = localDateTime();
  const assetDir = path.join(root, "public", "assets", "posts", slug);
  const assetBase = `/assets/posts/${slug}`;
  const body = rewriteImagePaths(parsed.body, path.dirname(markdownPath), assetDir, assetBase);

  if (type === "post") {
    const filePath = path.join(root, "src", "content", "posts", `${slug}.md`);
    const data = {
      title,
      description: parsed.frontmatter.description || firstSentence(body) || "新的文章摘要。",
      category: parsed.frontmatter.category || "Horizon",
      column: parsed.frontmatter.column || "horizon",
      tags: parseTags(parsed.frontmatter.tags),
      date: parsed.frontmatter.date || nowDate,
      updated: parsed.frontmatter.updated || nowTime,
      draft: parseBoolean(parsed.frontmatter.draft, false),
    };

    writeNewFile(filePath, `${formatFrontmatter(data)}\n${body.trim()}\n`);
    imported.push({ type, file: filePath });
    return;
  }

  const filePath = path.join(root, "src", "content", "diary", `${slug}.md`);
  const data = {
    title,
    datetime: parsed.frontmatter.datetime || parsed.frontmatter.date || nowTime,
    mood: parsed.frontmatter.mood || "",
    tags: parseTags(parsed.frontmatter.tags),
    draft: parseBoolean(parsed.frontmatter.draft, false),
  };

  writeNewFile(filePath, `${formatFrontmatter(data)}\n${body.trim()}\n`);
  imported.push({ type, file: filePath });
}

function findMarkdown(folderPath) {
  const files = fs.readdirSync(folderPath, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".md"))
    .map((entry) => path.join(folderPath, entry.name));
  return files.find((file) => path.basename(file).toLowerCase() === "index.md") || files[0];
}

function parseMarkdown(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return { frontmatter: {}, body: raw };
  return {
    frontmatter: parseFrontmatter(match[1]),
    body: raw.slice(match[0].length),
  };
}

function parseFrontmatter(text) {
  const data = {};
  const lines = text.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const pair = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!pair) continue;

    const key = pair[1];
    const value = pair[2].trim();
    if (value === "") {
      const list = [];
      while (lines[index + 1]?.trimStart().startsWith("- ")) {
        index += 1;
        list.push(unquote(lines[index].trimStart().slice(2).trim()));
      }
      data[key] = list;
    } else {
      data[key] = unquote(value);
    }
  }

  return data;
}

function rewriteImagePaths(body, markdownDir, assetDir, assetBase) {
  let output = body.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (full, alt, src) => {
    const next = copyLocalImage(src, markdownDir, assetDir, assetBase);
    return next ? `![${alt}](${next})` : full;
  });

  output = output.replace(/<img\b([^>]*?)\bsrc=(["'])(.*?)\2([^>]*)>/gi, (full, before, quote, src, after) => {
    const next = copyLocalImage(src, markdownDir, assetDir, assetBase);
    return next ? `<img${before}src=${quote}${next}${quote}${after}>` : full;
  });

  return output;
}

function copyLocalImage(src, markdownDir, assetDir, assetBase) {
  if (!src || src.startsWith("/") || /^[a-z]+:/i.test(src) || src.startsWith("#")) return null;
  const cleanSrc = decodeURIComponent(src.split("#")[0].split("?")[0]);
  const sourcePath = path.resolve(markdownDir, cleanSrc);
  if (!sourcePath.startsWith(markdownDir) || !fs.existsSync(sourcePath)) return null;
  if (!imageExtensions.has(path.extname(sourcePath).toLowerCase())) return null;

  fs.mkdirSync(assetDir, { recursive: true });
  const fileName = uniqueAssetName(assetDir, slugify(path.basename(sourcePath, path.extname(sourcePath))) + path.extname(sourcePath).toLowerCase());
  fs.copyFileSync(sourcePath, path.join(assetDir, fileName));
  return `${assetBase}/${fileName}`;
}

function formatFrontmatter(data) {
  const lines = ["---"];
  for (const [key, value] of Object.entries(data)) {
    if (value === "" || value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      if (value.length === 0) {
        lines.push(`${key}: []`);
      } else {
        lines.push(`${key}:`);
        for (const item of value) lines.push(`  - ${quote(item)}`);
      }
    } else {
      lines.push(`${key}: ${typeof value === "boolean" ? value : quote(value)}`);
    }
  }
  lines.push("---", "");
  return lines.join("\n");
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

function parseTags(value) {
  if (Array.isArray(value)) return value.map(String).map((tag) => tag.trim()).filter(Boolean);
  if (!value) return [];
  return String(value).split(",").map((tag) => tag.trim()).filter(Boolean);
}

function parseBoolean(value, fallback) {
  if (value === undefined || value === "") return fallback;
  return String(value).toLowerCase() === "true";
}

function firstSentence(body) {
  return body
    .replace(/<[^>]*>/g, " ")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/[#>*_`~-]/g, " ")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean)
    ?.slice(0, 96);
}

function uniqueSlug(base, type) {
  const targetDir = path.join(root, "src", "content", type === "post" ? "posts" : "diary");
  let slug = base || `note-${localStamp()}`;
  let count = 2;
  while (fs.existsSync(path.join(targetDir, `${slug}.md`))) {
    slug = `${base}-${count}`;
    count += 1;
  }
  return slug;
}

function uniqueAssetName(assetDir, fileName) {
  let next = fileName;
  let count = 2;
  const extension = path.extname(fileName);
  const base = path.basename(fileName, extension);
  while (fs.existsSync(path.join(assetDir, next))) {
    next = `${base}-${count}${extension}`;
    count += 1;
  }
  return next;
}

function writeNewFile(filePath, content) {
  if (fs.existsSync(filePath)) {
    console.error(`File already exists: ${filePath}`);
    process.exit(1);
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
}

function titleFromFilename(markdownPath) {
  return path.basename(path.dirname(markdownPath)).replace(/[-_]+/g, " ");
}

function slugify(value) {
  const slug = String(value)
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

function unquote(value) {
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    return trimmed.slice(1, -1).split(",").map((item) => unquote(item.trim())).filter(Boolean);
  }
  return trimmed;
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
