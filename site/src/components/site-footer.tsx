import { Arrow } from '@/components/arrow';
import { C0nn3ctMark } from '@/components/c0nn3ct-mark';
import { ARIA2T_SITE, NOCTIS_SITE, ORG_URL, PRODUCT_NAME, mailto } from '@/constants';
import { t } from '../i18n';

export function SiteFooter() {
  return (
    <footer
      data-enter-section
      className="page-pad border-t border-white/15 bg-stage pb-6 pt-8 text-white/60"
    >
      <div
        data-enter-stagger
        className="page-col grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] items-start gap-x-8 gap-y-7"
      >
        <div className="flex flex-col gap-2.5">
          <span className="inline-flex items-center gap-2.5 text-white/85">
            <C0nn3ctMark className="h-[18px] w-[18px] flex-none" />
            <span className="text-sm font-[560] tracking-[var(--track-name)]">c0nn3ct.info</span>
          </span>
          <span className="note max-w-[26ch]">{t('footer.byline')}</span>
          <span className="note max-w-[26ch] text-white/45">{t('footer.measure')}</span>
        </div>
        <div className="flex flex-col gap-2.5">
          <span className="eyebrow text-white/50">{t('footer.products')}</span>
          <a className="text-sm text-white/85 hover:text-white" href={NOCTIS_SITE}>
            {PRODUCT_NAME.noctis}
          </a>
          <a className="text-sm text-white/85 hover:text-white" href={ARIA2T_SITE}>
            {PRODUCT_NAME.aria2t}
          </a>
        </div>
        <div className="flex flex-col gap-2.5">
          <span className="eyebrow text-white/50">{t('footer.reach')}</span>
          <a className="text-sm text-white/85 hover:text-white" href={mailto(t('mail.hello'))}>
            {t('footer.mail')}
          </a>
          <a
            className="inline-flex items-center gap-1.5 text-sm text-white/85 hover:text-white"
            href={ORG_URL}
          >
            {t('footer.github')}
            <Arrow away />
          </a>
        </div>
      </div>
    </footer>
  );
}
