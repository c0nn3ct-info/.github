import { useEffect, useState } from 'react';

/** Which ground the bar is floating over: the dark hero stage, or the page. */
export type Ground = 'stage' | 'page';

export interface HeaderState {
  ground: Ground;
  hidden: boolean;
}

/** The bar's two scroll behaviours: it takes the colour of whatever is under
 * it, and it gets out of the way while you are reading downwards. Pages
 * without a dark hero pass `overStage: false` and keep the page colours. */
export function useHeader(overStage: boolean): HeaderState {
  const [ground, setGround] = useState<Ground>(overStage ? 'stage' : 'page');
  const [hidden, setHidden] = useState(false);

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

  return { ground, hidden };
}
