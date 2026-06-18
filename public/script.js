const revealItems = document.querySelectorAll("[data-reveal]");
const glow = document.querySelector(".cursor-glow");
const canvas = document.querySelector(".starfield");
const context = canvas?.getContext("2d");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (revealItems.length && !prefersReducedMotion && "IntersectionObserver" in window) {
  document.documentElement.classList.add("reveal-enhanced");
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting || entry.intersectionRatio > 0) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0, rootMargin: "0px 0px -8% 0px" }
  );

  revealItems.forEach((item, index) => {
    const itemHeight = item.getBoundingClientRect().height;
    if (itemHeight > window.innerHeight * 1.25) {
      item.classList.add("is-visible");
      return;
    }
    item.style.transitionDelay = `${Math.min(index * 35, 180)}ms`;
    revealObserver.observe(item);
  });
} else {
  revealItems.forEach((item) => {
    item.classList.add("is-visible");
  });
}

// 使用 requestAnimationFrame 优化鼠标跟随效果，减少重绘频率
let pointerTimeout;
document.addEventListener("pointermove", (event) => {
  if (!glow || prefersReducedMotion || window.innerWidth < 760) return;
  if (pointerTimeout) window.cancelAnimationFrame(pointerTimeout);
  pointerTimeout = window.requestAnimationFrame(() => {
    glow.style.setProperty("--x", `${event.clientX}px`);
    glow.style.setProperty("--y", `${event.clientY}px`);
  });
}, { passive: true });

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
  // 使用 requestIdleCallback 延迟启动非关键的星空背景动画
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(() => drawStars());
  } else {
    setTimeout(drawStars, 1000);
  }
  window.addEventListener("resize", resizeCanvas, { passive: true });
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
  ".button, .text-action, .tag-button, .engagement-button, .card-actions a, .contact-links a, .friend-links a, .column-card, .shelf-item, .metric-list a"
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
const ENGAGEMENT_API = {
  thread: "/api/thread",
  comment: "/api/comment",
  like: "/api/like",
  annotation: "/api/annotation",
};
const threadRequests = new Map();

function getVisitorId() {
  const key = "mratg-visitor-id";
  let visitorId = localStorage.getItem(key);
  if (!visitorId) {
    visitorId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
    localStorage.setItem(key, visitorId);
  }
  return visitorId;
}

async function fetchThreadData(threadId, options = {}) {
  const refresh = Boolean(options.refresh);
  const cacheKey = `${threadId}:${getVisitorId()}`;
  if (!refresh && threadRequests.has(cacheKey)) {
    return threadRequests.get(cacheKey);
  }

  const request = fetch(`${ENGAGEMENT_API.thread}?threadId=${encodeURIComponent(threadId)}&visitorId=${encodeURIComponent(getVisitorId())}`, {
    headers: { accept: "application/json" },
  }).then(async (response) => {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Thread request failed");
    return data;
  });

  threadRequests.set(cacheKey, request);
  return request;
}

