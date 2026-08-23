import { useState, type CSSProperties } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '../test/render';
import {
  observerThresholds,
  scrolls,
  setOnScreen,
  setPageHidden,
  setReducedMotion,
} from '../test/setup';
import { stride, useAutoplay, useLoop } from './carousel';

/** The shape ShotTrack has: a frame holding the scroller and the chevrons, with
 * both elements in state so the hook sees them once they exist. */
function Carousel({
  count = 3,
  on = true,
  width = 640,
  total = 1920,
  dwell,
}: {
  count?: number;
  on?: boolean;
  width?: number;
  total?: number;
  /** The stylesheet's `--shot-dwell`, which is where the real one comes from. */
  dwell?: CSSProperties;
}) {
  const [frame, setFrame] = useState<HTMLDivElement | null>(null);
  const [track, setTrack] = useState<HTMLDivElement | null>(null);
  const { playing, beat } = useAutoplay(frame, track, count, on);
  return (
    <div
      data-testid="frame"
      ref={setFrame}
      data-playing={playing || undefined}
      data-beat={beat}
      style={dwell}
    >
      <div
        data-testid="track"
        ref={(el) => {
          measure(el, width, total);
          setTrack(el);
        }}
      />
      <button type="button">next</button>
    </div>
  );
}

/** The first render of any mount, before either element exists. */
function Waiting() {
  useAutoplay(null, null, 3, true);
  return null;
}

/** jsdom has no layout, so the two numbers the carousel reads are given. */
function measure(track: HTMLElement | null, width: number, total: number): void {
  if (!track) return;
  Object.defineProperty(track, 'clientWidth', { value: width, configurable: true });
  Object.defineProperty(track, 'scrollWidth', { value: total, configurable: true });
}

const frame = () => screen.getByTestId('frame');
/** Every one of these lands in the hook, which reports back through state, so
 * each has to flush before the next assertion reads the DOM. */
const onScreen = (on: boolean) => act(() => setOnScreen(on));
const pageHidden = (hidden: boolean) => act(() => setPageHidden(hidden));
const on = (type: string) => act(() => void frame().dispatchEvent(new Event(type)));
const wheelBy = (deltaX: number, deltaY: number) =>
  act(() => void frame().dispatchEvent(new WheelEvent('wheel', { deltaX, deltaY })));
const track = () => screen.getByTestId('track');
const moves = () => scrolls.map((s) => `${s.kind}:${s.options.left}`);
const beat = () => frame().getAttribute('data-beat');

/** How long a capture is given to settle where `scrollend` never arrives. */
const LANDING = 600;

/**
 * One dwell, then the scroll the browser would have performed for it, then the
 * wait for that capture to settle. The dwell for the next one is measured from
 * the settling rather than from the scroll, so a test that skips the landing
 * would never see a second turn.
 */
function wait(times = 1, ms = 5000): void {
  for (let i = 0; i < times; i += 1) {
    const before = scrolls.length;
    act(() => vi.advanceTimersByTime(ms));
    const last = scrolls.at(-1);
    if (scrolls.length === before || !last) continue;
    const left = Number(last.options.left ?? 0);
    if (last.kind === 'to') track().scrollLeft = left;
    else track().scrollLeft += left;
    act(() => vi.advanceTimersByTime(LANDING));
  }
}

describe('stride', () => {
  it('measures one capture in the reading direction', () => {
    const el = document.createElement('div');
    Object.defineProperty(el, 'clientWidth', { value: 500, configurable: true });
    expect(stride(el, 1)).toBe(500);
    expect(stride(el, -1)).toBe(-500);
  });

  // `scrollBy` takes physical pixels, so "next" is a negative delta under rtl.
  // Without this the next chevron on /ar/ did nothing at all: the delta pushed
  // the scroller towards a start it was already clamped against.
  it('turns around with the writing direction', () => {
    document.documentElement.dir = 'rtl';
    try {
      const el = document.createElement('div');
      Object.defineProperty(el, 'clientWidth', { value: 500, configurable: true });
      expect(stride(el, 1)).toBe(-500);
    } finally {
      document.documentElement.dir = '';
    }
  });
});

