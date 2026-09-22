/* ════════════════════════════════════════════════════════════════════════════
   Aurelia — vanilla JS entrypoint
   Plain ES module, no React/JSON. Three.js loaded via importmap (see index.html).
   ─────────────────────────────────────────────────────────────────────────────
   Sections:
     1. Theme (dark/light)
     2. Static data (menu, gallery, course icons)
     3. Reveal on scroll (IntersectionObserver)
     4. Navbar (scroll class, mobile menu, smooth scroll)
     5. Scroll progress bar
     6. Ambient orbs (parallax + drift)
     7. Gold particles (canvas2d)
     8. Footer year
     9. Reservation form
    10. Gallery (populate + tilt + video hover)
    11. Three.js scenes (hero, reserve intro, menu intro)
    12. Trigger wiring (data-trigger="reserve|menu")
   ════════════════════════════════════════════════════════════════════════════ */

// Three.js is loaded as a global from the <script> tag in index.html,
// so no import is needed. THREE is available as window.THREE.

/* ─────────────────────────────────────────────────────────────────────────── */
/* 1. THEME                                                                  */
/* ─────────────────────────────────────────────────────────────────────────── */
const STORAGE_KEY = 'aurelia-theme';
const BRIGHT_KEY  = 'aurelia-bright-mode';

/* ── Bright mode ────────────────────────────────────────────────────────────── */
// Typing the phrase "bright mode" anywhere on the page flips the entire site
// to a white-on-white theme. Typing it again toggles back. Persisted in
// localStorage so the choice survives reloads.
function isBrightMode() {
  try { return localStorage.getItem(BRIGHT_KEY) === '1'; } catch (_) { return false; }
}
function setBrightMode(on) {
  if (on) document.documentElement.setAttribute('data-mode', 'bright');
  else    document.documentElement.removeAttribute('data-mode');
  try { on ? localStorage.setItem(BRIGHT_KEY, '1') : localStorage.removeItem(BRIGHT_KEY); } catch (_) {}
  // Inject/remove a hard-override <style> tag so the bright-mode rules
  // always win over cached stylesheets and theme-specific selectors.
  let tag = document.getElementById('bright-mode-override');
  if (on) {
    if (!tag) {
      tag = document.createElement('style');
      tag.id = 'bright-mode-override';
      tag.textContent = BRIGHT_OVERRIDE_CSS;
      document.head.appendChild(tag);
    }
  } else if (tag) {
    tag.remove();
  }
}

// Hard-override CSS injected at runtime so we win over any cached
// styles.css rules regardless of source order or specificity.
const BRIGHT_OVERRIDE_CSS = `
  html[data-mode="bright"],
  html[data-mode="bright"] body,
  html[data-mode="bright"] main,
  html[data-mode="bright"] .hero,
  html[data-mode="bright"] header,
  html[data-mode="bright"] nav,
  html[data-mode="bright"] footer,
  html[data-mode="bright"] .navbar,
  html[data-mode="bright"] .section { background: #ffffff !important; background-image: none !important; }
  html[data-mode="bright"] body { background: #ffffff !important; color: #111111 !important; }
  html[data-mode="bright"] #hero-canvas-wrap,
  html[data-mode="bright"] .hero-canvas-wrap,
  html[data-mode="bright"] .canvas-wrap,
  html[data-mode="bright"] .hero-overlay,
  html[data-mode="bright"] .gold-particles,
  html[data-mode="bright"] .ambient-orb,
  html[data-mode="bright"] .ambient-orb-layer { display: none !important; }
  html[data-mode="bright"] .hero { min-height: 540px !important; }
  html[data-mode="bright"] .hero-title { color: #8a6a1f !important; text-shadow: 0 4px 24px rgba(184,147,72,0.18) !important; }
  html[data-mode="bright"] .hero-eyebrow,
  html[data-mode="bright"] .hero-tagline,
  html[data-mode="bright"] .hero-scroll-hint { color: #5a5550 !important; }
  html[data-mode="bright"] .light-ribbon { opacity: 0.35 !important; }
`;
function setupBrightModeTyping() {
  // A small rolling buffer of recent keystrokes. We check it on every input;
  // if the last N characters spell "bright mode" (case-insensitive), toggle.
  let buffer = '';
  const TARGET = 'bright mode';

  const handler = () => {
    if (buffer.endsWith(TARGET)) {
      buffer = '';
      setBrightMode(!isBrightMode());
    } else if (buffer.length > TARGET.length + 4) {
      buffer = buffer.slice(-TARGET.length - 4);
    }
  };

  // Catch typing on every key event. We don't intercept input on form fields
  // (so users can still type into the reservation form normally).
  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input, textarea, select')) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key.length !== 1) return; // ignore arrows, shift, etc.
    buffer += e.key.toLowerCase();
    handler();
  }, { passive: true });
}

function getInitialTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
  } catch (_) {}
  return window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark';
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  try { localStorage.setItem(STORAGE_KEY, theme); } catch (_) {}
}

setTheme(getInitialTheme());

document.getElementById('theme-toggle')?.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  setTheme(current === 'dark' ? 'light' : 'dark');
});

/* ─────────────────────────────────────────────────────────────────────────── */
/* 2. STATIC DATA                                                            */
/* ─────────────────────────────────────────────────────────────────────────── */

// Menu courses — drives the Menu section.
const COURSES = [
  {
    name: 'Starters',
    italian: 'Opening notes',
    items: [
      { name: 'Puglia Burrata',        desc: 'Heirloom tomato, basil oil, aged balsamic.',      price: 22 },
      { name: 'Yellowfin Tartare',     desc: 'Tuna, capers, lemon zest, sourdough crisp.',      price: 26 },
      { name: 'Foie Gras Torchon',     desc: 'Sauternes gelée, toasted brioche, black truffle.', price: 34 },
    ],
  },
  {
    name: 'Pasta',
    italian: 'Firsts',
    items: [
      { name: 'Saffron Risotto',       desc: 'Carnaroli rice, saffron, bone marrow, Parmigiano.', price: 38 },
      { name: 'Truffle Tagliolini',    desc: 'Hand-cut pasta, butter, Pecorino, black truffle.',   price: 44 },
      { name: 'Ricotta Ravioli',       desc: "Sheep's ricotta, brown butter, sage, walnuts.",      price: 36 },
    ],
  },
  {
    name: 'Mains',
    italian: 'Mains',
    items: [
      { name: 'Salt-Crusted Sea Bass', desc: 'Branzino, fennel, lemon, salsa verde.',                       price: 58 },
      { name: 'Barolo Beef Tenderloin', desc: 'Beef tenderloin, Barolo reduction, porcini, polenta.',       price: 72 },
      { name: 'Orange-Glazed Duck',    desc: 'Duck breast, orange glaze, chestnut purée, radicchio.',      price: 54 },
    ],
  },
  {
    name: 'Dessert',
    italian: 'Sweets',
    items: [
      { name: 'House Tiramisu',        desc: 'Mascarpone, espresso, Marsala, Savoiardi.',          price: 18 },
      { name: 'Chocolate Sphere',      desc: 'Dark chocolate sphere, passion fruit, vanilla gelato.', price: 22 },
      { name: 'Panna Cotta',           desc: 'Vanilla bean, wild honey, roasted figs, pistachio.', price: 16 },
    ],
  },
];

// SVG markup for each menu-course icon. Returned as innerHTML strings.
const COURSE_ICON_SVG = {
  Starters: `
    <circle cx="20" cy="20" r="14" fill="none" stroke="#c9a961" stroke-width="0.8"/>
    <circle cx="14" cy="16" r="3" fill="#c43d3d">
      <animate attributeName="r" values="3;3.4;3" dur="2.4s" repeatCount="indefinite"/>
    </circle>
    <circle cx="24" cy="14" r="2" fill="#5a7a3a"/>
    <circle cx="22" cy="24" r="2.5" fill="#f4e9d4"/>
    <line x1="20" y1="20" x2="20" y2="20" stroke="#c9a961" stroke-width="1"/>
  `,
  Pasta: `
    <path d="M 8 26 Q 20 18 32 26" fill="none" stroke="#c9a961" stroke-width="0.8"/>
    <path d="M 10 22 Q 20 16 30 22" fill="none" stroke="#c9a961" stroke-width="0.8"/>
    <path d="M 12 18 Q 20 14 28 18" fill="none" stroke="#c9a961" stroke-width="0.8"/>
    <circle cx="20" cy="20" r="2" fill="#e6b450">
      <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite"/>
    </circle>
  `,
  Mains: `
    <path d="M 8 22 L 32 22 L 28 28 L 12 28 Z" fill="none" stroke="#c9a961" stroke-width="0.8"/>
    <ellipse cx="20" cy="22" rx="12" ry="2" fill="#c43d3d"/>
    <path d="M 16 18 L 20 12 L 24 18" fill="none" stroke="#c9a961" stroke-width="0.8">
      <animate attributeName="d" dur="2.6s" repeatCount="indefinite"
        values="M 16 18 L 20 12 L 24 18;M 16 16 L 20 8 L 24 16;M 16 18 L 20 12 L 24 18"/>
    </path>
    <circle cx="20" cy="6" r="1.5" fill="#ffb84d">
      <animate attributeName="opacity" values="0.6;1;0.6" dur="1.6s" repeatCount="indefinite"/>
    </circle>
  `,
  Dessert: `
    <path d="M 12 26 Q 20 14 28 26 Z" fill="#f4e9d4" stroke="#c9a961" stroke-width="0.8"/>
    <circle cx="16" cy="22" r="0.8" fill="#c43d3d"/>
    <circle cx="22" cy="20" r="0.8" fill="#8a6a3a"/>
    <circle cx="20" cy="25" r="0.8" fill="#c43d3d"/>
    <line x1="20" y1="26" x2="20" y2="32" stroke="#c9a961" stroke-width="0.8"/>
  `,
};

