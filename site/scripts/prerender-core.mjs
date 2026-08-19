// Prerender/sitemap generation. Split from the entry point so it can be imported
// (and tested) without launching a browser — scripts/prerender.mjs is the
// two-line entry that runs main().
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import handler from 'serve-handler';
import puppeteer from 'puppeteer';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const distDir = resolve(root, 'dist');

const ORIGIN = 'https://c0nn3ct.info';
const GITHUB_ORG = 'https://github.com/c0nn3ct-info';

const PAGE_PATH = {
  home: '/',
  'not-found': '/404.html',
};

// Doubles as the sitemap roster: pages without a priority (the 404) are
// prerendered but never listed.
const PRIORITY = { home: '1.0' };

const LOCALES = ['en'];

const OG_LOCALE = { en: 'en_US' };

const OG_IMAGE_ALT = {
  en: 'c0nn3ct.info: small, finished software that stays on your side of the wire',
};

const DICT = Object.fromEntries(
  await Promise.all(
    LOCALES.map(async (l) => [
      l,
      JSON.parse(await readFile(resolve(root, `src/i18n/${l}.json`), 'utf8')),
    ]),
  ),
);

export function pathFor(page, locale) {
  // Unknown pages fall back to a conventional path so every branch below is
  // reachable while the site ships a single route.
  const base = PAGE_PATH[page] ?? `/${page}/`;
  if (locale === 'en') return base;
  if (base === '/') return `/${locale}/`;
  return `/${locale}${base}`;
}

