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

function pointerAt(clientY: number) {
  act(() => {
    window.dispatchEvent(new PointerEvent('pointermove', { clientY }));
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

  it('stops listening once unmounted', () => {
    const { result, unmount } = renderHook(() => useHeader(true));
    unmount();
    scrollTo(900);
    expect(result.current.ground).toBe('stage');
  });
});
