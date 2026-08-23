// The prerender generator. Everything but main() is pure string work, so it is
// tested directly; main() runs against a mocked puppeteer and file system.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LOCALES } from '../src/i18n/index.ts';

const PAGES = ['home', 'not-found'];
// The 404 page is prerendered but deliberately left out of the sitemap.
const SITEMAP_PAGES = ['home'];

const written = new Map();
const writeFile = vi.fn((path, body) => {
  written.set(String(path), String(body));
  return Promise.resolve();
});
// The core loads the real locale catalogues through readFile, so JSON reads pass
// through to disk; only writes are captured.
vi.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal();
  const readFile = vi.fn((p, enc) =>
    String(p).endsWith('.json')
      ? actual.readFile(p, enc)
      : Promise.resolve('<!doctype html><html><head></head><body></body></html>'),
  );
  return { readFile, writeFile, default: { readFile, writeFile } };
});

const chromeAt = { path: null, all: false };
const statSync = vi.fn((p) => {
  if (chromeAt.all || (chromeAt.path && String(p) === chromeAt.path)) {
    return { isFile: () => true };
  }
  throw new Error('ENOENT');
});
vi.mock('node:fs', () => ({ statSync, default: { statSync } }));

const closed = { server: 0, browser: 0 };
const listen = vi.fn((port, cb) => cb());
const createServer = vi.fn((handler) => ({
  listen,
  handler,
  close: () => {
    closed.server += 1;
  },
}));
vi.mock('node:http', () => ({ createServer, default: { createServer } }));
vi.mock('serve-handler', () => ({ default: vi.fn() }));

// The page stub runs the callbacks the script hands it, so the readiness
// predicate and the serializer are exercised rather than skipped.
const pageStub = {
  goto: vi.fn(() => Promise.resolve()),
  waitForFunction: vi.fn((fn) => Promise.resolve(fn())),
  evaluate: vi.fn((fn) => Promise.resolve(fn())),
  close: vi.fn(() => Promise.resolve()),
};
const launch = vi.fn(() =>
  Promise.resolve({
    newPage: () => Promise.resolve(pageStub),
    close: () => {
      closed.browser += 1;
      return Promise.resolve();
    },
  }),
);
vi.mock('puppeteer', () => ({ default: { launch: (...a) => launch(...a) } }));

const core = await import('./prerender-core.mjs');

beforeEach(() => {
  written.clear();
  closed.server = 0;
  closed.browser = 0;
  chromeAt.path = null;
  chromeAt.all = false;
  delete process.env.PUPPETEER_EXECUTABLE_PATH;
  launch.mockClear();
  pageStub.goto.mockClear();
});

afterEach(() => {
  vi.restoreAllMocks?.();
});

describe('pathFor and diskPath', () => {
  it('keeps English at the root and prefixes hypothetical locales', () => {
    expect(core.pathFor('home', 'en')).toBe('/');
    expect(core.pathFor('home', 'ru')).toBe('/ru/');
    expect(core.pathFor('privacy', 'en')).toBe('/privacy/');
    expect(core.pathFor('privacy', 'ru')).toBe('/ru/privacy/');
    expect(core.pathFor('not-found', 'en')).toBe('/404.html');
    expect(core.pathFor('not-found', 'ru')).toBe('/ru/404.html');
  });

  it('maps every page and locale to a distinct file on disk', () => {
    const seen = new Set();
    for (const page of PAGES) {
      for (const locale of LOCALES) {
        const p = core.diskPath(page, locale);
        expect(p.endsWith('.html')).toBe(true);
        seen.add(p);
      }
    }
    expect(seen.size).toBe(PAGES.length * LOCALES.length);
    expect(core.diskPath('privacy', 'en').endsWith('privacy/index.html')).toBe(true);
    // GitHub Pages needs the 404 at exactly /404.html, not /404.html/index.html.
    expect(core.diskPath('not-found', 'en').endsWith('/dist/404.html')).toBe(true);
  });
});

describe('dictionary fallbacks', () => {
  it('falls back for a page the catalogue does not describe', () => {
    const meta = core.getMeta('nonexistent', 'en');
    expect(meta.title).toBe('c0nn3ct.info');
    expect(meta.description).toBe('');
  });

  it('still describes the OG image for every shipped locale', () => {
    for (const locale of LOCALES) {
      expect(core.buildHeadInjection('home', locale), locale).toContain('og:image:alt');
    }
  });
});

