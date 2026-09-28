import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import config from '../../tailwind.config';

const CSS = readFileSync(join(__dirname, 'globals.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

/** Every rule whose selector names `:hover`, with the at-rules it sits inside. */
function hoverRules(): { selector: string; within: string[] }[] {
  const out: { selector: string; within: string[] }[] = [];
  const stack: string[] = [];
  let start = 0;
  for (let i = 0; i < CSS.length; i++) {
    const c = CSS[i];
    if (c === '{') {
      const prelude = CSS.slice(start, i).trim();
      if (prelude.includes(':hover')) out.push({ selector: prelude, within: [...stack] });
      stack.push(prelude);
      start = i + 1;
    } else if (c === '}') {
      stack.pop();
      start = i + 1;
    } else if (c === ';') {
      start = i + 1;
    }
  }
  return out;
}

describe('a finger is not a pointer', () => {
  // A touch screen reports a tap as a hover that stays until the next tap lands
  // somewhere else, so an ungated hover left its fill on whatever was touched
  // last, and the contact rows' 12px nudge stayed on the label.
  it('hovers only where the pointer can', () => {
    const rules = hoverRules();
    expect(rules.length).toBeGreaterThan(0);
    for (const { selector, within } of rules) {
      const gated = within.some((at) => /@media[^{]*\(hover:\s*hover\)/.test(at));
      expect({ selector, gated }).toEqual({ selector, gated: true });
    }
  });

  it('asks Tailwind for the same of its hover: utilities', () => {
    expect(config.future).toMatchObject({ hoverOnlyWhenSupported: true });
  });
});
