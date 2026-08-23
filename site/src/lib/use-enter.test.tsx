import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '../test/render';
import {
  animations,
  fireRegion,
  observedTargets,
  observerMargins,
  setOnScreen,
  setReducedMotion,
  setScrollDriven,
} from '../test/setup';
import { useJumpArrival, useSectionEntrance } from './use-enter';

function Page({ stagger = 'wipe' }: { stagger?: string }) {
  useSectionEntrance();
  return (
    <div>
      <section data-enter-section data-testid="work">
        <h2 data-enter>The work</h2>
        <div data-enter-stagger={stagger} data-testid="rail">
          <button>one</button>
          <button>two</button>
        </div>
      </section>
      <section data-enter-section data-testid="settled">
        <div data-enter>card</div>
      </section>
    </div>
  );
}

function LongList() {
  useSectionEntrance();
  return (
    <section data-enter-section data-testid="long">
      <div data-enter-stagger>
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i}>{i}</span>
        ))}
      </div>
    </section>
  );
}

function Plain() {
  useSectionEntrance();
  return (
    <section data-enter-section data-testid="plain">
      <div data-enter="">block</div>
    </section>
  );
}

function Bare() {
  useSectionEntrance();
  return <div data-enter>nothing observes me</div>;
}

const played = () => animations.map((a) => a.options.delay);

describe('useSectionEntrance', () => {
  // Where the browser can tie an animation to the scroller, it does, and this
  // hook has to stay out of the way entirely or the two would both fire.
  it('stands down where the browser can drive the entrance from the scroll', () => {
    setScrollDriven(true);
    render(<Page />);
    expect(observedTargets()).toHaveLength(0);
    setOnScreen(true);
    expect(animations).toHaveLength(0);
  });

  it('watches every section and nothing inside them', () => {
    render(<Page />);
    expect(observedTargets()).toEqual([screen.getByTestId('work'), screen.getByTestId('settled')]);
  });

  it('says nothing until a section actually comes up', () => {
    render(<Page />);
    fireRegion(screen.getByTestId('work'), false);
    expect(animations).toHaveLength(0);
  });

  // Each section brings its own contents, in reading order.
  it('brings a section in when it arrives, and only that section', () => {
    render(<Page />);
    fireRegion(screen.getByTestId('work'), true);
    // the heading, then the two rail rows the container contributes
    expect(animations.map((a) => a.target.textContent)).toEqual(['The work', 'one', 'two']);
    expect(played()).toEqual([0, 45, 90]);
  });

  // A reader scrolling back up finds the page where they left it.
  it('arrives once and never again', () => {
    render(<Page />);
    const work = screen.getByTestId('work');
    fireRegion(work, true);
    const first = animations.length;
    fireRegion(work, true);
    expect(animations).toHaveLength(first);
    expect(observedTargets()).toEqual([screen.getByTestId('settled')]);
  });

  // Six steps is already a third of a second; past that a list reads as
  // waiting rather than arriving.
  it('caps the wait so a long list arrives rather than queues', () => {
    render(<LongList />);
    fireRegion(screen.getByTestId('long'), true);
    expect(animations).toHaveLength(10);
    expect(played()).toEqual([0, 45, 90, 135, 180, 225, 225, 225, 225, 225]);
  });

  // Rows and cards print; a single object rises.
  it('wipes a sequence and lifts a block', () => {
    render(<Page />);
    fireRegion(screen.getByTestId('work'), true);
    expect(animations[0].keyframes[0]).toEqual({
      opacity: 0,
      transform: 'translateY(12px) scale(0.985)',
    });
    // Transform and opacity only: everything else pays in paint, and this is
    // the path for browsers that cannot hand the work to the scroller.
    expect(animations[1].keyframes[0]).toEqual({
      opacity: 0,
      transform: 'translateX(-14px)',
    });
    expect(animations[1].options.duration).toBe(420);
  });

  it('takes the rise for a lone mark that names no gesture', () => {
    render(<Plain />);
    fireRegion(screen.getByTestId('plain'), true);
    expect(animations[0].keyframes[0]).toEqual({
      opacity: 0,
      transform: 'translateY(12px) scale(0.985)',
    });
  });

  it('takes the rise for a stagger that names no gesture', () => {
    render(<Page stagger="" />);
    fireRegion(screen.getByTestId('work'), true);
    expect(animations[1].keyframes[0]).toEqual({
      opacity: 0,
      transform: 'translateY(12px) scale(0.985)',
    });
  });

  // inset() is physical, so the side it uncovers from has to flip by hand.
  it('uncovers from the other side under rtl', () => {
    document.documentElement.dir = 'rtl';
    try {
      render(<Page />);
      fireRegion(screen.getByTestId('work'), true);
      // A sequence arrives along the line it is read on, so the axis flips.
      expect(animations[1].keyframes[0]).toEqual({
        opacity: 0,
        transform: 'translateX(14px)',
      });
    } finally {
      document.documentElement.dir = '';
    }
  });

  // The curve lives in the stylesheet so CSS and WAAPI cannot drift apart. It
  // used to be typed by hand into two files beside three ease tokens the page
  // already had.
  it('takes its curve from the page rather than from a literal', () => {
    document.documentElement.style.setProperty('--ease-enter', 'cubic-bezier(0.23, 1, 0.32, 1)');
    try {
      render(<Page />);
      fireRegion(screen.getByTestId('work'), true);
      expect(animations[0].options.easing).toBe('cubic-bezier(0.23, 1, 0.32, 1)');
    } finally {
      document.documentElement.style.removeProperty('--ease-enter');
    }
  });

  it('still animates on something when the stylesheet has not landed', () => {
    render(<Page />);
    fireRegion(screen.getByTestId('work'), true);
    expect(animations[0].options.easing).toBe('ease-out');
  });

  // A lead margin looked right, until #work turned out to sit one viewport down
  // and spend its arrival at load. Zero fires as the section's first pixel
  // crosses the fold, which its own top padding keeps clear of the content.
  it('waits for the section itself rather than leading it', () => {
    render(<Page />);
    // One observer for the whole page, watching both sections.
    expect(observerMargins()).toEqual(['0px']);
  });

  it('does nothing at all when the reader asked for reduced motion', () => {
    setReducedMotion(true);
    render(<Page />);
    expect(observedTargets()).toHaveLength(0);
    setOnScreen(true);
    expect(animations).toHaveLength(0);
  });

  it('leaves a page with no sections alone', () => {
    render(<Bare />);
    expect(observedTargets()).toHaveLength(0);
    setOnScreen(true);
    expect(animations).toHaveLength(0);
  });
});