// Gallery images (poster + hover-to-play video).
const GALLERY_IMAGES = [
  { caption: 'The Dining Room',     poster: 'posters/dining.jpg',   video: 'https://assets.mixkit.co/videos/32457/32457-720.mp4' },
  { caption: 'Truffle Pasta',       poster: 'posters/pasta.jpg',    video: 'https://assets.mixkit.co/videos/2432/2432-720.mp4'   },
  { caption: 'The Cellar',          poster: 'posters/cellar.jpg',   video: 'https://assets.mixkit.co/videos/52407/52407-720.mp4' },
  { caption: 'Starters',            poster: 'posters/starters.jpg', video: 'https://assets.mixkit.co/videos/13258/13258-720.mp4' },
  { caption: 'The Pass',            poster: 'posters/pass.jpg',     video: 'https://assets.mixkit.co/videos/15875/15875-720.mp4' },
  { caption: 'Orange-Glazed Duck',  poster: 'posters/duck.jpg',     video: 'https://assets.mixkit.co/videos/3806/3806-720.mp4'   },
];

/* ─────────────────────────────────────────────────────────────────────────── */
/* 3. REVEAL ON SCROLL                                                        */
/* ─────────────────────────────────────────────────────────────────────────── */
function setupReveal() {
  const els = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });
  els.forEach((el) => io.observe(el));
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* 4. NAVBAR                                                                  */
/* ─────────────────────────────────────────────────────────────────────────── */
function setupNavbar() {
  const navbar = document.getElementById('navbar');
  const burger = document.getElementById('navbar-burger');
  const backdrop = document.getElementById('navbar-backdrop');
  const icon = burger?.querySelector('.navbar-burger-icon');

  const setScrolled = () => {
    if (window.scrollY > 60) navbar.classList.add('navbar--scrolled');
    else navbar.classList.remove('navbar--scrolled');
  };
  setScrolled();
  window.addEventListener('scroll', setScrolled, { passive: true });

  const setOpen = (open) => {
    navbar.classList.toggle('navbar--open', open);
    if (icon) icon.classList.toggle('is-open', open);
    if (burger) {
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }
  };

  burger?.addEventListener('click', () => setOpen(!navbar.classList.contains('navbar--open')));
  backdrop?.addEventListener('click', () => setOpen(false));

  // Close on resize past breakpoint (avoid stale open state when rotating)
  window.addEventListener('resize', () => {
    if (window.innerWidth > 900) setOpen(false);
  });

  // Escape closes menu (a11y)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navbar.classList.contains('navbar--open')) setOpen(false);
  });

  // Smooth scroll helpers (used for data-scroll links)
  document.querySelectorAll('[data-scroll]').forEach((el) => {
    el.addEventListener('click', (e) => {
      const id = el.getAttribute('data-scroll');
      if (!id) return;
      e.preventDefault();
      setOpen(false);
      document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' });
    });
  });
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* 5. SCROLL PROGRESS                                                         */
/* ─────────────────────────────────────────────────────────────────────────── */
function setupScrollProgress() {
  const bar = document.getElementById('scroll-progress-bar');
  if (!bar) return;
  const update = () => {
    const doc = document.documentElement;
    const total = doc.scrollHeight - doc.clientHeight;
    const p = total > 0 ? Math.min(1, doc.scrollTop / total) : 0;
    bar.style.transform = `scaleX(${p})`;
  };
  window.addEventListener('scroll', update, { passive: true });
  update();
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* 6. AMBIENT ORBS                                                            */
/* ─────────────────────────────────────────────────────────────────────────── */
function setupAmbientOrbs() {
  const orb1 = document.getElementById('orb-1');
  const orb2 = document.getElementById('orb-2');
  if (!orb1 || !orb2) return;
  const onScroll = () => {
    const y = window.scrollY;
    orb1.style.transform = `translate3d(0, ${y * 0.1}px, 0)`;
    orb2.style.transform = `translate3d(0, ${y * -0.15}px, 0)`;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* 7. GOLD PARTICLES (canvas2d)                                               */
/* ─────────────────────────────────────────────────────────────────────────── */
function setupGoldParticles() {
  const canvas = document.getElementById('gold-particles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const MAX_DPR = 1.5;
  const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
  const density = window.innerWidth < 640 ? 20 : 40;

  const sizeOf = () => ({ w: canvas.offsetWidth, h: canvas.offsetHeight });

  const resize = () => {
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
  };
  resize();
  window.addEventListener('resize', resize);

  const spriteCache = new Map();
  const getSprite = (r) => {
    const key = r.toFixed(2);
    let s = spriteCache.get(key);
    if (s) return s;
    const off = document.createElement('canvas');
    const sz = Math.ceil(r * 12);
    off.width = off.height = sz;
    const octx = off.getContext('2d');
    const grd = octx.createRadialGradient(sz / 2, sz / 2, 0, sz / 2, sz / 2, sz / 2);
    grd.addColorStop(0, 'rgba(255, 220, 150, 0.9)');
    grd.addColorStop(0.4, 'rgba(201, 169, 97, 0.35)');
    grd.addColorStop(1, 'rgba(201, 169, 97, 0)');
    octx.fillStyle = grd;
    octx.fillRect(0, 0, sz, sz);
    spriteCache.set(key, off);
    return off;
  };

  const particles = [];
  for (let i = 0; i < density; i++) {
    const r = Math.random() * 1.6 + 0.4;
    particles.push({
      sprite: getSprite(r),
      r,
      x: Math.random() * canvas.offsetWidth,
      y: Math.random() * canvas.offsetHeight,
      vx: (Math.random() - 0.5) * 0.15,
      vy: -Math.random() * 0.25 - 0.05,
      a: Math.random() * 0.6 + 0.2,
      ph: Math.random() * Math.PI * 2,
      twinkle: Math.random() * 0.02 + 0.005,
    });
  }

  let running = false;
  let raf = 0;
  const draw = (t) => {
    const { w, h } = sizeOf();
    ctx.clearRect(0, 0, w, h);
    for (const p of particles) {
      p.x += p.vx + Math.sin(t * 0.001 + p.ph) * 0.08;
      p.y += p.vy;
      if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
      if (p.x < -10) p.x = w + 10;
      if (p.x > w + 10) p.x = -10;
      const tw = Math.sin(t * 0.003 + p.ph) * p.twinkle;
      ctx.globalAlpha = Math.max(0, Math.min(1, p.a + tw));
      const half = p.sprite.width / 2;
      ctx.drawImage(p.sprite, p.x - half, p.y - half);
    }
    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(draw);
  };

  const start = () => {
    if (running) return;
    running = true;
    canvas.classList.add('is-running');
    raf = requestAnimationFrame(draw);
  };
  const stop = () => {
    if (!running) return;
    running = false;
    canvas.classList.remove('is-running');
    cancelAnimationFrame(raf);
  };

  const io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()), { threshold: 0 });
  io.observe(canvas);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  start();
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* 8. FOOTER YEAR                                                             */
/* ─────────────────────────────────────────────────────────────────────────── */
document.getElementById('footer-year').textContent = new Date().getFullYear();

/* ─────────────────────────────────────────────────────────────────────────── */
/* 9. RESERVATION FORM                                                        */
/* ─────────────────────────────────────────────────────────────────────────── */
function setupReserveForm() {
  const form = document.getElementById('reserve-form');
  if (!form) return;
  const success = document.getElementById('form-success');
  const btnLabel = form.querySelector('.btn-label');
  let submitted = false;
  let resetTimer = 0;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (submitted) return;

    const data = new FormData(form);
    const name = (data.get('name') || '').toString().trim();
    const email = (data.get('email') || '').toString().trim();
    const date = (data.get('date') || '').toString().trim();
    if (!name || !email || !date) return;

    submitted = true;
    btnLabel.textContent = 'Request Received ✓';
    success.textContent = `Thank you, ${name.split(' ')[0]}. A member of our concierge team will be in touch within the hour.`;
    success.hidden = false;

    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => {
      submitted = false;
      btnLabel.textContent = 'Confirm Reservation';
      success.hidden = true;
      form.reset();
    }, 4000);
  });
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* 10. MENU + GALLERY RENDERING                                                */
/* ─────────────────────────────────────────────────────────────────────────── */
function renderMenu() {
  const grid = document.getElementById('menu-grid');
  if (!grid) return;
  grid.innerHTML = COURSES.map((course, idx) => `
    <div class="menu-course" style="transition-delay: ${idx * 100}ms">
      <div class="menu-course-header">
        <div class="menu-course-icon">
          <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            ${COURSE_ICON_SVG[course.name] || ''}
          </svg>
        </div>
        <div class="menu-course-titles">
          <h3>${course.name}</h3>
          <span>${course.italian}</span>
        </div>
      </div>
      <ul class="menu-items">
        ${course.items.map((item) => `
          <li class="menu-item">
            <div class="menu-item-top">
              <h4>${item.name}</h4>
              <span class="menu-item-dots"></span>
              <span class="menu-item-price">$${item.price}</span>
            </div>
            <p>${item.desc}</p>
          </li>
        `).join('')}
      </ul>
    </div>
  `).join('');
}

function renderGallery() {
  const grid = document.getElementById('gallery-grid');
  if (!grid) return;
  grid.innerHTML = GALLERY_IMAGES.map((img, i) => `
    <figure class="gallery-item gallery-item-${i + 1}" data-i="${i}">
      <img src="${img.poster}" alt="${img.caption}" loading="lazy"/>
      <video
        class="gallery-video"
        src="${img.video}"
        muted loop playsInline preload="none"
        poster="${img.poster}"
      ></video>
      <span class="gallery-glint"></span>
      <span class="gallery-play" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="14" height="14">
          <path d="M8 5v14l11-7z" fill="currentColor"/>
        </svg>
      </span>
      <figcaption><span>${img.caption}</span></figcaption>
    </figure>
  `).join('');

  // Tilt + glint + video play on hover
  grid.querySelectorAll('.gallery-item').forEach((fig) => {
    const video = fig.querySelector('video');
    fig.addEventListener('mousemove', (e) => {
      const rect = fig.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      fig.style.setProperty('--rx', `${-y * 6}deg`);
      fig.style.setProperty('--ry', `${x * 6}deg`);
      fig.style.setProperty('--mx', `${(x + 0.5) * 100}%`);
      fig.style.setProperty('--my', `${(y + 0.5) * 100}%`);
    });
    fig.addEventListener('mouseleave', () => {
      fig.style.setProperty('--rx', '0deg');
      fig.style.setProperty('--ry', '0deg');
      fig.classList.remove('is-hovering');
      if (video) {
        video.pause();
        try { video.currentTime = 0; } catch (_) {}
      }
    });
    fig.addEventListener('mouseenter', () => {
      fig.classList.add('is-hovering');
      if (video) {
        const p = video.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      }
    });
  });
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* 11. THREE.JS SCENES                                                        */
/* ─────────────────────────────────────────────────────────────────────────── */

/* ── Shared geometry helpers ───────────────────────────────────────────────── */
function makeStandardBox(w, h, d, color, opts = {}) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color, ...opts })
  );
  return m;
}
function makeStandardCylinder(rt, rb, h, segs, color, opts = {}) {
  return new THREE.Mesh(
    new THREE.CylinderGeometry(rt, rb, h, segs),
    new THREE.MeshStandardMaterial({ color, ...opts })
  );
}
function makeStandardSphere(r, ws, hs, color, opts = {}) {
  return new THREE.Mesh(
    new THREE.SphereGeometry(r, ws, hs),
    new THREE.MeshStandardMaterial({ color, ...opts })
  );
}

