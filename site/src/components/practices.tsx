import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Arrow } from '@/components/arrow';
import { nextIndex } from '@/lib/roving';
import { t } from '../i18n';

const HABITS = ['p1', 'p2', 'p3', 'p4', 'p5'] as const;

/** Five habits, with the chosen one's reasoning held in the block card beside
 * them. Hover previews it, click and keyboard commit it, so the panel is
 * reachable without a pointer. */
export function Practices() {
  const [i, setI] = useState(0);
  const list = useRef<HTMLDivElement>(null);
  const [panel, setPanel] = useState<HTMLDivElement | null>(null);
  const shown = useRef(i);
  // Where the tapped row sat before the accordion reflowed around it.
  const anchor = useRef<{ row: HTMLElement; top: number } | null>(null);

  // Opening a row below the open one moves the open panel from above the
  // finger to below it, and the tapped row jumped 234px up the screen. The
  // page scrolls by the same amount, so the row stays under the finger.
  // Instant, named: the page's in-page jumps are smooth (`scroll-behavior`
  // on html), and a smooth correction here let the row jump first and then
  // slide back over 240ms, which is the jerk this exists to prevent.
  useLayoutEffect(() => {
    const a = anchor.current;
    anchor.current = null;
    if (a) {
      window.scrollBy({ top: a.row.getBoundingClientRect().top - a.top, behavior: 'instant' });
    }
  }, [i]);

  // The panel follows the pointer, so this is a preview rather than a
  // committed choice, and it used to change with a hard cut: sweeping the five
  // habits strobed the card. It dips instead of blinking, from 0.45 rather
  // than from nothing, so a fast sweep reads as the panel tracking the pointer
  // and a single deliberate move reads as a soft arrival. No movement, because
  // a preview that slides would be five slides on the way past.
  useEffect(() => {
    if (!panel || i === shown.current) {
      shown.current = i;
      return;
    }
    shown.current = i;
    if (!window.matchMedia('(prefers-reduced-motion: no-preference)').matches) return;
    for (const el of panel.querySelectorAll('[data-swap]')) {
      // `ease` rather than `ease-out` for a crossfade: nothing is entering or
      // leaving, one reading replaces another, and the gentler curve keeps a
      // fast sweep down the list from feeling like five separate hits.
      el.animate([{ opacity: 0.45 }, { opacity: 1 }], { duration: 160, easing: 'ease' });
    }
  }, [panel, i]);

  // A tap reaches the row as pointerenter, focus and click in turn, so all
  // three go through here and only the first one that changes the habit
  // records where the row sat.
  const choose = (n: number, row: HTMLElement) => {
    if (n === i) return;
    if (window.matchMedia('(max-width: 899px)').matches) {
      anchor.current = { row, top: row.getBoundingClientRect().top };
    }
    setI(n);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const n = nextIndex(e.key, i, HABITS.length);
    if (n === null) return;
    e.preventDefault();
    setI(n);
    list.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[n]?.focus();
  };

  return (
    <section
      id="how"
      aria-labelledby="how-h"
      data-enter-section
      className="page-pad flex flex-col justify-center gap-[var(--gap-band)] border-y border-outline-variant bg-surface py-16 max-[899px]:min-h-[100svh] min-[900px]:py-28"
    >
      <h2
        id="how-h"
        data-enter
        className="page-col my-0 text-balance text-[clamp(28px,4vw,60px)] font-semibold leading-[0.98] tracking-[var(--track-display)]"
      >
        {t('home.how.h2_a')}
        <br />
        {t('home.how.h2_b')}
      </h2>

      <div className="page-col grid items-stretch gap-[var(--gap-part)] [grid-template-columns:minmax(0,1fr)] min-[900px]:[grid-template-columns:minmax(0,1fr)_minmax(240px,0.44fr)]">
        {/* Below 900px the list steps aside (display: contents), so its rows and
            the one panel are items of the same stack, and the order below puts
            the panel under whichever row is open: an accordion made of the
            design's own card, with the tablist's semantics intact. Stacked in
            source order it sat under all five rows, a screen below a tap on
            the first. */}
        <div
          data-enter-stagger="wipe"
          className="flex flex-col max-[899px]:contents"
          role="tablist"
          aria-label={t('home.how.list_aria')}
          aria-orientation="vertical"
          ref={list}
          onKeyDown={onKeyDown}
        >
          {HABITS.map((k, n) => (
            <button
              type="button"
              key={k}
              id={`habit-${k}`}
              className="practice-row hoverable"
              role="tab"
              aria-selected={n === i}
              aria-controls="practice-panel"
              tabIndex={n === i ? 0 : -1}
              style={{ order: n * 2 }}
              onClick={(e) => choose(n, e.currentTarget)}
              onPointerEnter={(e) => choose(n, e.currentTarget)}
              onFocus={(e) => choose(n, e.currentTarget)}
            >
              <span className="ordinal text-on-surface-variant">{`0${n + 1}`}</span>
              <span className="practice-title">{t(`home.how.${k}_t`)}</span>
              <Arrow className="text-[15px] text-on-surface-variant" />
            </button>
          ))}
        </div>

        <div
          ref={setPanel}
          data-enter
          className="block-card flex flex-col justify-between p-6"
          id="practice-panel"
          role="tabpanel"
          aria-labelledby={`habit-${HABITS[i]}`}
          tabIndex={-1}
          style={{ order: i * 2 + 1 }}
        >
          <span
            data-swap
            className="text-[clamp(72px,9vw,150px)] font-bold leading-[0.8] tracking-[var(--track-display)]"
          >
            {`0${i + 1}`}
          </span>
          <p data-swap className="m-0 text-pretty text-[15px] leading-normal text-on-block-dim">
            {t(`home.how.${HABITS[i]}_b`)}
          </p>
          <span aria-hidden data-loop className="block-ring" />
        </div>
      </div>
    </section>
  );
}
