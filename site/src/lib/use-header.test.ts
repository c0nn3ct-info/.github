import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { setScrollY } from '../test/setup';
import { useHeader } from './use-header';

function scrollTo(y: number) {
  act(() => {
    setScrollY(y);
    window.dispatchEvent(new Event('scroll'));
  });
}

function pointerAt(clientY: number, pointerType = 'mouse') {
  act(() => {
    window.dispatchEvent(new PointerEvent('pointermove', { clientY, pointerType }));
  });
}

describe('useHeader', () => {
  it('starts over the stage on the home page and over the page elsewhere', () => {
    expect(renderHook(() => useHeader(true)).result.current.ground).toBe('stage');
    expect(renderHook(() => useHeader(false)).result.current.ground).toBe('page');
  });

  it('takes the page colours once the hero has passed', () => {
    const { result } = renderHook(() => useHeader(true));
    scrollTo(400); // still inside 90% of the 768px viewport
    expect(result.current.ground).toBe('stage');
    scrollTo(800);
    expect(result.current.ground).toBe('page');
    scrollTo(100);
    expect(result.current.ground).toBe('stage');
  });

  // Measured on a phone: the stage ends at 557px and the viewport rule kept
  // the bar black over the light index for the next 200px of scroll.
  it('takes the page colours the moment the stage leaves the bar', () => {
    const stage = document.createElement('div');
    stage.className = 'stage';
    const bar = document.createElement('header');
    bar.className = 'site-header';
    document.body.append(stage);
    let bottom = 557;
    stage.getBoundingClientRect = () => ({ bottom }) as DOMRect;
    bar.getBoundingClientRect = () => ({ height: 65 }) as DOMRect;
    try {
      const { result } = renderHook(() => useHeader(true));
      expect(result.current.ground).toBe('stage');
      // Before the bar has mounted, any stage at all counts as under it.
      bottom = 1;
      scrollTo(10);
      expect(result.current.ground).toBe('stage');
      document.body.append(bar);
      bottom = 66;
      scrollTo(491);
      expect(result.current.ground).toBe('stage');
      bottom = 64;
      scrollTo(493);
      expect(result.current.ground).toBe('page');
      bottom = 200;
      scrollTo(357);
      expect(result.current.ground).toBe('stage');
    } finally {
      stage.remove();
      bar.remove();
    }
  });

  it('never leaves the page colours when there is no stage to sit over', () => {
    const { result } = renderHook(() => useHeader(false));
    scrollTo(0);
    expect(result.current.ground).toBe('page');
    scrollTo(900);
    expect(result.current.ground).toBe('page');
  });

  it('gets out of the way on a downward run and returns on the way up', () => {
    const { result } = renderHook(() => useHeader(true));
    expect(result.current.hidden).toBe(false);
    scrollTo(400);
    expect(result.current.hidden).toBe(true);
    scrollTo(300); // upward intent
    expect(result.current.hidden).toBe(false);
  });

  it('stays put for a short scroll near the top', () => {
    const { result } = renderHook(() => useHeader(true));
    scrollTo(100); // past nothing worth hiding for
    expect(result.current.hidden).toBe(false);
  });

  it('comes back when the pointer reaches for it', () => {
    const { result } = renderHook(() => useHeader(true));
    scrollTo(400);
    expect(result.current.hidden).toBe(true);
    pointerAt(300); // nowhere near the bar
    expect(result.current.hidden).toBe(true);
    pointerAt(20);
    expect(result.current.hidden).toBe(false);
  });

  // A finger crosses the top of the screen at the end of every downward swipe.
  it('does not take a finger at the top of the screen for intent', () => {
    const { result } = renderHook(() => useHeader(true));
    scrollTo(400);
    pointerAt(20, 'touch');
    expect(result.current.hidden).toBe(true);
  });

  // Measured on a phone: the tail of a flick reverses by 1-3px several times
  // as it settles, and the bar hid and returned four times in 7px of scroll.
  it('ignores the wobble at the end of a flick, in either direction', () => {
    const { result } = renderHook(() => useHeader(true));
    scrollTo(400);
    expect(result.current.hidden).toBe(true);
    for (const y of [398, 404, 403, 407, 405]) scrollTo(y);
    expect(result.current.hidden).toBe(true);
    scrollTo(380); // a real upward run of 25px
    expect(result.current.hidden).toBe(false);
    for (const y of [382, 379, 383, 381]) scrollTo(y);
    expect(result.current.hidden).toBe(false);
    scrollTo(406); // and a real downward one
    expect(result.current.hidden).toBe(true);
  });

  // A bounce past the foot of the page reads as an upward scroll once it
  // springs back, and that brought the bar back at the end of every page.
  it('reads a bounce past the end of the page as standing still', () => {
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      value: 1768,
      configurable: true,
    });
    try {
      const { result } = renderHook(() => useHeader(true));
      scrollTo(1000); // the end: 1768 - 768
      expect(result.current.hidden).toBe(true);
      scrollTo(1060); // the bounce
      scrollTo(1000); // the spring back
      expect(result.current.hidden).toBe(true);
    } finally {
      delete (document.documentElement as { scrollHeight?: number }).scrollHeight;
    }
  });

  it('stops listening once unmounted', () => {
    const { result, unmount } = renderHook(() => useHeader(true));
    unmount();
    scrollTo(900);
    expect(result.current.ground).toBe('stage');
  });
});
