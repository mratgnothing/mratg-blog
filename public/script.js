const revealItems = document.querySelectorAll("[data-reveal]");
const glow = document.querySelector(".cursor-glow");
const canvas = document.querySelector(".starfield");
const context = canvas?.getContext("2d");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.14 }
);

revealItems.forEach((item, index) => {
  item.style.transitionDelay = `${Math.min(index * 35, 180)}ms`;
  revealObserver.observe(item);
});

document.addEventListener("pointermove", (event) => {
  if (!glow || prefersReducedMotion || window.innerWidth < 760) return;
  glow.style.setProperty("--x", `${event.clientX}px`);
  glow.style.setProperty("--y", `${event.clientY}px`);
});

let stars = [];
let width = 0;
let height = 0;
let animationFrame = 0;

function resizeCanvas() {
  if (!canvas || !context) return;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(height * ratio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);

  const starLimit = width < 760 ? 20 : 42;
  const starCount = Math.floor(Math.min(starLimit, Math.max(16, width / 34)));
  stars = Array.from({ length: starCount }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    size: Math.random() > 0.78 ? 4 : 3,
    speed: 0.018 + Math.random() * 0.045,
    drift: Math.random() > 0.5 ? 0.035 : -0.035,
    phase: Math.random() * Math.PI * 2,
    color: ["255, 244, 215", "244, 184, 75", "132, 195, 216", "217, 240, 226"][Math.floor(Math.random() * 4)],
  }));
}

function drawStars(time = 0) {
  if (!canvas || !context) return;
  context.clearRect(0, 0, width, height);
  stars.forEach((star) => {
    const twinkle = 0.34 + Math.sin(time * 0.0012 + star.phase) * 0.26;
    const x = Math.round(star.x / 2) * 2;
    const y = Math.round(star.y / 2) * 2;
    context.fillStyle = `rgba(${star.color}, ${twinkle})`;
    context.fillRect(x, y, star.size, star.size);
    if (star.size > 3 && twinkle > 0.48) {
      context.fillStyle = `rgba(32, 24, 39, ${twinkle * 0.18})`;
      context.fillRect(x + star.size, y + star.size, 2, 2);
    }
    if (!prefersReducedMotion) {
      star.y += star.speed;
      star.x += Math.sin(time * 0.0006 + star.phase) * star.drift;
      if (star.y > height + 4) {
        star.y = -4;
        star.x = Math.random() * width;
      }
      if (star.x < -8) star.x = width + 8;
      if (star.x > width + 8) star.x = -8;
    }
  });

  if (!prefersReducedMotion) {
    animationFrame = window.requestAnimationFrame(drawStars);
  }
}

if (canvas && context) {
  resizeCanvas();
  drawStars();
  window.addEventListener("resize", resizeCanvas);
}

document.querySelectorAll(".post-card").forEach((card) => {
  card.addEventListener("mouseenter", () => {
    card.animate(
      [
        { transform: "translateY(-6px)" },
        { transform: "translateY(-6px) rotate(1deg)" },
        { transform: "translateY(-6px)" },
      ],
      { duration: 220, easing: "steps(3, end)" }
    );
  });
});

const burstTargets = document.querySelectorAll(
  ".button, .text-action, .tag-button, .engagement-button, .card-actions a, .contact-links a, .friend-links a, .column-card, .shelf-item"
);

burstTargets.forEach((target) => {
  target.addEventListener("click", (event) => {
    createPixelBurst(event.clientX, event.clientY);
    target.classList.remove("pixel-triggered");
    void target.offsetWidth;
    target.classList.add("pixel-triggered");
  });
});

function createPixelBurst(x, y) {
  if (prefersReducedMotion) return;

  const palette = ["#f4b84b", "#84c3d8", "#b95768", "#5f9c63", "#fff4d7"];
  const burst = document.createElement("span");
  burst.className = "pixel-burst";
  burst.style.transform = `translate(${x}px, ${y}px)`;

  for (let index = 0; index < 10; index += 1) {
    const bit = document.createElement("span");
    const angle = (Math.PI * 2 * index) / 10;
    const distance = 18 + (index % 3) * 8;
    bit.className = "pixel-bit";
    bit.style.setProperty("--dx", `${Math.round(Math.cos(angle) * distance)}px`);
    bit.style.setProperty("--dy", `${Math.round(Math.sin(angle) * distance)}px`);
    bit.style.setProperty("--pixel-color", palette[index % palette.length]);
    bit.style.left = `${index % 2 ? -3 : 3}px`;
    bit.style.top = `${index % 3 ? -4 : 2}px`;
    burst.append(bit);
  }

  document.body.append(burst);
  window.setTimeout(() => burst.remove(), 620);
}

