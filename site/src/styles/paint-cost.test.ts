import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const CSS = readFileSync(join(__dirname, 'globals.css'), 'utf8');

/** The declarations of the first rule whose selector list is exactly `selector`. */
function rule(selector: string): string {
  const at = CSS.search(new RegExp(`(^|\\n)\\s*${selector.replace(/[.[\]()*+?^$|\\]/g, '\\$&')}\\s*\\{`));
  expect(at, selector).toBeGreaterThanOrEqual(0);
  const open = CSS.indexOf('{', at);
  return CSS.slice(open + 1, CSS.indexOf('}', open));
}

describe('what the page pays for every frame', () => {
  // Measured on a production build in Chrome at 390px, CPU x4: with the bar's
  // backdrop blur the first frames of a scroll ran 67-333ms in a quarter of
  // the runs, and none of eight did without it. The blur only ever softened
  // what a translucent fill let through, so the fill is solid instead.
  it('keeps the bar solid and unblurred', () => {
    const bar = rule('.site-header');
    expect(bar).not.toMatch(/backdrop-filter/);
    expect(bar).toMatch(/background:\s*var\(--stage\)/);
    for (const value of CSS.matchAll(/--bar:\s*([^;]+);/g)) {
      expect(value[1]).not.toMatch(/\/\s*0\./);
    }
  });

  // Under rtl the two copies of the belt are laid out leftwards from the right
  // edge, so the same leftward slide carried the first copy out and never
  // brought the second in: measured at 390px in Arabic, the belt was empty
  // for most of each 46s loop. It slides the other way there.
  it('runs the belt the way the page reads', () => {
    const flat = CSS.replace(/\s+/g, ' ');
    expect(flat).toMatch(/\[dir='rtl'\] \.marquee-track \{ animation-name: marquee-rtl; \}/);
    expect(flat).toMatch(/@keyframes marquee-rtl \{ to \{ transform: translateX\(50%\); \} \}/);
  });
});