// Place an object at a position. Object3D.position is a Vector3 reference, so
// `obj.position = new Vector3(...)` throws. Use .set() / .copy() instead.
function placeAt(obj, x, y, z) {
  obj.position.set(x, y, z);
  return obj;
}

/* ── Embers (custom shader particles) ─────────────────────────────────────── */
function createEmbers(count = 35) {
  const positions = new Float32Array(count * 3);
  const speeds = new Float32Array(count);
  const phases = new Float32Array(count);
  const sizes = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    positions[i * 3 + 0] = (Math.random() - 0.5) * 16;
    positions[i * 3 + 1] = Math.random() * 6;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 12;
    speeds[i]  = 0.5 + Math.random() * 1.0;
    phases[i]  = Math.random() * Math.PI * 2;
    sizes[i]   = 1.5 + Math.random() * 2.5;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aSpeed',   new THREE.BufferAttribute(speeds, 1));
  geometry.setAttribute('aPhase',   new THREE.BufferAttribute(phases, 1));
  geometry.setAttribute('aSize',    new THREE.BufferAttribute(sizes, 1));

  const uniforms = { uTime: { value: 0 } };

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `
      uniform float uTime;
      attribute float aSpeed;
      attribute float aPhase;
      attribute float aSize;
      varying float vAlpha;
      void main() {
        vec3 p = position;
        float y = p.y + uTime * aSpeed * 0.35;
        p.y = mod(y + 0.5, 7.5) - 0.5;
        p.x += sin(uTime * 0.5 + aPhase) * 0.18;
        p.z += cos(uTime * 0.4 + aPhase) * 0.14;
        vAlpha = 0.6 + 0.4 * sin(uTime * 0.7 + aPhase);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = aSize * (300.0 / -mv.z);
      }
    `,
    fragmentShader: /* glsl */ `
      varying float vAlpha;
      void main() {
        vec2 uv = gl_PointCoord - vec2(0.5);
        float d = length(uv);
        float a = smoothstep(0.5, 0.0, d) * vAlpha;
        gl_FragColor = vec4(1.0, 0.78, 0.45, a);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  return { points: new THREE.Points(geometry, material), material };
}

/* ── Dust motes (shader particles, slow rotation) ─────────────────────────── */
function createDustMotes(count = 70) {
  const positions = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    positions[i * 3 + 0] = (Math.random() - 0.5) * 18;
    positions[i * 3 + 1] = Math.random() * 5;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 14;
    phases[i] = Math.random() * Math.PI * 2;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aPhase',   new THREE.BufferAttribute(phases, 1));

  const uniforms = {
    uTime: { value: 0 },
    uRot:  { value: new THREE.Vector2(1, 0) },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `
      uniform float uTime;
      uniform vec2 uRot;
      attribute float aPhase;
      varying float vAlpha;
      void main() {
        vec3 p = position;
        p.y += sin(uTime * 0.3 + aPhase) * 0.25;
        p.xz = mat2(uRot.x, -uRot.y, uRot.y, uRot.x) * p.xz;
        vAlpha = 0.45 + 0.25 * sin(uTime * 0.6 + aPhase);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = 2.0 * (300.0 / -mv.z);
      }
    `,
    fragmentShader: /* glsl */ `
      varying float vAlpha;
      void main() {
        vec2 uv = gl_PointCoord - vec2(0.5);
        float d = length(uv);
        float a = smoothstep(0.5, 0.0, d) * vAlpha;
        gl_FragColor = vec4(0.94, 0.88, 0.75, a * 0.55);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  return { points: new THREE.Points(geometry, material), material };
}

/* ── Soft sprite texture helper (cached) ──────────────────────────────────── */
const spriteCache = new Map();
function makeSoftSprite({ size = 64, stops }) {
  const key = `${size}|${stops.map((s) => `${s[0]}:${s[1]}`).join(';')}`;
  let tex = spriteCache.get(key);
  if (tex) return tex;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const half = size / 2;
  const grad = ctx.createRadialGradient(half, half, 0, half, half, half);
  for (const [offset, color] of stops) grad.addColorStop(offset, color);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  spriteCache.set(key, tex);
  return tex;
}

/* ── Smoke wisp (used by candle and door) ─────────────────────────────────── */
function createSmokeWisp({ position = [0, 0, 0], scale = 1 } = {}) {
  const sprite = makeSoftSprite({
    size: 128,
    stops: [
      [0, 'rgba(200, 180, 150, 0.5)'],
      [0.4, 'rgba(160, 140, 110, 0.18)'],
      [1, 'rgba(160, 140, 110, 0)'],
    ],
  });
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.7, 1),
    new THREE.MeshBasicMaterial({
      map: sprite, transparent: true, depthWrite: false, opacity: 0.55,
      blending: THREE.NormalBlending,
    })
  );
  mesh.position.set(...position);
  mesh.userData.isSmoke = true;
  mesh.userData.basePosition = position.slice();
  mesh.userData.scale = scale;
  return mesh;
}

/* ── Chair ─────────────────────────────────────────────────────────────────── */
function createChair() {
  const g = new THREE.Group();
  g.add(placeAt(makeStandardBox(0.5, 0.08, 0.5, '#3a1f1a', { roughness: 0.85 }), 0, 0.45, 0));
  g.add(makeStandardBox(0.52, 0.06, 0.52, '#2a1810', { roughness: 0.6 })).position.set(0, 0.38, 0);
  g.add(makeStandardBox(0.5, 0.8, 0.06, '#2a1810', { roughness: 0.6 })).position.set(0, 0.85, -0.22);
  g.add(makeStandardBox(0.42, 0.5, 0.05, '#3a1f1a', { roughness: 0.85 })).position.set(0, 0.78, -0.18);
  [[-0.22, 0.19, -0.22], [0.22, 0.19, -0.22], [-0.22, 0.19, 0.22], [0.22, 0.19, 0.22]].forEach((p) => {
    g.add(makeStandardCylinder(0.025, 0.025, 0.38, 6, '#1a0e08', { roughness: 0.7 })).position.set(...p);
  });
  return g;
}

