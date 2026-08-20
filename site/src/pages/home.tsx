import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, Download, Link as LinkIcon } from 'lucide-react';
import { C0nn3ctMark } from '@/components/c0nn3ct-mark';
import { ProductWindow } from '@/components/product-window';
import { WireStrip } from '@/components/wire-strip';
import { initReveals } from '@/lib/reveal';
import {
  ARIA2T_LICENSE,
  ARIA2T_PRIVACY,
  ARIA2T_RELEASES,
  ARIA2T_SHA,
  ARIA2T_SITE,
  CONTACT_MAILTO,
  NOCTIS_LICENSE,
  NOCTIS_PRIVACY,
  NOCTIS_RELEASES,
  NOCTIS_SHA,
  NOCTIS_SITE,
  NOCTIS_STORE,
} from '@/constants';
import { t } from '../i18n';
import { Layout } from '../layout';

const CLAIMS = ['c1', 'c2', 'c3', 'c4'] as const;

function ClaimChips({ product }: { product: 'noctis' | 'aria2t' }) {
  return (
    <ul className="claims" aria-label={t('home.made.claims_aria')}>
      {CLAIMS.map((k) => (
        <li key={k}>
          {/* on-container green: the readable verify-green in both themes. */}
          <Check className="h-3 w-3 text-success-on-container" aria-hidden />
          {t(`home.made.${product}_${k}`)}
        </li>
      ))}
    </ul>
  );
}

const PRACTICES = ['pr1', 'pr2', 'pr3', 'pr4', 'pr5'] as const;
const ROOMS = ['price', 'openness', 'accounts', 'services', 'scope'] as const;
const FLOORS = ['f1', 'f2', 'f3', 'f4'] as const;
const FLOOR_IDS: Record<(typeof FLOORS)[number], string> = {
  f1: 'stays-yours',
  f2: 'no-advertising',
  f3: 'leaving-is-easy',
  f4: 'keeps-working',
};

function MonoBadge({
  href,
  children,
  tonal,
  download,
  title,
}: {
  href: string;
  children: string;
  tonal?: boolean;
  download?: boolean;
  title?: string;
}) {
  const cls = `m3-state-layer inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-pill px-2.5 font-mono text-label-small leading-none tracking-[-0.01em] ${
    tonal ? 'bg-secondary-container text-secondary-foreground' : 'border border-outline-variant text-on-surface-variant'
  }`;
  return (
    <a className={cls} href={href} title={title}>
      {children}
      {download && <Download className="h-3 w-3" aria-hidden />}
    </a>
  );
}

function ClauseAnchor({ id, aria }: { id: string; aria: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const copy = () => {
    // The hash still navigates; the clipboard is the considered extra, and a
    // browser that refuses it silently falls back to the address bar.
    navigator.clipboard?.writeText(`${window.location.origin}/#${id}`).catch(() => {});
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1800);
  };
  return (
    <a className="anchor" href={`#${id}`} aria-label={aria} onClick={copy}>
      {copied ? <Check className="text-success-on-container" aria-hidden /> : <LinkIcon aria-hidden />}
      <span className="sr-only" role="status">
        {copied ? t('home.clause.copied') : ''}
      </span>
    </a>
  );
}

