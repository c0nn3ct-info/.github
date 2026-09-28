import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SHELLS = ['', 'ru/', 'es/', 'zh-CN/', 'fa/', 'ar/'].flatMap((dir) =>
  ['index.html', '404.html'].map((page) => `pages/${dir}${page}`),
);

describe('the tab', () => {
  // The same pair noctis ships: a 32px .ico for the browsers and surfaces that
  // ask for one, and the vector mark for everything else.
  it('carries the mark as an .ico and as the vector, in every shell', () => {
    expect(existsSync('public/favicon.ico')).toBe(true);
    for (const shell of SHELLS) {
      const html = readFileSync(shell, 'utf8');
      expect({ shell, ico: html.includes('<link rel="icon" href="/favicon.ico" sizes="32x32" />') }).toEqual({
        shell,
        ico: true,
      });
      expect({ shell, svg: html.includes('<link rel="icon" type="image/svg+xml" href="/favicon.svg" />') }).toEqual({
        shell,
        svg: true,
      });
    }
  });

  // One ink and no media query (owner-directed, 2026-09-01): a favicon is
  // decoded outside the page's colour scheme, and the adaptive copy put the
  // light ink on light tab strips.
  it('draws the mark in one ink', () => {
    const svg = readFileSync('public/favicon.svg', 'utf8');
    expect(svg).not.toMatch(/@media|<style/);
    expect(svg).toMatch(/fill="#16161e"/);
  });
});
