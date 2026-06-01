#!/usr/bin/env node
/**
 * Regenerate SEO artifacts for Swipio static site.
 * Run from repo root: node scripts/generate-seo.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  BASE,
  LANGS,
  OG_LOCALE,
  LOGO_URL,
  STORE_URLS,
  SUPPORT_EMAIL,
  homeUrl,
  pageUrl,
  bcp47,
} from './seo-config.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SWIPIO = path.join(ROOT, 'swipio');

const SEO_START = '<!-- seo:generated -->';
const SEO_END = '<!-- /seo:generated -->';
const LASTMOD = new Date().toISOString().slice(0, 10);

function escapeXml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf8');
}

function stripGeneratedBlock(html) {
  const re = new RegExp(
    `\\s*${SEO_START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${SEO_END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`,
    'g'
  );
  return html.replace(re, '\n');
}

function insertAfterDescription(html, block) {
  const cleaned = stripGeneratedBlock(html);
  const wrapped = `\n  ${SEO_START}\n${block}  ${SEO_END}\n`;
  const descRe = /(<meta name="description" content="[^"]*">)/i;
  if (descRe.test(cleaned)) {
    return cleaned.replace(descRe, `$1${wrapped}`);
  }
  const viewportRe = /(<meta name="viewport"[^>]*>)/i;
  if (viewportRe.test(cleaned)) {
    return cleaned.replace(viewportRe, `$1${wrapped}`);
  }
  return cleaned.replace('</head>', `${wrapped}</head>`);
}

function insertBeforeHeadClose(html, block) {
  const cleaned = stripGeneratedBlock(html);
  const wrapped = `\n  ${SEO_START}\n${block}  ${SEO_END}\n`;
  return cleaned.replace('</head>', `${wrapped}</head>`);
}

function parseMeta(html, name) {
  const re = new RegExp(
    `<meta\\s+name="${name}"\\s+content="([^"]*)"`,
    'i'
  );
  const m = html.match(re);
  return m ? m[1] : '';
}

function parseTitle(html) {
  const m = html.match(/<title>([^<]*)<\/title>/i);
  return m ? m[1].trim() : '';
}

function ogTitleFromPageTitle(title) {
  return title.replace(/\s*\|\s*znanixx\.com\s*$/i, '').trim();
}

function hreflangBlock(getUrl) {
  const lines = LANGS.map(
    (lang) =>
      `  <link rel="alternate" hreflang="${lang}" href="${escapeHtml(getUrl(lang))}">`
  );
  lines.push(
    `  <link rel="alternate" hreflang="x-default" href="${escapeHtml(getUrl('en'))}">`
  );
  return lines.join('\n');
}

function buildFaqSeoBlock(lang, title, description) {
  const canonical = pageUrl(lang, 'faq.html');
  const ogTitle = ogTitleFromPageTitle(title);
  const locale = OG_LOCALE[lang] || 'en_US';
  return `${[
    `  <link rel="canonical" href="${canonical}">`,
    `  <meta property="og:type" content="website">`,
    `  <meta property="og:url" content="${canonical}">`,
    `  <meta property="og:title" content="${escapeHtml(ogTitle)}">`,
    `  <meta property="og:description" content="${escapeHtml(description)}">`,
    `  <meta property="og:image" content="${LOGO_URL}">`,
    `  <meta property="og:site_name" content="Swipio">`,
    `  <meta property="og:locale" content="${locale}">`,
    `  <meta name="twitter:card" content="summary_large_image">`,
    `  <meta name="twitter:title" content="${escapeHtml(ogTitle)}">`,
    `  <meta name="twitter:description" content="${escapeHtml(description)}">`,
    `  <meta name="twitter:image" content="${LOGO_URL}">`,
    hreflangBlock((l) => pageUrl(l, 'faq.html')),
  ].join('\n')}\n`;
}

function parseFaqPairs(html) {
  const pairs = [];
  const itemRe =
    /<li class="faq-item[^"]*">[\s\S]*?<h2 class="faq-q">([\s\S]*?)<\/h2>[\s\S]*?<p class="faq-a">([\s\S]*?)<\/p>/gi;
  let m;
  while ((m = itemRe.exec(html)) !== null) {
    const q = m[1].replace(/<[^>]+>/g, '').trim();
    const a = m[2].replace(/<[^>]+>/g, '').trim();
    if (q && a) pairs.push({ q, a });
  }
  return pairs;
}

function buildFaqJsonLd(pairs, lang) {
  const mainEntity = pairs.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: {
      '@type': 'Answer',
      text: a,
    },
  }));
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: bcp47(lang),
    mainEntity,
  };
  return `  <script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n  </script>\n`;
}

function buildSoftwareApplicationJsonLd(lang, description) {
  const url = homeUrl(lang);
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Swipio',
    applicationCategory: 'EducationApplication',
    operatingSystem: 'iOS, Android',
    inLanguage: bcp47(lang),
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description,
    url,
    image: LOGO_URL,
  };
  return `  <script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n  </script>\n`;
}

function hreflangLinksForPage(getUrl) {
  return LANGS.flatMap((lang) => {
    const href = getUrl(lang);
    return `    <xhtml:link rel="alternate" hreflang="${lang}" href="${escapeXml(href)}"/>`;
  }).concat(
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(getUrl('en'))}"/>`
  );
}

function sitemapUrlEntry(loc, getUrl, priority, changefreq) {
  return `  <url>
    <loc>${escapeXml(loc)}</loc>
${hreflangLinksForPage(getUrl).join('\n')}
    <lastmod>${LASTMOD}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

function generateSitemap() {
  const entries = [];

  for (const lang of LANGS) {
    entries.push(
      sitemapUrlEntry(
        homeUrl(lang),
        (l) => homeUrl(l),
        lang === 'en' ? '1.0' : '0.9',
        'weekly'
      )
    );
  }

  for (const lang of LANGS) {
    entries.push(
      sitemapUrlEntry(
        pageUrl(lang, 'faq.html'),
        (l) => pageUrl(l, 'faq.html'),
        '0.8',
        'monthly'
      )
    );
  }

  for (const lang of LANGS) {
    entries.push(
      sitemapUrlEntry(
        pageUrl(lang, 'support.html'),
        (l) => pageUrl(l, 'support.html'),
        '0.7',
        'monthly'
      )
    );
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join('\n')}
</urlset>
`;
  writeFile(path.join(ROOT, 'sitemap.xml'), xml);
  return entries.length;
}

function patchFaqFiles() {
  let count = 0;
  for (const lang of LANGS) {
    const filePath = path.join(SWIPIO, lang, 'faq.html');
    if (!fs.existsSync(filePath)) continue;
    let html = readFile(filePath);
    const title = parseTitle(html);
    const description = parseMeta(html, 'description');
    const pairs = parseFaqPairs(html);
    const seoBlock = buildFaqSeoBlock(lang, title, description);
    const jsonLd = pairs.length ? buildFaqJsonLd(pairs, lang) : '';
    html = insertAfterDescription(html, `${seoBlock}${jsonLd}`);
    writeFile(filePath, html);
    count++;
  }
  return count;
}

function patchPrivacyFiles() {
  const robotsMeta = `<meta name="robots" content="noindex, nofollow">`;
  let count = 0;
  for (const lang of LANGS) {
    const filePath = path.join(SWIPIO, lang, 'privacy.html');
    if (!fs.existsSync(filePath)) continue;
    let html = readFile(filePath);
    if (/name=['"]robots['"]/i.test(html)) {
      html = html.replace(
        /<meta\s+name=['"]robots['"]\s+content=['"][^'"]*['"]\s*\/?>/gi,
        robotsMeta
      );
    } else {
      const viewportRe = /(<meta\s+name=['"]viewport['"][^>]*>)/i;
      if (viewportRe.test(html)) {
        html = html.replace(viewportRe, `$1\n  ${robotsMeta}`);
      } else {
        html = html.replace('<head>', `<head>\n  ${robotsMeta}`);
      }
    }
    writeFile(filePath, html);
    count++;
  }
  return count;
}

function fixLocaleIndexHreflang(html) {
  let out = html;
  out = out.replace(
    /(<link\s+rel="alternate"\s+hreflang="en"\s+href=")https:\/\/znanixx\.com\/swipio\/en\/?(")/gi,
    `$1${BASE}/$2`
  );
  out = out.replace(
    /(<link\s+rel="alternate"\s+hreflang="en"\s+href=")\/swipio\/en\/?(")/gi,
    `$1${BASE}/$2`
  );
  out = out.replace(
    /(<link\s+rel="alternate"\s+hreflang="x-default"\s+href=")https:\/\/znanixx\.com\/swipio\/en\/?(")/gi,
    `$1${BASE}/$2`
  );
  out = out.replace(
    /(<link\s+rel="alternate"\s+hreflang="x-default"\s+href=")\/(")/gi,
    `$1${BASE}/$2`
  );
  out = out.replace(
    /(<link\s+rel="alternate"\s+hreflang="x-default"\s+href=")\/swipio\/en\/?(")/gi,
    `$1${BASE}/$2`
  );
  return out;
}

function patchLocaleIndexFiles() {
  let count = 0;
  for (const lang of LANGS) {
    if (lang === 'en') continue;
    const filePath = path.join(SWIPIO, lang, 'index.html');
    if (!fs.existsSync(filePath)) continue;
    let html = readFile(filePath);
    html = fixLocaleIndexHreflang(html);
    const description = parseMeta(html, 'description');
    const jsonLd = buildSoftwareApplicationJsonLd(lang, description);
    html = insertBeforeHeadClose(html, jsonLd);
    writeFile(filePath, html);
    count++;
  }
  return count;
}

function generateLlmsTxt() {
  const lines = [
    '# Swipio',
    '',
    '> Swipio helps you learn vocabulary faster with swipe-based flashcards and spaced repetition. Available on iOS and Android.',
    '',
    '## Primary links',
    '',
    `- Home (English): ${homeUrl('en')}`,
    `- Apple App Store: ${STORE_URLS.appStore}`,
    `- Google Play: ${STORE_URLS.googlePlay}`,
    `- Support email: ${SUPPORT_EMAIL}`,
    `- Sitemap: ${BASE}/sitemap.xml`,
    '',
    '## Legal (noindex — not intended for search indexing)',
    '',
    '- Privacy policy and Terms of Service exist per language under `/swipio/{lang}/privacy.html` and `/swipio/{lang}/tos.html`.',
    '',
    '## Pages by language',
    '',
    '| Lang | Home | FAQ | Support |',
    '|------|------|-----|---------|',
  ];

  for (const lang of LANGS) {
    lines.push(
      `| ${lang} | ${homeUrl(lang)} | ${pageUrl(lang, 'faq.html')} | ${pageUrl(lang, 'support.html')} |`
    );
  }

  lines.push('');
  writeFile(path.join(ROOT, 'llms.txt'), lines.join('\n'));
}

function main() {
  const urlCount = generateSitemap();
  const faqCount = patchFaqFiles();
  const privacyCount = patchPrivacyFiles();
  const indexCount = patchLocaleIndexFiles();
  generateLlmsTxt();

  console.log(`Wrote sitemap.xml (${urlCount} URLs)`);
  console.log(`Patched ${faqCount} faq.html files`);
  console.log(`Patched ${privacyCount} privacy.html files`);
  console.log(`Patched ${indexCount} locale index.html files (hreflang + JSON-LD)`);
  console.log('Wrote llms.txt');
}

main();
