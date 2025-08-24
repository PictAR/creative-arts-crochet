/* main.js — CAC
   - Mobile nav toggle with ARIA + focus trap
   - Smooth-scroll for in-page anchors (ignores modals & data-no-scroll)
   - Testimonial modal (full review)
   - Etsy carousel (static data for now)
   - Reviews rotator (JSON with fallback)
   - Gallery lightbox (no hash changes; keyboard + arrows)
*/
(() => {
  const header = document.querySelector(".header");
  const nav = document.querySelector(".main-nav");
  const btn = document.querySelector(".btn-mobile-nav");
  if (header && nav && btn) {
    if (!nav.id) nav.id = "primary-navigation";
    btn.setAttribute("aria-controls", nav.id);
    btn.setAttribute("aria-expanded", "false");

    let isOpen = false, lastFocused = null;
    const focusableSelector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"]), select, input, textarea';
    const getFocusable = () => nav.querySelectorAll(focusableSelector);

    const openNav = () => {
      if (isOpen) return;
      isOpen = true; lastFocused = document.activeElement;
      header.classList.add("nav-open");
      btn.setAttribute("aria-expanded", "true");
      const f = getFocusable(); if (f.length) f[0].focus();
      document.addEventListener("keydown", onKeydown);
      document.addEventListener("click", onDocClick, true);
    };
    const closeNav = () => {
      if (!isOpen) return;
      isOpen = false;
      header.classList.remove("nav-open");
      btn.setAttribute("aria-expanded", "false");
      document.removeEventListener("keydown", onKeydown);
      document.removeEventListener("click", onDocClick, true);
      lastFocused?.focus?.();
    };
    const onKeydown = (e) => {
      if (e.key === "Escape") return closeNav();
      if (e.key === "Tab" && isOpen) {
        const f = Array.from(getFocusable()); if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    const onDocClick = (e) => {
      if (!isOpen) return;
      if (nav.contains(e.target) || btn.contains(e.target)) return;
      closeNav();
    };
    btn.addEventListener("click", () => (isOpen ? closeNav() : openNav()));
    nav.addEventListener("click", (e) => {
      const link = e.target.closest(".main-nav-link");
      if (link && isOpen) closeNav();
    }, true);

    const mq = window.matchMedia("(min-width: 64em)");
    const handleMQ = () => { if (mq.matches) { isOpen = false; header.classList.remove("nav-open"); btn.setAttribute("aria-expanded","false"); } };
    (mq.addEventListener || mq.addListener).call(mq, "change", handleMQ); handleMQ();
  }
})();

// Smooth scroll (ignore clicks inside modals and links with data-no-scroll)
(() => {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.addEventListener("click", (e) => {
    if (e.target.closest(".modal")) return; // don't interfere with modals
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const href = a.getAttribute("href");
    if (!href || href === "#" || a.hasAttribute("data-no-scroll")) return;
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "start" });
  });
})();

// --- Full review modal ---
(() => {
  const modal = document.getElementById("review-modal");
  const contentEl = document.getElementById("review-modal-content");
  if (!modal || !contentEl) return;
  let lastFocused = null;

  const open = (html) => {
    lastFocused = document.activeElement;
    contentEl.innerHTML = html;
    modal.hidden = false;
    document.documentElement.classList.add("has-modal");
    modal.querySelector(".modal__close")?.focus();
    document.addEventListener("keydown", onKey);
  };
  const close = () => {
    modal.hidden = true; contentEl.innerHTML = "";
    document.documentElement.classList.remove("has-modal");
    document.removeEventListener("keydown", onKey);
    lastFocused?.focus?.();
  };
  const onKey = (e) => { if (e.key === "Escape") close(); };

  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".review-more");
    if (!btn) return;
    const card = btn.closest(".testimonial");
    const quote = card?.querySelector(".testimonial-text");
    const author = card?.querySelector(".testimonial-name")?.textContent?.trim() ?? "";
    if (!quote) return;
    open(`<blockquote>${quote.textContent}</blockquote><p class="testimonial-name">${author}</p>`);
  });
  modal.addEventListener("click", (e) => {
    if (e.target.matches("[data-close-modal]") || e.target.closest("[data-close-modal]")) close();
  });
})();

// --- Etsy carousel (static data) ---
(() => {
  const root = document.getElementById("etsyCarousel");
  if (!root) return;
  const listings = [
    { title: "Cozy Cardigan",  price: "CAD 8.50",  url: "https://www.etsy.com/ca/shop/CreativeArtsCrochet", image: "resources/img/testimonial-01.png" },
    { title: "Drapey Shawl",    price: "CAD 6.75",  url: "https://www.etsy.com/ca/shop/CreativeArtsCrochet", image: "resources/img/testimonial-02.png" },
    { title: "Weekend Beanie",  price: "CAD 5.25",  url: "https://www.etsy.com/ca/shop/CreativeArtsCrochet", image: "resources/img/testimonial-03.png" },
    { title: "Textured Cowl",   price: "CAD 5.25",  url: "https://www.etsy.com/ca/shop/CreativeArtsCrochet", image: "resources/img/testimonial-04.png" },
    { title: "Everyday Mitts",  price: "CAD 4.95",  url: "https://www.etsy.com/ca/shop/CreativeArtsCrochet", image: "resources/img/testimonial-05.png" },
  ];
  root.innerHTML = listings.map(l => `
    <article class="etsy-card">
      <img src="${l.image}" alt="${l.title}">
      <h3>${l.title}</h3>
      <p>${l.price}</p>
      <a href="${l.url}" target="_blank" rel="noopener" data-no-scroll>View on Etsy</a>
    </article>
  `).join("");

  const wrap = root.closest(".etsy-wrap");
  const prev = wrap?.querySelector(".etsy-prev");
  const next = wrap?.querySelector(".etsy-next");
  const step = () => Math.min(root.clientWidth * 0.9, 600);
  prev?.addEventListener("click", () => root.scrollBy({ left: -step(), behavior: "smooth" }));
  next?.addEventListener("click", () => root.scrollBy({ left:  step(), behavior: "smooth" }));
})();

