import { useEffect } from 'react';
import { enterEase } from './ease';

/**
 * Where `view()` timelines exist the entrances are a scroll-driven CSS
 * animation, which is where they belong: progress follows the element's place
 * on screen rather than a clock. This module is the fallback for browsers
 * without them, playing the same two gestures off a timer.
 *
 * Both paths test the same way, so nothing can ever animate twice.
 */
export function scrollDriven(): boolean {
  return typeof CSS !== 'undefined' && CSS.supports('animation-timeline', 'view()');
}

/** No lead at all, deliberately. A positive bottom margin looked like the way
 * to keep the jump to the first keyframe off screen, but #work sits one
 * viewport down, so any lead at all made it intersect at load and spend its
 * arrival before the reader had scrolled a pixel.
 *
 * Zero works because every section pads its own top: the observer fires as the
 * section's first pixel crosses the fold, and the first marked element is
 * still 32 to 96px below that, which is where the jump happens. */
const LEAD = '0px';

const DUR = 420;
const STEP = 45;
/** Five steps of lead is a fifth of a second before the last item starts.
 * Past that a list reads as waiting rather than arriving. */
const MAX_DELAY = STEP * 5;

/** The same two gestures the stylesheet declares, kept in step by hand because
 * a keyframe rule and a keyframe object cannot share one definition. Transform
 * and opacity only: everything else pays in paint. */
function keyframes(gesture: string, rtl: boolean): Keyframe[] {
  // A sequence arrives along the line it is read on.
  if (gesture === 'wipe') {
    return [
      { opacity: 0, transform: `translateX(${rtl ? 14 : -14}px)` },
      { opacity: 1, transform: 'none' },
    ];
  }
  // One object rather than a sequence: it settles into place. The touch of
  // scale is what separates settling from sliding, and stays well inside the
  // 0.9 floor that keeps an entrance from appearing out of nothing.
  return [
    { opacity: 0, transform: 'translateY(12px) scale(0.985)' },
    { opacity: 1, transform: 'none' },
  ];
}

/** Everything in this section that arrives, in reading order, paired with the
 * gesture it arrives by. A container marked to stagger contributes its own
 * children rather than itself. */
function arrivals(section: Element): [Element, string][] {
  const out: [Element, string][] = [];
  for (const el of section.querySelectorAll('[data-enter], [data-enter-stagger]')) {
    const stagger = el.getAttribute('data-enter-stagger');
    if (stagger === null) {
      out.push([el, el.getAttribute('data-enter') || 'rise']);
      continue;
    }
    for (const child of el.children) out.push([child, stagger || 'rise']);
  }
  return out;
}

/**
 * Each section arrives once, when it first comes up, and never again.
 *
 * Transient keyframes through the Web Animations API rather than a class that
 * holds a hidden state. That matters three times over: the resting DOM is
 * always the finished one, so a script that never runs hides nothing; the
 * prerenderer captures the page mid-session and would otherwise serialize
 * whatever was still invisible; and a reader scrolling back up finds the page
 * where they left it rather than replaying it.
 */
export function useSectionEntrance(): void {
  useEffect(() => {
    if (scrollDriven()) return;
    if (!window.matchMedia('(prefers-reduced-motion: no-preference)').matches) return;
    const sections = [...document.querySelectorAll('[data-enter-section]')];
    if (!sections.length) return;
    const rtl = document.documentElement.dir === 'rtl';
    const easing = enterEase();

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          io.unobserve(e.target);
          arrivals(e.target).forEach(([el, gesture], i) => {
            el.animate(keyframes(gesture, rtl), {
              duration: DUR,
              delay: Math.min(i * STEP, MAX_DELAY),
              easing,
            });
          });
        }
      },
      { rootMargin: LEAD },
    );
    for (const s of sections) io.observe(s);
    return () => io.disconnect();
  }, []);
}