/* ── Candle ────────────────────────────────────────────────────────────────── */
function createCandle() {
  const g = new THREE.Group();

  const base = makeStandardCylinder(0.09, 0.11, 0.08, 16, '#c9a961', { metalness: 0.9, roughness: 0.25 });
  base.position.y = 0.04; base.castShadow = true;
  g.add(base);

  const plate = makeStandardCylinder(0.12, 0.12, 0.01, 16, '#8a7340', { metalness: 0.7, roughness: 0.4 });
  plate.position.y = 0.005;
  g.add(plate);

  const wax = makeStandardCylinder(0.055, 0.06, 0.24, 16, '#f5e9d3', { roughness: 0.6 });
  wax.position.y = 0.18; wax.castShadow = true;
  g.add(wax);

  const wick = makeStandardCylinder(0.005, 0.005, 0.04, 6, '#1a0e08');
  wick.position.y = 0.31;
  g.add(wick);

  const flameGroup = new THREE.Group();
  flameGroup.position.y = 0.36;
  g.add(flameGroup);

  const flameOuter = new THREE.Mesh(
    new THREE.ConeGeometry(0.025, 0.07, 12),
    new THREE.MeshBasicMaterial({ color: '#ffb84d', transparent: true, opacity: 0.92 })
  );
  flameGroup.add(flameOuter);

  const flameInner = new THREE.Mesh(
    new THREE.ConeGeometry(0.012, 0.04, 8),
    new THREE.MeshBasicMaterial({ color: '#fff4d6', transparent: true, opacity: 0.95 })
  );
  flameInner.position.y = -0.02;
  flameGroup.add(flameInner);

  const smoke = createSmokeWisp({ position: [0, 0.5, 0], scale: 0.6 });
  g.add(smoke);

  const light = new THREE.PointLight('#ffb060', 0.55, 4.5, 1.6);
  light.position.y = 0.4;
  g.add(light);

  // Per-frame flicker
  g.userData.tick = (t) => {
    const flick =
      0.55 +
      Math.sin(t * 6.3) * 0.12 +
      Math.sin(t * 11.1 + 1.3) * 0.08 +
      Math.sin(t * 17.7 + 0.7) * 0.05;
    light.intensity = flick;

    flameOuter.scale.y = 0.85 + Math.sin(t * 8) * 0.18;
    flameOuter.scale.x = flameOuter.scale.z = 1 + Math.sin(t * 9.4) * 0.08;
    flameGroup.rotation.z = Math.sin(t * 1.4) * 0.15 + Math.sin(t * 3.1) * 0.05;
    flameGroup.rotation.x = Math.sin(t * 1.7 + 0.7) * 0.1;

    // Smoke wisp floats
    const base = smoke.userData.basePosition;
    smoke.position.y = base[1] + Math.sin(t * 0.7) * 0.1;
    smoke.position.x = base[0] + Math.sin(t * 0.5) * 0.05;
    const s = smoke.userData.scale;
    smoke.scale.set(
      s * (1 + Math.sin(t * 0.6) * 0.12),
      s * (1 + Math.cos(t * 0.4) * 0.18),
      s * (1 + Math.sin(t * 0.5) * 0.10)
    );
    smoke.rotation.z = Math.sin(t * 0.3) * 0.3;
  };
  return g;
}

/* ── Plate ─────────────────────────────────────────────────────────────────── */
const PLATE_PALETTES = [
  { plate: '#1a1a1a', rim: '#c9a961', food: ['#c43d3d', '#f4e9d4', '#5a7a3a'] },
  { plate: '#1a1a1a', rim: '#c9a961', food: ['#e6b450', '#8a4a2a', '#f4e9d4'] },
  { plate: '#1a1a1a', rim: '#c9a961', food: ['#f4e9d4', '#c43d3d', '#3a5a4a'] },
  { plate: '#1a1a1a', rim: '#c9a961', food: ['#8a6a3a', '#f4e9d4', '#a04030'] },
];
const STEAM_STOPS = [
  [0, 'rgba(255, 240, 220, 0.5)'],
  [0.5, 'rgba(200, 180, 150, 0.15)'],
  [1, 'rgba(200, 180, 150, 0)'],
];

function createPlate(variant = 0) {
  const p = PLATE_PALETTES[variant % PLATE_PALETTES.length];
  const g = new THREE.Group();
  const base = makeStandardCylinder(0.32, 0.3, 0.04, 32, p.plate, { roughness: 0.3, metalness: 0.2 });
  base.castShadow = true; base.receiveShadow = true;
  g.add(base);

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.31, 0.012, 12, 64),
    new THREE.MeshStandardMaterial({ color: p.rim, metalness: 0.95, roughness: 0.2 })
  );
  rim.position.y = 0.022;
  g.add(rim);

  p.food.forEach((color, i) => {
    const angle = (i / p.food.length) * Math.PI * 2;
    const r = 0.12;
    const food = makeStandardSphere(0.06, 16, 12, color, { roughness: 0.55 });
    food.position.set(Math.cos(angle) * r, 0.05, Math.sin(angle) * r);
    food.castShadow = true;
    g.add(food);
  });

  const center = makeStandardSphere(0.025, 12, 8, '#f4e9d4', { roughness: 0.3, emissive: '#3a2a10', emissiveIntensity: 0.3 });
  center.position.y = 0.06;
  g.add(center);

  // Animated steam
  const steamSprite = makeSoftSprite({ size: 64, stops: STEAM_STOPS });
  const steamGroup = new THREE.Group();
  steamGroup.position.y = 0.1;
  g.add(steamGroup);

  const steamMats = [];
  for (let i = 0; i < 2; i++) {
    const mat = new THREE.MeshBasicMaterial({
      map: steamSprite, transparent: true, depthWrite: false, opacity: 0, color: '#f4e9d4',
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.4), mat);
    steamMats.push(mat);
    steamGroup.add(m);
  }

  g.userData.tick = (t) => {
    steamGroup.children.forEach((child, i) => {
      const phase = (t * 0.4 + i * 0.5) % 1;
      child.position.y = phase * 1.2;
      child.position.x = Math.sin(t * 0.6 + i) * 0.08;
      child.position.z = Math.cos(t * 0.6 + i) * 0.08;
      child.scale.setScalar(0.5 + phase * 0.7);
      if (child.material) child.material.opacity = (1 - phase) * 0.5;
    });
  };
  return g;
}

/* ── Table (composes Plate + Candle + 4 Chairs) ───────────────────────────── */
function createTable(plateVariant = 0) {
  const g = new THREE.Group();

  const top1 = makeStandardCylinder(0.78, 0.78, 0.04, 36, '#1a0f08', { roughness: 0.85 });
  top1.position.y = 0.71; top1.receiveShadow = true;
  g.add(top1);

  const top2 = makeStandardCylinder(0.7, 0.7, 0.06, 36, '#3a2418', { roughness: 0.55, metalness: 0.1 });
  top2.position.y = 0.74; top2.castShadow = true; top2.receiveShadow = true;
  g.add(top2);

  const topRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.7, 0.015, 10, 48),
    new THREE.MeshStandardMaterial({ color: '#c9a961', metalness: 0.9, roughness: 0.25 })
  );
  topRim.position.y = 0.78;
  g.add(topRim);

  const column = makeStandardCylinder(0.08, 0.12, 0.7, 12, '#1a0f08', { metalness: 0.5, roughness: 0.4 });
  column.position.y = 0.38;
  g.add(column);

  const base = makeStandardCylinder(0.36, 0.42, 0.04, 24, '#1a0f08', { metalness: 0.4, roughness: 0.5 });
  base.position.y = 0.02; base.receiveShadow = true;
  g.add(base);

  const plate = createPlate(plateVariant);
  plate.position.y = 0.83;
  g.add(plate);

  const candle = createCandle();
  candle.position.set(0.42, 0.79, 0.18);
  g.add(candle);

  const chairSpecs = [
    [0, 0, 1.05, 0, 0, 0],
    [0, 0, -1.05, 0, Math.PI, 0],
    [1.05, 0, 0, 0, -Math.PI / 2, 0],
    [-1.05, 0, 0, 0, Math.PI / 2, 0],
  ];
  chairSpecs.forEach(([x, y, z, rx, ry, rz]) => {
    const chair = createChair();
    chair.position.set(x, y, z);
    chair.rotation.set(rx, ry, rz);
    g.add(chair);
  });

  g.userData.tick = (t) => {
    plate.userData.tick?.(t);
    candle.userData.tick?.(t);
  };
  return g;
}