describe('useAutoplay', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('turns the captures over while the pane is on screen', () => {
    render(<Carousel />);
    onScreen(true);
    wait(2);
    expect(moves()).toEqual(['by:640', 'by:640']);
  });

  // Half the pane, so the captures turn over for a reader who has it in front of
  // them rather than for one whose screen holds its top edge.
  it('waits for half the pane rather than its first pixel', () => {
    render(<Carousel />);
    expect(observerThresholds()).toEqual([[0.5]]);
    wait();
    expect(moves()).toEqual([]);
  });

  it('goes quiet again when the pane leaves', () => {
    render(<Carousel />);
    onScreen(true);
    wait();
    onScreen(false);
    wait(2);
    expect(moves()).toEqual(['by:640']);
  });

  it('goes quiet while the tab is in the background', () => {
    render(<Carousel />);
    onScreen(true);
    pageHidden(true);
    wait(2);
    expect(moves()).toEqual([]);
    pageHidden(false);
    wait();
    expect(moves()).toEqual(['by:640']);
  });

  // Moving a capture out from under someone reading it is the whole reason
  // autoplay has a bad name.
  it('holds while the reader is on it and carries on when they leave', () => {
    render(<Carousel />);
    onScreen(true);
    on('pointerenter');
    wait(2);
    expect(moves()).toEqual([]);
    on('pointerleave');
    wait();
    expect(moves()).toEqual(['by:640']);
  });

  it('holds for a reader who arrived by keyboard', () => {
    render(<Carousel />);
    onScreen(true);
    on('focusin');
    wait();
    expect(moves()).toEqual([]);
    on('focusout');
    wait();
    expect(moves()).toEqual(['by:640']);
  });

  // Driving it resets the dwell rather than ending it: the capture the reader
  // landed on gets a whole one of its own, and the carousel carries on after.
  it.each([
    ['a press', () => on('pointerdown')],
    ['an activation without a pointer', () => on('click')],
    ['a key', () => on('keydown')],
    ['a sideways wheel', () => wheelBy(40, 2)],
  ])('starts the dwell again after %s', (_what, drive) => {
    render(<Carousel />);
    onScreen(true);
    wait(1, 3000);
    expect(moves()).toEqual([]);
    drive();
    // The three seconds already spent are given back, so the next move is a
    // whole dwell away rather than two seconds away.
    wait(1, 3000);
    expect(moves()).toEqual([]);
    wait(1, 2000);
    expect(moves()).toEqual(['by:640']);
  });

  // The readout's fill is the browser's animation, and the only way to start one
  // again is a new element, so the beat is what the markup keys it on.
  it('counts a beat for every dwell it starts again', () => {
    render(<Carousel />);
    onScreen(true);
    expect(beat()).toBe('0');
    on('pointerdown');
    expect(beat()).toBe('1');
    on('keydown');
    expect(beat()).toBe('2');
    // A wheel down the page is not the reader paging it, so it is not a beat.
    wheelBy(2, 40);
    expect(beat()).toBe('2');
  });

  // A wheel down the page happens to pass over the pane, which is not the reader
  // paging it.
  it('reads a wheel down the page as the page scrolling', () => {
    render(<Carousel />);
    onScreen(true);
    wheelBy(2, 40);
    wait();
    expect(moves()).toEqual(['by:640']);
  });

  // It loops: from the last capture it goes back to the first, which is the one
  // shape a reader expects of a set that turns itself over.
  it('returns to the first capture from the last', () => {
    render(<Carousel />);
    onScreen(true);
    wait(4);
    // Two steps to the end, back to the start, and away again: it keeps going
    // round rather than stopping at either end.
    expect(moves()).toEqual(['by:640', 'by:640', 'to:0', 'by:640']);
  });

  it('says nothing before the track has a width to page through', () => {
    render(<Carousel width={0} total={0} />);
    onScreen(true);
    wait(2);
    expect(moves()).toEqual([]);
  });

  // There is no reduced version of content that moves on its own.
  it('never starts for a reader who asked for less motion', () => {
    setReducedMotion(true);
    render(<Carousel />);
    onScreen(true);
    wait(2);
    expect(moves()).toEqual([]);
  });

  it('stays out of the dialog, where the reader opened one capture', () => {
    render(<Carousel on={false} />);
    onScreen(true);
    wait(2);
    expect(moves()).toEqual([]);
    expect(observerThresholds()).toEqual([]);
  });

  it('does nothing for a single capture', () => {
    render(<Carousel count={1} />);
    onScreen(true);
    wait(2);
    expect(moves()).toEqual([]);
  });

  // The first render has neither element yet, which is the case every mount
  // passes through.
  it('waits for the elements it drives', () => {
    render(<Waiting />);
    onScreen(true);
    wait(2);
    expect(moves()).toEqual([]);
  });

  // The readout fills over exactly one dwell, so the duration is the
  // stylesheet's and the timer reads it back rather than keeping its own copy.
  it.each([
    ['milliseconds', '2000ms', 2000],
    ['seconds', '3s', 3000],
  ])('takes the dwell from the page in %s', (_unit, value, ms) => {
    render(<Carousel dwell={{ '--shot-dwell': value } as CSSProperties} />);
    onScreen(true);
    wait(1, ms);
    expect(moves()).toEqual(['by:640']);
  });

  it('falls back to its own dwell where the page declares none', () => {
    render(<Carousel />);
    onScreen(true);
    wait(1, 4999);
    expect(moves()).toEqual([]);
    wait(1, 1);
    expect(moves()).toEqual(['by:640']);
  });

  // The readout has to know, and it asks through the return value rather than
  // through an attribute written by hand, so a prerendered page carries the
  // resting value a fresh load has.
  it('says whether the captures are turning over', () => {
    render(<Carousel />);
    expect(frame()).not.toHaveAttribute('data-playing');
    onScreen(true);
    expect(frame()).toHaveAttribute('data-playing');
    on('pointerenter');
    expect(frame()).not.toHaveAttribute('data-playing');
    on('pointerleave');
    expect(frame()).toHaveAttribute('data-playing');
    // Driving it does not stop it, so it is still turning over afterwards.
    on('pointerdown');
    expect(frame()).toHaveAttribute('data-playing');
    onScreen(false);
    expect(frame()).not.toHaveAttribute('data-playing');
  });

  // A glide takes a few hundred milliseconds and the loop back takes the whole
  // track, so a clock started with the scroll had the readout filling for a
  // capture still on its way, and gave the first capture after a loop a shorter
  // turn than the rest.
  it('measures the dwell from the capture settling, not from the scroll', () => {
    render(<Carousel />);
    onScreen(true);
    act(() => vi.advanceTimersByTime(5000));
    expect(moves()).toEqual(['by:640']);
    expect(beat()).toBe('0');
    // Still gliding: the next dwell has not started, so nothing is counted yet.
    act(() => vi.advanceTimersByTime(5000));
    expect(moves()).toEqual(['by:640']);
    // It settles, which is where the beat and the next dwell both begin.
    act(() => vi.advanceTimersByTime(LANDING));
    expect(beat()).toBe('1');
    act(() => vi.advanceTimersByTime(5000));
    expect(moves()).toEqual(['by:640', 'by:640']);
  });

  // Where the browser sends the event there is no need to guess at all.
  it('takes the settling from the scroller where it is reported', () => {
    Object.defineProperty(window, 'onscrollend', { value: null, configurable: true });
    try {
      render(<Carousel />);
      onScreen(true);
      act(() => vi.advanceTimersByTime(5000));
      expect(beat()).toBe('0');
      act(() => void track().dispatchEvent(new Event('scrollend')));
      expect(beat()).toBe('1');
      // A scroller reports the end of one glide more than once when a snap
      // settles after it, and the ceiling can already be queued besides. The
      // first is the landing and the rest are nothing.
      act(() => void track().dispatchEvent(new Event('scrollend')));
      act(() => vi.advanceTimersByTime(LANDING));
      expect(beat()).toBe('1');
    } finally {
      // @ts-expect-error the property only exists for this test
      delete window.onscrollend;
    }
  });

  // The reader put the pointer on it while a capture was still gliding, so the
  // dwell that would have started on landing waits for them to leave.
  it('holds a dwell that would have started while the reader is on it', () => {
    render(<Carousel />);
    onScreen(true);
    act(() => vi.advanceTimersByTime(5000));
    on('pointerenter');
    act(() => vi.advanceTimersByTime(LANDING));
    track().scrollLeft = 640;
    act(() => vi.advanceTimersByTime(5000));
    expect(moves()).toEqual(['by:640']);
    on('pointerleave');
    act(() => vi.advanceTimersByTime(5000));
    expect(moves()).toEqual(['by:640', 'by:640']);
  });

  it('starts nothing on a landing the reader has scrolled away from', () => {
    render(<Carousel />);
    onScreen(true);
    act(() => vi.advanceTimersByTime(5000));
    onScreen(false);
    act(() => vi.advanceTimersByTime(LANDING + 5000));
    expect(moves()).toEqual(['by:640']);
  });

  // Two reports of the same thing are one dwell, not two racing each other.
  it('keeps one dwell however often it is told the pane is there', () => {
    render(<Carousel />);
    onScreen(true);
    onScreen(true);
    act(() => vi.advanceTimersByTime(5000));
    expect(moves()).toEqual(['by:640']);
  });

  it('takes its timer with it when the pane goes', () => {
    const view = render(<Carousel />);
    onScreen(true);
    act(() => view.unmount());
    wait(2);
    expect(moves()).toEqual([]);
  });
});