const searchInput = document.querySelector("[data-search-input]");
const searchResults = document.querySelector("[data-search-results]");
const searchIndexNode = document.querySelector("[data-search-index]");
let searchIndex = [];
const COMMENT_IMAGE_LIMIT = 2 * 1024 * 1024;

if (searchInput && searchResults && searchIndexNode) {
  try {
    searchIndex = JSON.parse(searchIndexNode.textContent || "[]");
  } catch {
    searchIndex = [];
  }

  searchInput.addEventListener("input", () => {
    const query = searchInput.value.trim().toLowerCase();
    if (!query) {
      searchResults.hidden = true;
      searchResults.innerHTML = "";
      return;
    }

    const matches = searchIndex
      .filter((item) => item.text.toLowerCase().includes(query))
      .slice(0, 8);

    if (!matches.length) {
      searchResults.hidden = false;
      searchResults.innerHTML = '<div class="search-empty">没有找到相关内容</div>';
      return;
    }

    searchResults.hidden = false;
    searchResults.innerHTML = matches
      .map(
        (item) => `
          <a class="search-result" href="${item.href}">
            <span>${escapeHtml(item.type)}</span>
            <strong>${escapeHtml(item.title)}</strong>
            <small>${escapeHtml(item.description || "")}</small>
          </a>
        `
      )
      .join("");
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".site-search")) {
      searchResults.hidden = true;
    }
  });

  searchInput.addEventListener("focus", () => {
    if (searchInput.value.trim() && searchResults.innerHTML) {
      searchResults.hidden = false;
    }
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

document.querySelectorAll("[data-comment-box]").forEach((box) => {
  const threadId = box.dataset.threadId;
  const form = box.querySelector("[data-comment-form]");
  const list = box.querySelector("[data-comment-list]");
  const count = box.querySelector("[data-comment-count]");
  const imageInput = box.querySelector("[data-comment-image]");
  const preview = box.querySelector("[data-comment-preview]");
  let pendingImage = "";

  if (!threadId || !form || !list || !count) return;

  const storageKey = `mratg-comments:${threadId}`;

  function readComments() {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "[]");
    } catch {
      return [];
    }
  }

  function writeComments(comments) {
    localStorage.setItem(storageKey, JSON.stringify(comments));
  }

  function renderComments() {
    const comments = readComments();
    count.textContent = `${comments.length} 条`;

    if (!comments.length) {
      list.innerHTML = '<p class="comment-empty">还没有评论。</p>';
      return;
    }

    list.innerHTML = comments
      .map(
        (comment) => `
          <article class="comment-item">
            <div class="comment-avatar">${escapeHtml((comment.name || "A").slice(0, 1).toUpperCase())}</div>
            <div>
              <header>
                <strong>${escapeHtml(comment.name)}</strong>
                <time datetime="${escapeHtml(comment.createdAt)}">${escapeHtml(formatCommentTime(comment.createdAt))}</time>
              </header>
              <p>${escapeHtml(comment.message).replace(/\n/g, "<br>")}</p>
              ${comment.image ? `<img src="${comment.image}" alt="评论图片" loading="lazy" />` : ""}
            </div>
          </article>
        `
      )
      .join("");
  }

  if (imageInput && preview) {
    imageInput.addEventListener("change", () => {
      const file = imageInput.files?.[0];
      pendingImage = "";
      preview.hidden = true;
      preview.innerHTML = "";

      if (!file) return;
      if (!file.type.startsWith("image/")) {
        preview.hidden = false;
        preview.textContent = "请选择图片文件。";
        imageInput.value = "";
        return;
      }
      if (file.size > COMMENT_IMAGE_LIMIT) {
        preview.hidden = false;
        preview.textContent = "图片请控制在 2MB 以内。";
        imageInput.value = "";
        return;
      }

      const reader = new FileReader();
      reader.addEventListener("load", () => {
        pendingImage = String(reader.result || "");
        preview.hidden = false;
        preview.innerHTML = `<img src="${pendingImage}" alt="待上传图片预览" />`;
      });
      reader.readAsDataURL(file);
    });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const message = String(formData.get("message") || "").trim();

    if (!name || !email || !message) return;

    const comments = readComments();
    comments.unshift({
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      name,
      email,
      message,
      image: pendingImage,
      createdAt: new Date().toISOString(),
    });
    writeComments(comments);

    form.reset();
    pendingImage = "";
    if (preview) {
      preview.hidden = true;
      preview.innerHTML = "";
    }
    renderComments();
  });

  renderComments();
});

