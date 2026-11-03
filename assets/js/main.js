/* ============================================================
   Daoudi Mohamed Yacine — portfolio interactions
   Vanilla JS, no dependencies.
   ============================================================ */
(() => {
  'use strict';

  const doc = document;
  const root = doc.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  /* ---------------------------------------------- header + menu */
  const header = doc.getElementById('site-header');
  const menuToggle = doc.querySelector('.menu-toggle');
  const mobileMenu = doc.getElementById('mobile-menu');
  const mobileLinks = mobileMenu ? [...mobileMenu.querySelectorAll('a')] : [];

  const setScrolled = () => {
    header?.classList.toggle('is-scrolled', window.scrollY > 8);
  };
  setScrolled();

  const setMenu = (open) => {
    if (!menuToggle || !mobileMenu) return;
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    mobileMenu.classList.toggle('is-open', open);
    doc.body.classList.toggle('menu-open', open);
    if (open) {
      window.setTimeout(() => mobileLinks[0]?.focus({ preventScroll: true }), 220);
    }
  };

  menuToggle?.addEventListener('click', () => {
    setMenu(menuToggle.getAttribute('aria-expanded') !== 'true');
  });

  mobileLinks.forEach((link) => link.addEventListener('click', () => setMenu(false)));

  doc.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuToggle?.getAttribute('aria-expanded') === 'true') {
      setMenu(false);
      menuToggle.focus();
    }
  });

  doc.addEventListener('click', (event) => {
    if (menuToggle?.getAttribute('aria-expanded') !== 'true') return;
    if (!header?.contains(event.target)) setMenu(false);
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 980) setMenu(false);
  }, { passive: true });

  /* ---------------------------------------------- scroll progress */
  const progressBar = doc.querySelector('.scroll-progress span');
  let scrollQueued = false;

  const updateScrollUI = () => {
    scrollQueued = false;
    setScrolled();

    if (progressBar) {
      const max = root.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? Math.min(Math.max(window.scrollY / max, 0), 1) : 0;
      progressBar.style.transform = `scaleX(${ratio})`;
    }

    updateActiveLink();
  };

  const queueScroll = () => {
    if (scrollQueued) return;
    scrollQueued = true;
    window.requestAnimationFrame(updateScrollUI);
  };

  window.addEventListener('scroll', queueScroll, { passive: true });
  window.addEventListener('resize', queueScroll, { passive: true });

  /* ---------------------------------------------- active nav link */
  const navLinks = [...doc.querySelectorAll('.nav-links a')];
  const trackedSections = navLinks
    .map((link) => doc.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  function updateActiveLink() {
    if (!navLinks.length) return;

    const marker = window.scrollY + Math.min(window.innerHeight * 0.32, 220);
    let activeId = '';

    trackedSections.forEach((section) => {
      if (section.offsetTop <= marker) activeId = section.id;
    });

    if (window.innerHeight + window.scrollY >= root.scrollHeight - 4) {
      activeId = 'contact';
    }

    navLinks.forEach((link) => {
      const isActive = link.getAttribute('href') === `#${activeId}`;
      link.classList.toggle('is-active', isActive);
      if (isActive) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  }

  /* ---------------------------------------------- reveal on scroll */
  const revealItems = [...doc.querySelectorAll('[data-reveal]')];

  if ('IntersectionObserver' in window && !reducedMotion) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });

    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-in'));
  }

  /* ---------------------------------------------- stat counters */
  const counters = [...doc.querySelectorAll('[data-count]')];

  const runCounter = (element) => {
    const target = Number(element.dataset.count);
    const pad = Number(element.dataset.pad || 0);
    if (!Number.isFinite(target)) return;

    if (reducedMotion) {
      element.textContent = String(target).padStart(pad, '0');
      return;
    }

    const duration = 1100;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(target * eased);
      element.textContent = String(value).padStart(pad, '0');
      if (progress < 1) window.requestAnimationFrame(tick);
      else element.textContent = String(target).padStart(pad, '0');
    };

    window.requestAnimationFrame(tick);
  };

  if (counters.length) {
    if ('IntersectionObserver' in window) {
      const counterObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          runCounter(entry.target);
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.6 });
      counters.forEach((counter) => counterObserver.observe(counter));
    } else {
      counters.forEach(runCounter);
    }
  }

  /* ---------------------------------------------- board tilt */
  const heroVisual = doc.querySelector('.hero-visual');
  const boardTilt = doc.getElementById('board-tilt');

  if (heroVisual && boardTilt && finePointer && !reducedMotion) {
    let frame = null;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const render = () => {
      currentX += (targetX - currentX) * 0.12;
      currentY += (targetY - currentY) * 0.12;
      boardTilt.style.transform = `rotateX(${currentX.toFixed(2)}deg) rotateY(${currentY.toFixed(2)}deg)`;
      if (Math.abs(targetX - currentX) > 0.02 || Math.abs(targetY - currentY) > 0.02) {
        frame = window.requestAnimationFrame(render);
      } else {
        frame = null;
      }
    };

    const startRender = () => {
      if (frame === null) frame = window.requestAnimationFrame(render);
    };

    heroVisual.addEventListener('pointermove', (event) => {
      const rect = heroVisual.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      targetY = Math.max(-5, Math.min(5, x * 9));
      targetX = Math.max(-5, Math.min(5, -y * 9));
      startRender();
    }, { passive: true });

    heroVisual.addEventListener('pointerleave', () => {
      targetX = 0;
      targetY = 0;
      startRender();
    }, { passive: true });
  }

  /* ---------------------------------------------- project spotlight */
  if (finePointer && !reducedMotion) {
    doc.querySelectorAll('.project').forEach((card) => {
      card.addEventListener('pointermove', (event) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${event.clientX - rect.left}px`);
        card.style.setProperty('--my', `${event.clientY - rect.top}px`);
      }, { passive: true });
    });
  }

  /* ---------------------------------------------- copy email */
  const copyButton = doc.querySelector('.copy-btn');
  const toast = doc.querySelector('.toast');
  const toastText = toast?.querySelector('.toast-text');
  let toastTimer = null;
  let copyTimer = null;

  const showToast = (message) => {
    if (!toast) return;
    if (toastText && message) toastText.textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 2600);
  };

  const copyText = async (text) => {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const field = doc.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.opacity = '0';
    doc.body.appendChild(field);
    field.select();
    doc.execCommand('copy');
    doc.body.removeChild(field);
  };

  copyButton?.addEventListener('click', async () => {
    const value = copyButton.dataset.copy || '';
    const label = copyButton.querySelector('.copy-label');
    try {
      await copyText(value);
      copyButton.classList.add('is-copied');
      if (label) label.textContent = 'Copied';
      showToast('Email copied to clipboard');
      window.clearTimeout(copyTimer);
      copyTimer = window.setTimeout(() => {
        copyButton.classList.remove('is-copied');
        if (label) label.textContent = 'Copy email';
      }, 2400);
    } catch {
      showToast('Copy failed — use the email link');
    }
  });

  /* ---------------------------------------------- misc */
  const year = doc.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  // Make decorative motion pause when the tab is hidden.
  doc.addEventListener('visibilitychange', () => {
    doc.body.classList.toggle('is-paused', doc.hidden);
  });

  updateScrollUI();
})();