describe('the scroll-driven path', () => {
  const CSS_SRC = readFileSync('src/styles/globals.css', 'utf8');
  const block = CSS_SRC.slice(
    CSS_SRC.indexOf('/* ── section entrances'),
    CSS_SRC.indexOf('/* ── motion'),
  );

  // Progress follows the element's place on screen, not a clock. A fixed
  // timeline began every entrance around 1100px below the fold and finished it
  // above the top of the screen, so the reader caught an arbitrary phase.
  it('ties progress to the scroller', () => {
    // The declaration, not the @supports test around it: the two read alike
    // and only one of them actually drives anything.
    const flat = block.replace(/\s/g, '');
    expect(flat).toContain('animation-timeline:view();');
    expect(flat).toMatch(/animation-range:cover0%cover\d+%;/);
  });

  it('is gated on both the preference and the capability', () => {
    // Prettier may wrap either at-rule, so compare without whitespace at all.
    const flat = block.replace(/\s/g, '');
    expect(flat).toContain('@media(prefers-reduced-motion:no-preference)');
    expect(flat).toContain('@supports(animation-timeline:view())');
    // And the preference is the outer of the two, so opting out of motion opts
    // out whether or not the browser can drive it from the scroll.
    expect(flat.indexOf('@media(prefers-reduced-motion')).toBeLessThan(
      flat.indexOf('@supports(animation-timeline'),
    );
  });

  // Composited properties only. The mask reveal this replaced looked better in
  // a still frame and cost a paint layer per element to run.
  it('animates nothing that costs paint or layout', () => {
    for (const costly of ['mask', 'clip-path', 'filter', 'width', 'height', 'top', 'left']) {
      expect({ costly, present: block.includes(costly + ':') }).toEqual({ costly, present: false });
    }
  });

  // Two definitions of one gesture: a keyframe rule cannot be shared with a
  // keyframe object, so the fallback has to be checked against the stylesheet.
  it('matches the gestures the fallback plays', () => {
    render(<Page stagger="" />);
    fireRegion(screen.getByTestId('work'), true);
    const rise = animations[0].keyframes[0] as Record<string, string>;
    expect(block).toContain(rise.transform);

    animations.length = 0;
    render(<Page />);
    fireRegion(screen.getAllByTestId('work')[1], true);
    const line = animations[1].keyframes[0] as Record<string, string>;
    expect(CSS_SRC).toContain(line.transform);
  });
});

