import { t } from '../i18n';

const FLOOR = ['f1', 'f2', 'f3', 'f4'] as const;

/** The floor: four commitments that do not move, set against the block card
 * that says why they are worth more than the rest of the page. */
export function Promises() {
  return (
    <section
      id="settled"
      className="flex min-h-[100svh] flex-col justify-center gap-4 px-5 py-16"
    >
      <div className="grid gap-3.5 min-[900px]:grid-cols-12">
        <div className="block-card flex flex-col justify-between gap-6 p-7 min-[900px]:col-span-5">
          <span className="eyebrow text-on-block-faint">{t('home.floor.eyebrow')}</span>
          <h2 className="m-0 text-[clamp(30px,3.6vw,54px)] font-[620] leading-[0.96] tracking-[-0.048em]">
            {t('home.floor.h2_a')}
            <br />
            {t('home.floor.h2_b')}
          </h2>
          <p className="m-0 text-[15px] leading-normal text-on-block-dim">
            {t('home.floor.intro')}
          </p>
          <a
            className="eyebrow inline-flex items-center gap-2.5 self-start text-on-block-dim hover:text-on-block"
            href="#contact"
          >
            {t('home.floor.cta')}
            <span aria-hidden>→</span>
          </a>
        </div>

        <ul className="grid gap-3.5 min-[900px]:col-span-7 min-[900px]:grid-cols-2 min-[900px]:grid-rows-2">
          {FLOOR.map((k, i) => (
            <li
              className="flex flex-col gap-2.5 rounded-lg border border-outline-variant bg-surface-container-low p-5"
              key={k}
            >
              <span className="ordinal flex items-center gap-2.5 text-on-surface-variant">
                {`0${i + 1}`}
                <span aria-hidden className="h-px flex-1 bg-outline-variant" />
              </span>
              <h3 className="m-0 text-[clamp(19px,1.7vw,23px)] font-[580] leading-tight tracking-[-0.028em]">
                {t(`home.floor.${k}_t`)}
              </h3>
              <p className="m-0 text-sm leading-normal text-on-surface-variant">
                {t(`home.floor.${k}_b`)}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
