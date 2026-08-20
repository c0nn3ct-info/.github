import { Github } from 'lucide-react';
import { C0nn3ctMark } from '@/components/c0nn3ct-mark';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useHeader } from '@/lib/use-header';
import { ORG_URL, mailto } from '@/constants';
import { localePath, t } from '../i18n';

const SECTIONS = [
  ['#work', 'nav.work'],
  ['#how', 'nav.how'],
  ['#settled', 'nav.settled'],
] as const;

/** The fixed bar. `home` both turns on the in-page nav and tells the bar it
 * starts over the dark hero stage rather than the page ground. */
export function SiteHeader({ home }: { home: boolean }) {
  const { ground, hidden } = useHeader(home);
  return (
    <header className="site-header" data-ground={ground} data-hidden={hidden}>
      <a
        className="inline-flex items-center gap-2.5 text-inherit"
        href={localePath('/')}
        aria-label={t('nav.home_aria')}
      >
        <C0nn3ctMark className="h-[26px] w-[26px] flex-none" />
        <span className="text-[15px] font-[560] tracking-[-0.02em]">c0nn3ct.info</span>
      </a>

      {home && (
        <nav className="mono flex min-w-0 flex-1 basis-[220px] flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] font-semibold uppercase tracking-[0.14em]">
          {SECTIONS.map(([href, key]) => (
            <a className="text-inherit hover:opacity-70" href={href} key={href}>
              {t(key)}
            </a>
          ))}
        </nav>
      )}

      <div className="flex flex-none items-center gap-0.5">
        <a className="icon-btn" href={ORG_URL} aria-label={t('nav.github_aria')}>
          <Github className="h-[19px] w-[19px]" aria-hidden />
        </a>
        <LanguageSwitcher />
      </div>

      <a className="header-cta" href={mailto(t('mail.hello'))}>
        {t('nav.cta')}
        <span aria-hidden className="opacity-55">
          ↗
        </span>
      </a>
    </header>
  );
}