function formatCommentTime(value) {
  try {
    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(value));
  } catch {
    return value;
  }
}

document.querySelectorAll("[data-engagement]").forEach((bar) => {
  const threadId = bar.dataset.threadId;
  const likeButton = bar.querySelector("[data-like-button]");
  const likeCount = bar.querySelector("[data-like-count]");
  const shareButton = bar.querySelector("[data-share-button]");
  if (!threadId || !likeButton || !likeCount || !shareButton) return;

  const countKey = `mratg-likes:${threadId}`;
  const likedKey = `mratg-liked:${threadId}`;

  function renderLike() {
    const count = Number(localStorage.getItem(countKey) || "0");
    const liked = localStorage.getItem(likedKey) === "true";
    likeCount.textContent = String(Math.max(0, count));
    likeButton.setAttribute("aria-pressed", String(liked));
    likeButton.classList.toggle("is-liked", liked);
  }

  likeButton.addEventListener("click", () => {
    const liked = localStorage.getItem(likedKey) === "true";
    const current = Number(localStorage.getItem(countKey) || "0");
    localStorage.setItem(likedKey, String(!liked));
    localStorage.setItem(countKey, String(Math.max(0, current + (liked ? -1 : 1))));
    renderLike();
  });

  shareButton.addEventListener("click", () => {
    openShareModal({
      title: bar.dataset.shareTitle || "Mr.ATG Pixel Lab",
      description: bar.dataset.shareDescription || "",
      href: new URL(bar.dataset.shareHref || "/", window.location.origin).toString(),
      type: bar.dataset.shareType || "文章",
      date: bar.dataset.shareDate || "",
    });
  });

  renderLike();
});

