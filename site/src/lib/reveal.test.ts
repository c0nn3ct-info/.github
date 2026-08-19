import { afterEach, describe, expect, it, vi } from 'vitest';
import { setSystemDark } from '../test/setup';
import { initReveals } from './reveal';

function addRevealEl(): HTMLElement {
  const el = document.createElement('div');
  el.className = 'reveal';
  document.body.append(el);
  return el;
}

afterEach(() => {
  document.body.innerHTML = '';
  document.documentElement.classList.remove('js');
  vi.unstubAllGlobals();
});

describe('initReveals', () => {
  it('marks the document as scripted', () => {
    initReveals();
    expect(document.documentElement.classList.contains('js')).toBe(true);
  });

  it('shows everything at once under reduced motion', () => {
    const el = addRevealEl();
    const cleanup = initReveals();
    expect(el.classList.contains('in')).toBe(true);
    cleanup();
  });

  it('shows everything at once when IntersectionObserver is missing', () => {
    setSystemDark(true); // the stubbed matchMedia answers true for every query
    const el = addRevealEl();
    const cleanup = initReveals();
    expect(el.classList.contains('in')).toBe(true);
    cleanup();
  });

  it('reveals elements as they intersect and stops watching them', () => {
    setSystemDark(true);
    const observed: Element[] = [];
    const unobserve = vi.fn();
    const disconnect = vi.fn();
    let capturedCb: (entries: Array<{ isIntersecting: boolean; target: Element }>) => void = () => {};
    class FakeIO {
      constructor(cb: typeof capturedCb) {
        capturedCb = cb;
      }
      observe = (el: Element) => void observed.push(el);
      unobserve = unobserve;
      disconnect = disconnect;
    }
    vi.stubGlobal('IntersectionObserver', FakeIO as unknown as typeof IntersectionObserver);

    const a = addRevealEl();
    const b = addRevealEl();
    const cleanup = initReveals();
    expect(observed).toEqual([a, b]);

    capturedCb([
      { isIntersecting: true, target: a },
      { isIntersecting: false, target: b },
    ]);
    expect(a.classList.contains('in')).toBe(true);
    expect(b.classList.contains('in')).toBe(false);
    expect(unobserve).toHaveBeenCalledWith(a);

    cleanup();
    expect(disconnect).toHaveBeenCalled();
  });
});
