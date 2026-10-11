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

/** Under the 300ms an entrance can take before it reads as waiting. */
const DUR = 300;
const STEP = 45;
/** The ceiling on how long a smooth jump is given to settle, for a browser that
 * sends no `scrollend` and a glide the quiet below never catches. Long enough
 * for the length of this page, short enough that the arrival still belongs to
 * the click that caused it. */
const JUMP = 900;
/** How long the page has to stand still, after a click or after the last of a
 * glide's scroll events, before the jump counts as landed. Longer than a
 * frame of the glide, shorter than anything a reader would notice. */
const QUIET = 100;
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

/** The gestures, in reading order, over whatever the section is showing now.
 * Shared by the timer fallback, which plays them at once, and by a jump, which
 * holds them on their first frame until the page has landed. */
function arrive(section: Element, rtl: boolean, easing: string): Animation[] {
  return arrivals(section).map(([el, gesture], i) =>
    el.animate(keyframes(gesture, rtl), {
      duration: DUR,
      delay: Math.min(i * STEP, MAX_DELAY),
      easing,
      // The first frame holds through the delay, so a held sequence is all
      // out of sight at once rather than its tail still showing.
      fill: 'backwards',
    }),
  );
}

/**
 * Arriving by a link is an arrival too.
 *
 * A smooth jump consumes every entrance in its path at the scroll's own speed,
 * and the range is measured in scroll rather than in time, so it is spent long
 * before the jump ends. Measured on the bar's jump list: the section landed on
 * showed 33ms of movement, two frames, against 167ms for the same section
 * reached by wheel and 450ms for the hero's own arrival on load.
 *
 * So a jump holds the arrival of the section it is aimed at from the click,
 * every element on its first frame, and plays it once the scrolling has
 * stopped. Held rather than replayed: a replay after the landing took a pane
 * that was already fully there back to nothing and brought it in again, which
 * on a phone, where the hero's index jumps to the products, was the blink
 * after every tap. The landing is `scrollend` where the scroller sends it, a
 * page that has stood still for a hundred milliseconds where it does not,
 * and a ceiling behind both.
 */
export function useJumpArrival(): void {
  useEffect(() => {
    if (!window.matchMedia('(prefers-reduced-motion: no-preference)').matches) return;
    const rtl = document.documentElement.dir === 'rtl';
    const easing = enterEase();
    let held: Animation[] = [];
    let quiet: ReturnType<typeof setTimeout> | undefined;
    let ceiling: ReturnType<typeof setTimeout> | undefined;

    const stop = () => {
      clearTimeout(quiet);
      clearTimeout(ceiling);
      quiet = ceiling = undefined;
      document.removeEventListener('scrollend', land);
      document.removeEventListener('scroll', onScroll);
    };
    // A scroller reports the end of one glide more than once, and the timers
    // can already be queued when the event arrives, so the first call is the
    // landing and the rest are nothing.
    const land = () => {
      const arrival = held;
      held = [];
      stop();
      for (const a of arrival) a.play();
    };
    const onScroll = () => {
      clearTimeout(quiet);
      quiet = setTimeout(land, QUIET);
    };

    const onClick = (e: MouseEvent) => {
      const link = (e.target as Element | null)?.closest?.('a[href^="#"]');
      const id = link?.getAttribute('href')?.slice(1);
      const section = id ? document.getElementById(id) : null;
      if (!section?.hasAttribute('data-enter-section')) return;
      // A second link while the first is still gliding: the first section is
      // let go where it stands, and only the last one pressed arrives.
      for (const a of held) a.cancel();
      stop();
      held = arrive(section, rtl, easing);
      for (const a of held) a.pause();
      document.addEventListener('scrollend', land);
      document.addEventListener('scroll', onScroll, { passive: true });
      // A link to where the page already is moves nothing, and nothing
      // reports an end: a jump that has not started by now never will.
      quiet = setTimeout(land, QUIET);
      ceiling = setTimeout(land, JUMP);
    };

    document.addEventListener('click', onClick);
    return () => {
      for (const a of held) a.cancel();
      held = [];
      stop();
      document.removeEventListener('click', onClick);
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
          arrive(e.target, rtl, easing);
        }
      },
      { rootMargin: LEAD },
    );
    for (const s of sections) io.observe(s);
    return () => io.disconnect();
  }, []);
}