/* ── HERO SCENE ───────────────────────────────────────────────────────────── */
function setupHeroScene() {
  const wrap = document.getElementById('hero-canvas-wrap');
  if (!wrap) return;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x0a0a0a, 1);
  wrap.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#0a0a0a');
  scene.fog = new THREE.Fog('#0a0a0a', 6, 22);

  // getHeroCameraConfig returns {position, fov} — use it to build a real
  // PerspectiveCamera so we can call updateProjectionMatrix() on it later.
  const camConfig = getHeroCamera(window.innerWidth);
  const camera = new THREE.PerspectiveCamera(
    camConfig.fov,
    wrap.clientWidth / wrap.clientHeight,
    0.1,
    100
  );
  camera.position.set(...camConfig.position);
  renderer.setSize(wrap.clientWidth, wrap.clientHeight, false);

  // Lights
  scene.add(new THREE.AmbientLight('#ffb070', 0.18));
  const key = new THREE.SpotLight('#ffd9a8', 1.1, 0, 0.7, 0.9, 1);
  key.position.set(0, 8, 2);
  key.castShadow = true;
  key.shadow.mapSize.set(512, 512);
  scene.add(key);

  const rim = new THREE.SpotLight('#7a8aa8', 0.5, 0, 0.6, 1, 1);
  rim.position.set(-6, 5, -6);
  scene.add(rim);

  const fillLight = new THREE.PointLight('#c9a961', 0.3, 0, 2);
  fillLight.position.set(4, 3, -4);
  scene.add(fillLight);

  // Floor
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 40),
    new THREE.MeshStandardMaterial({ color: '#0c0c0c', roughness: 0.4, metalness: 0.3 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Floor inlay (gold lines)
  [-2.5, 2.5].forEach((z) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(18, 0.02),
      new THREE.MeshBasicMaterial({ color: '#c9a961', transparent: true, opacity: 0.18 })
    );
    m.rotation.x = -Math.PI / 2;
    m.position.set(0, 0.001, z);
    scene.add(m);
  });
  [-3, 0, 3].forEach((x) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(0.02, 12),
      new THREE.MeshBasicMaterial({ color: '#c9a961', transparent: true, opacity: 0.12 })
    );
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, 0.001, 0);
    scene.add(m);
  });

  // Walls
  const wallMat = new THREE.MeshStandardMaterial({ color: '#080808', roughness: 0.9 });
  const back = new THREE.Mesh(new THREE.PlaneGeometry(20, 6), wallMat);
  back.position.set(0, 3, -8); back.receiveShadow = true;
  scene.add(back);

  const left = new THREE.Mesh(new THREE.PlaneGeometry(20, 6), wallMat);
  left.rotation.y = Math.PI / 2;
  left.position.set(-10, 3, 0); left.receiveShadow = true;
  scene.add(left);

  const right = new THREE.Mesh(new THREE.PlaneGeometry(20, 6), wallMat);
  right.rotation.y = -Math.PI / 2;
  right.position.set(10, 3, 0); right.receiveShadow = true;
  scene.add(right);

  // Back-wall arch (gold torus)
  const archGroup = new THREE.Group();
  archGroup.position.set(0, 0, -7.9);
  const archMat = new THREE.MeshStandardMaterial({ color: '#c9a961', metalness: 0.85, roughness: 0.3 });
  const archUpper = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.04, 12, 64, Math.PI), archMat);
  archGroup.add(archUpper);
  const archLower = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.04, 12, 64, Math.PI), archMat);
  archLower.position.y = -2.2;
  archGroup.add(archLower);
  scene.add(archGroup);

  // Tables in 2x2 grid
  const tableSpecs = [
    { pos: [-2.6, 0, -1.4], v: 0 }, { pos: [2.6, 0, -1.4], v: 1 },
    { pos: [-2.6, 0, 2.2],  v: 2 }, { pos: [2.6, 0, 2.2],  v: 3 },
  ];
  const tables = [];
  tableSpecs.forEach(({ pos, v }) => {
    const t = createTable(v);
    t.position.set(...pos);
    scene.add(t);
    tables.push(t);
  });

  // Champagne flutes
  [[-2.6, 0.79, -1.9], [2.6, 0.79, -1.9], [-2.6, 0.79, 1.7], [2.6, 0.79, 1.7]].forEach((pos) => {
    const g = new THREE.Group();
    g.position.set(...pos);
    g.add(makeStandardCylinder(0.015, 0.04, 0.18, 12, '#c9a961', { metalness: 0.9, roughness: 0.2 }));
    const cup = makeStandardCylinder(0.05, 0.018, 0.12, 16, '#f4e9d4', { transparent: true, opacity: 0.35, metalness: 0.1, roughness: 0.1 });
    cup.position.y = 0.13;
    g.add(cup);
    scene.add(g);
  });

  // Particles
  const isMobile = window.innerWidth < 640;
  const embers = createEmbers(isMobile ? 18 : 35);
  scene.add(embers.points);
  const dust = createDustMotes(isMobile ? 30 : 70);
  scene.add(dust.points);

  // Camera drift
  let elapsed = 0;
  let isVisible = true;
  let inView = true;
  let raf = 0;

  const io = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
  }, { threshold: 0 });
  io.observe(wrap);

  const onResize = () => {
    renderer.setSize(wrap.clientWidth, wrap.clientHeight, false);
    const cam = getHeroCamera(window.innerWidth);
    camera.position.set(...cam.position);
    camera.fov = cam.fov;
    camera.aspect = wrap.clientWidth / wrap.clientHeight;
    camera.updateProjectionMatrix();
  };
  window.addEventListener('resize', onResize);

  const onVis = () => { isVisible = !document.hidden; };
  document.addEventListener('visibilitychange', onVis);

  const tick = (t) => {
    elapsed += 1 / 60;

    if (inView && isVisible) {
      // Camera drift
      const angle = Math.sin(elapsed * 0.08) * 0.35;
      const radius = window.innerWidth < 640 ? 7 : window.innerWidth < 900 ? 8 : 9;
      const baseY = window.innerWidth < 640 ? 2.6 : window.innerWidth < 900 ? 2.5 : 2.4;
      camera.position.x = Math.sin(angle) * radius + Math.sin(elapsed * 0.7) * 0.04;
      camera.position.z = Math.cos(angle) * radius;
      camera.position.y = baseY + Math.sin(elapsed * 0.12) * 0.08 + Math.sin(elapsed * 0.9) * 0.03;
      camera.lookAt(0, 1, 0);

      // Per-object ticks
      tables.forEach((t) => t.userData.tick?.(elapsed));
      embers.material.uniforms.uTime.value = elapsed;
      dust.material.uniforms.uTime.value = elapsed;
      const a = elapsed * 0.02;
      dust.material.uniforms.uRot.value.set(Math.cos(a), Math.sin(a));

      renderer.render(scene, camera);
    }

    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    cancelAnimationFrame(raf);
    io.disconnect();
    window.removeEventListener('resize', onResize);
    document.removeEventListener('visibilitychange', onVis);
    renderer.dispose();
  });
}

function getHeroCamera(width) {
  if (width < 640)  return { position: [0, 2.6, 7], fov: 62 };
  if (width < 900)  return { position: [0, 2.5, 8], fov: 56 };
  if (width < 1280) return { position: [0, 2.4, 9], fov: 52 };
  return { position: [0, 2.4, 9], fov: 50 };
}

/* ── Easing helpers ───────────────────────────────────────────────────────── */
const easeInOut = (t) => t * t * (3 - 2 * t);
const easeOut   = (t) => 1 - Math.pow(1 - t, 3);
const clamp01   = (t) => Math.max(0, Math.min(1, t));
const lerp      = (a, b, t) => a + (b - a) * t;

/* ─────────────────────────────────────────────────────────────────────────── */
/* 12. INTRO OVERLAYS — RESERVE + MENU                                         */
/* ─────────────────────────────────────────────────────────────────────────── */