// --- Etsy reviews rotator (JSON-powered with fallback) ---
(() => {
  const grid = document.getElementById("testimonialsGrid");
  if (!grid) return;

  const CARD = (r) => `
    <figure class="testimonial">
      <img src="${r.avatar}" class="testimonial-img" alt="${r.author}">
      <blockquote class="testimonial-text">“${(r.text || "").replace(/"/g, "&quot;")}”</blockquote>
      <p class="testimonial-name">&mdash; ${r.author}</p>
      <button class="review-more" type="button">Read full review</button>
    </figure>
  `;

  const FALLBACK = [
    { author: "Sally M.",  avatar: "resources/img/cust/1.png", rating: 5, text: "Pattern was crystal clear and the fit is chef’s kiss.", date: "2025-07-12" },
    { author: "Hannah B.", avatar: "resources/img/cust/2.png", rating: 5, text: "Loved the step-by-step photos. Finished in a weekend.", date: "2025-06-02" },
    { author: "Polly W.",  avatar: "resources/img/cust/3.png", rating: 4, text: "Fun, modern, wearable. Minimal frogging.", date: "2025-05-21" },
    { author: "Mary S.",   avatar: "resources/img/cust/4.png", rating: 5, text: "Sizing was spot on; notes saved time. Recommend!", date: "2025-05-03" }
  ];

  let data = [], start = 0;
  const VISIBLE = 4, INTERVAL_MS = 8000;

  const render = () => {
    if (!data.length) return;
    const slice = [];
    for (let i = 0; i < Math.min(VISIBLE, data.length); i++) {
      slice.push(data[(start + i) % data.length]);
    }
    grid.innerHTML = slice.map(CARD).join("");
    grid.classList.remove("testimonials-fade"); void grid.offsetWidth; grid.classList.add("testimonials-fade");
    start = (start + VISIBLE) % data.length;
  };

  const use = (arr) => {
    data = (arr || []).slice().sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    if (!data.length) data = FALLBACK;
    render();
    if (data.length > VISIBLE) setInterval(render, INTERVAL_MS);
  };

  fetch("resources/data/reviews.json", { cache: "no-store" })
    .then(r => (r.ok ? r.json() : FALLBACK))
    .then(use)
    .catch(() => use(FALLBACK));
})();

// --- Gallery Lightbox (no hash, no anchor scroll) ---
(() => {
  const modal = document.getElementById("gallery-modal");
  if (!modal) return;

  const imgs = Array.from(document.querySelectorAll(".gallery .gallery-item img"));
  if (!imgs.length) return;

  const imgEl = document.getElementById("lightbox-image");
  const captionEl = document.getElementById("lightbox-title");
  const prevBtn = modal.querySelector(".lightbox-nav.prev");
  const nextBtn = modal.querySelector(".lightbox-nav.next");
  let idx = 0, lastFocused = null;

  const render = () => {
    const el = imgs[idx];
    const src = el.getAttribute("data-large") || el.currentSrc || el.src;
    const alt = el.getAttribute("alt") || "Gallery image";
    imgEl.src = src; imgEl.alt = alt; captionEl.textContent = alt;
  };

  const open = (i) => {
    idx = i; lastFocused = document.activeElement;
    render();
    modal.hidden = false;
    document.documentElement.classList.add("has-modal");
    nextBtn?.focus();
    document.addEventListener("keydown", onKey);
  };

  const close = () => {
    modal.hidden = true;
    document.documentElement.classList.remove("has-modal");
    document.removeEventListener("keydown", onKey);
    lastFocused?.focus?.();
  };

  const onKey = (e) => {
    if (e.key === "Escape") return close();
    if (e.key === "ArrowRight") { idx = (idx + 1) % imgs.length; return render(); }
    if (e.key === "ArrowLeft")  { idx = (idx - 1 + imgs.length) % imgs.length; return render(); }
  };

  imgs.forEach((el, i) => {
    el.tabIndex = 0;
    el.addEventListener("click", (ev) => { ev.preventDefault(); open(i); });
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(i); }
    });
  });

  prevBtn?.addEventListener("click", () => { idx = (idx - 1 + imgs.length) % imgs.length; render(); });
  nextBtn?.addEventListener("click", () => { idx = (idx + 1) % imgs.length; render(); });
  modal.addEventListener("click", (e) => {
    if (e.target.matches("[data-close-modal]")) close();
  });
})();
