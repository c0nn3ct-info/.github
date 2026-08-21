import { useRef, useState, type KeyboardEvent } from 'react';
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
      className="page-pad flex min-h-[100svh] flex-col justify-center gap-[var(--gap-band)] border-y border-outline-variant bg-surface py-16"
    >
      <div className="page-col flex flex-wrap items-end justify-between gap-x-10 gap-y-5">
        <h2
          id="how-h"
          className="m-0 text-balance text-[clamp(28px,4vw,60px)] font-semibold leading-[0.98] tracking-[var(--track-display)]"
        >
          {t('home.how.h2_a')}
          <br />
          {t('home.how.h2_b')}
        </h2>
        <div className="flex max-w-[38ch] flex-col gap-2">
          <p className="m-0 text-pretty text-base leading-normal text-on-surface-variant">
            {t('home.how.intro')}
          </p>
          <span className="tag text-faint">{t('home.how.hint')}</span>
        </div>
      </div>

      <div className="page-col grid items-stretch gap-[var(--gap-part)] [grid-template-columns:minmax(0,1fr)] min-[900px]:[grid-template-columns:minmax(0,1fr)_minmax(240px,0.44fr)]">
        <div
          className="flex flex-col"
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
              onClick={() => setI(n)}
              onPointerEnter={() => setI(n)}
              onFocus={() => setI(n)}
            >
              <span className="ordinal text-on-surface-variant">{`0${n + 1}`}</span>
              <span className="practice-title">{t(`home.how.${k}_t`)}</span>
              <Arrow className="text-[15px] text-on-surface-variant" />
            </button>
          ))}
        </div>

        <div
          className="block-card flex flex-col justify-between p-6"
          id="practice-panel"
          role="tabpanel"
          aria-labelledby={`habit-${HABITS[i]}`}
          tabIndex={-1}
        >
          <span className="text-[clamp(72px,9vw,150px)] font-bold leading-[0.8] tracking-[var(--track-display)]">
            {`0${i + 1}`}
          </span>
          <p className="m-0 text-pretty text-[15px] leading-normal text-on-block-dim">
            {t(`home.how.${HABITS[i]}_b`)}
          </p>
          <span aria-hidden className="block-ring" />
        </div>
      </div>
    </section>
  );
}