async function postJson(url, payload, method = "POST") {
  const response = await fetch(url, {
    method,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      ...payload,
      visitorId: getVisitorId(),
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}

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

document.querySelectorAll("[data-view-counter]").forEach((counter) => {
  const viewKey = counter.dataset.viewKey;
  if (!viewKey) return;
  const storageKey = `mratg-views:${viewKey}`;
  const nextCount = Number(localStorage.getItem(storageKey) || "0") + 1;
  localStorage.setItem(storageKey, String(nextCount));
  counter.textContent = String(nextCount);
});

const annotationRoot = document.querySelector("[data-annotatable]");
const annotationPanel = document.querySelector("[data-annotation-panel]");

if (annotationRoot && annotationPanel) {
  const threadId = annotationPanel.dataset.annotationThread || annotationRoot.dataset.annotationThread || "article";
  const storageKey = `mratg-annotations:${threadId}`;
  const selectedPreview = annotationPanel.querySelector("[data-annotation-selected]");
  const input = annotationPanel.querySelector("[data-annotation-input]");
  const addButton = annotationPanel.querySelector("[data-annotation-add]");
  let selectedText = "";
  let selectedRange = null;
  let annotations = [];
  let backendAnnotations = false;

  function readAnnotations() {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "[]");
    } catch {
      return [];
    }
  }

  function writeAnnotations(items) {
    annotations = items;
    localStorage.setItem(storageKey, JSON.stringify(items));
  }

  function updateSelectionPreview() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    const text = selection.toString().replace(/\s+/g, " ").trim();
    if (!text || !annotationRoot.contains(range.commonAncestorContainer)) return;
    selectedText = text.slice(0, 260);
    selectedRange = range.cloneRange();
    if (selectedPreview) {
      selectedPreview.textContent = `已选中：${selectedText}`;
    }
  }

  document.addEventListener("selectionchange", updateSelectionPreview);

  function createAnnotationMark(text, note, id, owned = true) {
    const mark = document.createElement("span");
    mark.className = "article-annotation";
    mark.dataset.annotationId = id;
    mark.dataset.note = note;
    mark.dataset.text = text;
    mark.dataset.owned = String(owned);
    mark.textContent = text;
    return mark;
  }

  function wrapRange(text, note, id, owned = true) {
    if (!selectedRange || !annotationRoot.contains(selectedRange.commonAncestorContainer)) return false;
    const mark = createAnnotationMark(text, note, id, owned);
    try {
      selectedRange.surroundContents(mark);
      window.getSelection()?.removeAllRanges();
      return true;
    } catch {
      return false;
    }
  }

  function wrapFirstOccurrence(text, note, id, owned = true) {
    const walker = document.createTreeWalker(annotationRoot, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue?.includes(text)) return NodeFilter.FILTER_REJECT;
        if (node.parentElement?.closest(".article-annotation, script, style, textarea, button")) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    const node = walker.nextNode();
    if (!node || !node.nodeValue) return false;
    const index = node.nodeValue.indexOf(text);
    if (index < 0) return false;
    const range = document.createRange();
    range.setStart(node, index);
    range.setEnd(node, index + text.length);
    const mark = createAnnotationMark(text, note, id, owned);
    range.surroundContents(mark);
    return true;
  }

  function restoreAnnotations() {
    annotations.forEach((item) => {
      wrapFirstOccurrence(item.text, item.note, item.id, item.owned !== false);
    });
  }

  async function loadAnnotations() {
    annotations = readAnnotations();
    try {
      const data = await fetchThreadData(threadId);
      backendAnnotations = true;
      writeAnnotations(data.annotations || []);
    } catch {
      backendAnnotations = false;
    }
    restoreAnnotations();
  }

  function closeAnnotationPopovers(exceptMark = null) {
    annotationRoot.querySelectorAll(".article-annotation.is-open").forEach((item) => {
      if (item !== exceptMark) {
        item.classList.remove("is-open");
        item.querySelector(".article-annotation-popover")?.remove();
      }
    });
  }

  function openAnnotationPopover(mark) {
    const existingPopover = mark.querySelector(".article-annotation-popover");
    closeAnnotationPopovers(mark);
    if (existingPopover) {
      mark.classList.remove("is-open");
      existingPopover.remove();
      return;
    }
    const popover = document.createElement("span");
    popover.className = "article-annotation-popover";
    popover.setAttribute("role", "note");
    const deleteButton = mark.dataset.owned === "false" ? "" : `<button type="button" data-annotation-delete-inline="${escapeHtml(mark.dataset.annotationId || "")}">删除</button>`;
    popover.innerHTML = `
      <span>${escapeHtml(mark.dataset.note || "")}</span>
      ${deleteButton}
    `;
    mark.append(popover);
    mark.classList.add("is-open");
  }

  async function deleteAnnotation(id) {
    if (!id) return;
    let next = annotations.filter((item) => item.id !== id);
    if (backendAnnotations) {
      try {
        const data = await postJson(ENGAGEMENT_API.annotation, { threadId, id }, "DELETE");
        next = data.annotations || next;
      } catch {
        backendAnnotations = false;
      }
    }
    writeAnnotations(next);
    annotationRoot.querySelectorAll(`[data-annotation-id="${CSS.escape(id)}"]`).forEach((mark) => {
      mark.replaceWith(document.createTextNode(mark.dataset.text || mark.firstChild?.textContent || ""));
    });
  }

  addButton?.addEventListener("click", async () => {
    const note = String(input?.value || "").trim();
    if (!selectedText || !note) return;
    const id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
    const cleanText = selectedText.slice(0, 260);
    const cleanNote = note.slice(0, 360);
    let nextAnnotation = { id, text: cleanText, note: cleanNote, owned: true, createdAt: new Date().toISOString() };

    if (backendAnnotations) {
      try {
        const data = await postJson(ENGAGEMENT_API.annotation, { threadId, text: cleanText, note: cleanNote });
        nextAnnotation = (data.annotations || []).find((item) => item.text === cleanText && item.note === cleanNote) || nextAnnotation;
        writeAnnotations(data.annotations || [nextAnnotation, ...annotations]);
      } catch {
        backendAnnotations = false;
        writeAnnotations([nextAnnotation, ...annotations]);
      }
    } else {
      writeAnnotations([nextAnnotation, ...annotations]);
    }

    wrapRange(nextAnnotation.text, nextAnnotation.note, nextAnnotation.id, nextAnnotation.owned !== false) ||
      wrapFirstOccurrence(nextAnnotation.text, nextAnnotation.note, nextAnnotation.id, nextAnnotation.owned !== false);
    if (input) input.value = "";
    selectedText = "";
    selectedRange = null;
    if (selectedPreview) selectedPreview.textContent = "选中正文里的句子或段落后，可以在这里写批注。";
  });

  annotationRoot.addEventListener("click", (event) => {
    const deleteButton = event.target.closest("[data-annotation-delete-inline]");
    if (deleteButton) {
      event.stopPropagation();
      deleteAnnotation(deleteButton.dataset.annotationDeleteInline);
      return;
    }
    const mark = event.target.closest(".article-annotation");
    if (!mark) return;
    event.stopPropagation();
    openAnnotationPopover(mark);
  });

  document.addEventListener("click", (event) => {
    if (event.target.closest(".article-annotation")) return;
    closeAnnotationPopovers();
  });

  loadAnnotations();
}