/** The bar's jump list and the sections it points at. */
function Jumps() {
  useJumpArrival();
  return (
    <div>
      <a href="#how" data-testid="to-how">
        How we work
      </a>
      <a href="#nowhere" data-testid="to-nowhere">
        Nowhere
      </a>
      <a href="https://example.com" data-testid="away">
        Away
      </a>
      <section data-enter-section id="how">
        <h2 data-enter>Five habits</h2>
        <div data-enter-stagger="wipe">
          <button>one</button>
          <button>two</button>
        </div>
      </section>
      <div id="nowhere">not a section</div>
    </div>
  );
}

describe('useJumpArrival', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  // A smooth jump spends the scroll-driven range before it lands: measured on
  // the bar's jump list, 33ms of movement against 167ms for the same section
  // reached by wheel. The list only exists above 900px, which is why the page
  // looked alive on a phone and still on a desktop.
  it('replays the arrival of the section a link lands on', () => {
    render(<Jumps />);
    act(() => screen.getByTestId('to-how').click());
    // Still scrolling: the arrival belongs to the landing, not to the click.
    expect(animations).toHaveLength(0);
    act(() => vi.advanceTimersByTime(900));
    expect(animations).toHaveLength(3);
    expect(animations[0].keyframes[0]).toEqual({
      opacity: 0,
      transform: 'translateY(12px) scale(0.985)',
    });
    expect(animations[1].keyframes[0]).toEqual({ opacity: 0, transform: 'translateX(-14px)' });
    expect(animations[1].options.delay).toBe(45);
  });

  it('takes the landing from the scroller where it is reported', () => {
    render(<Jumps />);
    act(() => screen.getByTestId('to-how').click());
    act(() => void document.dispatchEvent(new Event('scrollend')));
    expect(animations).toHaveLength(3);
    // A second report of the same glide, and the ceiling behind it, do not play
    // the whole thing again.
    act(() => void document.dispatchEvent(new Event('scrollend')));
    act(() => vi.advanceTimersByTime(900));
    expect(animations).toHaveLength(3);
  });

  it('leaves alone a link that lands on something that is not a section', () => {
    render(<Jumps />);
    act(() => screen.getByTestId('to-nowhere').click());
    act(() => vi.advanceTimersByTime(900));
    expect(animations).toHaveLength(0);
  });

  it('leaves alone a link that leaves the page', () => {
    render(<Jumps />);
    act(() => screen.getByTestId('away').click());
    act(() => vi.advanceTimersByTime(900));
    expect(animations).toHaveLength(0);
  });

  it('ignores a click that came from no element at all', () => {
    render(<Jumps />);
    act(() => void document.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    act(() => vi.advanceTimersByTime(900));
    expect(animations).toHaveLength(0);
  });

  // A second click while the first jump is still settling replaces it rather
  // than queueing two arrivals.
  it('keeps the arrival of the last link pressed', () => {
    render(<Jumps />);
    act(() => screen.getByTestId('to-how').click());
    act(() => vi.advanceTimersByTime(300));
    act(() => screen.getByTestId('to-how').click());
    act(() => vi.advanceTimersByTime(900));
    expect(animations).toHaveLength(3);
  });

  it('stays out of the way of a reader who asked for less motion', () => {
    setReducedMotion(true);
    render(<Jumps />);
    act(() => screen.getByTestId('to-how').click());
    act(() => vi.advanceTimersByTime(900));
    expect(animations).toHaveLength(0);
  });

  it('takes its listeners with it', () => {
    const view = render(<Jumps />);
    act(() => screen.getByTestId('to-how').click());
    act(() => view.unmount());
    act(() => vi.advanceTimersByTime(900));
    expect(animations).toHaveLength(0);
  });
});
