import { ArrowLeft } from 'lucide-react';
import { C0nn3ctMark } from '@/components/c0nn3ct-mark';
import { t } from '../i18n';
import { Layout } from '../layout';

/** The 404 page GitHub Pages serves for any address the site does not hold. */
export function NotFoundPage() {
  return (
    <Layout>
      <div className="hero-atmosphere flex-1">
        <main className="mx-auto w-full max-w-[1200px] px-4 sm:px-6">
          <section className="relative flex flex-col items-start gap-7 pb-24 pt-[96px]">
            {/* Nothing is served here, but somebody is clearly home. */}
            <div className="hero-mark" aria-hidden>
              <C0nn3ctMark />
            </div>
            <h1 className="hero-h1 relative z-[1] max-w-[20ch]">{t('not-found.h1')}</h1>
            <p className="prose-dim relative z-[1] max-w-[60ch] text-[18px] leading-7 tracking-[0.2px]">
              {t('not-found.p')}
            </p>
            <a
              className="relative z-[1] inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-pill bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition-[transform,box-shadow] duration-short ease-emph hover:shadow-e1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.97]"
              href="/"
            >
              <ArrowLeft className="h-[18px] w-[18px]" />
              {t('not-found.cta')}
            </a>
          </section>
        </main>
      </div>
    </Layout>
  );
}