/** A looping track: the scroller, with the copy of the first capture at its end
 * standing in for the fifth slide. */
function Loop({ on = true, total = 1920, width = 640 }: { on?: boolean; total?: number; width?: number }) {
  const [track, setTrack] = useState<HTMLDivElement | null>(null);
  useLoop(track, on);
  return (
    <div
      data-testid="track"
      ref={(el) => {
        measure(el, width, total);
        setTrack(el);
      }}
    />
  );
}

describe('useLoop', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  const settle = () => act(() => void track().dispatchEvent(new Event('scroll')));
  const quiet = () => act(() => vi.advanceTimersByTime(120));

  // Landing on the copy puts the scroller back at the start with no animation,
  // on the same pixels, so nothing moves and the next step is a step forward
  // like every other one. The loop used to go back the way it came.
  it('closes on the copy at the end without moving anything', () => {
    render(<Loop />);
    track().scrollLeft = 1280;
    settle();
    quiet();
    expect(scrolls).toEqual([
      { target: track(), kind: 'to', options: { left: 0, behavior: 'auto' } },
    ]);
  });

  it('leaves a capture in the middle of the track alone', () => {
    render(<Loop />);
    track().scrollLeft = 640;
    settle();
    quiet();
    expect(scrolls).toEqual([]);
  });

  it('says nothing before the track has a width', () => {
    render(<Loop width={0} total={0} />);
    settle();
    quiet();
    expect(scrolls).toEqual([]);
  });

  it('stays out of a track that does not loop', () => {
    render(<Loop on={false} />);
    track().scrollLeft = 1280;
    settle();
    quiet();
    expect(scrolls).toEqual([]);
  });

  it('waits for the scroller to be still rather than for every pixel of it', () => {
    render(<Loop />);
    track().scrollLeft = 1280;
    settle();
    act(() => vi.advanceTimersByTime(60));
    settle();
    act(() => vi.advanceTimersByTime(60));
    expect(scrolls).toEqual([]);
    quiet();
    expect(scrolls).toHaveLength(1);
  });

  // Where the browser reports the end of a scroll there is nothing to wait out.
  it('takes the end of the scroll from the scroller where it is reported', () => {
    Object.defineProperty(window, 'onscrollend', { value: null, configurable: true });
    try {
      render(<Loop />);
      track().scrollLeft = 1280;
      act(() => void track().dispatchEvent(new Event('scrollend')));
      expect(scrolls).toHaveLength(1);
    } finally {
      // @ts-expect-error the property only exists for this test
      delete window.onscrollend;
    }
  });

  it('takes its listener with it', () => {
    const view = render(<Loop />);
    act(() => view.unmount());
    expect(scrolls).toEqual([]);
  });
});
