import type { ReactNode } from 'react';
import { ExternalLink, Github, Globe, Mail } from 'lucide-react';
import { C0nn3ctMark } from '@/components/c0nn3ct-mark';
import { CONTACT_MAILTO, ORG_URL, SITE_URL } from '@/constants';
import { t } from './i18n';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-on-surface">
      <header className="nav-blur sticky top-0 z-20 border-b border-outline-variant px-4 sm:px-6">
        <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center gap-2">
          <a
            href="/"
            className="m3-state-layer inline-flex items-center gap-2 rounded-pill px-2 py-1 text-[16px] font-medium tracking-[-0.01em] text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label={t('nav.home_aria')}
          >
            <C0nn3ctMark className="h-6 w-6 text-primary" />
            <span>c0nn3ct.info</span>
          </a>
          <div className="ms-auto flex items-center gap-1">
            <a
              className="m3-state-layer inline-flex h-10 w-10 items-center justify-center rounded-pill text-on-surface-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              href={ORG_URL}
              target="_blank"
              rel="noreferrer noopener"
              aria-label={t('nav.github_aria')}
            >
              <Github className="h-[18px] w-[18px]" />
            </a>
            <a
              className="m3-state-layer inline-flex h-10 w-10 items-center justify-center rounded-pill text-on-surface-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              href={CONTACT_MAILTO}
              aria-label={t('nav.mail_aria')}
            >
              <Mail className="h-[18px] w-[18px]" />
            </a>
          </div>
        </div>
      </header>

      {children}

      <footer className="mx-auto w-full max-w-[1200px] px-4 py-8 text-label-medium text-on-surface-variant sm:px-6">
        <div className="flex flex-wrap items-start gap-x-12 gap-y-6 border-t border-outline-variant pt-6">
          <div className="dim-label inline-flex items-center gap-2 text-label-small">
            <C0nn3ctMark className="h-[18px] w-[18px] flex-none" />
            {t('footer.byline')}
          </div>
          <div>
            <div className="dim-label mb-2 text-label-small uppercase tracking-[0.12em]">{t('footer.this_page')}</div>
            <ul className="space-y-1.5">
              <li>{t('footer.colophon')}</li>
            </ul>
          </div>
          <div>
            <div className="dim-label mb-2 text-label-small uppercase tracking-[0.12em]">{t('footer.reach')}</div>
            <ul className="space-y-1.5">
              <li>
                <a className="inline-flex items-center gap-2 underline-offset-4 hover:underline" href={CONTACT_MAILTO}>
                  <Mail className="h-3.5 w-3.5" />
                  {t('footer.mail')}
                </a>
              </li>
              <li>
                <a
                  className="inline-flex items-center gap-2 underline-offset-4 hover:underline"
                  href={ORG_URL}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <Github className="h-3.5 w-3.5" />
                  {t('footer.github')}
                  <ExternalLink className="h-3 w-3" aria-hidden />
                </a>
              </li>
              <li>
                <a className="inline-flex items-center gap-2 underline-offset-4 hover:underline" href={SITE_URL}>
                  <Globe className="h-3.5 w-3.5" />
                  {t('footer.site')}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
