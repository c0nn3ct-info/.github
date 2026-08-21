import { CONTACT_ADDRESS, mailto } from '@/constants';
import { t } from '../i18n';

const LINES = ['line1', 'line2', 'line3'] as const;

export function Talk() {
  return (
    <section
      id="contact"
      aria-labelledby="contact-h"
      className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden bg-stage px-6 pb-20 pt-24 text-white"
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(58%_62%_at_82%_16%,rgb(var(--glow-noctis)/0.2),transparent_70%)]"
      />
      <div className="relative mx-auto grid w-full max-w-[1440px] items-end gap-x-5 gap-y-7 min-[900px]:grid-cols-12">
        <div className="flex min-w-0 flex-col gap-5 min-[900px]:col-span-7">
          <span className="eyebrow font-semibold tracking-[0.17em] text-white/60">
            {t('home.talk.eyebrow')}
          </span>
          <h2
            id="contact-h"
            className="m-0 text-[clamp(30px,3.6vw,54px)] font-[580] leading-[1.04] tracking-[-0.045em]"
          >
            {t('home.talk.h2_a')}
            <br />
            {t('home.talk.h2_b')}
          </h2>
          <a className="talk-mail" href={mailto(t('mail.hello'))}>
            {CONTACT_ADDRESS}
          </a>
        </div>

        <div className="flex min-w-0 flex-col gap-2.5 min-[900px]:col-span-5">
          <span className="eyebrow text-white/50">{t('home.talk.lines_head')}</span>
          {LINES.map((k) => (
            <a className="talk-line" href={mailto(t(`mail.${k}`))} key={k}>
              <span className="text-[clamp(17px,1.7vw,22px)] font-[520] leading-snug tracking-[-0.028em]">
                {t(`home.talk.${k}`)}
              </span>
              <span aria-hidden className="mono text-[13px] text-white/50">
                ↗
              </span>
            </a>
          ))}
          <span className="mono pt-1.5 text-[10px] uppercase tracking-[0.14em] text-white/50">
            {t('home.talk.foot')}
          </span>
        </div>
      </div>
    </section>
  );
}