export function diskPath(page, locale) {
  const p = pathFor(page, locale);
  if (p === '/') return resolve(distDir, 'index.html');
  // GitHub Pages only honours a 404.html at the exact URL, so .html paths map
  // to themselves instead of a directory index.
  if (p.endsWith('.html')) return resolve(distDir, p.replace(/^\//, ''));
  return resolve(distDir, p.replace(/^\//, '').replace(/\/$/, ''), 'index.html');
}

// The locale list is a parameter so the alternate branches stay exercisable
// while the site ships English only.
export function getMeta(page, locale, locales = LOCALES) {
  const dict = DICT[locale] ?? DICT.en;
  const path = pathFor(page, locale);
  const url = `${ORIGIN}${path}`;
  return {
    title: dict[`${page}.title`] ?? 'c0nn3ct.info',
    description: dict[`${page}.description`] ?? '',
    canonical: url,
    hreflang: [
      ...locales.map((l) => ({ lang: l, href: `${ORIGIN}${pathFor(page, l)}` })),
      { lang: 'x-default', href: `${ORIGIN}${pathFor(page, 'en')}` },
    ],
    og: {
      type: 'website',
      locale: OG_LOCALE[locale],
      localeAlternate: locales.filter((l) => l !== locale).map((l) => OG_LOCALE[l] ?? l),
      image: `${ORIGIN}/og-preview.jpg?v=2`,
      url,
      siteName: 'c0nn3ct.info',
    },
    twitter: {
      card: 'summary_large_image',
      image: `${ORIGIN}/og-preview.jpg?v=2`,
    },
  };
}

export function jsonLdBlocks(page, locale) {
  const dict = DICT[locale] ?? DICT.en;
  const url = `${ORIGIN}${pathFor(page, locale)}`;
  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'c0nn3ct.info',
    url: ORIGIN,
    logo: `${ORIGIN}/favicon.svg`,
    email: 'hello@c0nn3ct.info',
    sameAs: [GITHUB_ORG],
  };
  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'c0nn3ct.info',
    url,
    description: dict[`${page}.description`],
    inLanguage: [...LOCALES],
    publisher: organization,
  };
  return [organization, website];
}

export function escapeHtmlAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

export function escapeHtmlText(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function buildHeadInjection(page, locale, locales = LOCALES) {
  const meta = getMeta(page, locale, locales);
  const blocks = jsonLdBlocks(page, locale);
  // Keyed by the same LOCALES list as the dictionaries, so every locale that
  // gets this far has an entry.
  const ogImageAlt = OG_IMAGE_ALT[locale] ?? OG_IMAGE_ALT.en;
  const lines = [];
  lines.push(`<link rel="canonical" href="${escapeHtmlAttr(meta.canonical)}" />`);
  for (const h of meta.hreflang) {
    lines.push(
      `<link rel="alternate" hreflang="${h.lang}" href="${escapeHtmlAttr(h.href)}" />`,
    );
  }
  lines.push(`<meta property="og:type" content="${meta.og.type}" />`);
  lines.push(`<meta property="og:site_name" content="${escapeHtmlAttr(meta.og.siteName)}" />`);
  lines.push(`<meta property="og:locale" content="${meta.og.locale}" />`);
  for (const alt of meta.og.localeAlternate) {
    lines.push(`<meta property="og:locale:alternate" content="${alt}" />`);
  }
  lines.push(`<meta property="og:url" content="${escapeHtmlAttr(meta.og.url)}" />`);
  lines.push(`<meta property="og:title" content="${escapeHtmlAttr(meta.title)}" />`);
  lines.push(
    `<meta property="og:description" content="${escapeHtmlAttr(meta.description)}" />`,
  );
  lines.push(`<meta property="og:image" content="${escapeHtmlAttr(meta.og.image)}" />`);
  lines.push(`<meta property="og:image:secure_url" content="${escapeHtmlAttr(meta.og.image)}" />`);
  lines.push(`<meta property="og:image:type" content="image/jpeg" />`);
  lines.push(`<meta property="og:image:width" content="1200" />`);
  lines.push(`<meta property="og:image:height" content="630" />`);
  lines.push(`<meta property="og:image:alt" content="${escapeHtmlAttr(ogImageAlt)}" />`);
  lines.push(`<meta name="twitter:card" content="${meta.twitter.card}" />`);
  lines.push(`<meta name="twitter:title" content="${escapeHtmlAttr(meta.title)}" />`);
  lines.push(
    `<meta name="twitter:description" content="${escapeHtmlAttr(meta.description)}" />`,
  );
  lines.push(`<meta name="twitter:image" content="${escapeHtmlAttr(meta.twitter.image)}" />`);
  lines.push(`<meta name="twitter:image:alt" content="${escapeHtmlAttr(ogImageAlt)}" />`);
  for (const b of blocks) {
    lines.push(
      `<script type="application/ld+json">${JSON.stringify(b)}</script>`,
    );
  }
  return lines.join('\n    ');
}

export function injectIntoHead(html, injection, newTitle, newDescription) {
  let out = html;
  out = out.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtmlText(newTitle)}</title>`);
  out = out.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/,
    `<meta name="description" content="${escapeHtmlAttr(newDescription)}" />`,
  );
  out = out.replace('</head>', `    ${injection}\n  </head>`);
  return out;
}

export function startServer(port) {
  const server = createServer((req, res) => handler(req, res, { public: distDir }));
  return new Promise((resolveP) => server.listen(port, () => resolveP(server)));
}

export function buildSitemap(lastmod) {
  const pages = Object.keys(PRIORITY);
  const locales = LOCALES;
  const urls = [];
  for (const page of pages) {
    for (const locale of locales) {
      const url = `${ORIGIN}${pathFor(page, locale)}`;
      const alts = locales
        .map(
          (l) =>
            `    <xhtml:link rel="alternate" hreflang="${l}" href="${ORIGIN}${pathFor(page, l)}" />`,
        )
        .join('\n');
      urls.push(
        `  <url>
    <loc>${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${PRIORITY[page]}</priority>
${alts}
    <xhtml:link rel="alternate" hreflang="x-default" href="${ORIGIN}${pathFor(page, 'en')}" />
  </url>`,
      );
    }
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`;
}

// A sitemap index is not strictly needed at this scale, but search consoles
// accept it and it future-proofs splitting the sitemap later.
export function buildSitemapIndex(lastmod) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${ORIGIN}/sitemap.xml</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${ORIGIN}/site.xml</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>
</sitemapindex>
`;
}

// Takes the platform rather than reading it, so every branch is reachable on
// any host (the same reason the Go side passes GOOS around).
export function findSystemChrome(platform = process.platform) {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) return process.env.PUPPETEER_EXECUTABLE_PATH;
  const candidates =
    platform === 'darwin'
      ? [
          '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
          '/Applications/Chromium.app/Contents/MacOS/Chromium',
          '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
        ]
      : platform === 'linux'
        ? ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser']
        : ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'];
  return candidates.find((p) => {
    try {
      return statSync(p).isFile();
    } catch {
      return false;
    }
  });
}

export async function main() {
  const port = 4321 + Math.floor(Math.random() * 1000);
  const server = await startServer(port);
  const executablePath = findSystemChrome();
  const launchOpts = { headless: true };
  if (executablePath) {
    launchOpts.executablePath = executablePath;
    console.log(`using system Chrome: ${executablePath}`);
  }
  const browser = await puppeteer.launch(launchOpts);

  try {
    const pages = Object.keys(PAGE_PATH);
    const locales = LOCALES;

    for (const page of pages) {
      for (const locale of locales) {
        const url = `http://localhost:${port}${pathFor(page, locale)}`;
        const target = diskPath(page, locale);
        const p = await browser.newPage();
        await p.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
        await p.waitForFunction(
          () => {
            const r = document.getElementById('root');
            return r && r.children.length > 0;
          },
          { timeout: 10000 },
        );
        // Revert what initReveals did to the live DOM before serializing:
        // hydrateRoot diffs the served markup against the initial client render,
        // and a captured `in`/`js` class is a hydration mismatch (React #418).
        await p.evaluate(() => {
          document.documentElement.classList.remove('js');
          // The theme class mirrors the capturing browser's color scheme, not
          // the visitor's; the shell's inline script re-adds the right one.
          document.documentElement.classList.remove('dark', 'light');
          for (const el of document.querySelectorAll('.reveal.in')) el.classList.remove('in');
          // Serialization merges adjacent text nodes, which hydrateRoot then
          // cannot split back (React #425). renderToString solves this with
          // empty comment separators between text nodes; emit the same.
          const rootEl = document.getElementById('root');
          if (!rootEl) return;
          const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT);
          const texts = [];
          while (walker.nextNode()) texts.push(walker.currentNode);
          for (const t of texts) {
            if (t.nextSibling && t.nextSibling.nodeType === Node.TEXT_NODE) {
              t.parentNode.insertBefore(document.createComment(''), t.nextSibling);
            }
          }
        });
        const html = await p.evaluate(() => '<!doctype html>\n' + document.documentElement.outerHTML);
        await p.close();

        const injection = buildHeadInjection(page, locale);
        const meta = getMeta(page, locale);
        const final = injectIntoHead(html, injection, meta.title, meta.description);
        await writeFile(target, final, 'utf8');
        console.log(`✓ prerendered ${pathFor(page, locale)} → ${target.replace(distDir, '')}`);
      }
    }

    const lastmod = new Date().toISOString().slice(0, 10);
    const sitemap = buildSitemap(lastmod);
    await writeFile(resolve(distDir, 'sitemap.xml'), sitemap, 'utf8');
    console.log(`✓ wrote sitemap.xml (lastmod=${lastmod})`);
    // site.xml is an alias of sitemap.xml (identical content) served at a second path.
    await writeFile(resolve(distDir, 'site.xml'), sitemap, 'utf8');
    console.log(`✓ wrote site.xml (lastmod=${lastmod})`);
    await writeFile(resolve(distDir, 'sitemap_index.xml'), buildSitemapIndex(lastmod), 'utf8');
    console.log(`✓ wrote sitemap_index.xml (lastmod=${lastmod})`);
  } finally {
    await browser.close();
    server.close();
  }
}
