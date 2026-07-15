#!/usr/bin/env node
/**
 * Regenerate SEO artifacts for the Znanixx static site (Swipio + Tech Interview Practice).
 * Run from repo root: node scripts/generate-seo.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  BASE,
  LANGS,
  OG_LOCALE,
  SWIPIO,
  SWIPIO_LOGO_URL,
  SWIPIO_STORE_URLS,
  TECH_INTERVIEW_PRACTICE,
  SUPPORT_EMAIL,
  homeUrl,
  pageUrl,
  bcp47,
} from './seo-config.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SWIPIO_DIR = path.join(ROOT, 'swipio');
const TECH_DIR = path.join(ROOT, TECH_INTERVIEW_PRACTICE.slug);

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
    `  <meta property="og:image" content="${SWIPIO_LOGO_URL}">`,
    `  <meta property="og:site_name" content="Swipio">`,
    `  <meta property="og:locale" content="${locale}">`,
    `  <meta name="twitter:card" content="summary_large_image">`,
    `  <meta name="twitter:title" content="${escapeHtml(ogTitle)}">`,
    `  <meta name="twitter:description" content="${escapeHtml(description)}">`,
    `  <meta name="twitter:image" content="${SWIPIO_LOGO_URL}">`,
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

function buildSoftwareApplicationJsonLd(app, { url, description, lang }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: app.name,
    applicationCategory: 'EducationApplication',
    operatingSystem: 'iOS, Android',
    inLanguage: lang ? bcp47(lang) : 'en-US',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description,
    url,
    image: app.logoUrl,
  };
  if (app.storeUrls?.appStore) {
    schema.downloadUrl = app.storeUrls.appStore;
  }
  return `  <script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n  </script>\n`;
}

function buildSwipioSoftwareApplicationJsonLd(lang, description) {
  return buildSoftwareApplicationJsonLd(SWIPIO, {
    url: homeUrl(lang),
    description,
    lang,
  });
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

  // Site hub (app chooser)
  entries.push(`  <url>
    <loc>${escapeXml(`${BASE}/`)}</loc>
    <lastmod>${LASTMOD}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>`);

  for (const lang of LANGS) {
    entries.push(
      sitemapUrlEntry(
        homeUrl(lang),
        (l) => homeUrl(l),
        lang === 'en' ? '0.9' : '0.9',
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

  // Tech Interview Practice (English only; legal pages excluded — noindex)
  const techPages = [
    { path: `/${TECH_INTERVIEW_PRACTICE.slug}/`, priority: '0.9', changefreq: 'weekly' },
    { path: `/${TECH_INTERVIEW_PRACTICE.slug}/faq.html`, priority: '0.8', changefreq: 'monthly' },
    { path: `/${TECH_INTERVIEW_PRACTICE.slug}/support.html`, priority: '0.7', changefreq: 'monthly' },
  ];
  for (const page of techPages) {
    entries.push(`  <url>
    <loc>${escapeXml(`${BASE}${page.path}`)}</loc>
    <lastmod>${LASTMOD}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`);
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
    const filePath = path.join(SWIPIO_DIR, lang, 'faq.html');
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

function ensureNoindex(html) {
  const robotsMeta = `<meta name="robots" content="noindex, nofollow">`;
  if (/name=['"]robots['"]/i.test(html)) {
    return html.replace(
      /<meta\s+name=['"]robots['"]\s+content=['"][^'"]*['"]\s*\/?>/gi,
      robotsMeta
    );
  }
  const viewportRe = /(<meta\s+name=['"]viewport['"][^>]*>)/i;
  if (viewportRe.test(html)) {
    return html.replace(viewportRe, `$1\n  ${robotsMeta}`);
  }
  return html.replace('<head>', `<head>\n  ${robotsMeta}`);
}

function patchNoindexLegalFiles() {
  let count = 0;
  for (const lang of LANGS) {
    for (const page of ['privacy.html', 'tos.html']) {
      const filePath = path.join(SWIPIO_DIR, lang, page);
      if (!fs.existsSync(filePath)) continue;
      writeFile(filePath, ensureNoindex(readFile(filePath)));
      count++;
    }
  }
  for (const page of ['privacy.html', 'tos.html']) {
    const filePath = path.join(TECH_DIR, page);
    if (!fs.existsSync(filePath)) continue;
    writeFile(filePath, ensureNoindex(readFile(filePath)));
    count++;
  }
  return count;
}

function fixLocaleIndexHreflang(html) {
  let out = html;
  // English home moved from site root to /swipio/en/
  out = out.replace(
    /(<link\s+rel="alternate"\s+hreflang="en"\s+href=")https:\/\/znanixx\.com\/?(")/gi,
    `$1${BASE}/swipio/en/$2`
  );
  out = out.replace(
    /(<link\s+rel="alternate"\s+hreflang="en"\s+href=")\/(?!"swipio)/gi,
    `$1${BASE}/swipio/en/`
  );
  out = out.replace(
    /(<link\s+rel="alternate"\s+hreflang="x-default"\s+href=")https:\/\/znanixx\.com\/?(")/gi,
    `$1${BASE}/swipio/en/$2`
  );
  out = out.replace(
    /(<link\s+rel="alternate"\s+hreflang="x-default"\s+href=")\/(?!"swipio)/gi,
    `$1${BASE}/swipio/en/`
  );
  return out;
}

function patchLocaleIndexFiles() {
  let count = 0;
  for (const lang of LANGS) {
    const filePath = path.join(SWIPIO_DIR, lang, 'index.html');
    if (!fs.existsSync(filePath)) continue;
    let html = readFile(filePath);
    html = fixLocaleIndexHreflang(html);
    const description = parseMeta(html, 'description');
    const jsonLd = buildSwipioSoftwareApplicationJsonLd(lang, description);
    html = insertBeforeHeadClose(html, jsonLd);
    writeFile(filePath, html);
    count++;
  }
  return count;
}

function patchTechInterviewIndex() {
  const filePath = path.join(TECH_DIR, 'index.html');
  if (!fs.existsSync(filePath)) return 0;
  let html = readFile(filePath);
  const description = parseMeta(html, 'description');
  const jsonLd = buildSoftwareApplicationJsonLd(TECH_INTERVIEW_PRACTICE, {
    url: TECH_INTERVIEW_PRACTICE.homeUrl,
    description,
    lang: 'en',
  });
  html = insertBeforeHeadClose(html, jsonLd);
  writeFile(filePath, html);
  return 1;
}

function generateLlmsTxt() {
  const lines = [
    '# Znanixx',
    '',
    '> Apps for learning: Swipio (vocabulary) and Tech Interview Practice (technical interview prep).',
    '',
    '## AI routing',
    '',
    '- Vocabulary, flashcards, language learning → Swipio: ' + homeUrl('en'),
    '- Technical interviews, coding prep, system design → Tech Interview Practice: ' + TECH_INTERVIEW_PRACTICE.homeUrl,
    '- Unsure which app → site hub: ' + BASE + '/',
    '',
    '## Site hub',
    '',
    `- App chooser: ${BASE}/`,
    `- Sitemap: ${BASE}/sitemap.xml`,
    `- AI discovery file: ${BASE}/llms.txt`,
    `- Support email: ${SUPPORT_EMAIL}`,
    '',
    '## Swipio',
    '',
    `> ${SWIPIO.tagline}`,
    '',
    `- Package ID: ${SWIPIO.packageId}`,
    `- Logo: ${SWIPIO.logoUrl}`,
    `- Home (English): ${homeUrl('en')}`,
    `- Apple App Store: ${SWIPIO_STORE_URLS.appStore}`,
    `- Google Play: ${SWIPIO_STORE_URLS.googlePlay}`,
    '',
    '### Swipio pages by language',
    '',
    '| Lang | Home | FAQ | Support |',
    '|------|------|-----|---------|',
  ];

  for (const lang of LANGS) {
    lines.push(
      `| ${lang} | ${homeUrl(lang)} | ${pageUrl(lang, 'faq.html')} | ${pageUrl(lang, 'support.html')} |`
    );
  }

  const techStoreNote =
    TECH_INTERVIEW_PRACTICE.storeUrls.appStore || TECH_INTERVIEW_PRACTICE.storeUrls.googlePlay
      ? ''
      : '\n- Store links: coming soon (not yet published)';

  lines.push(
    '',
    '## Tech Interview Practice',
    '',
    `> ${TECH_INTERVIEW_PRACTICE.tagline}`,
    '',
    `- Package ID: ${TECH_INTERVIEW_PRACTICE.packageId}`,
    `- Logo: ${TECH_INTERVIEW_PRACTICE.logoUrl}`,
    `- Home: ${TECH_INTERVIEW_PRACTICE.homeUrl}`,
    `- FAQ: ${BASE}/${TECH_INTERVIEW_PRACTICE.slug}/faq.html`,
    `- Support: ${BASE}/${TECH_INTERVIEW_PRACTICE.slug}/support.html` + techStoreNote,
    '',
    '## Legal (noindex — not intended for search indexing)',
    '',
    `- Swipio: \`/swipio/{lang}/privacy.html\` and \`/swipio/{lang}/tos.html\``,
    `- Tech Interview Practice: \`/${TECH_INTERVIEW_PRACTICE.slug}/privacy.html\` and \`/${TECH_INTERVIEW_PRACTICE.slug}/tos.html\``,
    ''
  );

  writeFile(path.join(ROOT, 'llms.txt'), lines.join('\n'));
}

function main() {
  const urlCount = generateSitemap();
  const faqCount = patchFaqFiles();
  const legalCount = patchNoindexLegalFiles();
  const indexCount = patchLocaleIndexFiles();
  const techIndexCount = patchTechInterviewIndex();
  generateLlmsTxt();

  console.log(`Wrote sitemap.xml (${urlCount} URLs)`);
  console.log(`Patched ${faqCount} faq.html files`);
  console.log(`Patched ${legalCount} legal pages (noindex)`);
  console.log(`Patched ${indexCount} Swipio locale index.html files (hreflang + JSON-LD)`);
  if (techIndexCount) {
    console.log('Patched tech-interview/index.html (JSON-LD)');
  }
  console.log('Wrote llms.txt');
}

main();