function openShareModal(item) {
  const modal = ensureShareModal();
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(item.href)}`;
  modal.querySelector("[data-share-type-label]").textContent = item.type;
  modal.querySelector("[data-share-date-label]").textContent = item.date || "Pixel Lab";
  modal.querySelector("[data-share-title-label]").textContent = item.title;
  modal.querySelector("[data-share-desc-label]").textContent = item.description;
  modal.querySelector("[data-share-url-label]").textContent = item.href;
  modal.querySelector("[data-share-qr]").src = qrUrl;
  modal.querySelector("[data-copy-link]").onclick = () => copyShareLink(item.href, modal);
  modal.querySelector("[data-save-poster]").onclick = () => saveSharePoster(item, qrUrl);
  modal.hidden = false;
  document.body.classList.add("share-open");
}

function ensureShareModal() {
  let modal = document.querySelector("[data-share-modal]");
  if (modal) return modal;

  modal = document.createElement("div");
  modal.className = "share-modal";
  modal.dataset.shareModal = "true";
  modal.hidden = true;
  modal.innerHTML = `
    <div class="share-backdrop" data-share-close></div>
    <section class="share-dialog" role="dialog" aria-modal="true" aria-label="转发内容">
      <button class="share-close" type="button" data-share-close aria-label="关闭">×</button>
      <article class="share-poster">
        <div class="share-poster-top">
          <span data-share-type-label>文章</span>
          <strong data-share-date-label>Pixel Lab</strong>
        </div>
        <h2 data-share-title-label></h2>
        <p data-share-desc-label></p>
        <div class="share-poster-bottom">
          <div>
            <span>作者</span>
            <strong>Mr.ATG</strong>
            <small>Pixel Lab</small>
          </div>
          <img data-share-qr alt="分享二维码" />
        </div>
        <small class="share-url" data-share-url-label></small>
      </article>
      <div class="share-actions">
        <button type="button" data-copy-link>复制链接</button>
        <button type="button" data-save-poster>保存海报</button>
      </div>
      <p class="share-status" data-share-status aria-live="polite"></p>
    </section>
  `;

  modal.querySelectorAll("[data-share-close]").forEach((button) => {
    button.addEventListener("click", () => {
      modal.hidden = true;
      document.body.classList.remove("share-open");
    });
  });
  document.body.append(modal);
  return modal;
}

async function copyShareLink(href, modal) {
  const status = modal.querySelector("[data-share-status]");
  try {
    await navigator.clipboard.writeText(href);
    status.textContent = "链接已复制。";
  } catch {
    const input = document.createElement("input");
    input.value = href;
    document.body.append(input);
    input.select();
    document.execCommand("copy");
    input.remove();
    status.textContent = "链接已复制。";
  }
}

function saveSharePoster(item, qrUrl) {
  const titleLines = wrapText(item.title, 18).slice(0, 3);
  const descLines = wrapText(item.description, 26).slice(0, 3);
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="760" height="960" viewBox="0 0 760 960">
  <defs>
    <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
      <path d="M24 0H0V24" fill="none" stroke="#201827" stroke-opacity="0.06" stroke-width="2"/>
    </pattern>
    <pattern id="pixel" width="16" height="16" patternUnits="userSpaceOnUse">
      <path d="M8 0V16M0 8H16" stroke="#201827" stroke-opacity="0.10" stroke-width="2"/>
    </pattern>
  </defs>
  <rect width="760" height="960" fill="#fff4d7"/>
  <rect width="760" height="960" fill="url(#grid)"/>
  <rect x="24" y="24" width="712" height="912" fill="#fff4d7" stroke="#201827" stroke-width="5"/>
  <rect x="24" y="24" width="712" height="190" fill="#ffe6ad" stroke="#201827" stroke-width="5"/>
  <rect x="560" y="42" width="128" height="128" fill="url(#pixel)" opacity="0.7" transform="rotate(12 624 106)"/>
  <rect x="64" y="78" width="96" height="76" fill="#1f2554" stroke="#201827" stroke-width="5"/>
  <text x="112" y="126" text-anchor="middle" font-family="IdeaFonts XiangSuZhiCheng, Microsoft YaHei, Arial" font-size="34" font-weight="100" fill="#fff4d7">${escapeXml(item.type.slice(0, 2))}</text>
  <rect x="516" y="78" width="156" height="56" fill="#d9f0e2" stroke="#201827" stroke-width="5"/>
  <text x="594" y="115" text-anchor="middle" font-family="IdeaFonts XiangSuZhiCheng, Microsoft YaHei, Arial" font-size="24" font-weight="100" fill="#2f644b">${escapeXml(item.date || "Pixel Lab")}</text>
  ${titleLines.map((line, index) => `<text x="64" y="${300 + index * 50}" font-family="IdeaFonts XiangSuZhiCheng, Microsoft YaHei, Arial" font-size="40" font-weight="100" fill="#201827">${escapeXml(line)}</text>`).join("")}
  <rect x="64" y="462" width="7" height="92" fill="#f4b84b"/>
  ${descLines.map((line, index) => `<text x="92" y="${500 + index * 36}" font-family="IdeaFonts XiangSuZhiCheng, Microsoft YaHei, Arial" font-size="26" fill="#5d5765">${escapeXml(line)}</text>`).join("")}
  <line x1="64" y1="650" x2="696" y2="650" stroke="#201827" stroke-opacity="0.18" stroke-width="4"/>
  <rect x="64" y="704" width="92" height="92" fill="#4f3b78" stroke="#201827" stroke-width="5"/>
  <text x="110" y="764" text-anchor="middle" font-family="IdeaFonts XiangSuZhiCheng, Microsoft YaHei, Arial" font-size="42" font-weight="100" fill="#fff4d7">A</text>
  <text x="184" y="724" font-family="IdeaFonts XiangSuZhiCheng, Microsoft YaHei, Arial" font-size="22" font-weight="100" fill="#2f644b">作者</text>
  <text x="184" y="762" font-family="IdeaFonts XiangSuZhiCheng, Microsoft YaHei, Arial" font-size="34" font-weight="100" fill="#201827">Mr.ATG</text>
  <text x="184" y="798" font-family="IdeaFonts XiangSuZhiCheng, Microsoft YaHei, Arial" font-size="26" font-weight="100" fill="#2f644b">Pixel Lab</text>
  <rect x="520" y="690" width="166" height="166" fill="#fff4d7" stroke="#201827" stroke-width="5"/>
  <image x="532" y="702" width="142" height="142" href="${escapeXml(qrUrl)}"/>
  <rect x="640" y="824" width="96" height="96" fill="url(#pixel)" opacity="0.55" transform="rotate(12 688 872)"/>
  <text x="64" y="900" font-family="IdeaFonts XiangSuZhiCheng, Microsoft YaHei, Arial" font-size="18" fill="#6f6876">${escapeXml(item.href)}</text>
</svg>`;
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${slugForFile(item.title)}-poster.svg`;
  link.click();
  URL.revokeObjectURL(url);
}

function wrapText(value, maxLength) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) return [""];
  const lines = [];
  for (let index = 0; index < text.length; index += maxLength) {
    lines.push(text.slice(index, index + maxLength));
  }
  return lines;
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function slugForFile(value) {
  return String(value || "share")
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "share";
}

window.addEventListener("pagehide", () => {
  if (animationFrame) {
    window.cancelAnimationFrame(animationFrame);
  }
});
