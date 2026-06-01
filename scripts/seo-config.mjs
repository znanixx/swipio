/** Shared SEO constants for generate-seo.mjs and llms.txt generation. */

export const BASE = 'https://znanixx.com';

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

export const STORE_URLS = {
  appStore: 'https://apps.apple.com/app/id6759218522',
  googlePlay: 'https://play.google.com/store/apps/details?id=com.mykhailiuk_v.swipio',
};

export const SUPPORT_EMAIL = 'support@znanixx.com';

export const LOGO_URL = `${BASE}/assets/logo.png`;

/** Canonical home path (trailing slash). English lives at site root. */
export function homePath(lang) {
  return lang === 'en' ? '/' : `/swipio/${lang}/`;
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
