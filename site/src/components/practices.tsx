import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Arrow } from '@/components/arrow';
import { nextIndex } from '@/lib/roving';
import { t } from '../i18n';

const HABITS = ['p1', 'p2', 'p3', 'p4', 'p5'] as const;

/** How long a fold takes, which is the stylesheet's `--dur-long`. The tapped
 * row is held under the finger for this long and a frame more, so the hold
 * outlasts the fold rather than letting go of it early. */
export const FOLD_MS = 450;

const stacked = () => window.matchMedia('(max-width: 899px)').matches;
const moving = () => window.matchMedia('(prefers-reduced-motion: no-preference)').matches;

/** A habit's reasoning: its ordinal, its sentence and the ring. The panel
 * beside the list marks its two halves for the dip that answers a hover. */
function Reasoning({ n, swap }: { n: number; swap?: boolean }) {
  const mark = swap ? '' : undefined;
  return (
    <>
      <span
        data-swap={mark}
        className="text-[clamp(72px,9vw,150px)] font-bold leading-[0.8] tracking-[var(--track-display)]"
      >
        {`0${n + 1}`}
      </span>
      <p data-swap={mark} className="m-0 text-pretty text-[15px] leading-normal text-on-block-dim">
        {t(`home.how.${HABITS[n]}_b`)}
      </p>
      <span aria-hidden data-loop className="block-ring" />
    </>
  );
}

/** Five habits, with the chosen one's reasoning held in the block card beside
 * them. Hover previews it, click and keyboard commit it, so the panel is
 * reachable without a pointer. */
export function Practices() {
  const [i, setI] = useState(0);
  const list = useRef<HTMLDivElement>(null);
  const [panel, setPanel] = useState<HTMLDivElement | null>(null);
  const shown = useRef(i);
  /** The tapped row and where it sat, on a phone, while the folds move. */
  const held = useRef<{ row: HTMLElement; top: number } | null>(null);

  // On a phone the open fold closes and the tapped one opens, both over the
  // long step, and everything between them slides. The tapped row does not:
  // each frame the page scrolls by whatever the folds moved it, so it stays
  // under the finger and its fold opens from it. It used to be one instant
  // jump of the page around a card that teleported, which is the jerk this
  // replaces. Once the folds are still, a fold that ended below the screen is
  // brought up to its edge.
  useLayoutEffect(() => {
    const a = held.current;
    held.current = null;
    if (!a) return;
    const until = performance.now() + (moving() ? FOLD_MS + 32 : 0);
    let frame = 0;
    const keep = () => {
      const dy = a.row.getBoundingClientRect().top - a.top;
      if (Math.abs(dy) >= 0.5) window.scrollBy({ top: dy, behavior: 'instant' });
      if (performance.now() < until) {
        frame = requestAnimationFrame(keep);
        return;
      }
      const fold = document.getElementById(`practice-fold-${HABITS[i]}`) as HTMLElement;
      if (fold.getBoundingClientRect().bottom > window.innerHeight) {
        fold.scrollIntoView({ block: 'nearest', behavior: moving() ? 'smooth' : 'instant' });
      }
    };
    keep();
    return () => cancelAnimationFrame(frame);
  }, [i]);

  // The panel follows the pointer, so this is a preview rather than a
  // committed choice, and it used to change with a hard cut: sweeping the five
  // habits strobed the card. It dips instead of blinking, from 0.45 rather
  // than from nothing, so a fast sweep reads as the panel tracking the pointer
  // and a single deliberate move reads as a soft arrival. No movement, because
  // a preview that slides would be five slides on the way past. On a phone
  // the panel is not showing and the folds carry the change.
  useEffect(() => {
    if (!panel || i === shown.current) {
      shown.current = i;
      return;
    }
    shown.current = i;
    if (!moving() || stacked()) return;
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
    if (stacked()) held.current = { row, top: row.getBoundingClientRect().top };
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
            the five folds are items of the same stack, and the order below puts
            each fold under its own row: an accordion made of the design's own
            card, with the tablist's semantics intact. The panel beside the list
            is for 900px and up, where nothing reflows and the card stands still
            while its words change. */}
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
              aria-controls={`practice-panel practice-fold-${k}`}
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

        {/* One fold per row, closed to nothing and opened to its card's own
            height by the stylesheet, so a change is a fold closing and
            another opening rather than a card that teleported. Static, so the
            served markup and the first render agree. */}
        {HABITS.map((k, n) => (
          <div
            key={k}
            id={`practice-fold-${k}`}
            role="tabpanel"
            aria-labelledby={`habit-${k}`}
            aria-hidden={n !== i}
            data-open={n === i || undefined}
            className="practice-fold"
            style={{ order: n * 2 + 1 }}
          >
            <div className="practice-fold-inner">
              <div className="block-card flex flex-col gap-6 p-6">
                <Reasoning n={n} />
              </div>
            </div>
          </div>
        ))}

        <div
          ref={setPanel}
          data-enter
          className="block-card flex flex-col justify-between p-6 max-[899px]:hidden"
          id="practice-panel"
          role="tabpanel"
          aria-labelledby={`habit-${HABITS[i]}`}
          tabIndex={-1}
        >
          <Reasoning n={i} swap />
        </div>
      </div>
    </section>
  );
}
