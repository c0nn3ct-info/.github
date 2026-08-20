import { C0nn3ctMark } from '@/components/c0nn3ct-mark';
import { ARIA2T_SITE, NOCTIS_SITE, ORG_URL, mailto } from '@/constants';
import { t } from '../i18n';

export function SiteFooter() {
  return (
    <footer className="border-t border-white/15 bg-stage px-6 pb-6 pt-8 text-white/60">
      <div className="mx-auto grid w-full max-w-[1440px] grid-cols-[repeat(auto-fit,minmax(170px,1fr))] items-start gap-x-8 gap-y-7">
        <div className="flex flex-col gap-2.5">
          <span className="inline-flex items-center gap-2.5 text-white/85">
            <C0nn3ctMark className="h-[18px] w-[18px] flex-none" />
            <span className="text-sm font-[560] tracking-[-0.02em]">c0nn3ct.info</span>
          </span>
          <span className="max-w-[26ch] text-[13px] leading-normal">{t('footer.byline')}</span>
        </div>
        <div className="flex flex-col gap-2.5">
          <span className="eyebrow text-white/50">{t('footer.products')}</span>
          <a className="text-sm text-white/85 hover:text-white" href={NOCTIS_SITE}>
            noctis
          </a>
          <a className="text-sm text-white/85 hover:text-white" href={ARIA2T_SITE}>
            aria2t
          </a>
        </div>
        <div className="flex flex-col gap-2.5">
          <span className="eyebrow text-white/50">{t('footer.reach')}</span>
          <a className="text-sm text-white/85 hover:text-white" href={mailto(t('mail.hello'))}>
            {t('footer.mail')}
          </a>
          <a className="text-sm text-white/85 hover:text-white" href={ORG_URL}>
            {t('footer.github')} ↗
          </a>
        </div>
      </div>
    </footer>
  );
}