const monthEntryDays = document.querySelectorAll(".month-day.has-entry");

monthEntryDays.forEach((day) => {
  day.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  day.addEventListener("toggle", () => {
    if (!day.open) return;
    monthEntryDays.forEach((item) => {
      if (item !== day) item.open = false;
    });
  });
});

if (monthEntryDays.length) {
  document.addEventListener("click", (event) => {
    if (event.target.closest(".month-day.has-entry")) return;
    monthEntryDays.forEach((day) => {
      day.open = false;
    });
  });
}

document.querySelectorAll("[data-comment-box]").forEach((box) => {
  const threadId = box.dataset.threadId;
  const form = box.querySelector("[data-comment-form]");
  const list = box.querySelector("[data-comment-list]");
  const count = box.querySelector("[data-comment-count]");
  const imageInput = box.querySelector("[data-comment-image]");
  const preview = box.querySelector("[data-comment-preview]");
  const note = box.querySelector("[data-comment-note]");
  let pendingImage = "";
  let backendComments = false;
  let comments = [];

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
    comments = comments.slice(0, 200);
    localStorage.setItem(storageKey, JSON.stringify(comments));
  }

  function setComments(nextComments, persist = true) {
    comments = nextComments;
    if (persist) {
      localStorage.setItem(storageKey, JSON.stringify(nextComments));
    }
  }

  function renderComments(nextComments = comments) {
    setComments(nextComments, false);
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

  async function loadComments() {
    setComments(readComments(), false);
    renderComments();
    try {
      const data = await fetchThreadData(threadId);
      backendComments = true;
      setComments(data.comments || []);
      writeComments(comments);
      renderComments();
      if (note) note.textContent = "评论会公开保存到站点后端；邮箱仅用于去重和防刷，不会公开显示。";
    } catch {
      backendComments = false;
      if (note) note.textContent = "评论暂时保存在本机浏览器；后端恢复后会重新启用公开评论。";
    }
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

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const message = String(formData.get("message") || "").trim();
    const website = String(formData.get("website") || "").trim();

    if (website) return;
    if (!name || !email || !message) return;

    let nextComments = comments;
    const localComment = {
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      name,
      message,
      image: pendingImage,
      createdAt: new Date().toISOString(),
    };

    if (backendComments) {
      try {
        const data = await postJson(ENGAGEMENT_API.comment, { threadId, name, email, message, image: pendingImage, website });
        nextComments = data.comments || [localComment, ...comments];
        setComments(nextComments);
      } catch {
        backendComments = false;
        nextComments = [localComment, ...comments];
        setComments(nextComments);
        if (note) note.textContent = "评论暂时保存在本机浏览器；后端恢复后会重新启用公开评论。";
      }
    } else {
      nextComments = [localComment, ...comments];
      setComments(nextComments);
    }

    form.reset();
    pendingImage = "";
    if (preview) {
      preview.hidden = true;
      preview.innerHTML = "";
    }
    renderComments(nextComments);
  });

  loadComments();
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
  let backendLikes = false;
  let likeState = {
    count: Number(localStorage.getItem(countKey) || "0"),
    liked: localStorage.getItem(likedKey) === "true",
  };

  function setLikeState(nextState, persist = true) {
    likeState = {
      count: Math.max(0, Number(nextState.count || 0)),
      liked: Boolean(nextState.liked),
    };
    if (persist) {
      localStorage.setItem(countKey, String(likeState.count));
      localStorage.setItem(likedKey, String(likeState.liked));
    }
  }

  function renderLike() {
    likeCount.textContent = String(likeState.count);
    likeButton.setAttribute("aria-pressed", String(likeState.liked));
    likeButton.classList.toggle("is-liked", likeState.liked);
  }

  async function loadLike() {
    renderLike();
    try {
      const data = await fetchThreadData(threadId);
      backendLikes = true;
      setLikeState(data.likes || likeState);
      renderLike();
    } catch {
      backendLikes = false;
    }
  }

  likeButton.addEventListener("click", async () => {
    const optimisticState = {
      liked: !likeState.liked,
      count: likeState.count + (likeState.liked ? -1 : 1),
    };
    setLikeState(optimisticState);
    renderLike();

    if (!backendLikes) return;

    try {
      const data = await postJson(ENGAGEMENT_API.like, { threadId, liked: optimisticState.liked });
      setLikeState(data.likes || optimisticState);
      renderLike();
    } catch {
      backendLikes = false;
    }
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

  loadLike();
});

function openShareModal(item) {
  const modal = ensureShareModal();
  const qrUrl = createShareCode(item.href);
  modal.querySelector("[data-share-type-label]").textContent = item.type;
  modal.querySelector("[data-share-date-label]").textContent = item.date || "Pixel Lab";
  modal.querySelector("[data-share-title-label]").textContent = item.title;
  modal.querySelector("[data-share-desc-label]").textContent = item.description;
  modal.querySelector("[data-share-url-label]").textContent = item.href;
  modal.querySelector("[data-share-qr]").src = qrUrl;
  modal.querySelector("[data-copy-link]").onclick = () => copyShareLink(item.href, modal);
  modal.querySelector("[data-save-poster]").onclick = () => saveSharePoster(item, qrUrl, modal);
  renderShareTargets(modal, item);
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
    <div class="share-frame">
    <section class="share-dialog" role="dialog" aria-modal="true" aria-label="转发内容">
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
      <div class="share-socials" data-share-socials aria-label="选择转发平台"></div>
      <p class="share-status" data-share-status aria-live="polite"></p>
    </section>
    <button class="share-close" type="button" data-share-close aria-label="关闭">×</button>
    </div>
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

function createShareCode(href) {
  const matrix = createQrMatrix(href);
  const quiet = 4;
  const cell = 5;
  const size = matrix.length + quiet * 2;
  const modules = [];
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value) {
        modules.push(`<rect x="${(x + quiet) * cell}" y="${(y + quiet) * cell}" width="${cell}" height="${cell}" fill="#201827"/>`);
      }
    });
  });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size * cell}" height="${size * cell}" viewBox="0 0 ${size * cell} ${size * cell}"><rect width="${size * cell}" height="${size * cell}" fill="#fff4d7"/><rect x="${cell * 1.5}" y="${cell * 1.5}" width="${size * cell - cell * 3}" height="${size * cell - cell * 3}" fill="none" stroke="#201827" stroke-width="5"/>${modules.join("")}</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function renderShareTargets(modal, item) {
  const socials = modal.querySelector("[data-share-socials]");
  if (!socials) return;
  const encodedUrl = encodeURIComponent(item.href);
  const encodedText = encodeURIComponent(item.title);
  const targets = [
    { label: "微信", icon: shareIcon("wechat"), mode: "copy" },
    { label: "QQ", icon: shareIcon("qq"), url: `https://connect.qq.com/widget/shareqq/index.html?url=${encodedUrl}&title=${encodedText}&summary=${encodeURIComponent(item.description || "")}` },
    { label: "X", icon: shareIcon("x"), url: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}` },
    { label: "bilibili", icon: shareIcon("bilibili"), mode: "copy" },
    { label: "Facebook", icon: shareIcon("facebook"), url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
    { label: "Instagram", icon: shareIcon("instagram"), mode: "copy" },
  ];

  socials.innerHTML = targets
    .map((target) => `<button type="button" data-share-target="${escapeHtml(target.label)}"><span class="share-social-icon" aria-hidden="true">${target.icon}</span><span>${escapeHtml(target.label)}</span></button>`)
    .join("");
  socials.querySelectorAll("[data-share-target]").forEach((button) => {
    const target = targets.find((item) => item.label === button.dataset.shareTarget);
    button.addEventListener("click", () => {
      if (target?.url) {
        window.open(target.url, "_blank", "noopener,noreferrer,width=720,height=560");
        return;
      }
      copyShareLink(item.href, modal);
    });
  });
}

function shareIcon(name) {
  const icons = {
    wechat: `<svg viewBox="0 0 32 32" focusable="false"><path d="M13.5 8C7.7 8 3 11.5 3 15.9c0 2.5 1.5 4.8 3.9 6.2l-.8 2.8 3.4-1.7c1.2.4 2.5.7 4 .7 5.8 0 10.5-3.5 10.5-7.9S19.3 8 13.5 8Zm-3.4 5.2a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4Zm6.8 0a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4Z"/><path d="M19.5 15.8c4.9 0 8.5 2.9 8.5 6.4 0 1.9-1.1 3.7-2.9 4.8l.6 2.1-2.6-1.3c-1 .3-2.1.5-3.5.5-3.8 0-7.1-1.9-8.2-4.6.7.1 1.4.2 2.1.2 6.9 0 12.5-4.1 12.5-9.1v-.4c.9.4 1.7.8 2.4 1.4h-8.9Z"/></svg>`,
    qq: `<svg viewBox="0 0 32 32" focusable="false"><path d="M16 3c-4 0-7 3.3-7 8.2 0 2-.8 4.2-2.4 6.8-.4.7-.2 1.5.5 1.8l2.1.9-1.7 4.5c-.3.8.5 1.5 1.2 1.1l3.9-2.1c1 .6 2.1.9 3.4.9s2.5-.3 3.5-.9l3.8 2.1c.7.4 1.5-.3 1.2-1.1l-1.7-4.5 2.1-.9c.7-.3.9-1.1.5-1.8-1.6-2.6-2.4-4.8-2.4-6.8C23 6.3 20 3 16 3Zm-2.4 8.4c-.7 0-1.3-.6-1.3-1.4s.6-1.4 1.3-1.4 1.3.6 1.3 1.4-.6 1.4-1.3 1.4Zm4.8 0c-.7 0-1.3-.6-1.3-1.4s.6-1.4 1.3-1.4 1.3.6 1.3 1.4-.6 1.4-1.3 1.4Z"/></svg>`,
    x: `<svg viewBox="0 0 32 32" focusable="false"><path d="M4 5h6.3l6.1 8.1L23.5 5H28l-9.5 10.9L28.8 29h-6.3l-6.7-8.8L8.1 29H3.6l10.1-11.6L4 5Zm4.1 2.7 15.7 18.6h1L9.2 7.7H8.1Z"/></svg>`,
    bilibili: `<svg viewBox="0 0 32 32" focusable="false"><path d="M10.2 4.2 14 8h4l3.8-3.8 2 2L21.9 8H23c3.3 0 6 2.7 6 6v8c0 3.3-2.7 6-6 6H9c-3.3 0-6-2.7-6-6v-8c0-3.3 2.7-6 6-6h1.1L8.2 6.2l2-2ZM9 11c-1.7 0-3 1.3-3 3v8c0 1.7 1.3 3 3 3h14c1.7 0 3-1.3 3-3v-8c0-1.7-1.3-3-3-3H9Zm2.8 5.2h2.4v4.6h-2.4v-4.6Zm6 0h2.4v4.6h-2.4v-4.6Z"/></svg>`,
    facebook: `<svg viewBox="0 0 32 32" focusable="false"><path d="M18.7 29V17.6h3.8l.6-4.5h-4.4v-2.8c0-1.3.4-2.2 2.2-2.2h2.4v-4c-.4-.1-1.9-.2-3.5-.2-3.5 0-5.9 2.1-5.9 6v3.3h-4v4.5h4V29h4.8Z"/></svg>`,
    instagram: `<svg viewBox="0 0 32 32" focusable="false"><path d="M10.2 4h11.6C25.2 4 28 6.8 28 10.2v11.6c0 3.4-2.8 6.2-6.2 6.2H10.2C6.8 28 4 25.2 4 21.8V10.2C4 6.8 6.8 4 10.2 4Zm0 3A3.2 3.2 0 0 0 7 10.2v11.6a3.2 3.2 0 0 0 3.2 3.2h11.6a3.2 3.2 0 0 0 3.2-3.2V10.2A3.2 3.2 0 0 0 21.8 7H10.2ZM16 11a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm6-3.8a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4Z"/></svg>`,
  };
  return icons[name] || "";
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

async function saveSharePoster(item, qrUrl, modal) {
  const status = modal?.querySelector("[data-share-status]");
  if (status) status.textContent = "正在生成海报...";
  const titleLines = wrapText(item.title, 18).slice(0, 3);
  const descLines = wrapText(item.description, 26).slice(0, 3);
  const fontFace = await getPosterFontFace();
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="760" height="960" viewBox="0 0 760 960">
  <defs>
    <style>
      ${fontFace}
      .poster-display { font-family: "IdeaFonts XiangSuZhiCheng", "Microsoft YaHei", sans-serif; font-weight: 100; }
      .poster-ui { font-family: "Microsoft YaHei UI", "Microsoft YaHei", sans-serif; }
    </style>
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
  <text class="poster-display" x="112" y="126" text-anchor="middle" font-size="34" fill="#fff4d7">${escapeXml(item.type.slice(0, 2))}</text>
  <rect x="516" y="78" width="156" height="56" fill="#d9f0e2" stroke="#201827" stroke-width="5"/>
  <text class="poster-display" x="594" y="115" text-anchor="middle" font-size="24" fill="#2f644b">${escapeXml(item.date || "Pixel Lab")}</text>
  ${titleLines.map((line, index) => `<text class="poster-display" x="64" y="${300 + index * 50}" font-size="40" fill="#201827">${escapeXml(line)}</text>`).join("")}
  <rect x="64" y="462" width="7" height="92" fill="#f4b84b"/>
  ${descLines.map((line, index) => `<text class="poster-ui" x="92" y="${500 + index * 36}" font-size="26" fill="#5d5765">${escapeXml(line)}</text>`).join("")}
  <line x1="64" y1="650" x2="696" y2="650" stroke="#201827" stroke-opacity="0.18" stroke-width="4"/>
  <rect x="64" y="704" width="92" height="92" fill="#4f3b78" stroke="#201827" stroke-width="5"/>
  <text class="poster-display" x="110" y="764" text-anchor="middle" font-size="42" fill="#fff4d7">A</text>
  <text class="poster-ui" x="184" y="724" font-size="22" fill="#2f644b">作者</text>
  <text class="poster-display" x="184" y="762" font-size="34" fill="#201827">Mr.ATG</text>
  <text class="poster-ui" x="184" y="798" font-size="26" fill="#2f644b">Pixel Lab</text>
  <rect x="520" y="690" width="166" height="166" fill="#fff4d7" stroke="#201827" stroke-width="5"/>
  <image x="532" y="702" width="142" height="142" href="${escapeXml(qrUrl)}"/>
  <rect x="640" y="824" width="96" height="96" fill="url(#pixel)" opacity="0.55" transform="rotate(12 688 872)"/>
  <text class="poster-ui" x="64" y="900" font-size="18" fill="#6f6876">${escapeXml(item.href)}</text>
</svg>`;
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${slugForFile(item.title)}-poster.svg`;
  link.click();
  URL.revokeObjectURL(url);
  if (status) status.textContent = "海报已生成。";
}

async function getPosterFontFace() {
  try {
    const response = await fetch("/fonts/IdeaFonts-XiangSuZhiCheng.woff2");
    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return `@font-face { font-family: "IdeaFonts XiangSuZhiCheng"; src: url("data:font/woff2;base64,${btoa(binary)}") format("woff2"); font-weight: 100; font-style: normal; }`;
  } catch {
    return "";
  }
}

function createQrMatrix(value) {
  const version = 5;
  const size = 17 + version * 4;
  const matrix = Array.from({ length: size }, () => Array(size).fill(false));
  const reserved = Array.from({ length: size }, () => Array(size).fill(false));
  const setModule = (x, y, dark, reserve = true) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    matrix[y][x] = Boolean(dark);
    if (reserve) reserved[y][x] = true;
  };
  const drawFinder = (x, y) => {
    for (let dy = -1; dy <= 7; dy += 1) {
      for (let dx = -1; dx <= 7; dx += 1) {
        const xx = x + dx;
        const yy = y + dy;
        const isFinder = dx >= 0 && dx <= 6 && dy >= 0 && dy <= 6 && (dx === 0 || dx === 6 || dy === 0 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4));
        setModule(xx, yy, isFinder);
      }
    }
  };
  drawFinder(0, 0);
  drawFinder(size - 7, 0);
  drawFinder(0, size - 7);
  for (let index = 8; index < size - 8; index += 1) {
    setModule(index, 6, index % 2 === 0);
    setModule(6, index, index % 2 === 0);
  }
  drawAlignment(matrix, reserved, 30, 30);
  setModule(8, 4 * version + 9, true);
  reserveFormatAreas(reserved, size);

  const data = createQrDataCodewords(value, 108);
  const ecc = createReedSolomonRemainder(data, 26);
  const bits = [...data, ...ecc].flatMap((byte) => Array.from({ length: 8 }, (_, index) => ((byte >> (7 - index)) & 1) === 1));
  let bitIndex = 0;
  let upward = true;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right -= 1;
    for (let vertical = 0; vertical < size; vertical += 1) {
      const y = upward ? size - 1 - vertical : vertical;
      for (let col = 0; col < 2; col += 1) {
        const x = right - col;
        if (reserved[y][x]) continue;
        const bit = bitIndex < bits.length ? bits[bitIndex] : false;
        bitIndex += 1;
        matrix[y][x] = bit !== ((x + y) % 2 === 0);
      }
    }
    upward = !upward;
  }
  drawFormatBits(matrix, 0x77c4);
  return matrix;
}

function drawAlignment(matrix, reserved, centerX, centerY) {
  for (let dy = -2; dy <= 2; dy += 1) {
    for (let dx = -2; dx <= 2; dx += 1) {
      const distance = Math.max(Math.abs(dx), Math.abs(dy));
      const x = centerX + dx;
      const y = centerY + dy;
      matrix[y][x] = distance !== 1;
      reserved[y][x] = true;
    }
  }
}

function reserveFormatAreas(reserved, size) {
  for (let index = 0; index < 9; index += 1) {
    if (index !== 6) {
      reserved[8][index] = true;
      reserved[index][8] = true;
    }
  }
  for (let index = 0; index < 8; index += 1) {
    reserved[8][size - 1 - index] = true;
    reserved[size - 1 - index][8] = true;
  }
}

function drawFormatBits(matrix, bits) {
  const size = matrix.length;
  const bit = (index) => ((bits >> index) & 1) === 1;
  for (let index = 0; index <= 5; index += 1) matrix[index][8] = bit(index);
  matrix[7][8] = bit(6);
  matrix[8][8] = bit(7);
  matrix[8][7] = bit(8);
  for (let index = 9; index < 15; index += 1) matrix[8][14 - index] = bit(index);
  for (let index = 0; index < 8; index += 1) matrix[8][size - 1 - index] = bit(index);
  for (let index = 8; index < 15; index += 1) matrix[size - 15 + index][8] = bit(index);
}

function createQrDataCodewords(value, capacity) {
  const bytes = Array.from(new TextEncoder().encode(value));
  const bitBuffer = [0, 1, 0, 0];
  appendBits(bitBuffer, bytes.length, 8);
  bytes.forEach((byte) => appendBits(bitBuffer, byte, 8));
  const maxBits = capacity * 8;
  appendBits(bitBuffer, 0, Math.min(4, maxBits - bitBuffer.length));
  while (bitBuffer.length % 8) bitBuffer.push(0);
  const codewords = [];
  for (let index = 0; index < bitBuffer.length; index += 8) {
    codewords.push(parseInt(bitBuffer.slice(index, index + 8).join(""), 2));
  }
  for (let pad = 0; codewords.length < capacity; pad += 1) {
    codewords.push(pad % 2 === 0 ? 0xec : 0x11);
  }
  return codewords.slice(0, capacity);
}

function appendBits(buffer, value, length) {
  for (let index = length - 1; index >= 0; index -= 1) {
    buffer.push((value >> index) & 1);
  }
}

function createReedSolomonRemainder(data, degree) {
  const generator = createRsGenerator(degree);
  const result = Array(degree).fill(0);
  data.forEach((byte) => {
    const factor = byte ^ result.shift();
    result.push(0);
    generator.forEach((coefficient, index) => {
      result[index] ^= gfMultiply(coefficient, factor);
    });
  });
  return result;
}

function createRsGenerator(degree) {
  let result = [1];
  for (let index = 0; index < degree; index += 1) {
    const next = Array(result.length + 1).fill(0);
    const factor = gfPow(2, index);
    result.forEach((coefficient, coefficientIndex) => {
      next[coefficientIndex] ^= coefficient;
      next[coefficientIndex + 1] ^= gfMultiply(coefficient, factor);
    });
    result = next;
  }
  return result.slice(1);
}

function gfPow(value, power) {
  let result = 1;
  for (let index = 0; index < power; index += 1) {
    result = gfMultiply(result, value);
  }
  return result;
}

function gfMultiply(a, b) {
  let result = 0;
  for (let index = 0; index < 8; index += 1) {
    if ((b & 1) !== 0) result ^= a;
    const carry = (a & 0x80) !== 0;
    a = (a << 1) & 0xff;
    if (carry) a ^= 0x1d;
    b >>= 1;
  }
  return result;
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
