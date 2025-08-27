/* Creative Arts Crochet — main.js
   - Mobile nav
   - Etsy carousel from resources/data/etsy.json
   - Gallery from resources/data/instagram.json (local images)
   - Lightbox (450×450)
   - Review modal
   - Carousel buttons & wheel scrolling
*/

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initEtsyCarousel();
  initInstagramGallery();
  initLightbox();
  initReviewModal();
  initEtsyScrollButtons();
});

/* Mobile nav (only active <48em due to CSS) */
function initMobileNav() {
  const btn = document.querySelector('.btn-mobile-nav');
  if (!btn) return;
  btn.addEventListener('click', () => document.body.classList.toggle('nav-open'));
  document.querySelectorAll('.main-nav-link').forEach(a =>
    a.addEventListener('click', () => document.body.classList.remove('nav-open'))
  );
}

/* Fetch helper */
async function fetchJSON(path) {
  const r = await fetch(path, { cache: 'no-store' });
  if (!r.ok) throw new Error(`${path} ${r.status}`);
  return r.json();
}

/* Etsy carousel */
async function initEtsyCarousel() {
  const host = document.getElementById('etsy-carousel');
  if (!host) return;
  try {
    const items = await fetchJSON('resources/data/etsy.json');
    const fmt = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' });
    host.innerHTML = items.map(it => `
      <article class="etsy-card">
        <img src="${esc(it.image_url)}" alt="${esc(it.title)}" loading="lazy">
        <h3>${escHTML(it.title)}</h3>
        <p>${fmt.format(Number(it.price || 0))} ${it.currency ? escHTML(it.currency) : ''}</p>
        <a href="${esc(it.url)}" target="_blank" rel="noopener">View on Etsy</a>
      </article>
    `).join('');
  } catch (e) {
    console.warn('Etsy feed failed:', e);
    host.innerHTML = `<p style="text-align:center;color:#666">Etsy items are loading…</p>`;
  }
}

/* Instagram-style gallery (local images via JSON) */
async function initInstagramGallery() {
  const wrap = document.getElementById('ig-gallery');
  if (!wrap) return;
  try {
    const posts = await fetchJSON('resources/data/instagram.json');
    wrap.innerHTML = posts.map(p => `
      <figure class="gallery-item">
        <a href="${esc(p.permalink || '#')}" aria-label="Open on Instagram">
          <img src="${esc(p.image_url)}"
               alt="${esc(p.alt || '')}"
               data-large="${esc(p.image_url)}"
               data-caption='${esc(p.caption || "")}'
               loading="lazy">
        </a>
      </figure>
    `).join('');

    // Intercept clicks to open our lightbox instead of navigating
    wrap.querySelectorAll('.gallery-item a').forEach(a => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const img = a.querySelector('img');
        openLightbox(img.dataset.large || img.src, img.dataset.caption || '');
      });
    });

    refreshLightboxSources();
  } catch (e) {
    console.warn('Instagram feed failed:', e);
    wrap.innerHTML = `<p style="text-align:center;color:#666">Gallery is loading…</p>`;
  }
}

/* Lightbox */
const LIGHTBOX = { modal:null, img:null, cap:null, sources:[], index:-1 };

function initLightbox(){
  ensureLightboxModal();
  refreshLightboxSources();

  document.addEventListener('click', (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;

    if (t.matches('.gallery .gallery-item img')) {
      e.preventDefault();
      const src = t.dataset.large || t.getAttribute('src');
      const cap = t.dataset.caption || t.getAttribute('alt') || '';
      openLightbox(src, cap);
      setCurrentIndexFromSrc(src);
    }
    if (t.matches('.lightbox-nav.next')) { e.preventDefault(); showNext(); }
    if (t.matches('.lightbox-nav.prev')) { e.preventDefault(); showPrev(); }
    if (t.hasAttribute('data-close-modal')) { closeLightbox(); }
  });

  window.addEventListener('keydown', (e) => {
    if (!isLightboxOpen()) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') showNext();
    if (e.key === 'ArrowLeft') showPrev();
  });
}

function ensureLightboxModal(){
  let m = document.getElementById('gallery-modal');
  if (!m){
    m = document.createElement('div');
    m.className = 'modal modal--lightbox';
    m.id = 'gallery-modal';
    m.setAttribute('role','dialog');
    m.setAttribute('aria-modal','true');
    m.setAttribute('hidden','');
    m.innerHTML = `
      <div class="modal__backdrop" data-close-modal></div>
      <figure class="modal__panel modal__panel--wide" role="document">
        <button class="modal__close" type="button" aria-label="Close" data-close-modal>&times;</button>
        <div class="lightbox-stage">
          <img id="lightbox-image" class="lightbox-img" alt="">
        </div>
        <figcaption class="lightbox-caption"></figcaption>
        <button class="lightbox-nav prev" type="button" aria-label="Previous image">‹</button>
        <button class="lightbox-nav next" type="button" aria-label="Next image">›</button>
      </figure>`;
    document.body.appendChild(m);
  }
  LIGHTBOX.modal = m;
  LIGHTBOX.img = m.querySelector('#lightbox-image');
  LIGHTBOX.cap = m.querySelector('.lightbox-caption');
}

