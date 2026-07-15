/** Shared SEO constants for generate-seo.mjs and llms.txt generation. */

export const BASE = 'https://znanixx.com';

export const SUPPORT_EMAIL = 'support@znanixx.com';

export const LANGS = [
  'cs', 'da', 'de', 'en', 'es', 'fi', 'fr', 'ga', 'hi', 'it', 'ja', 'ko',
  'nl', 'no', 'pl', 'pt', 'ro', 'sv', 'tr', 'uk', 'zh',
];

export const OG_LOCALE = {
  cs: 'cs_CZ',
  da: 'da_DK',
  de: 'de_DE',
  en: 'en_US',
  es: 'es_ES',
  fi: 'fi_FI',
  fr: 'fr_FR',
  ga: 'ga_IE',
  hi: 'hi_IN',
  it: 'it_IT',
  ja: 'ja_JP',
  ko: 'ko_KR',
  nl: 'nl_NL',
  no: 'nb_NO',
  pl: 'pl_PL',
  pt: 'pt_BR',
  ro: 'ro_RO',
  sv: 'sv_SE',
  tr: 'tr_TR',
  uk: 'uk_UA',
  zh: 'zh_CN',
};

export const SWIPIO_STORE_URLS = {
  appStore: 'https://apps.apple.com/app/id6759218522',
  googlePlay: 'https://play.google.com/store/apps/details?id=com.mykhailiuk_v.swipio',
};

/** @deprecated Use SWIPIO_STORE_URLS */
export const STORE_URLS = SWIPIO_STORE_URLS;

export const SWIPIO_LOGO_URL = `${BASE}/assets/logo.png`;

/** @deprecated Use SWIPIO_LOGO_URL */
export const LOGO_URL = SWIPIO_LOGO_URL;

export const SWIPIO = {
  name: 'Swipio',
  slug: 'swipio',
  packageId: 'com.mykhailiuk_v.swipio',
  logoUrl: SWIPIO_LOGO_URL,
  ogImageUrl: SWIPIO_LOGO_URL,
  storeUrls: SWIPIO_STORE_URLS,
  tagline:
    'Swipio helps you learn vocabulary faster with swipe-based flashcards and spaced repetition. Available on iOS and Android.',
};

export const TECH_INTERVIEW_PRACTICE = {
  name: 'Tech Interview Practice',
  slug: 'tech-interview',
  packageId: 'com.techinterviewpractice.app',
  logoUrl: `${BASE}/tech-interview/assets/logo.png`,
  ogImageUrl: `${BASE}/tech-interview/assets/screenshots/home.png`,
  homeUrl: `${BASE}/tech-interview/`,
  storeUrls: {
    appStore: null,
    googlePlay: null,
  },
  tagline:
    'Master 13,000+ technical interview questions across 170+ topics with spaced repetition, code snippets, and progress analytics.',
};

/** Canonical home path (trailing slash). */
export function homePath(lang) {
  return `/swipio/${lang}/`;
}

export function homeUrl(lang) {
  return `${BASE}${homePath(lang)}`;
}

export function pagePath(lang, page) {
  return `/swipio/${lang}/${page}`;
}

export function pageUrl(lang, page) {
  return `${BASE}${pagePath(lang, page)}`;
}

/** BCP-47 language tag from OG locale (e.g. de_DE → de). */
export function bcp47(lang) {
  const locale = OG_LOCALE[lang] || 'en_US';
  return locale.replace('_', '-');
}
