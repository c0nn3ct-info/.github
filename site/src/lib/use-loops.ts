import { useEffect } from 'react';

/**
 * Pauses the page's looping animations while nobody can see them.
 *
 * Four ran permanently: the dot riding the hero wire, the dashed ring turning
 * behind it, the belt of refusals, and the ring breathing on the habits card.
 * Measured on a fresh load, all four were already running with two of them off
 * screen, and all four kept running with the hero a full viewport away. None of
 * them means anything to a reader who is not looking at it, and a loop that
 * cannot be seen is battery spent on nothing.
 *
 * Pausing rather than removing, so the wire picks its dot back up where it left
 * it instead of restarting the arrival every time the hero scrolls back.
 *
 * `refresh` exists because two of the marked elements, the scan band and the
 * caret, only render while the workshop pane is open, so the set has to be
 * gathered again when the open product changes.
 */
export function useIdleLoops(refresh?: unknown): void {
  useEffect(() => {
    if (!window.matchMedia('(prefers-reduced-motion: no-preference)').matches) return;
    const nodes = [...document.querySelectorAll<HTMLElement>('[data-loop]')];
    if (!nodes.length) return;

    const onScreen = new WeakMap<Element, boolean>();
    const apply = (el: Element) => {
      const run = !document.hidden && onScreen.get(el) !== false;
      (el as HTMLElement).style.animationPlayState = run ? '' : 'paused';
    };

    // A tenth of a viewport of margin, so a loop is already moving by the time
    // its first pixel arrives rather than starting under the reader's eye.
    // Watch the region, not the moving part. The dot on the hero wire rests at
    // x -20, off the left edge, because that is where it enters from; observing
    // the dot itself paused it there and it never moved again. Its section is
    // stationary and is what "can anyone see this" actually means. Anything
    // outside a section, like the belt between two of them, watches itself.
    const watched = new Map<Element, Element>();
    for (const n of nodes) watched.set(n, n.closest('section') ?? n);

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          for (const [node, region] of watched) {
            if (region !== e.target) continue;
            onScreen.set(node, e.isIntersecting);
            apply(node);
          }
        }
      },
      { rootMargin: '10% 0px' },
    );
    for (const region of new Set(watched.values())) io.observe(region);

    const onVisibility = () => {
      for (const n of nodes) apply(n);
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      for (const n of nodes) n.style.animationPlayState = '';
    };
  }, [refresh]);
}
