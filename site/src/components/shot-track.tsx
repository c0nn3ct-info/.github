import { useLayoutEffect, useState, type CSSProperties } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { stride, useAutoplay } from '@/lib/carousel';
import { t } from '../i18n';

export interface Shot {
  /** Both themes, because the capture is of a themed interface and the wrong
   * one beside the page's own ground reads as a screenshot of a different
   * product. The picture element picks, so no script decides it. */
  light: string;
  dark: string;
  alt: string;
}

/** One capture forward or back. The scroller does the rest; the direction comes
 * from `stride`, because a physical delta does not flip with the writing mode on
 * its own. */
function step(track: HTMLDivElement, dir: number): void {
  const smooth = window.matchMedia('(prefers-reduced-motion: no-preference)').matches;
  track.scrollBy({ left: stride(track, dir), behavior: smooth ? 'smooth' : 'auto' });
}

interface ShotTrackProps {
  shots: readonly Shot[];
  /** Which capture to start on, for a dialog opened from one of them. */
  at?: number;
  label: string;
  /**
   * A capture is a control in the pane, where activating one opens it, and it
   * is scenery in the dialog, where activating any of them does the same one
   * thing. So it is a button only in the first case; in the second the click
   * belongs to the whole surface, and the dialog keeps its own close control
   * for the keyboard.
   */
  pick?: { verb: string; onPick: (shot: Shot) => void };
  onSurface?: () => void;
  /** The dialog's captures are already decoded by the pane that opened it. */
  eager?: boolean;
  /**
   * Turn the captures over unprompted. True for the pane, where the carousel is
   * one of several things on screen and has to say it holds more than one
   * capture; false for the dialog, where the reader opened a particular capture
   * and moving it under them would answer a click they did not make.
   */
  auto?: boolean;
}

/**
 * A scroll container rather than a slideshow. Swipe, trackpad, arrow keys and
 * Home/End all come from the browser, and there is no index in React for
 * anything to disagree about. What this adds is a way to drive it with a mouse
 * and a hairline saying how far along it is.
 */
export function ShotTrack({ shots, at = 0, label, pick, onSurface, eager, auto }: ShotTrackProps) {
  // Through state rather than a ref, so the chevrons can wait for an element
  // that exists and `step` never has to guard against a null it cannot see.
  const [track, setTrack] = useState<HTMLDivElement | null>(null);
  const [frame, setFrame] = useState<HTMLDivElement | null>(null);

  // Opened from the third capture, the dialog should be showing the third.
  // Measured rather than multiplied, because scrollLeft runs backwards under
  // rtl and the delta between two boxes does not.
  useLayoutEffect(() => {
    if (!track) return;
    const slide = track.children[at];
    if (!slide) return;
    track.scrollLeft += slide.getBoundingClientRect().left - track.getBoundingClientRect().left;
  }, [track, at]);

  const { playing, beat } = useAutoplay(frame, track, shots.length, Boolean(auto));

  return (
    <div
      className="shot-frame"
      ref={setFrame}
      style={{ '--shots': shots.length } as CSSProperties}
    >
      <div
        className="shot-track"
        tabIndex={0}
        role="group"
        aria-label={label}
        ref={setTrack}
        onClick={onSurface}
      >
        {shots.map((shot) =>
          pick ? (
            <button
              type="button"
              key={shot.light}
              className="shot-slide"
              onClick={() => pick.onPick(shot)}
              aria-label={`${shot.alt} · ${pick.verb}`}
            >
              <Capture shot={shot} eager={eager} />
            </button>
          ) : (
            <div className="shot-slide" key={shot.light}>
              <Capture shot={shot} eager={eager} labelled={false} />
            </div>
          ),
        )}
      </div>
      {track && (
        <>
          <button
            type="button"
            className="shot-nav shot-nav-prev"
            onClick={() => step(track, -1)}
            aria-label={t('home.work.shot_prev')}
          >
            <ChevronLeft className="h-[18px] w-[18px] rtl:-scale-x-100" aria-hidden />
          </button>
          <button
            type="button"
            className="shot-nav shot-nav-next"
            onClick={() => step(track, 1)}
            aria-label={t('home.work.shot_next')}
          >
            <ChevronRight className="h-[18px] w-[18px] rtl:-scale-x-100" aria-hidden />
          </button>
        </>
      )}
      {/* Which capture, out of how many: one mark each, and a bright one that
          travels between them on the scroller's own timeline, so it is exact at
          any position rather than at the ones a script thought about. While the
          captures are turning themselves over, the bright mark fills over the
          dwell, which is the carousel saying the next one is coming. */}
      <div className="shot-progress" data-playing={playing || undefined} aria-hidden>
        {shots.map((shot) => (
          <span className="shot-seg" key={shot.light} />
        ))}
        {/* Keyed on the beat so a dwell the reader restarted takes the fill
            with it: the animation is the browser's, and the only way to start
            one again is a new element. */}
        <span className="shot-at" key={beat} />
      </div>
    </div>
  );
}

/** In the dialog the description is already the dialog's own name, so saying it
 * again here would read the screenshot out twice. */
function Capture({
  shot,
  eager,
  labelled = true,
}: {
  shot: Shot;
  eager?: boolean;
  labelled?: boolean;
}) {
  return (
    <picture>
      <source media="(prefers-color-scheme: dark)" srcSet={shot.dark} />
      <img
        src={shot.light}
        alt={labelled ? shot.alt : ''}
        width={1280}
        height={800}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        /* An image is a drag source by default, and a press that slid a few
         * pixels started dragging the screenshot instead of clicking it, which
         * swallowed the click that opens the pane's capture and the one that
         * closes the dialog. Measured: a clean click closed the dialog, the
         * same click with 6px of travel did nothing at all. */
        draggable={false}
      />
    </picture>
  );
}