export function HomePage() {
  useEffect(() => initReveals(), []);
  return (
    <Layout>
      <div className="hero-atmosphere">
        <div className="wire" aria-hidden>
          <span className="wire-progress" />
          <span className="wire-dot" />
        </div>
        <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-10 sm:px-6">
          <section className="relative flex flex-col items-start gap-7 pb-16 pt-[72px]">
            <div className="hero-mark" aria-hidden>
              <C0nn3ctMark />
            </div>
            <h1 className="hero-h1 relative z-[1]">
              <span className="rise-1 block">{t('home.hero.h1')}</span>{' '}
              <span className="rise-2 block text-on-surface-variant">{t('home.hero.h1_sub')}</span>
            </h1>
            <p className="rise-3 prose-dim relative z-[1] max-w-[60ch] text-[18px] leading-7 tracking-[0.2px]">
              {t('home.hero.lede')}
            </p>
            {/* One action: GitHub and mail already live in the header and footer. */}
            <div className="rise-4 relative z-[1]">
              <a
                className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-pill bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition-[transform,box-shadow] duration-short ease-emph hover:shadow-e1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.97]"
                href="#made"
              >
                {t('home.hero.cta_made')}
                <ArrowRight className="h-[18px] w-[18px]" />
              </a>
            </div>
          </section>

          <WireStrip />

          <section id="made">
            <div className="shead">
              <h2>{t('home.made.h2')}</h2>
              <span className="anno">{t('home.made.anno')}</span>
            </div>
            <p className="prose-dim mb-10 max-w-[72ch] text-pretty text-body-medium">{t('home.made.scope')}</p>

            <div className="grid items-center gap-8 min-[980px]:grid-cols-[1.25fr_1fr] min-[980px]:gap-12">
              <ProductWindow
                href={NOCTIS_SITE}
                ariaLabel={t('home.made.noctis_site_aria')}
                title="noctis.c0nn3ct.info"
                led="noctis"
                darkSrc="/media/noctis-dark.png"
                lightSrc="/media/noctis-light.png"
                alt={t('home.made.noctis_alt')}
                width={1280}
                height={800}
              />
              <div className="flex min-w-0 flex-col items-start gap-3.5">
                <h3 className="product-title flex items-center gap-2.5">
                  <span className="led led-noctis h-2.5 w-2.5" aria-hidden />
                  <a
                    className="text-[clamp(24px,2.8vw,32px)] font-medium tracking-[-0.015em] hover:underline hover:underline-offset-4"
                    href={NOCTIS_SITE}
                  >
                    noctis
                  </a>
                </h3>
                <p className="prose-dim max-w-[26rem] text-body-large">{t('home.made.noctis_desc')}</p>
                <ClaimChips product="noctis" />
                {/* Wider interval than the 14px column gap: proximity marks the
                    acquisition row off from the claims above it. */}
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <MonoBadge href={NOCTIS_STORE} tonal>{t('home.made.badge_cws')}</MonoBadge>
                  <MonoBadge href={NOCTIS_RELEASES}>{t('home.made.badge_helper')}</MonoBadge>
                  <MonoBadge href={NOCTIS_SHA} download title={t('home.made.badge_sha_title')}>{t('home.made.badge_sha')}</MonoBadge>
                  <MonoBadge href={NOCTIS_LICENSE}>{t('home.made.badge_eula')}</MonoBadge>
                  <MonoBadge href={NOCTIS_PRIVACY}>{t('home.made.privacy_page')}</MonoBadge>
                </div>
              </div>
            </div>

            <div className="mt-[72px] grid items-center gap-8 min-[980px]:grid-cols-[1fr_1.25fr] min-[980px]:gap-12">
              {/* Window first in DOM so both products stack window-then-text
                  below 980px; the order utilities keep it on the right above. */}
              <ProductWindow
                className="min-[980px]:order-2"
                href={ARIA2T_SITE}
                ariaLabel={t('home.made.aria2t_site_aria')}
                title="aria2t.c0nn3ct.info"
                led="aria2t"
                darkSrc="/media/aria2t-dark.png"
                lightSrc="/media/aria2t-light.png"
                alt={t('home.made.aria2t_alt')}
                width={1280}
                height={495}
                zoom
              />
              <div className="flex min-w-0 flex-col items-start gap-3.5 min-[980px]:order-1">
                <h3 className="product-title flex items-center gap-2.5">
                  <span className="led led-aria2t h-2.5 w-2.5" aria-hidden />
                  <a
                    className="text-[clamp(24px,2.8vw,32px)] font-medium tracking-[-0.015em] hover:underline hover:underline-offset-4"
                    href={ARIA2T_SITE}
                  >
                    aria2t
                  </a>
                </h3>
                <p className="prose-dim max-w-[26rem] text-body-large">{t('home.made.aria2t_desc')}</p>
                <ClaimChips product="aria2t" />
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <MonoBadge href={ARIA2T_RELEASES} tonal>{t('home.made.badge_releases')}</MonoBadge>
                  <MonoBadge href={ARIA2T_SHA} download title={t('home.made.badge_sha_title')}>{t('home.made.badge_sha')}</MonoBadge>
                  <MonoBadge href={ARIA2T_LICENSE}>{t('home.made.badge_apache')}</MonoBadge>
                  <MonoBadge href={ARIA2T_PRIVACY}>{t('home.made.privacy_page')}</MonoBadge>
                </div>
              </div>
            </div>

            {/* The section's one raised voice: the claim a visitor can actually check. */}
            <p className="mt-16 max-w-[34rem] text-balance text-[clamp(21px,2.4vw,27px)] font-medium leading-[1.4] tracking-[-0.015em] text-on-surface">
              {t('home.made.sofar')}
            </p>
          </section>

          <section>
            <div className="shead">
              <h2>{t('home.how.h2')}</h2>
              <span className="anno">{t('home.how.anno')}</span>
            </div>
            <div className="mb-11 max-w-[66ch]">
              {/* The mission carries the section's raised voice; the second
                  paragraph and the practices stay in the quiet register. */}
              <p className="text-[clamp(19px,1.6vw,22px)] leading-[1.55] tracking-[0.1px] text-on-surface">
                {t('home.how.p1')}
              </p>
              <p className="body-xl mt-5">{t('home.how.p2')}</p>
            </div>
            <div>
              {PRACTICES.map((k) => (
                <div className="practice-row" key={k}>
                  <h3 className="text-[17px] font-medium leading-[1.35] tracking-[-0.01em]">{t(`home.how.${k}_t`)}</h3>
                  <p className="prose-dim max-w-[66ch] text-body-medium">{t(`home.how.${k}_b`)}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="room">
            <div className="shead">
              <h2>{t('home.room.h2')}</h2>
              <span className="anno">{t('home.room.anno')}</span>
            </div>
            <p className="prose-dim mb-6 max-w-[70ch] text-body-large">{t('home.room.intro')}</p>
            <div className="ledger">
              {ROOMS.map((k) => (
                <div className="ledger-row" id={`on-${k}`} key={k}>
                  <h3 className="m-0 text-[17px] font-medium leading-[1.35] tracking-[-0.01em]">
                    {t(`home.room.${k}_t`)}
                    <ClauseAnchor id={`on-${k}`} aria={t('home.room.link_aria')} />
                  </h3>
                  <div className="prose-dim max-w-[62ch] text-body-medium">{t(`home.room.${k}_b`)}</div>
                  <span className="status">{t(`home.room.${k}_s`)}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="shead">
              <h2>{t('home.floor.h2')}</h2>
              <span className="anno">{t('home.floor.anno')}</span>
            </div>
            <p className="prose-dim mb-8 max-w-[70ch] text-body-large">{t('home.floor.intro')}</p>
            {/* The floor speaks in the page's raised voice: the room above
                files its reversible decisions in a dense ledger, and these
                four are set large and slow because they do not move. */}
            <ul className="reveal">
              {FLOORS.map((k) => (
                <li
                  className="floor-item grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 border-t border-outline-variant py-7 last:border-b"
                  id={FLOOR_IDS[k]}
                  key={k}
                >
                  {/* The settled commitments join the verify-green grammar the
                      claim chips and the strip pill already speak. */}
                  <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-success-container text-success-on-container">
                    <Check className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="m-0 text-balance text-[clamp(21px,2.4vw,27px)] font-medium leading-[1.4] tracking-[-0.015em]">
                      {t(`home.floor.${k}_t`)}
                      <ClauseAnchor id={FLOOR_IDS[k]} aria={t('home.floor.link_aria')} />
                    </h3>
                    <p className="prose-dim mt-2 max-w-[62ch] text-body-medium">{t(`home.floor.${k}_b`)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="flex flex-col items-start gap-5 pb-8">
            <div className="shead self-stretch">
              <h2>{t('home.talk.h2')}</h2>
              <span className="anno">{t('home.talk.anno')}</span>
            </div>
            <p className="prose-dim max-w-[70ch] text-body-large">{t('home.talk.p1')}</p>
            <p className="prose-dim max-w-[70ch] text-body-large">{t('home.talk.p2')}</p>
            <div className="flex flex-wrap items-center gap-4">
              <a
                className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-pill bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition-[transform,box-shadow] duration-short ease-emph hover:shadow-e1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.97]"
                href={CONTACT_MAILTO}
              >
                {t('home.talk.cta')}
                <ArrowRight className="h-[18px] w-[18px]" />
              </a>
              {/* The address as selectable text, for visitors without a mail client. */}
              <span className="font-mono text-label-medium tracking-[0.02em] text-on-surface-variant">
                {t('home.talk.address')}
              </span>
            </div>
          </section>
        </main>
      </div>
    </Layout>
  );
}
