import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const CSS = readFileSync(join(__dirname, 'globals.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const FLAT = CSS.replace(/\s+/g, ' ');

const SOURCES = ['src/components', 'src/pages'].flatMap((dir) =>
  readdirSync(dir)
    .filter((f) => f.endsWith('.tsx') && !f.endsWith('.test.tsx'))
    .map((f) => [join(dir, f), readFileSync(join(dir, f), 'utf8')] as const),
);

describe('what the page asks the eye to look at', () => {
  // Two identical white pills on the first screen split the reader's attention
  // between the header's "write to us" and the hero's "see the products". The
  // header's is an outline on both grounds, because on the page ground the
  // products pane and the contact slab carry their own filled action.
  it('never adds a second filled pill to a screen', () => {
    expect(FLAT).toMatch(/\.header-cta \{[^}]*background: transparent;/);
    expect(FLAT).not.toMatch(/\.site-header\[data-ground='page'\] \.header-cta \{[^}]*background:/);
    expect(FLAT).toMatch(/\.site-header\[data-ground='page'\] \.header-cta \{[^}]*border-color: hsl\(var\(--on-surface\) \/ 0\.4\);/);
  });

  // The selected rail row and the focus ring were both the page's ink, told
  // apart by shape alone. Focus takes the wire's colour, the one accent the page
  // already has, and selection stays achromatic.
  it('rings focus in its own colour', () => {
    expect(FLAT).toMatch(/outline: 2px solid var\(--focus-ring, var\(--wire-go\)\);/);
    expect(FLAT).toMatch(/--focus-ring: var\(--wire-go-on-dark\);/);
    expect(FLAT).not.toMatch(/--focus-ring: (#fff|#111|hsl\(var\(--on-surface\)\))/);
  });

  // Pure white on near-black glares; the stage's ink is a step down from it.
  it('sets the dark surfaces in their own ink, not in pure white', () => {
    expect(FLAT).toMatch(/--on-stage: [^;]+;/);
    expect(FLAT).not.toMatch(/(^|[^-])color: #fff;/);
    for (const [file, src] of SOURCES) {
      expect({ file, white: /\btext-white\b/.test(src) }).toEqual({ file, white: false });
    }
  });

  // A card nobody can click should not lift under the pointer as if it could.
  it('keeps the fact cards still', () => {
    expect(FLAT).not.toMatch(/\.fact-card:hover/);
  });
});
