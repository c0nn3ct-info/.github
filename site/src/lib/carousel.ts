import { useEffect, useState } from 'react';

/**
 * How long a capture holds once it has arrived.
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

/**
 * How long to wait for a capture to settle where `scrollend` is not delivered.
 *
 * Longer than a one-capture glide and shorter than the dwell, so a browser
 * without the event keeps the same rhythm with the phase approximated rather
 * than measured.
 */
const LANDING = 600;

/** How much stillness counts as a scroller having stopped, for the same. */
const QUIET = 120;

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
 * Calls back once a scroller has stopped, however it was moved.
 *
 * `scrollend` where the browser sends it. Where it does not, a quiet stretch is
 * the signal instead, which is what the event itself means.
 */
function onSettle(track: HTMLElement, done: () => void): () => void {
  if ('onscrollend' in window) {
    track.addEventListener('scrollend', done);
    return () => track.removeEventListener('scrollend', done);
  }
  let quiet: ReturnType<typeof setTimeout> | undefined;
  const nudge = () => {
    clearTimeout(quiet);
    quiet = setTimeout(done, QUIET);
  };
  track.addEventListener('scroll', nudge, { passive: true });
  return () => {
    clearTimeout(quiet);
    track.removeEventListener('scroll', nudge);
  };
}

/**
 * Closes the loop on the copy of the first capture that sits at the end.
 *
 * The track carries one slide more than it has captures, and the extra one is
 * the first capture again. Landing on it puts the scroller back at the start
 * without an animation, on the same pixels, so nothing moves and the next step
 * is a step forward like every other. Before this the loop went back the way it
 * came, a rewind across the whole track, which is a return rather than a loop.
 */
export function useLoop(track: HTMLDivElement | null, on: boolean): void {
  useEffect(() => {
    if (!on || !track) return;
    return onSettle(track, () => {
      const { total, at } = span(track);
      if (total > 0 && at >= total - 1) track.scrollTo({ left: 0, behavior: 'auto' });
    });
  }, [track, on]);
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
 *
 * **The dwell is measured from the moment a capture settles, not from the moment
 * the one before it began leaving.** A glide takes a few hundred milliseconds and
 * the loop back takes the whole track, so a clock started with the scroll had the
 * readout filling for a capture that was still on its way, and gave the first
 * capture after a loop a visibly shorter turn than the rest. `scrollend` is the
 * signal and `LANDING` is the ceiling for browsers that do not send it.
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
    // Held as locals so the hoisted `turn` below sees the elements rather than
    // the nullable props they came from.
    const region = frame;
    const scroller = track;

    let hold: ReturnType<typeof setTimeout> | undefined;
    let ceiling: ReturnType<typeof setTimeout> | undefined;
    let settling = false;
    let seen = false;
    let held = false;

    const running = () => seen && !held && !document.hidden;

    // Two timers with two jobs, and only one of them is the reader's business.
    // Pausing used to clear both, which left a capture that was mid-glide
    // waiting for a landing that had been cancelled: the dwell never started
    // again and the carousel stopped for good on a pointer that passed over it.
    const stop = () => {
      clearTimeout(hold);
      hold = undefined;
    };
    const forget = () => {
      clearTimeout(ceiling);
      ceiling = undefined;
      settling = false;
      scroller.removeEventListener('scrollend', landed);
    };

    const arm = () => {
      if (hold === undefined && !settling) hold = setTimeout(turn, dwell(region));
    };

    /** The capture has settled, so the next dwell starts here, and the fill with it. */
    const landed = () => {
      // A scroller can report the end of one glide more than once, a snap
      // settling after the scroll being the ordinary case, and the ceiling can
      // already be queued when the event arrives. The first one is the landing
      // and the rest are nothing; `forget` is what takes the listener away.
      if (!settling) return;
      settling = false;
      clearTimeout(ceiling);
      ceiling = undefined;
      setBeat((n) => n + 1);
      if (running()) arm();
    };

    function turn() {
      hold = undefined;
      const { total, at } = span(scroller);
      // Before layout there is nothing to page through, and nothing to be wrong
      // about either, so it waits out another dwell rather than giving up.
      if (total <= 0) {
        arm();
        return;
      }
      // One step forward, every time. A looping track has a copy of the first
      // capture at the end and `useLoop` closes on it, so there is always a next
      // step; the return to the start is the fallback for a track without one.
      if (at >= total - 1) scroller.scrollTo({ left: 0, behavior: 'smooth' });
      else scroller.scrollBy({ left: stride(scroller, 1), behavior: 'smooth' });
      settling = true;
      if ('onscrollend' in window) scroller.addEventListener('scrollend', landed);
      ceiling = setTimeout(landed, LANDING);
    }

    const sync = () => {
      const go = running();
      setPlaying(go);
      if (go) arm();
      else stop();
    };

    const grab = () => {
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
      stop();
      forget();
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
    io.observe(region);

    region.addEventListener('pointerenter', grab);
    region.addEventListener('pointerleave', release);
    region.addEventListener('focusin', grab);
    region.addEventListener('focusout', release);
    // pointerdown catches a swipe, which produces no click of its own; click
    // catches an activation that arrives without a pointer at all, from a
    // screen reader or an assistive switch.
    region.addEventListener('pointerdown', restart);
    region.addEventListener('click', restart);
    region.addEventListener('keydown', restart);
    region.addEventListener('wheel', wheel, { passive: true });
    document.addEventListener('visibilitychange', sync);

    return () => {
      stop();
      forget();
      io.disconnect();
      region.removeEventListener('pointerenter', grab);
      region.removeEventListener('pointerleave', release);
      region.removeEventListener('focusin', grab);
      region.removeEventListener('focusout', release);
      region.removeEventListener('pointerdown', restart);
      region.removeEventListener('click', restart);
      region.removeEventListener('keydown', restart);
      region.removeEventListener('wheel', wheel);
      document.removeEventListener('visibilitychange', sync);
      setPlaying(false);
    };
  }, [frame, track, count, on]);

  return { playing, beat };
}
