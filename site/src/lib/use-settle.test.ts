import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setMedia, setScrollY } from '../test/setup';
import { easeInOutCubic, pickEdge, useSectionSettle } from './use-settle';

let now = 0;
let frames: FrameRequestCallback[] = [];

/** Run the queued frame callbacks once, advancing the clock by `dt` first. */
function frame(dt = 16) {
  now += dt;
  const queued = frames;
  frames = [];
  act(() => {
    for (const cb of queued) cb(now);
  });
}

/** Move the page to `y`, then hold it still long enough for the watcher to
 * decide the scroll is over. The closer only ever fires after real movement. */
function stopAt(y: number) {
  act(() => {
    setScrollY(y);
    vi.advanceTimersByTime(90);
  });
  now += 200;
  act(() => {
    vi.advanceTimersByTime(90);
  });
}

function sections(...tops: number[]) {
  for (const [i, top] of tops.entries()) {
    const s = document.createElement('section');
    s.id = `s${i}`;
    s.getBoundingClientRect = () => ({ top }) as DOMRect;
    document.body.appendChild(s);
  }
}

beforeEach(() => {
  now = 0;
  frames = [];
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb));
  vi.spyOn(performance, 'now').mockImplementation(() => now);
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
  Object.defineProperty(document.documentElement, 'scrollHeight', {
    value: 5000,
    configurable: true,
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

describe('easeInOutCubic', () => {
  it('runs from nothing to everything through both halves', () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(1)).toBe(1);
    expect(easeInOutCubic(0.25)).toBeCloseTo(0.0625, 4);
    expect(easeInOutCubic(0.75)).toBeCloseTo(0.9375, 4);
  });
});

describe('pickEdge', () => {
  it('finds nothing when there are no sections', () => {
    expect(pickEdge([], 768)).toBeNull();
  });

  it('leaves an edge that is already met alone', () => {
    expect(pickEdge([2, 900], 768)).toBeNull();
  });

  it('leaves a deliberate stop mid-section alone', () => {
    expect(pickEdge([400], 768)).toBeNull();
  });

  it('picks the nearest edge on either side', () => {
    expect(pickEdge([200, -40, 600], 768)).toBe(-40);
    expect(pickEdge([-200, 40], 768)).toBe(40);
  });
});

describe('useSectionSettle', () => {
  it('glides to a nearby section edge once scrolling stops', () => {
    sections(20, 900);
    renderHook(() => useSectionSettle());
    stopAt(300);
    expect(frames).toHaveLength(1);
    frame(1000); // past the whole duration, so it lands and stops
    expect(window.scrollY).toBe(320);
    expect(frames).toHaveLength(0);
  });

  it('tweens through intermediate positions rather than jumping', () => {
    sections(100);
    renderHook(() => useSectionSettle());
    stopAt(300);
    frame(100);
    expect(window.scrollY).toBeGreaterThan(300);
    expect(window.scrollY).toBeLessThan(400);
    frame(1000);
    expect(window.scrollY).toBe(400);
  });

  it('leaves a deliberate stop in the middle of a section alone', () => {
    sections(500); // further than 40% of the 768px viewport
    renderHook(() => useSectionSettle());
    stopAt(300);
    expect(frames).toHaveLength(0);
  });

  it('gives the page a moment before deciding the scroll is over', () => {
    sections(20);
    renderHook(() => useSectionSettle());
    act(() => {
      setScrollY(300);
      vi.advanceTimersByTime(90);
    });
    now += 50; // not yet the 150ms that counts as stopped
    act(() => {
      vi.advanceTimersByTime(90);
    });
    expect(frames).toHaveLength(0);
  });

  it('waits while the page is still moving', () => {
    sections(20);
    renderHook(() => useSectionSettle());
    act(() => {
      setScrollY(340);
      vi.advanceTimersByTime(90);
    });
    expect(frames).toHaveLength(0);
  });

  it('leaves the very top and the very bottom alone', () => {
    sections(20);
    const first = renderHook(() => useSectionSettle());
    stopAt(4);
    expect(frames).toHaveLength(0);
    first.unmount();

    renderHook(() => useSectionSettle());
    stopAt(4995); // scrollHeight 5000 less the 768 viewport, and then some
    expect(frames).toHaveLength(0);
  });

  it('does not re-pull while a glide it just started is still landing', () => {
    sections(20);
    renderHook(() => useSectionSettle());
    stopAt(300);
    frames = [];
    stopAt(305); // the watcher fires again inside the lock window
    expect(frames).toHaveLength(0);
  });

  it('stops mid-glide when real input arrives', () => {
    sections(200);
    renderHook(() => useSectionSettle());
    stopAt(300);
    frame(50);
    const reached = window.scrollY;
    act(() => {
      window.dispatchEvent(new Event('wheel'));
    });
    frame(50);
    expect(window.scrollY).toBe(reached);
    expect(frames).toHaveLength(0);
  });

  it('does nothing at all when motion is not wanted', () => {
    setMedia('(prefers-reduced-motion: no-preference)', false);
    sections(20);
    renderHook(() => useSectionSettle());
    stopAt(300);
    expect(frames).toHaveLength(0);
  });

  it('stops watching once unmounted', () => {
    sections(20);
    const { unmount } = renderHook(() => useSectionSettle());
    unmount();
    stopAt(300);
    expect(frames).toHaveLength(0);
  });
});
