(function () {
  'use strict';

  const SCROLL_NAV_THRESHOLD = 10;
  const FOOTER_START_YEAR = 2026;

  function initNavScroll() {
    const nav = document.getElementById('nav');
    if (!nav) return;
    window.addEventListener(
      'scroll',
      () => nav.classList.toggle('scrolled', window.scrollY > SCROLL_NAV_THRESHOLD),
      { passive: true }
    );
  }

  function initFooterYear() {
    const el = document.getElementById('footer-year');
    if (!el) return;
    const year = new Date().getFullYear();
    const range = year === FOOTER_START_YEAR
      ? String(FOOTER_START_YEAR)
      : `${FOOTER_START_YEAR}\u2013${year}`;
    el.textContent = `\u00A9 Znanixx ${range}`;
  }

  function initScrollReveal() {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    document.querySelectorAll('.fade-in').forEach((el) => {
      if (el.closest('#hero')) {
        el.classList.add('visible');
        return;
      }
      observer.observe(el);
    });
  }

  initNavScroll();
  initFooterYear();
  initScrollReveal();
})();
