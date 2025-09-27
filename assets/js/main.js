// Year in footer
document.getElementById('year').textContent = new Date().getFullYear();

// Mobile nav toggle
const navToggle = document.querySelector('.nav-toggle');
const siteNav = document.querySelector('.site-nav');
if (navToggle && siteNav) {
  navToggle.addEventListener('click', () => {
    const open = siteNav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(open));
  });
  siteNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => siteNav.classList.remove('open')));
}

// Smooth scroll with header offset
const header = document.querySelector('.site-header');
const headerOffset = () => (header ? header.offsetHeight - 1 : 0);
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const id = link.getAttribute('href');
    if (!id || id === '#') return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    const y = target.getBoundingClientRect().top + window.pageYOffset - headerOffset();
    window.scrollTo({ top: y, behavior: 'smooth' });
  });
});

// Active section highlighting
const navLinks = Array.from(document.querySelectorAll('.site-nav a'));
// Multi-page: mark active based on pathname
const current = location.pathname.split('/').pop() || 'index.html';
navLinks.forEach(a => {
  const href = a.getAttribute('href');
  const file = (href || '').split('#')[0];
  if (!file) return;
  if ((current === 'index.html' && href.includes('#home')) || file === current) {
    a.classList.add('active');
  }
});

// Single-page (index) additionally update active by section when scrolling
const sectionAnchors = navLinks
  .map(a => document.querySelector(a.getAttribute('href')))
  .filter(Boolean);
if (sectionAnchors.length && 'IntersectionObserver' in window) {
  const obs = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = '#' + entry.target.id;
          navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === id));
        }
      });
    },
    { rootMargin: '-40% 0px -50% 0px', threshold: [0.2, 0.6] }
  );
  sectionAnchors.forEach(sec => obs.observe(sec));
}

// Menu category active highlighting
(function menuCategoryActive() {
  const menuNav = document.querySelector('.menu-nav');
  if (!menuNav) return;
  const links = Array.from(menuNav.querySelectorAll('a[href^="#"]'));
  const secs = links
    .map(a => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);
  if (!secs.length || !('IntersectionObserver' in window)) return;

  const obs = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = '#' + entry.target.id;
          links.forEach(a => a.setAttribute('aria-current', a.getAttribute('href') === id ? 'true' : 'false'));
          links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === id));
        }
      });
    },
    { rootMargin: '-40% 0px -50% 0px', threshold: [0.2, 0.6] }
  );
  secs.forEach(sec => obs.observe(sec));
})();

// Image dashboard rotation
(function setupDashboardRotation() {
  const container = document.getElementById('image-dashboard');
  if (!container) return;
  const tiles = Array.from(container.querySelectorAll('.tile'));
  if (tiles.length < 5) return;

  let order = [0, 1, 2, 3, 4]; // 5 tiles: a,b,c,d,e
  let prevOrder = order.slice();
  let rotateTimer = null;
  let running = true;

  // Assign varied Ken Burns classes to images once for visual richness
  const kbClasses = ['kb-ltr', 'kb-rtl', 'kb-zoom-out'];
  tiles.forEach((t, i) => {
    const img = t.querySelector('img');
    if (img) {
      const cls = kbClasses[i % kbClasses.length];
      img.classList.remove('kb-ltr', 'kb-rtl', 'kb-zoom-out');
      img.classList.add(cls);
    }
  });

  const applyPositions = () => {
    tiles.forEach(t => t.classList.remove('featured', 'pos-b', 'pos-c', 'pos-d', 'pos-e'));
    const classes = ['featured', 'pos-b', 'pos-c', 'pos-d', 'pos-e'];
    order.forEach((tileIndex, i) => {
      const tile = tiles[tileIndex];
      tile.classList.add(classes[i]);
    });

    // Staggered swap animation for all tiles that moved
    const moved = order.filter((idx, pos) => prevOrder[pos] !== idx);
    moved.forEach((idx, j) => {
      const tile = tiles[idx];
      tile.classList.remove('swap-anim');
      // stagger for depth
      setTimeout(() => tile.classList.add('swap-anim'), j * 60);
      // cleanup after animation
      setTimeout(() => tile.classList.remove('swap-anim'), 800 + j * 60);
    });
    prevOrder = order.slice();
  };

  applyPositions();
  const start = () => {
    if (rotateTimer) return;
    rotateTimer = setInterval(() => {
      order.push(order.shift());
      applyPositions();
    }, 6500);
    running = true;
  };
  const stop = () => {
    if (!rotateTimer) return;
    clearInterval(rotateTimer);
    rotateTimer = null;
    running = false;
  };
  start();

  // Pause/Play control
  const toggleBtn = document.getElementById('dash-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      if (running) {
        stop();
        toggleBtn.textContent = 'Play';
        toggleBtn.setAttribute('aria-label', 'Play slideshow');
        toggleBtn.setAttribute('aria-pressed', 'true');
      } else {
        start();
        toggleBtn.textContent = 'Pause';
        toggleBtn.setAttribute('aria-label', 'Pause slideshow');
        toggleBtn.setAttribute('aria-pressed', 'false');
      }
    });
  }
})();

