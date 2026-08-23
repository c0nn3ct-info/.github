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

/** The bar's two scroll behaviours: it takes the colour of whatever is under
 * it, and it gets out of the way while you are reading downwards. Pages
 * without a dark hero pass `overStage: false` and keep the page colours. */
export function useHeader(overStage: boolean): HeaderState {
  const [ground, setGround] = useState<Ground>(overStage ? 'stage' : 'page');
  const [hidden, setHidden] = useState(false);
  const [bar, setBar] = useState<HTMLElement | null>(null);

  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setGround(overStage && y <= window.innerHeight * 0.9 ? 'stage' : 'page');
      // Away on a downward run, back on the first upward intent or near the top.
      setHidden(y > 140 && y > last + 4);
      last = y;
    };
    // A pointer reaching for the bar counts as intent even without a scroll.
    const onPointer = (e: PointerEvent) => {
      if (e.clientY < 90) setHidden(false);
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
