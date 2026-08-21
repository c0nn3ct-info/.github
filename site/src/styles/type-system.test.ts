import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const CSS = readFileSync(join(__dirname, 'globals.css'), 'utf8');

const SOURCES = ['src/components', 'src/pages'].flatMap((dir) =>
  readdirSync(dir)
    .filter((f) => f.endsWith('.tsx') && !f.endsWith('.test.tsx'))
    .map((f) => [join(dir, f), readFileSync(join(dir, f), 'utf8')] as const),
);

/** Every className string in a source file, one per match. */
function classNames(src: string): string[] {
  return [...src.matchAll(/className="([^"]*)"/g), ...src.matchAll(/className=\{`([^`]*)`\}/g)].map(
    (m) => m[1],
  );
}

describe('label roles', () => {
  // The design port shipped 48 label nodes rendering 28 different combinations
  // of size, weight and tracking, because each one was written inline on top of
  // the class it was meant to reuse. Three roles replaced them. A new label
  // written inline would rebuild the drift one element at a time, so the roles
  // own uppercase and positive tracking and nothing else may declare them.
  it('are the only thing that sets uppercase or letter-tracking', () => {
    for (const [file, src] of SOURCES) {
      for (const cn of classNames(src)) {
        const inline = /(^|\s)(uppercase|tracking-\[0\.)/.test(cn);
        expect({ file, cn, inline }).toEqual({ file, cn, inline: false });
      }
    }
  });

  // Negative tracking is a token too, so the script overrides below can reach
  // it. A literal em value in a component is invisible to them.
  it('leave no negative tracking literal in a component', () => {
    for (const [file, src] of SOURCES) {
      const literals = [...src.matchAll(/tracking-\[-[\d.]+em\]/g)].map((m) => m[0]);
      expect({ file, literals }).toEqual({ file, literals: [] });
    }
  });

  it('define each role once, in the stylesheet', () => {
    for (const role of ['.eyebrow', '.tag', '.ordinal', '.note']) {
      expect({ role, count: CSS.split(`\n  ${role} {`).length - 1 }).toEqual({ role, count: 1 });
    }
  });
});

describe('script-aware tracking', () => {
  const TOKENS = [
    '--track-display',
    '--track-h1',
    '--track-title',
    '--track-name',
    '--track-body',
    '--track-eyebrow',
    '--track-tag',
    '--track-ordinal',
  ];

  /** The declarations inside one `:root:lang(...)` block. */
  function langBlock(lang: string): string {
    const at = CSS.indexOf(`:root:lang(${lang})`);
    expect({ lang, present: at !== -1 }).toEqual({ lang, present: true });
    return CSS.slice(at, CSS.indexOf('}', at));
  }

  it('names every tracked role as a token, so an override can reach it', () => {
    for (const token of TOKENS) {
      expect({ token, declared: CSS.includes(`${token}:`) }).toEqual({ token, declared: true });
    }
  });

  // Arabic and Persian draw the letters of a word joined. Latin tracking cuts
  // the joins: it measured 4.1% and 4.7% of extra width on the hero eyebrow,
  // with the word visibly coming apart. Nothing on those pages is tracked.
  it('zeroes every step for Arabic and Persian', () => {
    const block = langBlock('ar') + langBlock('fa');
    for (const token of TOKENS) {
      expect({ token, zeroed: block.includes(`${token}: 0em`) }).toEqual({ token, zeroed: true });
    }
  });

  // Chinese sets solid on a square em, so a negative step overlaps the glyph
  // next to it. Positive tracking suits it and stays.
  it('drops the negative steps for Chinese and keeps the positive ones', () => {
    const block = langBlock('zh');
    for (const token of ['--track-display', '--track-h1', '--track-title', '--track-name']) {
      expect({ token, zeroed: block.includes(`${token}: 0em`) }).toEqual({ token, zeroed: true });
    }
    for (const token of ['--track-eyebrow', '--track-tag', '--track-ordinal']) {
      expect({ token, overridden: block.includes(token) }).toEqual({ token, overridden: false });
    }
  });
});

describe('webfont delivery', () => {
  // A local() fallback with no range claims every codepoint the local font
  // happens to hold. Arial and Courier New hold Arabic and Cyrillic on macOS,
  // so an open range put the Persian headline in Arial and the Arabic labels
  // in Courier, ahead of the faces that can actually set them.
  it('bounds every metric-matched fallback to a unicode-range', () => {
    for (const family of ['Hanken Fallback', 'JetBrains Fallback']) {
      const at = CSS.indexOf(`font-family: '${family}'`);
      const block = CSS.slice(at, CSS.indexOf('}', at));
      expect({ family, bounded: block.includes('unicode-range:') }).toEqual({
        family,
        bounded: true,
      });
      expect({ family, adjusted: block.includes('size-adjust:') }).toEqual({
        family,
        adjusted: true,
      });
    }
  });

  it('ships every font file the stylesheet asks for', () => {
    const asked = [...CSS.matchAll(/url\('\/fonts\/([^']+)'\)/g)].map((m) => m[1]);
    const onDisk = readdirSync('public/fonts');
    expect(asked.length).toBeGreaterThan(0);
    for (const file of asked) {
      expect({ file, present: onDisk.includes(file) }).toEqual({ file, present: true });
    }
  });

  // A face nobody fetches is weight the repo carries for nothing. latin-ext
  // was dropped for exactly this reason, so the check runs both ways.
  it('asks for every font file it ships', () => {
    const asked = [...CSS.matchAll(/url\('\/fonts\/([^']+)'\)/g)].map((m) => m[1]);
    for (const file of readdirSync('public/fonts').filter((f) => f.endsWith('.woff2'))) {
      expect({ file, used: asked.includes(file) }).toEqual({ file, used: true });
    }
  });
});

describe('page shells', () => {
  const SHELLS = ['pages/index.html', 'pages/ru/index.html', 'pages/ar/index.html'];

  // The label face carries the ordinals and the address on every locale, so
  // the latin cut is on the critical path everywhere, not just in English.
  it('preload both faces that paint above the fold', () => {
    for (const shell of SHELLS) {
      const html = readFileSync(shell, 'utf8');
      for (const font of ['hanken-grotesk-var.woff2', 'jetbrains-mono-latin.woff2']) {
        const preloaded = new RegExp(`rel="preload"[^>]*>?[\\s\\S]{0,120}${font}`).test(html);
        expect({ shell, font, preloaded }).toEqual({ shell, font, preloaded: true });
      }
    }
  });

  // Russian sets its labels in Cyrillic, so that cut is critical there and
  // nowhere else; unicode-range keeps every other locale from fetching it.
  it('preload the cyrillic cut on ru alone', () => {
    for (const shell of SHELLS) {
      const has = readFileSync(shell, 'utf8').includes('jetbrains-mono-cyrillic.woff2');
      expect({ shell, has }).toEqual({ shell, has: shell.includes('/ru/') });
    }
  });
});
