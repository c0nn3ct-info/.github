import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { setMedia } from '../test/setup';
import { useParallax } from './use-parallax';

/** A rect with the edges a real DOMRect derives, since the hook reads bottom. */
function rect(top: number, left = 100, width = 200, height = 100) {
  return { left, top, width, height, right: left + width, bottom: top + height } as DOMRect;
}

function stage() {
  const el = document.createElement('div');
  el.getBoundingClientRect = () => rect(50);
  document.body.appendChild(el);
  const ref = createRef<HTMLDivElement>();
  (ref as { current: HTMLDivElement }).current = el;
  return { el, ref };
}

function move(clientX: number, clientY: number) {
  act(() => {
    window.dispatchEvent(new PointerEvent('pointermove', { clientX, clientY }));
  });
}

describe('useParallax', () => {
  it('writes the pointer position as two unitless offsets', () => {
    const { el, ref } = stage();
    renderHook(() => useParallax(ref));
    move(200, 100); // dead centre of the 200x100 box at (100,50)
    expect(el.style.getPropertyValue('--px')).toBe('0');
    expect(el.style.getPropertyValue('--py')).toBe('0');
    move(250, 75);
    expect(el.style.getPropertyValue('--px')).toBe('0.25');
    expect(el.style.getPropertyValue('--py')).toBe('-0.25');
  });

  it('clamps at both ends so a pointer outside the stage cannot fling it', () => {
    const { el, ref } = stage();
    renderHook(() => useParallax(ref));
    move(5000, 5000);
    expect(el.style.getPropertyValue('--px')).toBe('0.5');
    expect(el.style.getPropertyValue('--py')).toBe('0.5');
    move(-5000, -5000);
    expect(el.style.getPropertyValue('--px')).toBe('-0.5');
    expect(el.style.getPropertyValue('--py')).toBe('-0.5');
  });

  it('leaves the offsets unset when motion is not wanted', () => {
    setMedia('(prefers-reduced-motion: no-preference)', false);
    const { el, ref } = stage();
    renderHook(() => useParallax(ref));
    move(250, 75);
    expect(el.style.getPropertyValue('--px')).toBe('');
  });

  it('leaves the offsets unset on a touch screen', () => {
    setMedia('(hover: hover) and (pointer: fine)', false);
    const { el, ref } = stage();
    renderHook(() => useParallax(ref));
    move(250, 75);
    expect(el.style.getPropertyValue('--px')).toBe('');
  });

  it('does nothing without an element to track', () => {
    const ref = createRef<HTMLDivElement>();
    expect(() => renderHook(() => useParallax(ref))).not.toThrow();
    move(250, 75);
  });

  // The listener is on the window, so it fires while the reader is four
  // sections further down and the hero is nowhere near the screen.
  it('writes nothing while the stage is scrolled out of sight', () => {
    const { el, ref } = stage();
    renderHook(() => useParallax(ref));
    el.getBoundingClientRect = () => rect(-900); // scrolled up past the top
    move(250, 75);
    expect(el.style.getPropertyValue('--px')).toBe('');
    el.getBoundingClientRect = () => rect(window.innerHeight + 40); // still below
    move(250, 75);
    expect(el.style.getPropertyValue('--px')).toBe('');
  });

  it('clears what it set when it goes away', () => {
    const { el, ref } = stage();
    const { unmount } = renderHook(() => useParallax(ref));
    move(250, 75);
    expect(el.style.getPropertyValue('--px')).toBe('0.25');
    unmount();
    expect(el.style.getPropertyValue('--px')).toBe('');
    move(300, 90);
    expect(el.style.getPropertyValue('--px')).toBe('');
  });
});