function showReserveIntro() {
  const root = document.getElementById('reserve-intro');
  if (!root) return;
  root.hidden = false;
  root.innerHTML = `
    <div class="intro-vignette"></div>
    <div class="intro-canvas-layer" id="reserve-canvas"></div>
    <div class="intro-text">
      <div class="intro-eyebrow">— Reserve —</div>
      <h1 class="intro-title">Welcome</h1>
      <div class="intro-line"></div>
    </div>
    <button class="intro-skip" id="reserve-skip" aria-label="Skip intro">Skip</button>
  `;
  root.className = 'intro-overlay intro-phase-0';

  // Build the 3D scene
  const layer = root.querySelector('#reserve-canvas');
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.setClearColor(0x0a0806, 1);
  layer.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#0a0806');
  scene.fog = new THREE.Fog('#0a0806', 6, 22);

  const camera = new THREE.PerspectiveCamera(55, layer.clientWidth / layer.clientHeight, 0.1, 60);
  camera.position.set(0, 1.0, 1.6);
  camera.lookAt(0, 1.0, 0);

  renderer.setSize(layer.clientWidth, layer.clientHeight, false);

  const onResize = () => {
    renderer.setSize(layer.clientWidth, layer.clientHeight, false);
    camera.aspect = layer.clientWidth / layer.clientHeight;
    camera.updateProjectionMatrix();
  };
  window.addEventListener('resize', onResize);

  // ── Doorway
  const doorGroup = new THREE.Group();
  scene.add(doorGroup);

  const gold = '#c9a961';
  const woodDark = '#2a1810';
  const woodLight = '#3a2418';

  doorGroup.add(placeAt(makeStandardBox(3.6, 0.18, 0.3, gold, { metalness: 0.9, roughness: 0.25 }), 0, 3.4, 0));
  doorGroup.add(placeAt(makeStandardBox(0.12, 3.4, 0.3, gold, { metalness: 0.9, roughness: 0.25 }), -1.74, 1.7, 0));
  doorGroup.add(placeAt(makeStandardBox(0.12, 3.4, 0.3, gold, { metalness: 0.9, roughness: 0.25 }), 1.74, 1.7, 0));

  const step = new THREE.Mesh(
    new THREE.BoxGeometry(3.4, 0.04, 0.6),
    new THREE.MeshStandardMaterial({ color: '#0a0a0a', roughness: 0.4, metalness: 0.4 })
  );
  step.position.set(0, 0.02, 0);
  doorGroup.add(step);

  const threshold = new THREE.Mesh(
    new THREE.BoxGeometry(3.0, 0.005, 0.02),
    new THREE.MeshStandardMaterial({ color: gold, metalness: 0.95, roughness: 0.2 })
  );
  threshold.position.set(0, 0.045, 0.2);
  doorGroup.add(threshold);

  // Outer walls
  [
    [-2.6, 1.7, 0.5, 1.6, 3.4, 0.6, '#0a0a0a', 0.85],
    [2.6, 1.7, 0.5, 1.6, 3.4, 0.6, '#0a0a0a', 0.85],
    [0, 3.4, 0.5, 5.2, 1.4, 0.6, '#0a0a0a', 0.85],
  ].forEach(([x, y, z, w, h, d, c, r]) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color: c, roughness: r }));
    m.position.set(x, y, z);
    doorGroup.add(m);
  });

  [
    [-2.6, 1.7, -0.8, 1.6, 3.4, 0.4],
    [2.6, 1.7, -0.8, 1.6, 3.4, 0.4],
    [0, 3.4, -0.8, 5.2, 1.4, 0.4],
  ].forEach(([x, y, z, w, h, d]) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color: '#080808', roughness: 0.9 }));
    m.position.set(x, y, z);
    doorGroup.add(m);
  });

  // Doors
  const leftDoor = new THREE.Group(); leftDoor.position.set(-1.62, 0, 0);
  const rightDoor = new THREE.Group(); rightDoor.position.set(1.62, 0, 0);

  function buildDoorPanel(parent, sign) {
    const door = makeStandardBox(1.5, 3.4, 0.08, woodDark, { roughness: 0.55, metalness: 0.05 });
    door.position.set(sign * 0.75, 1.7, 0.05); door.castShadow = true;
    parent.add(door);

    const upperPanel = makeStandardBox(1.1, 1.2, 0.04, woodLight, { roughness: 0.6 });
    upperPanel.position.set(sign * 0.75, 2.4, 0.10);
    parent.add(upperPanel);

    const lowerPanel = makeStandardBox(1.1, 1.2, 0.04, woodLight, { roughness: 0.6 });
    lowerPanel.position.set(sign * 0.75, 1.0, 0.10);
    parent.add(lowerPanel);

    // Handle
    const h1 = makeStandardCylinder(0.025, 0.025, 0.12, 12, gold, { metalness: 0.95, roughness: 0.2 });
    h1.position.set(sign * 1.45, 1.0, 0.12);
    parent.add(h1);
    const h2 = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 12, 8),
      new THREE.MeshStandardMaterial({ color: gold, metalness: 0.95, roughness: 0.2 })
    );
    h2.position.set(sign * 1.45, 1.05, 0.18);
    parent.add(h2);

    // Hinges
    [-1.5, 0, 1.5].forEach((y) => {
      const hinge = makeStandardCylinder(0.04, 0.04, 0.1, 12, gold, { metalness: 0.95, roughness: 0.2 });
      hinge.position.set(sign * 0.04, 1.7 + y, 0.06);
      parent.add(hinge);
    });
  }
  buildDoorPanel(leftDoor, 1);
  buildDoorPanel(rightDoor, -1);
  doorGroup.add(leftDoor);
  doorGroup.add(rightDoor);

  // Sconces
  [-2.05, 2.05].forEach((x) => {
    const g = new THREE.Group();
    g.position.set(x, 2.4, 0.5);
    const cup = makeStandardCylinder(0.06, 0.08, 0.18, 12, gold, { metalness: 0.9, roughness: 0.3 });
    g.add(cup);
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(0.05, 0.1, 12),
      new THREE.MeshStandardMaterial({ color: '#fff4d6', emissive: '#ffb060', emissiveIntensity: 0.6 })
    );
    cone.position.y = -0.15;
    g.add(cone);
    const light = new THREE.PointLight('#ffb060', 0.6, 3, 1.6);
    light.position.y = -0.15;
    g.add(light);
    doorGroup.add(g);
  });

  // ── Dining room (back)
  const diningGroup = new THREE.Group();
  scene.add(diningGroup);

  const backFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 20),
    new THREE.MeshStandardMaterial({ color: '#1a1410', roughness: 0.45, metalness: 0.25 })
  );
  backFloor.rotation.x = -Math.PI / 2;
  backFloor.position.set(0, 0, -7);
  backFloor.receiveShadow = true;
  diningGroup.add(backFloor);

  [-5, -3, -1].forEach((z) => {
    const line = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 0.02),
      new THREE.MeshBasicMaterial({ color: '#c9a961', transparent: true, opacity: 0.28 })
    );
    line.rotation.x = -Math.PI / 2;
    line.position.set(0, 0.001, z);
    diningGroup.add(line);
  });
  [-1.6, 1.6].forEach((x) => {
    const line = new THREE.Mesh(
      new THREE.PlaneGeometry(0.02, 18),
      new THREE.MeshBasicMaterial({ color: '#c9a961', transparent: true, opacity: 0.18 })
    );
    line.rotation.x = -Math.PI / 2;
    line.position.set(x, 0.001, -7);
    diningGroup.add(line);
  });

  const sideWallMat = new THREE.MeshStandardMaterial({ color: '#1c1410', roughness: 0.85 });
  const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(18, 5), sideWallMat);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(-5, 2.5, -7); leftWall.receiveShadow = true;
  diningGroup.add(leftWall);
  const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(18, 5), sideWallMat);
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.position.set(5, 2.5, -7); rightWall.receiveShadow = true;
  diningGroup.add(rightWall);

  const farWall = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 5),
    new THREE.MeshStandardMaterial({ color: '#221814', roughness: 0.85 })
  );
  farWall.position.set(0, 2.5, -14); farWall.receiveShadow = true;
  diningGroup.add(farWall);

  // Back wall arch (gold)
  const archOuter = new THREE.Group();
  archOuter.position.set(0, 0, -13.9);
  const archMat2 = new THREE.MeshStandardMaterial({
    color: '#e6cfa3', metalness: 0.9, roughness: 0.25,
    emissive: '#c9a961', emissiveIntensity: 0.4,
  });
  const archTop = new THREE.Mesh(new THREE.TorusGeometry(2.0, 0.04, 12, 64, Math.PI), archMat2);
  archOuter.add(archTop);
  const archBot = new THREE.Mesh(new THREE.TorusGeometry(2.0, 0.04, 12, 64, Math.PI), archMat2);
  archBot.position.y = -2.0;
  archOuter.add(archBot);
  diningGroup.add(archOuter);

  // AURELIA sign on the back wall — built from primitives (no TextGeometry/texture).
  // Each letter is constructed from thin BoxGeometry strokes. We use a small
  // helper that takes 2D line segments so the letters are clean and readable.
  function makeAureliaSign() {
    const g = new THREE.Group();
    g.position.set(0, 2.5, -13.85);

    const mat = new THREE.MeshStandardMaterial({
      color: '#e6cfa3', metalness: 0.6, roughness: 0.3,
      emissive: '#c9a961', emissiveIntensity: 0.7, toneMapped: false,
    });

    // Each letter: array of [x1, y1, x2, y2] line segments in a 1×1 cell
    // where (0,0) is the center, +y is up. Letter height ≈ 0.9, width ≈ 0.6.
    // A: two diagonals from baseline corners up to apex, plus a crossbar
    const A = [
      [-0.30, -0.45,  0.00,  0.45], // left diagonal: bottom-left to apex
      [ 0.30, -0.45,  0.00,  0.45], // right diagonal: bottom-right to apex
      [-0.20, -0.05,  0.20, -0.05], // crossbar across the middle
    ];
    // U: two verticals connected by a curved bottom (approximated by 3 segments)
    const U = [
      [-0.30,  0.45, -0.30, -0.20], // left vertical
      [ 0.30,  0.45,  0.30, -0.20], // right vertical
      [-0.30, -0.20, -0.20, -0.40], // bottom-left curve
      [ 0.20, -0.40,  0.30, -0.20], // bottom-right curve
      [-0.20, -0.40,  0.20, -0.40], // bottom join
    ];
    // R: vertical + bowl on top half + diagonal leg
    const R = [
      [-0.30,  0.45, -0.30, -0.45], // left vertical (full height)
      [-0.30,  0.45,  0.15,  0.45], // top horizontal
      [ 0.15,  0.45,  0.30,  0.20], // top-right outer diagonal
      [ 0.30,  0.20,  0.15,  0.00], // top-right inner diagonal (bowl back)
      [ 0.15,  0.00, -0.30,  0.00], // bowl bottom horizontal
      [-0.05,  0.00,  0.30, -0.45], // leg diagonal from middle to bottom-right
    ];
    // E: vertical + three horizontals (top, middle, bottom)
    const E = [
      [-0.30,  0.45, -0.30, -0.45], // left vertical
      [-0.30,  0.45,  0.25,  0.45], // top horizontal
      [-0.30,  0.00,  0.15,  0.00], // middle horizontal (shorter)
      [-0.30, -0.45,  0.25, -0.45], // bottom horizontal
    ];
    // L: vertical + bottom horizontal
    const L = [
      [-0.30,  0.45, -0.30, -0.45], // left vertical
      [-0.30, -0.45,  0.30, -0.45], // bottom horizontal
    ];
    // I: top serif + vertical + bottom serif
    const I = [
      [-0.25,  0.45,  0.25,  0.45], // top serif
      [ 0.00,  0.45,  0.00, -0.45], // vertical
      [-0.25, -0.45,  0.25, -0.45], // bottom serif
    ];

    const LETTERS = [
      { strokes: A }, { strokes: U }, { strokes: R },
      { strokes: E }, { strokes: L }, { strokes: I }, { strokes: A },
    ];

    // Geometry of each letter cell — letter height 0.9, width 0.6
    const cellW = 0.7;
    const strokeW = 0.06;
    const strokeH = 0.06;
    const depth = 0.06;
    const totalWidth = cellW * LETTERS.length;
    const startX = -totalWidth / 2 + cellW / 2;

    LETTERS.forEach((letter, li) => {
      const letterGroup = new THREE.Group();
      letterGroup.position.x = startX + li * cellW;
      letter.strokes.forEach(([x1, y1, x2, y2]) => {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        // Make the stroke the right length; rotate around its center.
        const stroke = new THREE.Mesh(
          new THREE.BoxGeometry(length, strokeH, depth),
          mat
        );
        // Center of the segment
        stroke.position.set((x1 + x2) / 2, (y1 + y2) / 2, 0);
        stroke.rotation.z = angle;
        letterGroup.add(stroke);
      });
      g.add(letterGroup);
    });

    return g;
  }
  diningGroup.add(makeAureliaSign());

  // Thin gold underline beneath the sign
  const underline = new THREE.Mesh(
    new THREE.BoxGeometry(5.8, 0.02, 0.02),
    new THREE.MeshStandardMaterial({
      color: '#c9a961', metalness: 0.95, roughness: 0.2,
      emissive: '#c9a961', emissiveIntensity: 0.6,
    })
  );
  underline.position.set(0, 1.45, -13.84);
  diningGroup.add(underline);

  // Four tables
  const tables = [
    [-1.6, 0, -3.5, 0], [1.6, 0, -3.5, 1],
    [-1.6, 0, -6.5, 2], [1.6, 0, -6.5, 3],
  ].map(([x, y, z, v]) => {
    const t = createTable(v);
    t.position.set(x, y, z);
    diningGroup.add(t);
    return t;
  });

  // Particles in the dining room
  const embers = createEmbers(50);
  diningGroup.add(embers.points);
  const dust = createDustMotes(100);
  diningGroup.add(dust.points);

  // Lights
  diningGroup.add(new THREE.AmbientLight('#ffe2b8', 0.75));
  const dir = new THREE.DirectionalLight('#ffd9a8', 1.9);
  dir.position.set(0, 4, 2);
  diningGroup.add(dir);

  tables.forEach((t) => {
    const x = t.position.x, z = t.position.z;
    const spot = new THREE.SpotLight('#ffe0b8', 3.0, 6, 0.55, 0.4, 1.2);
    spot.position.set(x, 4.5, z);
    diningGroup.add(spot);
    const glow = new THREE.PointLight('#ffb070', 1.2, 3.8, 1.4);
    glow.position.set(x, 1.2, z);
    diningGroup.add(glow);
  });
  diningGroup.add(placeAt(new THREE.PointLight('#ffb070', 1.4, 7, 1.3), 0, 2.8, -10));
  diningGroup.add(placeAt(new THREE.PointLight('#ffb070', 1.3, 6, 1.4), 0, 2.5, -1.0));

  // ── Scripted camera + door animation
  const KEY = {
    outsidePos:  [0, 1.0, 1.6],
    outsideLook: [0, 1.0, 0],
    midPos:      [0, 1.0, -1.0],
    midLook:     [0, 1.2, -3.5],
    insidePos:   [0, 0.85, -2.6],
    insideLook:  [0, 1.4, -7.0],
  };
  const lerpArr = (out, a, b, t) => {
    out.set(lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t));
    return out;
  };

  const start = 1.6, midDur = 1.0, insideDur = 1.4, holdStart = 4.0;
  const startMs = performance.now();
  let raf = 0;

  const camPos = new THREE.Vector3(...KEY.outsidePos);
  const camLook = new THREE.Vector3(...KEY.outsideLook);

  const tick = () => {
    const t = (performance.now() - startMs) / 1000;

    // Door swing
    const openT = clamp01((t - 0.6) / 0.8);
    const oe = easeInOut(openT);
    leftDoor.rotation.y = oe * Math.PI * 0.85;
    rightDoor.rotation.y = -oe * Math.PI * 0.85;

    // Camera
    if (t < start) {
      lerpArr(camPos, KEY.outsidePos, KEY.outsidePos, 1);
      lerpArr(camLook, KEY.outsideLook, KEY.outsideLook, 1);
    } else if (t < start + midDur) {
      const k = easeInOut(clamp01((t - start) / midDur));
      lerpArr(camPos, KEY.outsidePos, KEY.midPos, k);
      lerpArr(camLook, KEY.outsideLook, KEY.midLook, k);
    } else if (t < start + midDur + insideDur) {
      const k = easeInOut(clamp01((t - start - midDur) / insideDur));
      lerpArr(camPos, KEY.midPos, KEY.insidePos, k);
      lerpArr(camLook, KEY.midLook, KEY.insideLook, k);
    } else {
      const breath = Math.sin((t - holdStart) * 1.2) * 0.02;
      camPos.set(KEY.insidePos[0], KEY.insidePos[1] + breath, KEY.insidePos[2]);
      camLook.set(...KEY.insideLook);
    }
    camera.position.copy(camPos);
    camera.lookAt(camLook);

    tables.forEach((tbl) => tbl.userData.tick?.(t));
    embers.material.uniforms.uTime.value = t;
    dust.material.uniforms.uTime.value = t;
    const a = t * 0.02;
    dust.material.uniforms.uRot.value.set(Math.cos(a), Math.sin(a));

    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  // Phases
  const phaseTimers = [
    setTimeout(() => root.classList.replace('intro-phase-0', 'intro-phase-1'), 400),
    setTimeout(() => root.classList.replace('intro-phase-1', 'intro-phase-2'), 2400),
    setTimeout(() => {
      root.classList.replace('intro-phase-2', 'intro-phase-3');
      // Append flash
      const flash = document.createElement('div');
      flash.className = 'intro-flash';
      root.appendChild(flash);
    }, 4800),
  ];

  const cleanup = () => {
    cancelAnimationFrame(raf);
    phaseTimers.forEach(clearTimeout);
    window.removeEventListener('resize', onResize);
    renderer.dispose();
  };

  // Smooth-scroll to #reservations after the overlay finishes closing.
  // We use a single auto-finish timer and a `done` flag so Skip and the auto
  // timer can't both fire cleanup (which used to throw when the render loop
  // ran on a detached canvas).
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    cancelAnimationFrame(raf);
    phaseTimers.forEach(clearTimeout);
    window.removeEventListener('resize', onResize);
    try { renderer.dispose(); } catch (_) {}
    setTimeout(() => {
      root.hidden = true;
      root.innerHTML = '';
      document.getElementById('reservations')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 700);
  };
  const skipBtn = root.querySelector('#reserve-skip');
  if (skipBtn) {
    skipBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      root.classList.add('intro-phase-3');
      // Append a flash to match the natural-end behavior
      if (!root.querySelector('.intro-flash')) {
        const flash = document.createElement('div');
        flash.className = 'intro-flash';
        root.appendChild(flash);
      }
      finish();
    });
  }
  setTimeout(finish, 5400);
}

