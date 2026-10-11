import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { act } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, userEvent } from '../test/render';
import { animations, setMedia, setReducedMotion } from '../test/setup';
import { FOLD_MS, Practices } from './practices';

const CSS = readFileSync(resolve(__dirname, '../styles/globals.css'), 'utf8');

/** The card beside the list, for 900px and up. */
const panel = () => document.getElementById('practice-panel') as HTMLElement;
/** The fold under a row, for a phone. */
const fold = (k: string) => document.getElementById(`practice-fold-${k}`) as HTMLElement;

describe('Practices', () => {
  afterEach(() => {
    setMedia('(max-width: 899px)', false);
    vi.useRealTimers();
  });

  it('lists five habits and opens on the first', () => {
    render(<Practices />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(5);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(panel()).toHaveTextContent(
      'Every product so far began with a task one of us could not finish',
    );
  });

  // Stacked below 900px the panel sat under all five rows, so a tap on the
  // first opened something a screen below it. The list steps aside there
  // (display: contents), each row has a fold of its own under it, and the
  // card beside the list is for the wide layout alone.
  it('folds one card under each row on a phone, and opens the chosen one', async () => {
    render(<Practices />);
    const list = screen.getByRole('tablist');
    expect(list).toHaveClass('max-[899px]:contents');
    const tabs = screen.getAllByRole('tab');
    expect(tabs.map((b) => b.style.order)).toEqual(['0', '2', '4', '6', '8']);
    const folds = ['p1', 'p2', 'p3', 'p4', 'p5'].map(fold);
    expect(folds.map((f) => f.style.order)).toEqual(['1', '3', '5', '7', '9']);
    expect(folds.map((f) => f.hasAttribute('data-open'))).toEqual([
      true,
      false,
      false,
      false,
      false,
    ]);
    expect(folds.map((f) => f.getAttribute('aria-hidden'))).toEqual([
      'false',
      'true',
      'true',
      'true',
      'true',
    ]);
    expect(fold('p1')).toHaveTextContent('01');
    expect(fold('p4')).toHaveTextContent('04');
    expect(panel()).toHaveClass('max-[899px]:hidden');
    // Each row names both the card beside it and the fold under it.
    expect(tabs[3]).toHaveAttribute('aria-controls', 'practice-panel practice-fold-p4');
    await userEvent.click(tabs[3]);
    expect(folds.map((f) => f.hasAttribute('data-open'))).toEqual([
      false,
      false,
      false,
      true,
      false,
    ]);
    expect(fold('p1')).toHaveAttribute('aria-hidden', 'true');
    expect(fold('p4')).toHaveAttribute('aria-hidden', 'false');
  });

  // The folds move on the stylesheet's long step, from nothing to the card's
  // own height, and a closed one leaves the tree once it has closed.
  it('folds on grid rows over the long step, and lets a closed fold out of the tree', () => {
    expect(CSS).toMatch(/--dur-long: 450ms;/);
    expect(FOLD_MS).toBe(450);
    expect(CSS).toMatch(
      /\.practice-fold \{\n\s+display: grid;\n\s+grid-template-rows: 0fr;\n\s+visibility: hidden;\n\s+\}/,
    );
    expect(CSS).toMatch(
      /\.practice-fold\[data-open\] \{\n\s+grid-template-rows: 1fr;\n\s+visibility: visible;\n\s+\}/,
    );
    expect(CSS).toMatch(/\.practice-fold-inner \{\n\s+min-height: 0;\n\s+overflow: hidden;/);
    expect(CSS).toMatch(
      /\.practice-fold \{\n\s+transition:\n\s+grid-template-rows var\(--dur-long\) var\(--ease-emph\),\n\s+visibility 0s linear var\(--dur-long\);/,
    );
    expect(CSS).toMatch(
      /\.practice-fold\[data-open\] \{\n\s+transition:\n\s+grid-template-rows var\(--dur-long\) var\(--ease-emph\),\n\s+visibility 0s;/,
    );
    // Beside the list the folds are not there at all.
    expect(CSS).toMatch(/@media \(min-width: 900px\) \{\n\s+\.practice-fold \{\n\s+display: none;/);
    // One ring breathes, in the open fold.
    expect(CSS).toMatch(/\.practice-fold:not\(\[data-open\]\) \.block-ring \{\n\s+animation: none;/);
  });

  // Opening a row below the open one closes a fold above the finger, and the
  // tapped row would ride up with everything under that fold. The page
  // scrolls by the same amount on every frame of the fold instead, so the row
  // stays where it was tapped and its own fold opens from it.
  it('holds the tapped row under the finger while the folds move', async () => {
    setMedia('(max-width: 899px)', true);
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame'] });
    let clock = 1000;
    vi.spyOn(performance, 'now').mockImplementation(() => clock);
    const scrollBy = vi.spyOn(window, 'scrollBy').mockImplementation(() => {});
    render(<Practices />);
    const row = screen.getAllByRole('tab')[3];
    // Where the row sits: at the tap, then on each frame of the fold.
    const tops = [724, 724, 700, 600, 490];
    vi.spyOn(row, 'getBoundingClientRect').mockImplementation(
      () => ({ top: tops.length > 1 ? (tops.shift() as number) : tops[0] }) as DOMRect,
    );
    act(() => row.click());
    // The frame of the tap: nothing has moved yet.
    expect(scrollBy).not.toHaveBeenCalled();
    for (let frame = 1; frame <= 3; frame++) {
      clock += 16;
      vi.advanceTimersByTime(16);
    }
    expect(scrollBy.mock.calls.map(([o]) => o)).toEqual([
      { top: -24, behavior: 'instant' },
      { top: -124, behavior: 'instant' },
      { top: -234, behavior: 'instant' },
    ]);
    // And it lets go once the fold has had its time.
    clock += FOLD_MS;
    vi.advanceTimersByTime(FOLD_MS);
    const calls = scrollBy.mock.calls.length;
    clock += 100;
    vi.advanceTimersByTime(100);
    expect(scrollBy.mock.calls.length).toBe(calls);
    scrollBy.mockRestore();
  });

  // A row near the foot of the screen opens its fold below the screen's
  // edge. Once the fold is still, the page brings it up to that edge.
  it('brings a fold that opened below the screen up to its edge', async () => {
    setMedia('(max-width: 899px)', true);
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame'] });
    let clock = 1000;
    vi.spyOn(performance, 'now').mockImplementation(() => clock);
    vi.spyOn(window, 'scrollBy').mockImplementation(() => {});
    render(<Practices />);
    const row = screen.getAllByRole('tab')[4];
    const opened = fold('p5');
    opened.getBoundingClientRect = () => ({ bottom: 900 }) as DOMRect;
    const into = vi.fn();
    opened.scrollIntoView = into;
    act(() => row.click());
    expect(into).not.toHaveBeenCalled();
    clock += FOLD_MS + 40;
    vi.advanceTimersByTime(FOLD_MS + 40);
    expect(into).toHaveBeenCalledWith({ block: 'nearest', behavior: 'smooth' });
  });

  it('moves the row at once, and the fold with it, for a reader who asked for less motion', async () => {
    setMedia('(max-width: 899px)', true);
    setReducedMotion(true);
    const scrollBy = vi.spyOn(window, 'scrollBy').mockImplementation(() => {});
    render(<Practices />);
    const row = screen.getAllByRole('tab')[2];
    const tops = [724, 490];
    vi.spyOn(row, 'getBoundingClientRect').mockImplementation(
      () => ({ top: tops.shift() ?? 490 }) as DOMRect,
    );
    const opened = fold('p3');
    opened.getBoundingClientRect = () => ({ bottom: 900 }) as DOMRect;
    const into = vi.fn();
    opened.scrollIntoView = into;
    await userEvent.click(row);
    // One correction, on the frame of the tap, and no frames after it.
    expect(scrollBy).toHaveBeenCalledTimes(1);
    expect(scrollBy).toHaveBeenCalledWith({ top: -234, behavior: 'instant' });
    expect(into).toHaveBeenCalledWith({ block: 'nearest', behavior: 'instant' });
    scrollBy.mockRestore();
  });

  it('leaves the scroll alone beside the list, where nothing reflows', async () => {
    const scrollBy = vi.spyOn(window, 'scrollBy').mockImplementation(() => {});
    render(<Practices />);
    await userEvent.click(screen.getAllByRole('tab')[3]);
    expect(scrollBy).not.toHaveBeenCalled();
    scrollBy.mockRestore();
  });

  // Minimal (owner-directed): the heading and the list, with no intro and no
  // instruction under them; the rows say they can be chosen by being rows.
  it('carries no intro and no hint under its heading', () => {
    render(<Practices />);
    expect(screen.queryByText('Choose a line')).toBeNull();
    expect(screen.queryByText(/how we decide what to build/)).toBeNull();
  });

  // The panel used to be a bare aria-live region, which announced itself on top
  // of the tab a reader had just moved to. Naming it after the selected tab is
  // what a tablist owes, and it is how the work rail next door already reads.
  it('names its panel after whichever habit is open', async () => {
    render(<Practices />);
    expect(panel()).not.toHaveAttribute('aria-live');
    expect(panel()).toHaveAccessibleName(/We build the tools we need/);
    await userEvent.click(screen.getByRole('tab', { name: /We build on proven work/ }));
    expect(panel()).toHaveAccessibleName(/We build on proven work/);
    // A fold is named by its own row.
    expect(fold('p2')).toHaveAttribute('aria-labelledby', 'habit-p2');
  });

  // The panel follows the pointer, so it is a preview, and it used to change
  // with a hard cut: sweeping the five habits strobed the card.
  it('dips rather than blinks when the panel follows the pointer', async () => {
    render(<Practices />);
    await userEvent.hover(screen.getByRole('tab', { name: /We build on proven work/ }));
    // Both halves of the card, the ordinal and the reasoning, move together.
    expect(animations).toHaveLength(2);
    expect(animations[0].keyframes).toEqual([{ opacity: 0.45 }, { opacity: 1 }]);
    expect(animations[0].options.duration).toBe(160);
    expect(animations.map((a) => a.target.closest('#practice-panel'))).toEqual([
      panel(),
      panel(),
    ]);
  });

  it('does not dip on a phone, where the folds carry the change', async () => {
    setMedia('(max-width: 899px)', true);
    vi.spyOn(window, 'scrollBy').mockImplementation(() => {});
    render(<Practices />);
    await userEvent.hover(screen.getByRole('tab', { name: /We build on proven work/ }));
    expect(animations).toHaveLength(0);
  });

  it('says nothing on first paint, and nothing when the same habit is re-entered', async () => {
    render(<Practices />);
    expect(animations).toHaveLength(0);
    const first = screen.getAllByRole('tab')[0];
    await userEvent.hover(first);
    expect(animations).toHaveLength(0);
  });

  it('changes without moving when the reader asked for reduced motion', async () => {
    setReducedMotion(true);
    render(<Practices />);
    await userEvent.click(screen.getByRole('tab', { name: /We build on proven work/ }));
    expect(animations).toHaveLength(0);
    expect(panel()).toHaveTextContent('05');
  });

  it('speaks as "we" in every title, so the list has one voice', () => {
    render(<Practices />);
    for (const tab of screen.getAllByRole('tab')) {
      // The ordinal leads, then the title; the title is what must say "we".
      const title = tab.textContent?.replace(/^\d+/, '') ?? '';
      expect({ title, we: title.trim().startsWith('We ') || title.includes('we ') }).toEqual({
        title,
        we: true,
      });
    }
  });

  it('follows the pointer', async () => {
    render(<Practices />);
    await userEvent.hover(screen.getByRole('tab', { name: /We build on proven work/ }));
    expect(panel()).toHaveTextContent('put our effort into the parts you touch');
    expect(panel()).toHaveTextContent('05');
  });

  it('commits on a click', async () => {
    render(<Practices />);
    await userEvent.click(screen.getByRole('tab', { name: /We read every message with care/ }));
    expect(screen.getByRole('tab', { name: /We read every message with care/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(panel()).toHaveTextContent('03');
  });

  it('is reachable without a pointer at all', async () => {
    render(<Practices />);
    const first = screen.getAllByRole('tab')[0];
    first.focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(panel()).toHaveTextContent('02');
    expect(fold('p2')).toHaveAttribute('data-open');
    await userEvent.keyboard('{ArrowUp}{ArrowUp}');
    expect(panel()).toHaveTextContent('05');
  });

  it('jumps to either end on Home and End', async () => {
    render(<Practices />);
    screen.getAllByRole('tab')[0].focus();
    await userEvent.keyboard('{End}');
    expect(panel()).toHaveTextContent('05');
    await userEvent.keyboard('{Home}');
    expect(panel()).toHaveTextContent('01');
  });

  it('leaves keys it does not own to the browser', async () => {
    render(<Practices />);
    screen.getAllByRole('tab')[0].focus();
    await userEvent.keyboard('{PageDown}');
    expect(panel()).toHaveTextContent('01');
  });
});
