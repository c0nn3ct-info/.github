import { useRef } from 'react';
import { ArrowDown } from 'lucide-react';
import { Arrow } from '@/components/arrow';
import { useParallax } from '@/lib/use-parallax';
import { mailto } from '@/constants';
import { t } from '../i18n';
import type { Project } from '@/components/work';

const WIRE = 'M-20 640 C 220 640 240 300 480 300 S 760 470 1020 470';

/** The index rows double as the work section's remote control: the anchor does
 * the travelling, the click decides which product is waiting on arrival. */
function IndexRow({
  ordinal,
  name,
  status,
  onPick,
}: {
  ordinal: string;
  name: string;
  status: string;
  onPick?: () => void;
}) {
  const body = (
    <>
      <span className="ordinal">{ordinal}</span>
      <span className="flex min-w-0 flex-col gap-[3px]">
        <span
          className={`text-[clamp(19px,1.9vw,26px)] font-[560] leading-none tracking-[var(--track-title)] ${
            onPick ? '' : 'text-on-surface-variant'
          }`}
        >
          {name}
        </span>
        <span className="tag text-on-surface-variant">
          {status}
        </span>
      </span>
    </>
  );
  if (!onPick) {
    return <div className="index-row">{body}</div>;
  }
  return (
    <a className="index-row hoverable" href="#work" onClick={onPick}>
      {body}
      <Arrow className="text-faint" />
    </a>
  );
}

export function Hero({ onPick }: { onPick: (p: Project) => void }) {
  const stage = useRef<HTMLDivElement>(null);
  useParallax(stage);

  return (
    <section id="top" className="relative flex min-h-[100svh] flex-wrap items-stretch">
      <div className="stage" ref={stage}>
        <div className="stage-grid" aria-hidden />
        <div className="stage-glow" aria-hidden />

        <svg
          aria-hidden
          viewBox="0 0 1000 800"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
        >
          <path
            className="wire-path"
            d={WIRE}
            fill="none"
            stroke="rgba(255,255,255,.5)"
            strokeWidth="1.25"
            strokeDasharray="1400"
          />
          <circle className="wire-dot" r="4.5" />
        </svg>

        {/* The wordmark is the brand as scenery, not as text to read. */}
        <div className="stage-wordmark" aria-hidden>
          <span>c0nn3ct</span>
        </div>

        <svg className="stage-ring" aria-hidden viewBox="0 0 800 800">
          <circle cx="400" cy="400" r="392" fill="none" stroke="#fff" strokeOpacity=".22" strokeWidth="1" />
          <circle
            className="ring-dash"
            cx="400"
            cy="400"
            r="330"
            fill="none"
            stroke="#fff"
            strokeOpacity=".45"
            strokeWidth="1"
            strokeDasharray="3 9"
          />
        </svg>

        <div className="glass">
          <div className="glass-inner">
            <span className="rise-1 eyebrow whitespace-nowrap text-white/75">
              {t('home.hero.eyebrow')}
            </span>
            <h1 className="rise-2 m-0 text-balance text-[clamp(23px,min(5.4svh,8.5vw),46px)] font-[520] leading-[1.06] tracking-[var(--track-h1)] text-white">
              {t('home.hero.h1_a')}{' '}
              <em className="font-semibold not-italic">{t('home.hero.h1_em')}</em>
            </h1>
            <p className="rise-3 m-0 max-w-[36ch] text-pretty text-[clamp(13px,min(2.7svh,3.6vw),15px)] leading-normal text-white/75">
              {t('home.hero.lede')}
            </p>
            <a
              className="rise-4 cta-invert inline-flex h-[clamp(38px,8.3svh,46px)] items-center gap-3 rounded-pill bg-white pe-2 ps-5 text-[clamp(12px,2.5svh,14px)] font-semibold tracking-[var(--track-body)] text-[#111]"
              href="#work"
            >
              {t('home.hero.cta')}
              <span className="grid h-[clamp(24px,5.4svh,30px)] w-[clamp(24px,5.4svh,30px)] place-items-center rounded-full bg-[#111] text-white">
                <ArrowDown className="h-3.5 w-3.5" aria-hidden />
              </span>
            </a>
          </div>
        </div>
      </div>

      <aside className="hero-index" aria-label={t('home.index.aria')}>
        <div className="tag flex items-baseline justify-between gap-3 px-[clamp(18px,2vw,26px)] pb-3.5 text-on-surface-variant">
          <span>{t('home.index.head')}</span>
          <span>{t('home.index.status')}</span>
        </div>

        <IndexRow
          ordinal="01"
          name="noctis"
          status={t('home.index.noctis_status')}
          onPick={() => onPick('noctis')}
        />
        <IndexRow
          ordinal="02"
          name="aria2t"
          status={t('home.index.aria2t_status')}
          onPick={() => onPick('aria2t')}
        />
        <IndexRow
          ordinal="03"
          name={t('home.index.next_name')}
          status={t('home.index.next_status')}
        />

        <div className="mt-auto flex flex-col gap-3.5 px-[clamp(18px,2vw,26px)] pt-6">
          <p className="m-0 max-w-[32ch] text-pretty text-base leading-snug tracking-[var(--track-body)]">
            {t('home.index.note')}
          </p>
          <a
            className="tag inline-flex items-center gap-2.5 text-on-surface-variant hover:text-on-surface"
            href={mailto(t('mail.hello'))}
          >
            hello@c0nn3ct.info
            <Arrow away />
          </a>
        </div>
      </aside>
    </section>
  );
}