describe('getMeta', () => {
  it('reads title and description from the catalogue and builds canonical urls', () => {
    const meta = core.getMeta('home', 'en');
    expect(meta.title).toContain('c0nn3ct.info');
    expect(meta.description).toContain('answers to you');
    expect(meta.canonical).toBe('https://c0nn3ct.info/');
    expect(meta.og.siteName).toBe('c0nn3ct.info');
    expect(meta.og.localeAlternate).toEqual(['ru_RU', 'es_ES', 'zh_CN', 'fa_IR', 'ar_AR']);
    expect(meta.hreflang).toHaveLength(LOCALES.length + 1);
    expect(meta.hreflang.at(-1)).toEqual({ lang: 'x-default', href: 'https://c0nn3ct.info/' });
  });
});

describe('jsonLdBlocks', () => {
  it('describes the organisation and the site, and nothing product-shaped', () => {
    const blocks = core.jsonLdBlocks('home', 'en');
    expect(blocks.map((b) => b['@type'])).toEqual(['Organization', 'WebSite']);
    const org = blocks[0];
    expect(org.name).toBe('c0nn3ct.info');
    expect(org.email).toBe('hello@c0nn3ct.info');
    expect(org.sameAs).toContain('https://github.com/c0nn3ct-info');
    expect(blocks[1].publisher).toBe(org);
    expect(JSON.stringify(blocks)).not.toContain('SoftwareApplication');
  });
});

describe('locale alternates', () => {
  it('maps every shipped locale to its OG tag', () => {
    const meta = core.getMeta('home', 'ru', ['en', 'ru']);
    expect(meta.og.locale).toBe('ru_RU');
    expect(meta.og.localeAlternate).toEqual(['en_US']);
    const injection = core.buildHeadInjection('home', 'ru', ['en', 'ru']);
    expect(injection).toContain('og:locale:alternate');
    expect(injection).toContain('hreflang="en"');
  });

  it('falls back to the raw tag for a locale with no OG mapping', () => {
    const meta = core.getMeta('home', 'en', ['en', 'pt']);
    expect(meta.og.localeAlternate).toEqual(['pt']);
  });

  it('reads an unknown locale through the English catalogue', () => {
    const meta = core.getMeta('home', 'pt', ['en', 'pt']);
    expect(meta.title).toContain('c0nn3ct.info');
    expect(core.buildHeadInjection('home', 'pt', ['en', 'pt'])).toContain('og:image:alt');
  });

  it('titles the card in the language of the page', () => {
    expect(core.buildHeadInjection('home', 'ru')).toContain('законченные программы');
  });

  it('names the identity itself when a page has no title of its own', () => {
    expect(core.buildHeadInjection('nameless', 'en')).toContain(
      'og:image:alt" content="c0nn3ct.info"',
    );
  });
});

describe('startServer', () => {
  it('serves the dist directory through serve-handler', async () => {
    const server = await core.startServer(4111);
    const serveHandler = (await import('serve-handler')).default;
    server.handler('req', 'res');
    expect(serveHandler).toHaveBeenCalledWith('req', 'res', expect.objectContaining({ public: expect.stringContaining('dist') }));
    server.close();
  });
});

describe('escaping', () => {
  it('escapes attribute and text contexts differently', () => {
    expect(core.escapeHtmlAttr('a & "b" <c>')).toBe('a &amp; &quot;b&quot; &lt;c>');
    expect(core.escapeHtmlText('a & <b> > c')).toBe('a &amp; &lt;b&gt; &gt; c');
  });
});

describe('buildHeadInjection and injectIntoHead', () => {
  it('injects canonical, hreflang, OG, twitter and JSON-LD into the head', () => {
    const injection = core.buildHeadInjection('home', 'en');
    expect(injection).toContain('rel="canonical"');
    expect(injection).toContain('hreflang="x-default"');
    expect(injection).toContain('og:site_name');
    expect(injection).toContain('twitter:card');
    expect(injection).toContain('application/ld+json');

    const html = [
      '<html><head><title>old</title>',
      '<meta name="description" content="old" />',
      '</head><body></body></html>',
    ].join('');
    const out = core.injectIntoHead(html, injection, 'New & <Title>', 'New "desc"');
    expect(out).toContain('<title>New &amp; &lt;Title&gt;</title>');
    expect(out).toContain('content="New &quot;desc&quot;"');
    expect(out).toContain('rel="canonical"');
    expect(out.indexOf('rel="canonical"')).toBeLessThan(out.indexOf('</head>'));
  });
});

