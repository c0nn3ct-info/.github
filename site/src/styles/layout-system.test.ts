import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const CSS = readFileSync(join(__dirname, 'globals.css'), 'utf8');

const SOURCES = ['src/components', 'src/pages'].flatMap((dir) =>
  readdirSync(dir)
    .filter((f) => f.endsWith('.tsx') && !f.endsWith('.test.tsx'))
    .map((f) => [join(dir, f), readFileSync(join(dir, f), 'utf8')] as const),
);

describe('the page column', () => {
  // The contact slab and the footer capped themselves at 1440, the work pane at
  // 1200, and the habits and promises at nothing, so at 1920 the left edge of
  // the content moved 20, 240, 490, 20, 240 as a reader scrolled. One column
  // now owns the measure and one token owns the gutter.
  it('is the only thing that sets a page measure', () => {
    for (const [file, src] of SOURCES) {
      const caps = [...src.matchAll(/max-w-\[(\d+)px\]/g)]
        .map((m) => Number(m[1]))
        .filter((px) => px >= 900);
      expect({ file, caps }).toEqual({ file, caps: [] });
    }
  });

  it('is the only thing that sets a page gutter', () => {
    for (const [file, src] of SOURCES) {
      // A section paints edge to edge, so any horizontal padding on one is the
      // gutter by another name.
      const sections = [
        ...src.matchAll(/<(?:section|footer|main)\b[^>]*className="([^"]*)"/g),
      ].map((m) => m[1]);
      for (const cn of sections) {
        const ownGutter = /(^|\s)(px|ps|pe)-(?!\[var\(--gutter\)\])[\w.[\]]+/.test(cn);
        expect({ file, cn: cn.slice(0, 60), ownGutter }).toEqual({
          file,
          cn: cn.slice(0, 60),
          ownGutter: false,
        });
      }
    }
  });

  // The hero is the exception and stays full bleed, because its split between
  // the dark stage and the light index is the composition.
  it('reaches every band of the page except the hero', () => {
    const banded = SOURCES.filter(([f]) =>
      /(work|practices|promises|talk|site-footer)\.tsx$/.test(f),
    );
    expect(banded.length).toBe(5);
    for (const [file, src] of banded) {
      expect({ file, pad: src.includes('page-pad') }).toEqual({ file, pad: true });
      expect({ file, col: src.includes('page-col') }).toEqual({ file, col: true });
    }
    const hero = SOURCES.find(([f]) => f.endsWith('hero.tsx'))![1];
    expect(hero.includes('page-pad')).toBe(false);
  });
});

describe('the proximity scale', () => {
  const step = (name: string) => {
    const m = CSS.match(new RegExp(`--gap-${name}:\\s*(\\d+)px`));
    expect({ name, declared: Boolean(m) }).toEqual({ name, declared: true });
    return Number(m![1]);
  };

  // Spacing is a ratio before it is a number. The promise cards used to space
  // their own contents by 10px and separate the cards by 14px, so the borders
  // did all the grouping and the reader read a grid of boxes.
  it('separates groups by more than it separates their parts', () => {
    const knit = step('knit');
    const group = step('group');
    const part = step('part');
    const band = step('band');
    expect({ knit, group, part, band }).toEqual({ knit, group, part, band });
    expect(knit).toBeLessThan(group);
    expect(group).toBeLessThan(part);
    expect(part).toBeLessThan(band);
    // Each step has to be far enough from the last to read as a different
    // interval rather than as an inconsistency.
    expect(group / knit).toBeGreaterThanOrEqual(1.5);
    expect(part / group).toBeGreaterThanOrEqual(1.5);
  });

  it('names the column and the gutter as tokens too', () => {
    for (const token of ['--page-max', '--gutter']) {
      expect({ token, declared: CSS.includes(`${token}:`) }).toEqual({ token, declared: true });
    }
  });
});
