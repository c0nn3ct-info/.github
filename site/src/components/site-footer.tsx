import { Arrow } from '@/components/arrow';
import { C0nn3ctMark } from '@/components/c0nn3ct-mark';
import { ARIA2T_SITE, NOCTIS_SITE, ORG_URL, PRODUCT_NAME, mailto } from '@/constants';
import { t } from '../i18n';

export function SiteFooter() {
  return (
    <footer
      data-enter-section
      className="page-pad border-t border-white/15 bg-stage pb-6 pt-8 text-on-stage/60"
    >
      <div
        data-enter-stagger
        className="page-col grid grid-cols-2 items-start gap-x-8 gap-y-7 min-[600px]:grid-cols-[repeat(auto-fit,minmax(170px,1fr))]"
      >
        {/* Two columns on a phone, the byline across both: one column put
            every link on its own row a screen tall. */}
        <div className="col-span-2 flex flex-col gap-2.5 min-[600px]:col-span-1">
          <span className="inline-flex items-center gap-2.5 text-on-stage/85">
            <C0nn3ctMark className="h-[18px] w-[18px] flex-none" />
            <span className="text-sm font-[560] tracking-[var(--track-name)]">c0nn3ct.info</span>
          </span>
          <span className="note max-w-[26ch]">{t('footer.byline')}</span>
          <span className="note max-w-[26ch] text-on-stage/45">{t('footer.measure')}</span>
        </div>
        <div className="flex flex-col gap-2.5">
          <span className="eyebrow text-on-stage/50">{t('footer.products')}</span>
          <a className="inline-flex items-center text-sm text-on-stage/85 hover:text-on-stage [@media(pointer:coarse)]:min-h-11" href={NOCTIS_SITE}>
            {PRODUCT_NAME.noctis}
          </a>
          <a className="inline-flex items-center text-sm text-on-stage/85 hover:text-on-stage [@media(pointer:coarse)]:min-h-11" href={ARIA2T_SITE}>
            {PRODUCT_NAME.aria2t}
          </a>
        </div>
        <div className="flex flex-col gap-2.5">
          <span className="eyebrow text-on-stage/50">{t('footer.reach')}</span>
          <a className="inline-flex items-center text-sm text-on-stage/85 hover:text-on-stage [@media(pointer:coarse)]:min-h-11" href={mailto(t('mail.hello'))}>
            {t('footer.mail')}
          </a>
          <a
            className="inline-flex items-center gap-1.5 text-sm text-on-stage/85 hover:text-on-stage [@media(pointer:coarse)]:min-h-11"
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
