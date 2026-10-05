import { Arrow } from '@/components/arrow';
import { t } from '../i18n';

const FLOOR = ['f1', 'f2', 'f3', 'f4'] as const;

/** The floor: four commitments that do not move, set against the block card
 * that says why they are worth more than the rest of the page. */
export function Promises() {
  return (
    <section
      id="settled"
      aria-labelledby="settled-h"
      data-enter-section
      className="page-pad flex flex-col justify-center py-16 max-[899px]:min-h-[100svh] min-[900px]:py-28"
    >
      <div className="page-col grid gap-[var(--gap-part)] min-[900px]:grid-cols-12">
        <div data-enter className="block-card flex flex-col p-7 min-[900px]:col-span-5">
          {/* The card stands as tall as the four promises beside it, and its
              middle was empty ground. The habits card's ring, drawn still
              here: one loop on the page is enough. */}
          <span aria-hidden className="floor-ring" />
          <span aria-hidden className="floor-ring floor-ring-sm" />
          <h2
            id="settled-h"
            className="m-0 text-balance text-[clamp(30px,3.6vw,54px)] font-[620] leading-[0.96] tracking-[var(--track-display)]"
          >
            {t('home.floor.h2_a')}
            <br />
            {t('home.floor.h2_b')}
          </h2>
          {/* The space sits outside the link so its focus ring hugs the words. */}
          <div className="mt-auto pt-8">
            <a
              className="tag inline-flex min-h-11 items-center gap-2.5 text-on-block-dim hover:text-on-block"
              href="#contact"
            >
              {t('home.floor.cta')}
              <Arrow />
            </a>
          </div>
        </div>

        <ul
          data-enter-stagger="wipe"
          className="grid gap-4 min-[900px]:col-span-7 min-[900px]:grid-cols-2 min-[900px]:grid-rows-2"
        >
          {FLOOR.map((k, i) => (
            <li
              className="flex flex-col rounded-lg border border-outline-variant bg-surface-container-low p-5"
              key={k}
            >
              <span className="ordinal flex items-center gap-2.5 text-on-surface-variant">
                {`0${i + 1}`}
                <span aria-hidden className="h-px flex-1 bg-outline-variant" />
              </span>
              <h3 className="m-0 mt-[var(--gap-group)] text-balance text-[clamp(19px,1.7vw,23px)] font-[580] leading-tight tracking-[var(--track-title)]">
                {t(`home.floor.${k}_t`)}
              </h3>
              <p className="note m-0 mt-[var(--gap-knit)] text-on-surface-variant">
                {t(`home.floor.${k}_b`)}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
