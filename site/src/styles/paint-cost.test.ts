import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const CSS = readFileSync(join(__dirname, 'globals.css'), 'utf8');
const FLAT = CSS.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ');

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

  // Seven loops on seven unrelated periods (9, 26, 46, 7, 1.1, 6 and 5
  // seconds) read as noise; on one beat and its multiples they read as a
  // machine idling. The dwell is the one written out, because the autoplay
  // parses it back, so the test holds it to half the beat by hand.
  it('runs every loop on one beat', () => {
    const beat = Number(/--beat: (\d+)s;/.exec(CSS)![1]) * 1000;
    expect(beat).toBe(9000);
    const loops = [...FLAT.matchAll(/animation: ([\w-]+) ([^;]*?) infinite;/g)].map(
      (m) => [m[1], m[2]] as const,
    );
    expect(loops.map(([name]) => name).sort()).toEqual([
      'breathe',
      'caret',
      'marquee',
      'ring-dash',
      'ring-turn',
      'scan',
      'shot-dwell',
      'wire-ride',
    ]);
    for (const [name, timing] of loops) {
      const onBeat =
        /^(var\(--beat\)|calc\(var\(--beat\) [*/] \d+\))(?: |$)/.test(timing) ||
        (name === 'shot-dwell' && timing.startsWith('var(--shot-dwell)'));
      expect({ name, onBeat }).toEqual({ name, onBeat: true });
    }
    const dwell = Number(/--shot-dwell: (\d+)ms;/.exec(CSS)![1]);
    expect(dwell * 2).toBe(beat);
  });

  // A still track was clipped at the belt's edge: at 1440 it showed 2.3 of the
  // five sentences and never the last one. Still, it wraps.
  it('lets the belt wrap where it cannot move', () => {
    expect(FLAT).toMatch(
      /@media \(prefers-reduced-motion: reduce\) \{ \.marquee-track > \[aria-hidden='true'\] \{ display: none; \} \.marquee-track \{ width: 100%; \} \.marquee-run \{ flex: 1 1 auto; flex-wrap: wrap; justify-content: center; \} \}/,
    );
    // After the belt's own rules, or `flex: none` wins and nothing wraps.
    expect(FLAT.indexOf('.marquee-run { flex: 1 1 auto;')).toBeGreaterThan(
      FLAT.indexOf('.marquee-run { display: flex;'),
    );
  });

  // The footer is the last thing on the page, so a cover range never finished
  // for it: its rows stopped at 0.9 opacity at 1440x900.
  it("finishes the footer's entrance at the end of the page", () => {
    expect(FLAT).toMatch(
      /footer \[data-enter\], footer \[data-enter-stagger\] > \* \{ animation-range: entry 0% entry 100%; \}/,
    );
  });

  // From 900px the ring carries the refusals and the belt is for the ear and
  // the still page; under rtl the ring has no text and the belt runs.
  it('hands the refusals to the ring from 900px and keeps the belt for the ear', () => {
    expect(FLAT).toMatch(
      /@media \(min-width: 900px\) and \(prefers-reduced-motion: no-preference\) \{ html:not\(\[dir='rtl'\]\) \.marquee \{ position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset\(50%\); white-space: nowrap; border: 0; \} html:not\(\[dir='rtl'\]\) \.marquee-track \{ animation: none; \} \}/,
    );
    expect(FLAT).toMatch(/\[dir='rtl'\] \.ring-text \{ display: none; \}/);
    expect(FLAT).toMatch(
      /\.ring-text \{ animation: ring-turn calc\(var\(--beat\) \* 6\) linear infinite; \}/,
    );
  });
});
