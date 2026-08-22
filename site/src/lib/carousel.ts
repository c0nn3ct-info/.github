import { useEffect, useState } from 'react';

/**
 * How long one capture holds before the carousel moves on.
 *
 * Long enough to take in a dense product screenshot, short enough that a reader
 * who glanced at the pane learns there is more than one. Everything below is
 * about giving it back: it pauses the moment a reader is on it and stops for
 * good once they have driven it themselves.
 *
 * The number lives in the stylesheet as `--shot-dwell`, because the readout
 * fills over exactly this long and two definitions of one duration drift apart
 * the first time either is tuned. This is the fallback for a document that has
 * no stylesheet to read it from.
 */
const DWELL = 5000;

function dwell(frame: HTMLElement): number {
  const raw = getComputedStyle(frame).getPropertyValue('--shot-dwell').trim();
  const ms = raw.endsWith('ms') ? Number.parseFloat(raw) : Number.parseFloat(raw) * 1000;
  return Number.isFinite(ms) && ms > 0 ? ms : DWELL;
}

/**
 * One capture of travel, in physical pixels, in the direction being asked for.
 *
 * `scrollBy` takes physical pixels, so under rtl "next" is a negative delta.
 * Without the sign the next chevron in Arabic and Persian scrolled towards the
 * start, which is clamped at rest, so it did nothing at all: measured on
 * `/ar/`, `scrollLeft` stayed 0 across a click.
 */
export function stride(track: HTMLElement, dir: number): number {
  return track.clientWidth * dir * (document.documentElement.dir === 'rtl' ? -1 : 1);
}

/** How far the track can travel, and how far along it is, sign-free. */
function span(track: HTMLElement): { total: number; at: number } {
  return { total: track.scrollWidth - track.clientWidth, at: Math.abs(track.scrollLeft) };
}

/**
 * Turns the captures over on their own, until the reader takes it from there.
 *
 * The pane is one of three things a reader looks at in the work section, and a
 * carousel that waits to be discovered shows one capture out of three. So it
 * turns them over itself, and every rule below is about the reader outranking
 * the timer:
 *
 * - **It never starts for a reader who asked for less motion.** There is no
 *   reduced version of content that moves on its own, so under the preference
 *   there is none.
 * - **It runs only while the pane is on screen and the tab is in front**, the
 *   same rule the page's looping animations follow, and for the same reason.
 * - **It holds while the reader is on it**, pointer over the pane or focus
 *   inside it, because moving a capture out from under someone reading it is
 *   the whole reason autoplay has a bad name.
 * - **Driving it resets the dwell rather than ending it** (owner-directed): a
 *   press, a key, or a sideways wheel gives the capture the reader just landed
 *   on a full dwell of its own, so the carousel never moves out from under a
 *   decision they made a moment ago and never stops answering either.
 *
 * It loops: from the last capture it returns to the first, which is the one
 * shape a reader expects of a set that turns itself over. The way back is the
 * whole track, so it reads as a rewind, which is the honest picture of what
 * just happened.
 */
export function useAutoplay(
  /**
   * The frame is what "the reader is on this" means, and it is a separate
   * element on purpose: the chevrons sit over the capture but outside the
   * track, so a pointer moving from the capture onto a chevron leaves the
   * track, and a hold that watched the track alone let go exactly as the
   * reader took aim.
   */
  frame: HTMLElement | null,
  track: HTMLDivElement | null,
  count: number,
  on: boolean,
  /**
   * Whether the captures are turning over right now, and a beat that changes
   * every time the dwell starts again from zero, so the readout's fill can be
   * restarted with it. React state rather than attributes written by hand, so a
   * prerendered page carries the resting values a fresh load has.
   */
): { playing: boolean; beat: number } {
  const [playing, setPlaying] = useState(false);
  const [beat, setBeat] = useState(0);

  useEffect(() => {
    if (!on || !frame || !track || count < 2) return;
    if (!window.matchMedia('(prefers-reduced-motion: no-preference)').matches) return;

    let timer: ReturnType<typeof setInterval> | undefined;
    let seen = false;
    let held = false;

    const tick = () => {
      const { total, at } = span(track);
      // Before layout there is nothing to page through, and nothing to be wrong
      // about either.
      if (total <= 0) return;
      // Back to the first capture rather than one further into a track that has
      // run out. `left: 0` is the start in both writing directions, since rtl
      // counts away from zero rather than towards it.
      if (at >= total - 1) track.scrollTo({ left: 0, behavior: 'smooth' });
      else track.scrollBy({ left: stride(track, 1), behavior: 'smooth' });
    };

    const sync = () => {
      const run = seen && !held && !document.hidden;
      if (run && timer === undefined) timer = setInterval(tick, dwell(frame));
      if (!run && timer !== undefined) {
        clearInterval(timer);
        timer = undefined;
      }
      setPlaying(run);
    };

    const hold = () => {
      held = true;
      sync();
    };
    const release = () => {
      held = false;
      sync();
    };
    // The reader moved it themselves, so the capture they landed on gets a whole
    // dwell of its own: the timer starts again from zero and the readout's fill
    // starts with it.
    const restart = () => {
      if (timer !== undefined) {
        clearInterval(timer);
        timer = undefined;
      }
      setBeat((n) => n + 1);
      sync();
    };
    // A wheel across the pane is the reader paging it; a wheel down the page
    // happens to pass over it.
    const wheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) restart();
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) seen = e.isIntersecting;
        sync();
      },
      // Half of it, so the captures turn over for a reader who has the pane in
      // front of them rather than for one whose screen holds its top edge.
      { threshold: 0.5 },
    );
    io.observe(frame);

    frame.addEventListener('pointerenter', hold);
    frame.addEventListener('pointerleave', release);
    frame.addEventListener('focusin', hold);
    frame.addEventListener('focusout', release);
    // pointerdown catches a swipe, which produces no click of its own; click
    // catches an activation that arrives without a pointer at all, from a
    // screen reader or an assistive switch.
    frame.addEventListener('pointerdown', restart);
    frame.addEventListener('click', restart);
    frame.addEventListener('keydown', restart);
    frame.addEventListener('wheel', wheel, { passive: true });
    document.addEventListener('visibilitychange', sync);

    return () => {
      if (timer !== undefined) clearInterval(timer);
      io.disconnect();
      frame.removeEventListener('pointerenter', hold);
      frame.removeEventListener('pointerleave', release);
      frame.removeEventListener('focusin', hold);
      frame.removeEventListener('focusout', release);
      frame.removeEventListener('pointerdown', restart);
      frame.removeEventListener('click', restart);
      frame.removeEventListener('keydown', restart);
      frame.removeEventListener('wheel', wheel);
      document.removeEventListener('visibilitychange', sync);
      setPlaying(false);
    };
  }, [frame, track, count, on]);

  return { playing, beat };
}
