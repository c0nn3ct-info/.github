import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { setMedia } from '../test/setup';
import { useParallax } from './use-parallax';

function stage() {
  const el = document.createElement('div');
  el.getBoundingClientRect = () =>
    ({ left: 100, top: 50, width: 200, height: 100 }) as DOMRect;
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
