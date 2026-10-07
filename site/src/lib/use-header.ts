import { useEffect, useState } from 'react';

/** Which ground the bar is floating over: the dark hero stage, or the page. */
export type Ground = 'stage' | 'page';

export interface HeaderState {
  ground: Ground;
  hidden: boolean;
  /** The bar itself, so its measured height can become the scroll padding an
   * in-page jump has to clear. Through state rather than a ref, so the effect
   * that reads it re-runs when it attaches. */
  setBar: (el: HTMLElement | null) => void;
}

/** Whether the dark stage still reaches under the bar. Measured from the
 * stage itself: the old rule, nine tenths of the viewport, was the stage's
 * height on a desktop and twice it on a phone, where the stage ends at 557px
 * and the bar stayed black over the light index for the next 200px of
 * scroll. Without a stage in the document (the hook's own tests) the viewport
 * rule stands in. */
function stageUnderBar(y: number): boolean {
  const stage = document.querySelector('.stage');
  if (!stage) return y <= window.innerHeight * 0.9;
  const bar = document.querySelector('.site-header');
  return stage.getBoundingClientRect().bottom > (bar ? bar.getBoundingClientRect().height : 0);
}

/** The bar's two scroll behaviours: it takes the colour of whatever is under
 * it, and it gets out of the way while you are reading downwards. Pages
 * without a dark hero pass `overStage: false` and keep the page colours. */
export function useHeader(overStage: boolean): HeaderState {
  const [ground, setGround] = useState<Ground>(overStage ? 'stage' : 'page');
  const [hidden, setHidden] = useState(false);
  const [bar, setBar] = useState<HTMLElement | null>(null);

  useEffect(() => {
    let last = window.scrollY;
    // Distance travelled in the current direction, signed. The bar moves only
    // once a run has gone 24px one way: measured on a phone, the tail of a
    // flick reverses by 1-3px several times as it settles, and a bar that
    // answered every reversal hid and returned four times in 7px of scroll.
    let run = 0;
    const onScroll = () => {
      // Clamped to the document, because a bounce past either end reads as a
      // scroll in the other direction and brought the bar back at the foot of
      // the page.
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const y = Math.max(0, max > 0 ? Math.min(window.scrollY, max) : window.scrollY);
      setGround(overStage && stageUnderBar(y) ? 'stage' : 'page');
      const dy = y - last;
      last = y;
      run = Math.sign(run) === Math.sign(dy) ? run + dy : dy;
      // Away on a downward run, back on an upward one or near the top.
      if (y <= 140) setHidden(false);
      else if (run >= 24) setHidden(true);
      else if (run <= -24) setHidden(false);
    };
    // A pointer reaching for the bar counts as intent even without a scroll.
    // A finger is not: it crosses the top of the screen at the end of every
    // downward swipe.
    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== 'touch' && e.clientY < 90) setHidden(false);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pointermove', onPointer, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pointermove', onPointer);
    };
  }, [overStage]);

  // What an in-page jump has to clear. It was a flat 74px, which is a number
  // the bar has never been: measured, the bar is 63px on a desktop, so a jump
  // stopped 11px short of the section it was aimed at, and 107px on a phone,
  // where the row wraps and the same jump left the heading under the bar. The
  // wrap depends on the locale's own words, so it is measured rather than
  // guessed at in a media query.
  useEffect(() => {
    if (!bar) return;
    const apply = () => {
      document.documentElement.style.setProperty(
        '--bar-h',
        `${Math.round(bar.getBoundingClientRect().height)}px`,
      );
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(bar);
    return () => {
      ro.disconnect();
      document.documentElement.style.removeProperty('--bar-h');
    };
  }, [bar]);

  return { ground, hidden, setBar };
}
