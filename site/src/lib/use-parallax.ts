import { useEffect, type RefObject } from 'react';

/** Writes the pointer's position within `ref`, as two unitless -0.5…0.5
 * numbers, onto the element itself. The hero reads them from CSS, so the
 * resting page (and every reduced-motion or touch visitor) needs no styles of
 * its own: the custom properties simply stay unset. */
export function useParallax(ref: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia('(prefers-reduced-motion: no-preference)').matches) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const clamp = (v: number) => Math.max(-0.5, Math.min(0.5, v));
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--px', String(clamp((e.clientX - r.left) / r.width - 0.5)));
      el.style.setProperty('--py', String(clamp((e.clientY - r.top) / r.height - 0.5)));
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      el.style.removeProperty('--px');
      el.style.removeProperty('--py');
    };
  }, [ref]);
}
