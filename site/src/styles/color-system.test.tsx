import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '../test/render';
import { Hero } from '../components/hero';
import { Work, type Project } from '../components/work';

const CSS = readFileSync(join(__dirname, 'globals.css'), 'utf8');

function WorkHarness() {
  const [project, setProject] = useState<Project>('noctis');
  return <Work project={project} onPick={setProject} />;
}

/** The lamp lives on the ordinal, so the ordinal names the product it counts. */
function lamps(container: HTMLElement) {
  return [...container.querySelectorAll('.ordinal[data-product]')].map(
    (el) => (el as HTMLElement).dataset.product,
  );
}

describe('product colour', () => {
  // The coding used to appear only inside one product's own pane, which is the
  // one place a reader cannot need it: nothing else is on screen to tell it
  // apart from. These are the two lists where all three sit together.
  it('marks every product in the hero index', () => {
    const { container } = render(<Hero onPick={() => {}} />);
    expect(lamps(container)).toEqual(['noctis', 'aria2t', 'next']);
  });

  it('marks every product in the work rail', () => {
    const { container } = render(<WorkHarness />);
    // The rail carries all three; the open pane's fact cards count facts, not
    // products, so they stay unlit.
    const rail = container.querySelector('[role="tablist"]') as HTMLElement;
    expect(lamps(rail)).toEqual(['noctis', 'aria2t', 'next']);
  });

  it('leaves ordinals that count something other than a product alone', () => {
    const { container } = render(<WorkHarness />);
    const panel = container.querySelector('[role="tabpanel"]') as HTMLElement;
    expect(lamps(panel)).toEqual([]);
  });

  // Colour means one thing on this page. Selection is carried by the marker,
  // the row background and the title's weight, all achromatic, so a reader who
  // cannot separate the two hues still sees which row is open.
  it('never spends the product hue on selection state', () => {
    // The marker moved off the selected row and onto the list when it learned
    // to travel; what it must not do is take the product's colour with it.
    const marker = CSS.slice(
      CSS.indexOf('.rail-list::before'),
      CSS.indexOf('}', CSS.indexOf('.rail-list::before')),
    );
    expect(marker).toContain('background: hsl(var(--on-surface))');
    expect(marker).not.toContain('--led');
  });

  it('opens on a product whose rail row is selected without colour', () => {
    render(<WorkHarness />);
    expect(screen.getAllByRole('tab')[0]).toHaveAttribute('aria-selected', 'true');
  });
});

describe('the unshipped product', () => {
  // Grey alone would be the only code, and the two hues plus grey is exactly
  // the distinction a red-green or low-vision reader loses first. The shape
  // carries it independently.
  it('reads as unlit by shape, not only by colour', () => {
    const rule = CSS.slice(
      CSS.indexOf(".ordinal[data-product='next']::before"),
      CSS.indexOf('}', CSS.indexOf(".ordinal[data-product='next']::before")),
    );
    expect(rule).toContain('background: none');
    expect(rule).toContain('inset 0 0 0 1.5px');
  });

  it('is the one product with no link out of the hero index', () => {
    const { container } = render(<Hero onPick={() => {}} />);
    const rows = [...container.querySelectorAll('.index-row')];
    expect(rows.map((r) => r.tagName.toLowerCase())).toEqual(['a', 'a', 'div']);
  });
});

describe('the lamp', () => {
  // A non-text mark needs 3:1 where text needs 4.5. The ink pair measures 4.23
  // and 4.25 on the index ground, so tinted figures would have failed and the
  // LED as a mark passes; the rule has to keep taking the LED, not the ink.
  it('takes the LED rather than the text ink', () => {
    const rule = CSS.slice(
      CSS.indexOf('.ordinal[data-product]::before'),
      CSS.indexOf('}', CSS.indexOf('.ordinal[data-product]::before')),
    );
    expect(rule).toContain('background: var(--led)');
    expect(rule).not.toContain('--led-ink');
  });

  // Dimming the whole ordinal took --faint-ink to 1.63:1 on white and would
  // have taken the lamp under its floor with it.
  it('is not dimmed with the figures beside it', () => {
    expect(CSS).not.toContain('.rail-btn .ordinal {\n    opacity');
  });
});
