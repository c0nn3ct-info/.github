import { useEffect } from 'react';

/** Symmetric ease for the closer, so the pull neither snaps nor drifts. */
export function easeInOutCubic(p: number): number {
  return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
}

/** The section edge worth closing to, given every section's distance from the
 * viewport top. Null when the nearest edge is already met, or is far enough
 * away that stopping there was clearly deliberate. */
export function pickEdge(tops: readonly number[], vh: number): number | null {
  let best: number | null = null;
  for (const top of tops) if (best === null || Math.abs(top) < Math.abs(best)) best = top;
  if (best === null || Math.abs(best) < 3 || Math.abs(best) > vh * 0.4) return null;
  return best;
}

/** Section closer: when scrolling stops just short of a section edge, glide to
 * it. Only pulls when the edge is already close, so a deliberate stop in the
 * middle of a long section is left alone. */
export function useSectionSettle(): void {
  useEffect(() => {
    if (!window.matchMedia('(prefers-reduced-motion: no-preference)').matches) return;
    let settling = false;
    let lockUntil = 0;
    let watchY = window.scrollY;
    // null, not 0: a timestamp of zero is a legitimate reading, and using it as
    // the empty sentinel would swallow the first movement after mount.
    let moved: number | null = null;

    // A rAF tween rather than scroll-behavior, so the closer lands even where
    // smooth scrolling is throttled.
    const glide = (to: number) => {
      const from = window.scrollY;
      const dist = to - from;
      settling = true;
      const dur = Math.min(520, 180 + Math.abs(dist) * 1.1);
      // Time-based lock: a stale flag can never wedge the closer shut.
      lockUntil = performance.now() + dur + 90;
      const t0 = performance.now();
      const step = (now: number) => {
        if (!settling) return;
        const p = Math.min(1, (now - t0) / dur);
        window.scrollTo(0, Math.round(from + dist * easeInOutCubic(p)));
        if (p < 1) requestAnimationFrame(step);
        else settling = false;
      };
      requestAnimationFrame(step);
    };

    const settle = () => {
      if (performance.now() < lockUntil) return;
      const vh = window.innerHeight;
      const max = document.documentElement.scrollHeight - vh;
      if (window.scrollY < 8 || window.scrollY > max - 8) return;
      const tops = [...document.querySelectorAll('section[id]')].map(
        (s) => s.getBoundingClientRect().top,
      );
      const edge = pickEdge(tops, vh);
      if (edge === null) return;
      glide(window.scrollY + edge);
    };

    // A position watcher rather than the scroll event: it settles the same way
    // for wheel, keyboard, touch fling and programmatic jumps.
    const watch = window.setInterval(() => {
      const y = window.scrollY;
      if (y !== watchY) {
        watchY = y;
        moved = performance.now();
        return;
      }
      if (moved !== null && performance.now() - moved > 150) {
        moved = null;
        settle();
      }
    }, 90);

    // Real input intent cancels a closing tween; the tween's own scroll events
    // do not, since the tween is what emits them.
    const interrupt = () => {
      settling = false;
    };
    const events = ['wheel', 'touchstart', 'keydown'] as const;
    for (const ev of events) window.addEventListener(ev, interrupt, { passive: true });

    return () => {
      window.clearInterval(watch);
      settling = false;
      for (const ev of events) window.removeEventListener(ev, interrupt);
    };
  }, []);
}
