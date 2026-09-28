import { Github, Mail } from 'lucide-react';
import { Arrow } from '@/components/arrow';
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
  const { ground, hidden, setBar } = useHeader(home);
  return (
    <header className="site-header" ref={setBar} data-ground={ground} data-hidden={hidden}>
      {/* First in the tab order and out of sight until it has focus: five
          controls stand between a keyboard and the page otherwise. */}
      <a className="skip-link" href="#main">
        {t('nav.skip')}
      </a>
      <a
        className="site-brand inline-flex items-center gap-2.5 text-inherit"
        href={localePath('/')}
        aria-label={t('nav.home_aria')}
      >
        <C0nn3ctMark className="h-[26px] w-[26px] flex-none" />
        <span className="text-[15px] font-[560] tracking-[var(--track-name)]">c0nn3ct.info</span>
      </a>

      {home && (
        <nav className="tag flex min-w-0 flex-1 basis-[220px] flex-wrap items-center justify-center gap-x-6 gap-y-2">
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

      {/* Below 900px the envelope stands in for the words, which is what keeps
          the bar to one row at 320px: with the label it wrapped to two below
          413px, and in Russian at every phone width, and the second row sat on
          the hero's headline. The words stay the link's name. */}
      <a className="header-cta" href={mailto(t('mail.hello'))} aria-label={t('nav.cta')}>
        <Mail className="header-cta-icon h-[19px] w-[19px]" aria-hidden />
        <span className="header-cta-label">{t('nav.cta')}</span>
        <Arrow away className="header-cta-arrow opacity-55" />
      </a>
    </header>
  );
}
