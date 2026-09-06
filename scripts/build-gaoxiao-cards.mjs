import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const gameRoot = path.join(root, "public", "assets", "games", "gaoxiao-fengyun");
const dataRoot = path.join(gameRoot, "data");
const artRoot = path.join(gameRoot, "art");
const promptRoot = path.join(root, "tmp", "imagegen");

const files = {
  school: "高校风云-50校全案.md",
  faculty: "高校风云-院系牌全库.md",
  talent: "高校风云-人才牌全库.md",
  event: "高校风云-事件牌全库.md",
  project: "高校风云-国家重大工程牌全库.md",
  policy: "高校风云-政策牌全库.md",
};

const read = (name) => fs.readFileSync(path.join(dataRoot, name), "utf8");
const clean = (value = "") => value.replace(/\*\*/g, "").replace(/`/g, "").replace(/\[M[123]\]/g, "").replace(/\s+/g, " ").trim();
const mechanicTags = { M1: "港澳通则 M1", M2: "军工高校 M2", M3: "师范高校 M3" };
const rows = (text, pattern) => text
  .split(/\r?\n/)
  .filter((line) => line.startsWith("|"))
  .map((line) => line.split("|").slice(1, -1).map((cell) => clean(cell)))
  .filter((cells) => pattern.test(cells[0] || ""));

const crestClasses = {
  "清华大学": "tsinghua", "北京大学": "pku", "浙江大学": "zju", "上海交通大学": "sjtu",
  "复旦大学": "fudan", "中国科学技术大学": "ustc", "南京大学": "nju", "香港大学": "hku",
  "香港中文大学": "cuhk", "香港科技大学": "hkust", "香港理工大学": "polyu", "中国人民大学": "ruc",
  "华中科技大学": "hust", "武汉大学": "whu", "中山大学": "sysu", "西安交通大学": "xjtu",
  "哈尔滨工业大学": "hit", "四川大学": "scu", "南开大学": "nankai", "天津大学": "tju",
  "东南大学": "seu", "北京航空航天大学": "buaa", "北京师范大学": "bnu", "北京理工大学": "bit",
  "厦门大学": "xmu", "同济大学": "tongji", "华南理工大学": "scut", "大连理工大学": "dlut",
  "西北工业大学": "nwpu", "华东师范大学": "ecnu", "中国农业大学": "cau", "电子科技大学": "uestc",
  "中南大学": "csu", "南京航空航天大学": "nuaa", "南京理工大学": "njust", "西安电子科技大学": "xidian",
  "北京邮电大学": "bupt", "上海财经大学": "shufe", "吉林大学": "jlu", "山东大学": "sdu",
  "兰州大学": "lzu", "苏州大学": "suda", "郑州大学": "zzu", "中国海洋大学": "ouc",
  "东北大学": "neu", "武汉理工大学": "whut", "湖南大学": "hnu", "重庆大学": "cqu",
};

function parseSchools(text) {
  const cards = [];
  let tier = "";
  const lines = text.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.startsWith("## 第二部分")) tier = "领跑档";
    if (line.startsWith("## 第三部分")) tier = "劲旅档";
    if (line.startsWith("## 第四部分")) tier = "蓄力档";
    const match = line.match(/^\*\*([^*]+)\*\*\s*\|\s*([^|]+)\|\s*核心:([^|]+)\|\s*开局:(.+)$/);
    if (!match) continue;
    const following = [];
    for (let cursor = index + 1; cursor < lines.length && !/^\*\*[^*]+\*\*\s*\|/.test(lines[cursor]) && !/^---$/.test(lines[cursor]); cursor += 1) {
      following.push(lines[cursor]);
    }
    const skills = [...following.join("\n").matchAll(/【([^】]+)】([^\n]+)/g)].map((item) => ({ title: clean(item[1]), text: clean(item[2]) }));
    const core = clean(match[3]).split(/[、/]/).map(clean);
    const mechanicCode = match[2].match(/\[(M[123])\]/)?.[1] || "";
    cards.push({
      type: "school",
      id: `S${String(cards.length + 1).padStart(2, "0")}`,
      name: clean(match[1]), tier, region: clean(match[2]), mechanicTag: mechanicTags[mechanicCode] || "", core,
      start: clean(match[4]), skills,
      body: skills.map((skill) => `【${skill.title}】${skill.text}`).join(" "),
      target: tier === "领跑档" ? 112 : tier === "蓄力档" ? 80 : 86,
      startPrestige: tier === "领跑档" ? 12 : tier === "蓄力档" ? 2 : 6,
      startMoney: tier === "领跑档" ? 6 : tier === "蓄力档" ? 4 : 5,
      crestClass: crestClasses[clean(match[1])] || "",
    });
  }
  return cards;
}

const disciplineFor = (id) => id.startsWith("W") ? "文" : id.startsWith("F") ? "法" : id.startsWith("SCI") ? "理" : id.startsWith("AGR") ? "农" : id.startsWith("MED") ? "医" : id.startsWith("BUS") ? "商" : id.startsWith("ENG") ? "传统工科" : "新工科";
const romanLevel = (value) => ({ "Ⅰ": 1, "Ⅱ": 2, "Ⅲ": 3 }[value] || 1);
const facultyStats = {
  "文": [{ cost: 2, strength: 2, output: { policy: 1 } }, { cost: 6, strength: 4, output: { policy: 2 } }, { cost: null, strength: 6, output: { policy: 3 } }],
  "法": [{ cost: 2, strength: 2, output: { policy: 1 } }, { cost: 6, strength: 4, output: { policy: 2 } }, { cost: null, strength: 6, output: { policy: 3 } }],
  "理": [{ cost: 3, strength: 2, output: { science: 1 } }, { cost: 7, strength: 4, output: { science: 2 } }, { cost: null, strength: 7, output: { science: 3 } }],
  "农": [{ cost: 2, strength: 2, output: { science: 1 } }, { cost: 6, strength: 5, output: { science: 1, policy: 1 } }, { cost: null, strength: 7, output: { science: 2, policy: 1 } }],
  "医": [{ cost: 3, strength: 2, output: { science: 1, money: 1 } }, { cost: 7, strength: 4, output: { science: 2, money: 1 } }, { cost: null, strength: 7, output: { science: 2, money: 2 } }],
  "商": [{ cost: 2, strength: 2, output: { money: 2 } }, { cost: 6, strength: 4, output: { money: 3 } }, { cost: null, strength: 6, output: { money: 4 } }],
  "传统工科": [{ cost: 3, strength: 2, output: { science: 1, money: 1 } }, { cost: 7, strength: 4, output: { science: 2, money: 1 } }, { cost: null, strength: 7, output: { science: 3, money: 1 } }],
  "新工科": [{ cost: 4, strength: 3, output: { science: 2 } }, { cost: 8, strength: 5, output: { science: 3 } }, { cost: null, strength: 8, output: { science: 4 } }],
};

function parseFaculties(text) {
  return rows(text, /^(?:W|F|SCI|AGR|MED|BUS|ENG|NEW)\d{2}$/).map(([id, name, levelLabel, tags]) => {
    const discipline = disciplineFor(id);
    const level = romanLevel(levelLabel);
    const stats = facultyStats[discipline][level - 1];
    return { type: "faculty", id, name, level, levelLabel, discipline, tags, slots: level, ...stats, body: `${discipline} · ${levelLabel}级 · ${tags}` };
  });
}

function parseTalents(text) {
  const cards = rows(text, /^[LY]\d{2}$/).map((cells) => {
    const [id, name, discipline, tags, subtype, standard, special] = cells;
    return { type: "talent", id, name, discipline, tags, subtype, cost: id.startsWith("Y") ? 4 : 2, strength: id.startsWith("Y") ? 2 : 0, body: clean([standard, special].filter(Boolean).join("；")) };
  });
  for (const match of text.matchAll(/^###\s+(A\d{2})\s+(.+)$/gm)) {
    const start = match.index;
    const next = text.indexOf("\n---", start);
    const chunk = text.slice(start, next > start ? next : start + 900);
    const meta = chunk.match(/\*\*门类：([^｜\n]+)｜方向：([^｜\n]+)｜底价\s*(\d+)\*\*/);
    const unique = chunk.match(/【([^】]+)】([^\n]+)/);
    cards.push({ type: "talent", id: match[1], name: clean(match[2]), discipline: clean(meta?.[1]), tags: clean(meta?.[2]), subtype: "院士/学部委员", cost: Number(meta?.[3] || 7), strength: 3, body: unique ? `【${clean(unique[1])}】${clean(unique[2])}` : clean(chunk) });
  }
  return cards;
}

function parseEvents(text) {
  const cards = [];
  let era = "";
  for (const line of text.split(/\r?\n/)) {
    const heading = line.match(/^## 第 \d+ 时代:([^\s(]+)/);
    if (heading) era = heading[1];
    const match = line.match(/^\s*(\d+)\.\s*(🟢|🔴|🔵)\*\*「(.+?)」\*\*\|\s*([^|]+)\|\s*(.+)$/u);
    if (match) {
      cards.push({ type: "event", id: `E${String(match[1]).padStart(2, "0")}`, era, tone: match[2], name: clean(match[3]), range: clean(match[4]), duration: clean(match[5]), body: "" });
    } else if (cards.length && /^\s{3,}\S/.test(line)) {
      cards.at(-1).body = clean(`${cards.at(-1).body} ${line}`);
    }
  }
  return cards;
}

function parseProjects(text) {
  const cards = [];
  let era = "";
  let lane = "";
  const lines = text.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const eraMatch = lines[index].match(/^# [二三四五六七]、([^：]+)：/);
    if (eraMatch) era = eraMatch[1].split("：")[0];
    if (/^## (基础科学|工程技术|生命资源|人文治理|交叉战略)$/.test(lines[index])) lane = lines[index].slice(3);
    const cardMatch = lines[index].match(/^###\s+(P\d{2})\s+(.+)$/);
    if (!cardMatch) continue;
    const block = [];
    for (let cursor = index + 1; cursor < lines.length && !/^###\s+P\d{2}/.test(lines[cursor]) && !/^---$/.test(lines[cursor]); cursor += 1) block.push(lines[cursor]);
    const chunk = block.join("\n");
    const role = chunk.match(/\*\*主门类：([^｜\n]+)｜协同：([^*\n]+)\*\*/);
    const pool = Number(chunk.match(/声望池：(\d+)⭐/)?.[1] || 0);
    const tags = clean(chunk.match(/\*\*标签：([^*\n]+)\*\*/)?.[1]);
    const contribution = clean(chunk.match(/\*\*出资：([^*\n]+)\*\*/)?.[1]);
    const leader = clean(chunk.match(/\*\*牵头：\*\*([^\n]+)/)?.[1]);
    const participant = clean(chunk.match(/\*\*参与：\*\*([^\n]+)/)?.[1]);
    cards.push({ type: "project", id: cardMatch[1], name: clean(cardMatch[2]), era, lane, main: clean(role?.[1]).split("、").filter(Boolean), support: clean(role?.[2]).replace(/（[^）]+）/g, "").split(/[、，]/).map(clean).filter(Boolean), pool, contribution, leader, participant, tags, body: `主门类：${clean(role?.[1])}｜协同：${clean(role?.[2])}｜${contribution}｜声望池 ${pool}⭐` });
  }
  return cards;
}

function parsePolicies(text) {
  const cards = [];
  let category = "";
  for (const match of text.matchAll(/^## ([A-D])\.\s+(.+)|^###\s+([GTRD]\d{2})\s+(.+)$/gm)) {
    if (match[1]) { category = clean(match[2]); continue; }
    const start = match.index;
    const next = text.indexOf("\n---", start);
    const chunk = text.slice(start, next > start ? next : start + 900);
    const meta = chunk.match(/\*\*费用：(\d+)🏛｜([^*]+)\*\*/);
    const body = clean(chunk.split(/\r?\n/).slice(3).filter((line) => !line.startsWith("*用途：")).join(" "));
    cards.push({ type: "policy", id: match[3], name: clean(match[4]), category, cost: Number(meta?.[1] || 0), subtype: clean(meta?.[2]), body });
  }
  return cards;
}

const raw = Object.fromEntries(Object.entries(files).map(([key, file]) => [key, read(file)]));
const decks = {
  school: parseSchools(raw.school), faculty: parseFaculties(raw.faculty), talent: parseTalents(raw.talent),
  event: parseEvents(raw.event), project: parseProjects(raw.project), policy: parsePolicies(raw.policy),
};
const expected = { school: 48, faculty: 96, talent: 36, event: 72, project: 60, policy: 24 };
for (const [key, total] of Object.entries(expected)) {
  if (decks[key].length !== total) throw new Error(`${key}: expected ${total}, got ${decks[key].length}`);
}

fs.writeFileSync(path.join(gameRoot, 'cards.json'), JSON.stringify({version:'0.5', counts:expected, decks}, null, 2)+'\n');
console.log('Validated and built 336 cards.');
