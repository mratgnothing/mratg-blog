(() => {
  'use strict';
  document.documentElement.classList.add('js');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const header = document.querySelector('.global-header');
  const menuToggle = document.getElementById('menu-toggle');
  const closeMenu = () => { header.classList.remove('menu-open'); menuToggle.setAttribute('aria-expanded', 'false'); menuToggle.setAttribute('aria-label', '打开导航菜单'); };
  menuToggle.addEventListener('click', () => {
    const open = header.classList.toggle('menu-open');
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? '关闭导航菜单' : '打开导航菜单');
  });
  document.querySelectorAll('.nav-links a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
  window.matchMedia('(min-width: 601px)').addEventListener('change', closeMenu);

  const revealElements = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } });
    }, { threshold: 0.08, rootMargin: '0px 0px -18px 0px' });
    revealElements.forEach(element => observer.observe(element));
  } else revealElements.forEach(element => element.classList.add('is-visible'));

  const parallax = [...document.querySelectorAll('[data-parallax]')];
  let scheduled = false;
  const updateParallax = () => {
    scheduled = false;
    parallax.forEach(element => {
      if (reducedMotion.matches) { element.style.removeProperty('transform'); return; }
      const bounds = element.getBoundingClientRect();
      if (bounds.bottom > 0 && bounds.top < window.innerHeight) {
        const offset = Math.max(-22, Math.min(22, (window.innerHeight / 2 - (bounds.top + bounds.height / 2)) * Number(element.dataset.parallax)));
        element.style.transform = `translate3d(0,${offset}px,0)`;
      }
    });
  };
  window.addEventListener('scroll', () => { if (!scheduled) { scheduled = true; requestAnimationFrame(updateParallax); } }, { passive: true });
  reducedMotion.addEventListener('change', updateParallax);

  const products = {
    iphone: { name: 'iPhone 18 Pro', tagline: '细节之中，自有不凡。', image: 'phone-hero.webp', description: '深酒红的色彩与细腻的金属轮廓，在明暗之间显现层次。让镜头、弧线与边缘，都成为目光停留的理由。', details: [['深邃色彩', '酒红色与冷色轮廓光相映。'], ['纯粹轮廓', '舒展的弧线，克制的边缘。'], ['镜头之美', '在秩序中，呈现细节。']] },
    mac: { name: 'MacBook Air', tagline: '轻盈之间，灵感无限。', image: 'laptop.webp', light: true, description: '舒展的屏幕，纤薄的轮廓。银色机身与流动的蓝色光影相遇，让工作与灵感，拥有一片干净的空间。', details: [['轻盈姿态', '以侧面轮廓表达轻薄感。'], ['银色质感', '柔和光线中的金属肌理。'], ['灵感流动', '屏幕里，自有开阔天地。']] },
    airpods: { name: 'AirPods Pro', tagline: '让世界静下来。', image: 'earbuds.webp', description: '纯白曲面，悬浮于静谧光影之中。让复杂的世界暂时退后，让注意力回到自己的节奏。', details: [['纯白曲面', '柔和而流畅的设计语言。'], ['精致细节', '细看，也有值得发现之处。'], ['静谧光影', '黑与白，构成纯粹的画面。']] }
  };
  const productDialog = document.getElementById('product-dialog');
  const searchDialog = document.getElementById('search-dialog');
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && (productDialog.open || searchDialog.open)) {
      event.preventDefault();
      if (productDialog.open) productDialog.close();
      if (searchDialog.open) searchDialog.close();
    }
  });
  const lock = () => document.body.classList.add('body-locked');
  const unlock = () => { if (!productDialog.open && !searchDialog.open) document.body.classList.remove('body-locked'); };
  const openProduct = key => {
    closeMenu();
    const content = document.getElementById('dialog-content');
    if (key === 'about') {
      content.innerHTML = '<div class="dialog-body"><p class="eyebrow">INDEPENDENT DESIGN CONCEPT</p><h2 id="dialog-title">以简，见不凡。</h2><p>一次关于材质、光影与留白的独立设计探索。用安静的画面，把目光留给产品本身。</p><p style="margin-top:18px">这是风格演示页面。产品图像为 AI 创作的概念视觉，名称与文案不代表官方发布、产品规格或销售承诺。本展与 Apple Inc. 无关联。</p><button class="button primary" data-close-dialog>继续探索</button></div>';
    } else {
      const item = products[key];
      if (!item) return;
      content.innerHTML = `<div class="dialog-picture ${item.light ? 'light-picture' : ''}"><img src="/demo/apple-showcase/assets/${item.image}" alt="${item.name} 概念视觉"></div><div class="dialog-body"><p class="eyebrow">${item.tagline}</p><h2 id="dialog-title">${item.name}</h2><p>${item.description}</p><div class="dialog-detail-list">${item.details.map(([title, text]) => `<div><strong>${title}</strong><span>${text}</span></div>`).join('')}</div><button class="button primary" data-close-dialog>继续探索</button></div>`;
    }
    content.querySelector('[data-close-dialog]').addEventListener('click', () => productDialog.close());
    productDialog.showModal();
    productDialog.scrollTop = 0;
    lock();
  };
  document.querySelectorAll('[data-dialog]').forEach(button => button.addEventListener('click', () => openProduct(button.dataset.dialog)));
  document.getElementById('dialog-close').addEventListener('click', () => productDialog.close());
  [productDialog, searchDialog].forEach(dialog => {
    dialog.addEventListener('close', unlock);
    dialog.addEventListener('click', event => { if (event.target === dialog) { const box = dialog.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close(); } });
  });

  const searchItems = [
    { name: 'iPhone 18 Pro', hint: '光影与金属', target: 'iphone', keywords: '手机 iphone pro 苹果' },
    { name: 'MacBook Air', hint: '轻盈与灵感', target: 'mac', keywords: 'mac laptop 笔记本 电脑' },
    { name: 'AirPods Pro', hint: '纯白与静谧', target: 'airpods', keywords: 'airpods 耳机 音乐' },
    { name: '设计与细节', hint: '发现不凡', target: 'design', keywords: '设计 光影 细节 design' }
  ];
  const searchInput = document.getElementById('search-input');
  const renderSearch = () => {
    const query = searchInput.value.trim().toLowerCase();
    const matches = searchItems.filter(item => `${item.name} ${item.keywords}`.toLowerCase().includes(query));
    const result = document.getElementById('search-results');
    result.replaceChildren();
    if (!matches.length) { const message = document.createElement('p'); message.className = 'no-results'; message.textContent = '暂时没有找到。试试 iPhone、Mac、AirPods 或设计。'; result.append(message); return; }
    matches.forEach(item => {
      const link = document.createElement('a'); link.className = 'search-result'; link.href = `#${item.target}`;
      const name = document.createElement('span'); name.textContent = item.name;
      const hint = document.createElement('small'); hint.textContent = item.hint;
      link.append(name, hint); link.addEventListener('click', () => searchDialog.close()); result.append(link);
    });
  };
  document.getElementById('search-toggle').addEventListener('click', () => { closeMenu(); searchInput.value = ''; renderSearch(); searchDialog.showModal(); lock(); searchInput.focus(); });
  document.getElementById('search-close').addEventListener('click', () => searchDialog.close());
  searchInput.addEventListener('input', renderSearch);
})();
