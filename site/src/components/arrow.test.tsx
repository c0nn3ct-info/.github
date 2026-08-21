import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { render } from '../test/render';
import { Arrow } from './arrow';

/** The lucide glyph behind a rendered arrow, e.g. `arrow-up-right`. */
function glyph(container: HTMLElement): string {
  const svg = container.querySelector('svg');
  return (
    [...(svg?.classList ?? [])].find((c) => c.startsWith('lucide-'))?.replace('lucide-', '') ?? ''
  );
}

describe('Arrow', () => {
  it('points along the page for a destination inside it', () => {
    const { container } = render(<Arrow />);
    expect(glyph(container)).toBe('arrow-right');
  });

  it('points out of the page for a destination that leaves it', () => {
    const { container } = render(<Arrow away />);
    expect(glyph(container)).toBe('arrow-up-right');
  });

  // Both point along the reading direction, so both flip with it. The pane
  // links used to mirror one and not the other.
  it('mirrors both directions under rtl', () => {
    for (const away of [false, true]) {
      const { container } = render(<Arrow away={away} />);
      expect({ away, mirrored: container.querySelector('svg')?.classList.contains('rtl:-scale-x-100') }).toEqual({
        away,
        mirrored: true,
      });
    }
  });

  // Sized against its label rather than per call site: the seven it replaced
  // ran 9px to 15px for the same mark.
  it('takes its size from the text it sits in', () => {
    const { container } = render(<Arrow />);
    const cls = container.querySelector('svg')?.className.baseVal ?? '';
    expect({ h: cls.includes('h-[1em]'), w: cls.includes('w-[1em]') }).toEqual({ h: true, w: true });
  });

  it('stays out of the accessibility tree, since the label carries the meaning', () => {
    const { container } = render(<Arrow away />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden');
  });
});

describe('the page draws its arrows', () => {
  const SOURCES = ['src/components', 'src/pages'].flatMap((dir) =>
    readdirSync(dir)
      .filter((f) => f.endsWith('.tsx') && !f.endsWith('.test.tsx'))
      .map((f) => [join(dir, f), readFileSync(join(dir, f), 'utf8')] as const),
  );

  // Seven arrows were typed characters sitting beside real icons that meant
  // the same thing, so the page shipped two arrow families: whichever font
  // caught the glyph, next to lucide. The one in the footer was loose in a text
  // node, which a screen reader read out as part of the link.
  it('never as a typed character', () => {
    for (const [file, src] of SOURCES) {
      // arrow.tsx names the two it replaced, in the comment explaining why.
      if (file.endsWith('arrow.tsx')) continue;
      const glyphs = [...src.matchAll(/[←-⇿⟰-⟿➔-➿]/g)].map(
        (m) => m[0],
      );
      expect({ file, glyphs }).toEqual({ file, glyphs: [] });
    }
  });

  // One implementation for the two inline directions, so the next call site
  // cannot invent an eighth size or forget the rtl flip. ArrowLeft and
  // ArrowDown stay outside it on purpose: those two are button icons, sized to
  // the control they sit in rather than to a run of text.
  it('through the one component, never a bare inline lucide arrow', () => {
    for (const [file, src] of SOURCES) {
      if (file.endsWith('arrow.tsx')) continue;
      const bare = [...src.matchAll(/<(Arrow(?:Right|UpRight))\b/g)].map((m) => m[1]);
      expect({ file, bare }).toEqual({ file, bare: [] });
    }
  });
});