function refreshLightboxSources(){
  const imgs = Array.from(document.querySelectorAll('.gallery .gallery-item img'));
  LIGHTBOX.sources = imgs.map(img => ({
    src: img.dataset.large || img.getAttribute('src') || '',
    caption: img.dataset.caption || img.getAttribute('alt') || ''
  }));
}

function setCurrentIndexFromSrc(src){
  const i = LIGHTBOX.sources.findIndex(s => s.src === src);
  LIGHTBOX.index = i >= 0 ? i : -1;
}
function isLightboxOpen(){ return LIGHTBOX.modal && !LIGHTBOX.modal.hasAttribute('hidden'); }
function openLightbox(src, caption){
  ensureLightboxModal();
  LIGHTBOX.img.src = src;
  LIGHTBOX.cap.textContent = caption || '';
  LIGHTBOX.modal.removeAttribute('hidden');
  document.body.style.overflow = 'hidden';
  setCurrentIndexFromSrc(src);
}
function closeLightbox(){
  if (!LIGHTBOX.modal) return;
  LIGHTBOX.modal.setAttribute('hidden','');
  document.body.style.overflow = '';
}
function showNext(){
  if (!LIGHTBOX.sources.length) return;
  LIGHTBOX.index = (LIGHTBOX.index + 1) % LIGHTBOX.sources.length;
  const { src, caption } = LIGHTBOX.sources[LIGHTBOX.index];
  LIGHTBOX.img.src = src; LIGHTBOX.cap.textContent = caption || '';
}
function showPrev(){
  if (!LIGHTBOX.sources.length) return;
  LIGHTBOX.index = (LIGHTBOX.index - 1 + LIGHTBOX.sources.length) % LIGHTBOX.sources.length;
  const { src, caption } = LIGHTBOX.sources[LIGHTBOX.index];
  LIGHTBOX.img.src = src; LIGHTBOX.cap.textContent = caption || '';
}

/* Review modal */
function initReviewModal(){
  const triggers = document.querySelectorAll('.review-more');
  if (!triggers.length) return;

  let modal = document.getElementById('review-modal');
  if (!modal){
    modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'review-modal';
    modal.setAttribute('role','dialog');
    modal.setAttribute('aria-modal','true');
    modal.setAttribute('hidden','');
    modal.innerHTML = `
      <div class="modal__backdrop" data-close-modal></div>
      <div class="modal__panel" role="document">
        <button class="modal__close" type="button" aria-label="Close" data-close-modal>&times;</button>
        <h3 class="modal__title">Full Review</h3>
        <div class="modal__content"></div>
      </div>`;
    document.body.appendChild(modal);
  }
  const content = modal.querySelector('.modal__content');

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.review-more');
    if (!btn) return;
    e.preventDefault();
    const card = btn.closest('.testimonial');
    const txt = card?.querySelector('.testimonial-text')?.textContent?.trim() || '';
    content.textContent = txt || '—';
    modal.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
  });

  document.addEventListener('click', (e) => {
    if (e.target.hasAttribute('data-close-modal')){
      modal.setAttribute('hidden','');
      document.body.style.overflow = '';
    }
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hasAttribute('hidden')){
      modal.setAttribute('hidden','');
      document.body.style.overflow = '';
    }
  });
}

/* Etsy nav buttons + wheel-to-horizontal */
function initEtsyScrollButtons(){
  const track = document.getElementById('etsy-carousel');
  if (!track) return;
  const prev = document.querySelector('.etsy-prev');
  const next = document.querySelector('.etsy-next');
  const step = () => Math.max(track.clientWidth * 0.9, 320);

  prev && prev.addEventListener('click', e => { e.preventDefault(); track.scrollBy({ left:-step(), behavior:'smooth' }); });
  next && next.addEventListener('click', e => { e.preventDefault(); track.scrollBy({ left: step(), behavior:'smooth' }); });

  track.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      track.scrollLeft += e.deltaY;
      e.preventDefault();
    }
  }, { passive:false });
}

/* Utilities */
function esc(s){ return escHTML(String(s||'').trim()); }
function escHTML(str){
  return String(str||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

document.addEventListener('DOMContentLoaded', () => {
  // ...your existing initializers
  initHeaderElevation();
});

function initHeaderElevation(){
  const header = document.querySelector('.header');
  if (!header) return;
  const onScroll = () => {
    header.classList.toggle('header--elevated', window.scrollY > 10);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}
