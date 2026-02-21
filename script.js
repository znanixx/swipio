/**
 * Swipio landing page — navigation, scroll reveal, footer, language picker.
 * Runs in a single IIFE to avoid polluting global scope.
 */
(function () {
  'use strict';

  // ─── Constants ─────────────────────────────────────────────────────────────
  const SCROLL_NAV_THRESHOLD = 10;
  const FOOTER_START_YEAR = 2026;
  const REVEAL_THRESHOLD = 0.15;
  const REVEAL_ROOT_MARGIN = '0px 0px -40px 0px';

  const STORAGE_KEY_LANG = 'swipio-lang';
  const SUPPORTED_LANGS = [
    'cs', 'da', 'de', 'en', 'es', 'fi', 'fr', 'ga', 'hi', 'it', 'ja', 'ko',
    'nl', 'no', 'pl', 'pt', 'ro', 'sv', 'tr', 'uk', 'zh',
  ];

  const LANG_TO_FLAG = {
    cs: 'cz', da: 'dk', de: 'de', en: 'gb', es: 'es', fi: 'fi', fr: 'fr',
    ga: 'ie', hi: 'in', it: 'it', ja: 'jp', ko: 'kr', nl: 'nl', no: 'no',
    pl: 'pl', pt: 'pt', ro: 'ro', sv: 'se', tr: 'tr', uk: 'ua', zh: 'cn',
  };

  const LANG_TO_LABEL = {
    cs: 'Čeština', da: 'Dansk', de: 'Deutsch', en: 'English', es: 'Español',
    fi: 'Suomi', fr: 'Français', ga: 'Gaeilge', hi: 'हिन्दी', it: 'Italiano',
    ja: '日本語', ko: '한국어', nl: 'Nederlands', no: 'Norsk', pl: 'Polski',
    pt: 'Português', ro: 'Română', sv: 'Svenska', tr: 'Türkçe', uk: 'Українська',
    zh: '中文',
  };

  const STORE_BADGE_LANGS = {
    appStore: ['cs', 'da', 'de', 'en', 'es', 'fi', 'fr', 'hi', 'it', 'ja', 'ko', 'nl', 'no', 'pl', 'pt', 'ro', 'sv', 'tr', 'uk', 'zh'],
    googlePlay: ['cs', 'da', 'de', 'en', 'es', 'fi', 'fr', 'ga', 'hi', 'it', 'ja', 'ko', 'nl', 'no', 'pl', 'pt', 'ro', 'sv', 'tr', 'uk', 'zh'],
  };

  const DOCS = { tos: 'tos.html', privacy: 'privacy.html' };
  /** Base path for language landing pages (e.g. "pages/" so en is at /, others at /pages/de/, etc.). */
  const PAGES_BASE = 'pages/';

  // ─── Nav scroll state ───────────────────────────────────────────────────────
  function initNavScroll() {
    const nav = document.getElementById('nav');
    if (!nav) return;

    window.addEventListener(
      'scroll',
      () => nav.classList.toggle('scrolled', window.scrollY > SCROLL_NAV_THRESHOLD),
      { passive: true }
    );
  }

  // ─── Footer copyright year ──────────────────────────────────────────────────
  function initFooterYear() {
    const el = document.getElementById('footer-year');
    if (!el) return;

    const year = new Date().getFullYear();
    const range = year === FOOTER_START_YEAR
      ? String(FOOTER_START_YEAR)
      : `${FOOTER_START_YEAR}\u2013${year}`;
    el.textContent = `\u00A9 Znanixx ${range}`;
  }

  // ─── Scroll reveal (IntersectionObserver) ────────────────────────────────────
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
      { threshold: REVEAL_THRESHOLD, rootMargin: REVEAL_ROOT_MARGIN }
    );

    document.querySelectorAll('.fade-in').forEach((el) => observer.observe(el));
  }

  // ─── Language picker ────────────────────────────────────────────────────────
  function initLanguagePicker() {
    const dropdown = document.getElementById('lang-dropdown');
    const trigger = document.getElementById('lang-trigger');
    const triggerFlag = document.getElementById('lang-trigger-flag');
    const triggerLabel = document.getElementById('lang-trigger-label');
    const panel = document.getElementById('lang-panel');
    const docLinks = document.querySelectorAll('.footer-links a[data-doc]');
    const appStoreImgs = document.querySelectorAll('.store-btn img[src*="app-store"]');
    const googlePlayImgs = document.querySelectorAll('.store-btn img[src*="google-play"]');

    const pathname = window.location.pathname || '';
    const base = PAGES_BASE.replace(/\/$/, '');
    const pagesRe = new RegExp('^/' + base.replace(/\//g, '\\/') + '/([a-z]{2})(?:/|$)', 'i');
    const pagesMatch = pathname.match(pagesRe);
    const inPagesFolder = pagesMatch && SUPPORTED_LANGS.includes(pagesMatch[1]);
    const pathPrefix = inPagesFolder ? '../../' : '';
    const langFromPath = inPagesFolder ? pagesMatch[1] : null;

    function detectBrowserLang() {
      const list = navigator.languages?.length ? navigator.languages : [navigator.language || ''];
      for (const locale of list) {
        const code = (locale || '').toLowerCase().split('-')[0];
        if (SUPPORTED_LANGS.includes(code)) return code;
      }
      return 'en';
    }

    function getLang() {
      if (langFromPath) return langFromPath;
      const stored = localStorage.getItem(STORAGE_KEY_LANG);
      if (stored && SUPPORTED_LANGS.includes(stored)) return stored;
      return detectBrowserLang();
    }

    function setLang(lang) {
      localStorage.setItem(STORAGE_KEY_LANG, lang);
    }

    function effectiveLang(lang) {
      return SUPPORTED_LANGS.includes(lang) ? lang : 'en';
    }

    function updateDocLinks(lang) {
      const langCode = effectiveLang(lang);
      docLinks.forEach((a) => {
        const doc = a.getAttribute('data-doc');
        if (doc && DOCS[doc]) a.href = `${pathPrefix}docs/${langCode}/${DOCS[doc]}`;
      });
    }

    function updateStoreBadges(lang) {
      const appLang = STORE_BADGE_LANGS.appStore.includes(lang) ? lang : 'en';
      const gpLang = STORE_BADGE_LANGS.googlePlay.includes(lang) ? lang : 'en';
      appStoreImgs.forEach((img) => { img.src = `${pathPrefix}assets/store/app-store/${appLang}.svg`; });
      googlePlayImgs.forEach((img) => { img.src = `${pathPrefix}assets/store/google-play/${gpLang}.svg`; });
    }

    function setTrigger(lang) {
      const flag = LANG_TO_FLAG[lang] ?? 'gb';
      const label = LANG_TO_LABEL[lang] ?? 'English';
      if (triggerFlag) triggerFlag.src = `${pathPrefix}assets/flags/${flag}.svg`;
      if (triggerLabel) triggerLabel.textContent = label;
      panel?.querySelectorAll('.lang-option').forEach((opt) => {
        opt.setAttribute('aria-selected', opt.getAttribute('data-lang') === lang ? 'true' : 'false');
      });
      updateStoreBadges(lang);
    }

    function navigateToLang(lang) {
      const url = lang === 'en'
        ? (pathPrefix ? '../../' : '/')
        : pathPrefix + PAGES_BASE + lang + '/';
      window.location.href = url;
    }

    function openDropdown() {
      dropdown?.classList.add('open');
      if (trigger) trigger.setAttribute('aria-expanded', 'true');
      if (panel) panel.setAttribute('aria-hidden', 'false');
    }

    function closeDropdown() {
      dropdown?.classList.remove('open');
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
      if (panel) panel.setAttribute('aria-hidden', 'true');
    }

    if (trigger) {
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown?.classList.contains('open') ? closeDropdown() : openDropdown();
      });
    }

    panel?.querySelectorAll('.lang-option').forEach((opt) => {
      opt.addEventListener('click', function () {
        const lang = this.getAttribute('data-lang');
        setLang(lang);
        closeDropdown();
        navigateToLang(lang);
      });
    });

    document.addEventListener('click', () => {
      if (dropdown?.classList.contains('open')) closeDropdown();
    });

    const current = getLang();
    if (!localStorage.getItem(STORAGE_KEY_LANG)) setLang(current);
    if (document.documentElement) document.documentElement.lang = current;
    setTrigger(current);
    updateDocLinks(current);
  }

  // ─── Bootstrap ──────────────────────────────────────────────────────────────
  initNavScroll();
  initFooterYear();
  initScrollReveal();
  initLanguagePicker();
})();
