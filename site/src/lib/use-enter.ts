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
/** The ceiling on how long a smooth jump is given to settle, for a browser that
 * sends no `scrollend`. Long enough for the length of this page, short enough
 * that the arrival still belongs to the click that caused it. */
const JUMP = 900;
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

/** The gestures, in reading order, played once over whatever the section is
 * showing now. Shared by the timer fallback and by an arrival on a jump. */
function play(section: Element, rtl: boolean, easing: string): void {
  arrivals(section).forEach(([el, gesture], i) => {
    el.animate(keyframes(gesture, rtl), {
      duration: DUR,
      delay: Math.min(i * STEP, MAX_DELAY),
      easing,
    });
  });
}

/**
 * Arriving by a link is an arrival too.
 *
 * A smooth jump consumes every entrance in its path at the scroll's own speed,
 * and the range is measured in scroll rather than in time, so it is spent long
 * before the jump ends. Measured on the bar's jump list: the section landed on
 * showed 33ms of movement, two frames, against 167ms for the same section
 * reached by wheel and 450ms for the hero's own arrival on load. That jump list
 * only exists above 900px, which is why the page looked alive on a phone and
 * still on a desktop.
 *
 * So a jump replays the arrival of the section it lands on, with the same two
 * gestures the scroll drives, once the scrolling has stopped. `scrollend` is the
 * signal; the timer is the ceiling for browsers that do not send it.
 */
export function useJumpArrival(): void {
  useEffect(() => {
    if (!window.matchMedia('(prefers-reduced-motion: no-preference)').matches) return;
    const rtl = document.documentElement.dir === 'rtl';
    const easing = enterEase();
    let waiting: Element | null = null;
    let ceiling: ReturnType<typeof setTimeout> | undefined;

    const landed = () => {
      // A scroller reports the end of one glide more than once, and the ceiling
      // can already be queued when the event arrives, so the first call is the
      // landing and the rest are nothing. The listener goes on cleanup; adding
      // the same one again per click is what the DOM already deduplicates.
      const section = waiting;
      if (!section) return;
      waiting = null;
      clearTimeout(ceiling);
      ceiling = undefined;
      play(section, rtl, easing);
    };

    const onClick = (e: MouseEvent) => {
      const link = (e.target as Element | null)?.closest?.('a[href^="#"]');
      const id = link?.getAttribute('href')?.slice(1);
      const section = id ? document.getElementById(id) : null;
      if (!section?.hasAttribute('data-enter-section')) return;
      waiting = section;
      clearTimeout(ceiling);
      document.addEventListener('scrollend', landed);
      ceiling = setTimeout(landed, JUMP);
    };

    document.addEventListener('click', onClick);
    return () => {
      clearTimeout(ceiling);
      waiting = null;
      document.removeEventListener('click', onClick);
      document.removeEventListener('scrollend', landed);
    };
  }, []);
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
          play(e.target, rtl, easing);
        }
      },
      { rootMargin: LEAD },
    );
    for (const s of sections) io.observe(s);
    return () => io.disconnect();
  }, []);
}
