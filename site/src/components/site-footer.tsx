import type { ComponentType, ReactNode, SVGProps } from 'react';
import { Github, Languages, Mail } from 'lucide-react';
import { C0nn3ctMark } from '@/components/c0nn3ct-mark';
import { pairPath } from '@/components/language-switcher';
import { Aria2tMark, NoctisMark } from '@/components/product-mark';
import { ARIA2T_SITE, NOCTIS_SITE, ORG_URL, PRODUCT_NAME, mailto } from '@/constants';
import { LOCALES, LOCALE_LABEL, getLocale, localePath, t } from '../i18n';

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

/** A column of links under its own label; the nav names the group, so the
 * label stays a label rather than adding a heading to the outline. */
function FooterColumn({ label, children }: { label: string; children: ReactNode }) {
  return (
    <nav aria-label={label}>
      <div className="eyebrow mb-2 text-on-surface-variant">{label}</div>
      <ul className="min-[600px]:space-y-1.5">{children}</ul>
    </nav>
  );
}

/** 44px under a finger, 24px from `sm`, where a pointer can still pick the
 * rows apart. */
function FooterLink({ href, icon: Glyph, children }: { href: string; icon: Icon; children: ReactNode }) {
  return (
    <li>
      <a
        className="inline-flex min-h-11 items-center gap-2 text-sm text-on-surface underline-offset-4 hover:underline min-[600px]:min-h-6"
        href={href}
      >
        <Glyph className="h-3.5 w-3.5 flex-none" aria-hidden />
        {children}
      </a>
    </li>
  );
}

/** The close both products use: the mark and one line about the work, a
 * column per kind of link, and every language as a plain link under a rule,
 * so a crawler finds each locale without opening the header's menu. */
export function SiteFooter() {
  const locale = getLocale();
  const here = window.location.pathname;
  return (
    <footer data-enter-section className="page-pad pb-8 text-on-surface-variant">
      <div className="page-col">
        <div
          data-enter-stagger
          className="grid grid-cols-2 items-start gap-x-6 gap-y-6 border-t border-outline-variant pt-6 min-[600px]:flex min-[600px]:flex-wrap min-[600px]:gap-x-12"
        >
          <div className="col-span-2 flex max-w-[280px] flex-col gap-3">
            <a className="inline-flex items-center gap-2.5 text-on-surface" href={localePath('/')}>
              <C0nn3ctMark className="h-5 w-5 flex-none" />
              <span className="text-base font-[560] tracking-[var(--track-name)]">c0nn3ct.info</span>
            </a>
            <p className="note m-0">{t('footer.byline')}</p>
          </div>
          <FooterColumn label={t('footer.products')}>
            <FooterLink href={NOCTIS_SITE} icon={NoctisMark}>
              {PRODUCT_NAME.noctis}
            </FooterLink>
            <FooterLink href={ARIA2T_SITE} icon={Aria2tMark}>
              {PRODUCT_NAME.aria2t}
            </FooterLink>
          </FooterColumn>
          <FooterColumn label={t('footer.reach')}>
            <FooterLink href={ORG_URL} icon={Github}>
              {t('footer.github')}
            </FooterLink>
            <FooterLink href={mailto(t('mail.hello'))} icon={Mail}>
              {t('footer.mail')}
            </FooterLink>
          </FooterColumn>
        </div>
        <nav
          aria-label={t('footer.languages')}
          className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-outline-variant pt-4 text-sm"
        >
          <Languages className="me-1 h-3.5 w-3.5 flex-none" aria-hidden />
          {LOCALES.map((code, i) => (
            <span key={code} className="inline-flex items-center gap-2">
              {i > 0 && (
                <span aria-hidden className="text-outline">
                  ·
                </span>
              )}
              <a
                className="inline-flex min-h-11 items-center underline-offset-4 hover:underline min-[600px]:min-h-6"
                href={pairPath(here, code)}
                hrefLang={code}
                lang={code}
                aria-current={code === locale ? 'true' : undefined}
              >
                {LOCALE_LABEL[code]}
              </a>
            </span>
          ))}
        </nav>
      </div>
    </footer>
  );
}
