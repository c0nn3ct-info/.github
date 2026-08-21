import { ArrowLeft } from 'lucide-react';
import { C0nn3ctMark } from '@/components/c0nn3ct-mark';
import { localePath, t } from '../i18n';
import { Layout } from '../layout';

/** The 404 page GitHub Pages serves for any address the site does not hold. */
export function NotFoundPage() {
  return (
    <Layout home={false}>
      <main className="flex flex-1 items-center px-6 py-24">
        <section className="mx-auto flex w-full max-w-[1200px] flex-col items-start gap-6">
          {/* Nothing is served here, but somebody is clearly home. */}
          <C0nn3ctMark className="h-14 w-14 text-outline-variant" />
          <h1 className="m-0 max-w-[20ch] text-balance text-[clamp(30px,4vw,56px)] font-[560] leading-[1.05] tracking-[var(--track-display)]">
            {t('not-found.h1')}
          </h1>
          <p className="m-0 max-w-[62ch] text-pretty text-[17px] leading-relaxed text-on-surface-variant">
            {t('not-found.p')}
          </p>
          <a
            className="inline-flex h-11 items-center gap-2.5 rounded-pill bg-primary px-6 text-sm font-semibold text-primary-foreground transition-transform duration-short ease-emph active:scale-[0.97]"
            href={localePath('/')}
          >
            <ArrowLeft className="h-[18px] w-[18px] rtl:-scale-x-100" aria-hidden />
            {t('not-found.cta')}
          </a>
        </section>
      </main>
    </Layout>
  );
}