function showMenuIntro() {
  const root = document.getElementById('menu-intro');
  if (!root) return;
  root.hidden = false;
  root.innerHTML = `
    <div class="menu-intro-vignette"></div>
    <div class="menu-intro-canvas-layer" id="menu-intro-canvas"></div>
    <div class="menu-intro-text">
      <div class="menu-intro-eyebrow">— Explore —</div>
      <h1 class="menu-intro-title" id="menu-intro-title">Tonight</h1>
      <div class="menu-intro-line"></div>
    </div>
    <button class="menu-intro-skip" id="menu-intro-skip" aria-label="Skip">Skip</button>
  `;
  root.className = 'menu-intro-overlay menu-intro-phase-0';

  const layer = root.querySelector('#menu-intro-canvas');
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.setClearColor(0x0a0806, 1);
  layer.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#0a0806');
  scene.fog = new THREE.Fog('#0a0806', 3, 14);

  const camera = new THREE.PerspectiveCamera(45, layer.clientWidth / layer.clientHeight, 0.1, 50);
  camera.position.set(0, 0.85, 2.6);
  camera.lookAt(0, 0.4, 0);

  renderer.setSize(layer.clientWidth, layer.clientHeight, false);
  const onResize = () => {
    renderer.setSize(layer.clientWidth, layer.clientHeight, false);
    camera.aspect = layer.clientWidth / layer.clientHeight;
    camera.updateProjectionMatrix();
  };
  window.addEventListener('resize', onResize);

  scene.add(new THREE.AmbientLight('#ffe2b8', 0.6));
  const menuSpot = new THREE.SpotLight('#ffd9a8', 2.4, 0, 0.55, 0.5, 1);
  menuSpot.position.set(0, 5, 2);
  menuSpot.castShadow = true;
  scene.add(menuSpot);
  scene.add(placeAt(new THREE.PointLight('#ffb060', 0.8, 5, 1.5), -3, 2, -3));
  scene.add(placeAt(new THREE.PointLight('#ffb070', 0.8, 5, 1.5), 3, 2, -3));

  // Table
  const tableGroup = new THREE.Group();
  tableGroup.position.set(0, -0.55, 0);
  scene.add(tableGroup);

  const tabletop = makeStandardCylinder(0.85, 0.85, 0.06, 48, '#4a2c1c', { roughness: 0.5, metalness: 0.1 });
  tabletop.position.y = 0.74; tabletop.castShadow = true; tabletop.receiveShadow = true;
  tableGroup.add(tabletop);

  const tRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.85, 0.015, 12, 64),
    new THREE.MeshStandardMaterial({
      color: '#e6cfa3', metalness: 0.95, roughness: 0.2,
      emissive: '#c9a961', emissiveIntensity: 0.3,
    })
  );
  tRim.position.y = 0.78;
  tableGroup.add(tRim);

  const tCol = makeStandardCylinder(0.08, 0.12, 0.7, 16, '#1a0f08', { metalness: 0.5, roughness: 0.4 });
  tCol.position.y = 0.38;
  tableGroup.add(tCol);

  const tBase = makeStandardCylinder(0.36, 0.42, 0.04, 32, '#1a0f08', { metalness: 0.4, roughness: 0.5 });
  tBase.position.y = 0.02; tBase.receiveShadow = true;
  tableGroup.add(tBase);

  // Candle on the table
  const candle = createCandle();
  candle.position.set(0, 0.79, 0);
  tableGroup.add(candle);

  // Plates that slide in
  const plateSpecs = [
    { enterFrom: 'right', startAt: 0.6, variant: 0, pos: [0.5, 0.83, 0.2] },
    { enterFrom: 'left',  startAt: 1.8, variant: 1, pos: [-0.5, 0.83, -0.2] },
    { enterFrom: 'top',   startAt: 3.0, variant: 2, pos: [0.5, 0.83, -0.4] },
    { enterFrom: 'right', startAt: 4.2, variant: 3, pos: [-0.5, 0.83, 0.4] },
  ];
  const plateAnims = plateSpecs.map(({ enterFrom, startAt, variant, pos }) => {
    const plate = createPlate(variant);
    plate.position.set(...pos);
    tableGroup.add(plate);

    let enterPos;
    if (enterFrom === 'right') enterPos = new THREE.Vector3(4, pos[1], pos[2]);
    else if (enterFrom === 'left') enterPos = new THREE.Vector3(-4, pos[1], pos[2]);
    else enterPos = new THREE.Vector3(pos[0], 5, pos[2]);

    plate.position.copy(enterPos);

    return { plate, target: new THREE.Vector3(...pos), enterPos, startAt, enterDuration: 0.9 };
  });

  // Wine glass on the side
  const glass = new THREE.Group();
  glass.position.set(0.6, 0.79, -0.6);
  glass.add(makeStandardCylinder(0.015, 0.04, 0.18, 12, '#c9a961', { metalness: 0.9, roughness: 0.2 }));
  const cup = makeStandardCylinder(0.05, 0.018, 0.12, 16, '#a03030', { transparent: true, opacity: 0.65, metalness: 0.2, roughness: 0.1 });
  cup.position.y = 0.13;
  glass.add(cup);
  tableGroup.add(glass);

  // Titles
  const TITLES = [
    { start: 0,   end: 1.4, text: 'Tonight' },
    { start: 1.4, end: 3.0, text: 'Starters & Pasta' },
    { start: 3.0, end: 4.4, text: 'Main Course' },
    { start: 4.4, end: 5.4, text: 'Dessert' },
    { start: 5.4, end: 5.8, text: 'The Menu' },
  ];
  const titleEl = root.querySelector('#menu-intro-title');
  let raf = 0;
  let elapsed = 0;
  let lastT = performance.now();

  const tick = () => {
    const now = performance.now();
    const dt = (now - lastT) / 1000;
    lastT = now;
    elapsed += dt;

    plateAnims.forEach(({ plate, target, enterPos, startAt, enterDuration }) => {
      const k = clamp01((elapsed - startAt) / enterDuration);
      const e = easeOut(k);
      plate.position.x = lerp(enterPos.x, target.x, e);
      plate.position.y = lerp(enterPos.y, target.y, e) + Math.sin(elapsed * 1.5) * 0.01;
      plate.position.z = lerp(enterPos.z, target.z, e);
      plate.rotation.y = (1 - e) * Math.PI * 0.5;
      plate.userData.tick?.(elapsed);
    });

    candle.userData.tick?.(elapsed);

    // Update title based on elapsed
    const current = TITLES.find((t) => elapsed >= t.start && elapsed < t.end) || TITLES[TITLES.length - 1];
    if (titleEl && titleEl.textContent !== current.text) {
      titleEl.textContent = current.text;
      // Replay entrance animation
      titleEl.style.animation = 'none';
      void titleEl.offsetWidth; // reflow
      titleEl.style.animation = '';
    }

    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  const phaseTimers = [
    setTimeout(() => root.classList.replace('menu-intro-phase-0', 'menu-intro-phase-1'), 400),
    setTimeout(() => root.classList.replace('menu-intro-phase-1', 'menu-intro-phase-2'), 3000),
    setTimeout(() => {
      root.classList.replace('menu-intro-phase-2', 'menu-intro-phase-3');
      const flash = document.createElement('div');
      flash.className = 'menu-intro-flash';
      root.appendChild(flash);
    }, 5000),
  ];

  // Single-finish with `done` flag so Skip and auto-timer can't double-cleanup.
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    cancelAnimationFrame(raf);
    phaseTimers.forEach(clearTimeout);
    window.removeEventListener('resize', onResize);
    try { renderer.dispose(); } catch (_) {}
    setTimeout(() => {
      root.hidden = true;
      root.innerHTML = '';
      document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 700);
  };
  const skipBtn = root.querySelector('#menu-intro-skip');
  if (skipBtn) {
    skipBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      root.classList.add('menu-intro-phase-3');
      if (!root.querySelector('.menu-intro-flash')) {
        const flash = document.createElement('div');
        flash.className = 'menu-intro-flash';
        root.appendChild(flash);
      }
      finish();
    });
  }
  setTimeout(finish, 5800);
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* 13. WIRE UP `data-trigger` LINKS                                            */
/* ─────────────────────────────────────────────────────────────────────────── */
function setupTriggers() {
  document.querySelectorAll('[data-trigger]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const which = el.getAttribute('data-trigger');
      try {
        if (which === 'reserve') showReserveIntro();
        else if (which === 'menu') showMenuIntro();
      } catch (err) {
        console.error('[Aurelia] Overlay failed:', err);
        // Last-ditch: hide the overlay and scroll to the target section
        const fallback = which === 'reserve' ? 'reservations' : 'menu';
        document.querySelectorAll('.intro-overlay, .menu-intro-overlay').forEach((o) => { o.hidden = true; o.innerHTML = ''; });
        document.getElementById(fallback)?.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* 14. INTRO CURTAIN — lifts after a short delay                              */
/* ─────────────────────────────────────────────────────────────────────────── */
function setupIntroCurtain() {
  const curtain = document.getElementById('intro-curtain');
  if (!curtain) return;

  setTimeout(() => {
    curtain.classList.add('intro-curtain--lifting');
  }, 700);

  setTimeout(() => {
    curtain.classList.add('intro-curtain--done');
  }, 2000);
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* INIT                                                                        */
/* ─────────────────────────────────────────────────────────────────────────── */
// Restore bright mode from previous session (if any) before anything renders.
setBrightMode(isBrightMode());
setupBrightModeTyping();

// Triggers (overlay launchers) wire up FIRST so the cinematic overlays work
// even if a 3D scene later fails to initialize.
setupTriggers();
setupIntroCurtain();
setupNavbar();
setupScrollProgress();
setupAmbientOrbs();
setupGoldParticles();
setupReserveForm();
renderMenu();
renderGallery();
setupReveal();

// 3D scenes are wrapped so a failure in one doesn't take down the whole page.
try { setupHeroScene(); }
catch (err) { console.error('[Aurelia] Hero scene failed:', err); }