describe('sitemaps', () => {
  it('lists every indexable page once and keeps the 404 out', () => {
    const xml = core.buildSitemap('2026-08-19');
    expect(xml).toContain('<?xml');
    expect((xml.match(/<url>/g) ?? []).length).toBe(SITEMAP_PAGES.length * LOCALES.length);
    expect(xml).toContain('<lastmod>2026-08-19</lastmod>');
    expect(xml).toContain('<priority>1.0</priority>');
    expect(xml).toContain('hreflang="x-default"');
    expect(xml).not.toContain('404.html');
  });

  it('indexes both sitemap aliases', () => {
    const xml = core.buildSitemapIndex('2026-08-19');
    expect(xml).toContain('sitemap.xml');
    expect(xml).toContain('site.xml');
    expect((xml.match(/<sitemap>/g) ?? []).length).toBe(2);
  });
});

describe('findSystemChrome', () => {
  it('prefers an explicit executable path from the environment', () => {
    process.env.PUPPETEER_EXECUTABLE_PATH = '/opt/chrome';
    expect(core.findSystemChrome('linux')).toBe('/opt/chrome');
  });

  it('walks the per-platform candidate lists', () => {
    chromeAt.path = '/usr/bin/chromium';
    expect(core.findSystemChrome('linux')).toBe('/usr/bin/chromium');
    chromeAt.path = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    expect(core.findSystemChrome('darwin')).toBe(chromeAt.path);
    chromeAt.path = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    expect(core.findSystemChrome('win32')).toBe(chromeAt.path);
  });

  it('returns undefined when nothing is installed', () => {
    expect(core.findSystemChrome('linux')).toBeUndefined();
  });
});

describe('main', () => {
  it('prerenders every page and writes all three sitemaps', async () => {
    // The readiness predicate runs against this document via the page stub;
    // give it a hydrated root so its positive branch is exercised.
    // The capturing browser's own color scheme lands on <html>; the cleanup
    // must strip it so a light-system visitor never inherits `dark`.
    document.documentElement.classList.add('dark');
    // The loop pauser writes animation-play-state onto whatever is off screen,
    // and at capture time most of the page is. Left in, every visitor is served
    // a paused marquee; under reduced motion the pauser never clears it.
    document.body.innerHTML =
      '<div id="root">' +
      '<span data-loop style="animation-play-state: paused"></span>' +
      '<span data-loop style="animation-play-state: paused; color: red"></span>' +
      '<p>hydrated</p></div>';
    // Two adjacent text nodes, as React renders around an expression child;
    // the serializer must fence them so hydration can split them again.
    document.querySelector('p').appendChild(document.createTextNode('!'));
    await core.main();

    const pages = [...written.keys()].filter((p) => p.endsWith('.html'));
    expect(pages).toHaveLength(PAGES.length * LOCALES.length);
    expect([...written.keys()].some((p) => p.endsWith('404.html'))).toBe(true);
    expect([...written.keys()].some((p) => p.endsWith('sitemap.xml'))).toBe(true);
    expect([...written.keys()].some((p) => p.endsWith('site.xml'))).toBe(true);
    expect([...written.keys()].some((p) => p.endsWith('sitemap_index.xml'))).toBe(true);

    const home = written.get([...written.keys()].find((p) => p.endsWith('index.html')));
    expect(home).toContain('rel="canonical"');
    // The capture's own theme class is gone, so the shipped page hydrates clean.
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    // Both loops ship running. The one that had nothing else in its style
    // attribute loses the attribute too, rather than shipping an empty one.
    expect(home).not.toContain('animation-play-state');
    const loops = [...document.querySelectorAll('[data-loop]')].map((el) =>
      el.getAttribute('style'),
    );
    expect(loops).toEqual([null, 'color: red;']);
    expect(home).toContain('hydrated<!---->!');
    expect(launch).toHaveBeenCalledWith({ headless: true });
    expect(closed.server).toBe(1);
    expect(closed.browser).toBe(1);
  });

  it('launches the system Chrome when one is present', async () => {
    chromeAt.all = true;
    document.body.innerHTML = '';
    await core.main();
    expect(launch).toHaveBeenCalledWith(
      expect.objectContaining({ executablePath: expect.stringContaining('Chrome') }),
    );
  });
});
