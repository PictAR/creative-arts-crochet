/* Main JS — CAC */

/* ===== Mobile nav (drawer) ===== */
/* Mobile nav: single source of truth */
(() => {
  const body = document.body;
  const btn  = document.querySelector('.btn-mobile-nav');
  const nav  = document.querySelector('.main-nav');
  if (!btn || !nav) return;

  const setExpanded = (isOpen) => btn.setAttribute('aria-expanded', String(isOpen));

  let scrim = null;
  setExpanded(false);
  const open = () => {
    if (body.classList.contains('nav-open')) return;
    body.classList.add('nav-open');
    setExpanded(true);
    scrim = document.createElement('div');
    scrim.className = 'nav-backdrop';
    document.body.appendChild(scrim);
    scrim.addEventListener('click', close, { once: true });

    // Move focus into the menu for keyboard users
    setTimeout(() => nav.querySelector('a')?.focus(), 0);
  };
  const close = () => {
    body.classList.remove('nav-open');
    setExpanded(false);
    scrim?.remove(); scrim = null;
  };
  const toggle = () => (body.classList.contains('nav-open') ? close() : open());

  btn.addEventListener('click', toggle);

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });

  // In-page links: close first, then smooth scroll
  nav.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const hash = a.getAttribute('href');
      const target = document.querySelector(hash);
      close();
      setTimeout(() => {
        target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (hash && hash !== '#') history.pushState(null, '', hash);
      }, 320); // match your CSS transition ~300ms
    });
  });

  // Ensure closed on desktop
  const mq = matchMedia('(min-width:48em)');
  const sync = e => { if (e.matches) close(); };
  mq.addEventListener ? mq.addEventListener('change', sync) : mq.addListener(sync);
})();

/* ===== Etsy carousel (local JSON) ===== */
async function loadEtsy() {
  const wrap = document.getElementById('etsy-carousel');
  if (!wrap) return;

  const sources = [
    'resources/data/etsy.json',
    'css/data/etsy.json' // fallback if dev path differs
  ];

  let data = null;
  for (const src of sources) {
    try {
      const res = await fetch(src, {cache:'no-store'});
      if (res.ok) { data = await res.json(); break; }
    } catch (_) {}
  }
  if (!data || !Array.isArray(data)) { wrap.innerHTML = ''; return; }

  wrap.innerHTML = data.map(item => `
    <article class="etsy-card">
      <img src="${item.image_url}" alt="${item.title}">
      <h3>${item.title}</h3>
      <p>${item.currency} ${Number(item.price).toFixed(2)}</p>
      <a href="${item.url}" target="_blank" rel="noopener">View on Etsy</a>
    </article>
  `).join('');

  const prev = document.querySelector('.etsy-prev');
  const next = document.querySelector('.etsy-next');
  const by = () => wrap.clientWidth * 0.9;
  prev?.addEventListener('click', () => wrap.scrollBy({left: -by(), behavior:'smooth'}));
  next?.addEventListener('click', () => wrap.scrollBy({left:  by(), behavior:'smooth'}));
}

/* ===== Testimonials: “Read full review” modal ===== */
function initReviewModals() {
  const triggers = document.querySelectorAll('.testimonial .review-more');
  if (!triggers.length) return;

  triggers.forEach(btn => {
    btn.addEventListener('click', () => {
      const fig = btn.closest('.testimonial');
      const title = fig.querySelector('.testimonial-name')?.textContent || 'Review';
      const full = fig.dataset.full || fig.querySelector('.testimonial-text')?.textContent || '';
      openModal({ title, html: `<p>${escapeHtml(full)}</p>` });
    });
  });
}

/* ===== IG Gallery (local JSON) + lightbox ===== */
async function loadInstagram() {
  const grid = document.getElementById('ig-gallery');
  if (!grid) return;

  const sources = [
    'resources/data/instagram.json',
    'css/data/instagram.json'
  ];

  let items = null;
  for (const src of sources) {
    try {
      const res = await fetch(src, {cache:'no-store'});
      if (res.ok) { items = await res.json(); break; }
    } catch (_) {}
  }
  if (!items || !Array.isArray(items)) { grid.innerHTML = ''; return; }

  grid.innerHTML = items.map((item, idx) => `
    <figure class="gallery-item">
      <img 
        src="${item.image_url}" 
        alt="${item.alt || 'Gallery image'}"
        data-caption="${escapeAttr((item.caption || '').trim())}"
        data-link="${escapeAttr(item.permalink || '#')}"
        data-index="${idx}"
        loading="lazy"
      />
    </figure>
  `).join('');

  grid.querySelectorAll('img').forEach(img => {
    img.addEventListener('click', () => {
      const caption = img.dataset.caption || '';
      const link = img.dataset.link && img.dataset.link !== '#'
        ? `\n\nView on Instagram: ${img.dataset.link}` : '';
      openLightbox({ src: img.src, caption: `${caption}${link}` });
    });
  });
}

/* ===== Modal & Lightbox helpers ===== */
function openModal({title='Notice', html=''}) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal__backdrop"></div>
    <div class="modal__panel" role="dialog" aria-modal="true" aria-label="${escapeAttr(title)}">
      <button class="modal__close" aria-label="Close">✕</button>
      <h3 class="modal__title">${title}</h3>
      <div class="modal__content">${html}</div>
    </div>`;
  document.body.appendChild(modal);

  const close = () => modal.remove();
  modal.querySelector('.modal__backdrop').addEventListener('click', close);
  modal.querySelector('.modal__close').addEventListener('click', close);
}

function openLightbox({src, caption=''}) {
  const modal = document.createElement('div');
  modal.className = 'modal modal--lightbox';
  modal.innerHTML = `
    <div class="modal__backdrop"></div>
    <div class="modal__panel" role="dialog" aria-modal="true" aria-label="Gallery image">
      <button class="modal__close" aria-label="Close">✕</button>
      <div class="lightbox-stage">
        <img class="lightbox-img" src="${src}" alt="Gallery image">
      </div>
      <div class="lightbox-caption">${escapeHtml(caption)}</div>
    </div>`;
  document.body.appendChild(modal);

  const close = () => modal.remove();
  modal.querySelector('.modal__backdrop').addEventListener('click', close);
  modal.querySelector('.modal__close').addEventListener('click', close);
}

/* ===== Utils ===== */
function escapeHtml(s){return (s||'').replace(/[&<>"']/g,m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]))}
function escapeAttr(s){return escapeHtml(s).replace(/\n/g,' ')}

/* ===== Init ===== */
document.addEventListener('DOMContentLoaded', () => {
  loadEtsy();
  loadInstagram();
  initReviewModals();

  // Header elevation on slight scroll
  const header = document.querySelector('.header');
  const onScroll = () => header?.classList.toggle('header--elevated', window.scrollY > 6);
  onScroll(); window.addEventListener('scroll', onScroll, {passive:true});
});