// Parallax effect on hero dashboard (pointer: fine only)
(function heroParallax() {
  const media = document.querySelector('.hero-media');
  const dash = document.getElementById('image-dashboard');
  if (!media || !dash) return;
  const mql = window.matchMedia('(pointer: fine)');
  const mqlRM = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!mql.matches || mqlRM.matches) return;

  let raf = 0;
  let targetRX = 0, targetRY = 0; // target rotation
  let curRX = 0, curRY = 0;

  const animate = () => {
    curRX += (targetRX - curRX) * 0.12;
    curRY += (targetRY - curRY) * 0.12;
    dash.style.transform = `rotateX(${curRX.toFixed(3)}deg) rotateY(${curRY.toFixed(3)}deg)`;
    raf = requestAnimationFrame(animate);
  };

  const onMove = (e) => {
    const rect = media.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const x = (e.clientX - cx) / (rect.width / 2); // -1..1
    const y = (e.clientY - cy) / (rect.height / 2); // -1..1
    targetRX = y * -4; // invert so up tilts back
    targetRY = x * 6;
    if (!raf) raf = requestAnimationFrame(animate);
  };

  const onLeave = () => {
    targetRX = 0; targetRY = 0;
  };

  media.addEventListener('mousemove', onMove);
  media.addEventListener('mouseleave', onLeave);
})();

// Scroll reveal animations
(function scrollReveal() {
  const selectors = [
    '.section .container > *',
    '.menu-grid .card',
    '.about-highlights li',
    '.gallery-grid img',
    '.menu-item',
    '.cta-card'
  ];
  const nodes = Array.from(document.querySelectorAll(selectors.join(',')));
  if (!nodes.length || !('IntersectionObserver' in window)) return;

  // Mark initial state
  nodes.forEach(n => n.classList.add('will-reveal'));

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        el.classList.add('reveal');
        el.classList.remove('will-reveal');
        obs.unobserve(el);
      }
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });

  // Stagger by DOM order within a container
  const groups = new Map();
  nodes.forEach(n => {
    const parent = n.parentElement;
    if (!groups.has(parent)) groups.set(parent, []);
    groups.get(parent).push(n);
  });
  groups.forEach(list => {
    list.forEach((el, i) => {
      el.style.transitionDelay = `${Math.min(i * 40, 240)}ms`;
      obs.observe(el);
    });
  });
})();

// Tile captions from data-label or alt
(function tileCaptions() {
  const tiles = Array.from(document.querySelectorAll('#image-dashboard .tile'));
  if (!tiles.length) return;
  tiles.forEach(t => {
    if (t.querySelector('.caption')) return;
    let label = t.getAttribute('data-label');
    if (!label) {
      const img = t.querySelector('img');
      label = img?.getAttribute('alt') || '';
    }
    if (!label) return;
    const cap = document.createElement('div');
    cap.className = 'caption';
    cap.textContent = label;
    t.appendChild(cap);
    t.setAttribute('tabindex', '0');
  });
})();
