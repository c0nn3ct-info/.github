import { useRef, useState, type KeyboardEvent } from 'react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { C0nn3ctMark } from '@/components/c0nn3ct-mark';
import { Lightbox, type Shot } from '@/components/lightbox';
import { nextIndex } from '@/lib/roving';
import {
  ARIA2T_SITE,
  ARIA2T_SRC,
  NOCTIS_SITE,
  NOCTIS_SRC,
  NOCTIS_STORE,
  mailto,
} from '@/constants';
import { t } from '../i18n';

export type Project = 'noctis' | 'aria2t' | 'next';

export const PROJECTS: readonly Project[] = ['noctis', 'aria2t', 'next'];

const SHOT: Partial<Record<Project, string>> = {
  noctis: '/media/noctis-dark.png',
  aria2t: '/media/aria2t-dark.png',
};

interface PaneLink {
  label: string;
  href: string;
  /** An in-page destination takes the arrow that means "further down". */
  inPage?: boolean;
}

function links(p: Project): PaneLink[] {
  if (p === 'noctis')
    return [
      { label: t('home.work.link_site'), href: NOCTIS_SITE },
      { label: t('home.work.link_store'), href: NOCTIS_STORE },
      { label: t('home.work.link_src'), href: NOCTIS_SRC },
    ];
  if (p === 'aria2t')
    return [
      { label: t('home.work.link_site'), href: ARIA2T_SITE },
      { label: t('home.work.link_src'), href: ARIA2T_SRC },
    ];
  return [
    { label: t('home.work.link_suggest'), href: mailto(t('mail.suggest')) },
    { label: t('home.work.link_promises'), href: '#settled', inPage: true },
  ];
}

function name(p: Project): string {
  return p === 'next' ? t('home.work.next_name') : p;
}

/** The screen half of a pane: a real capture, or the placeholder that says
 * plainly there is nothing to capture yet. */
function Screen({ project, onOpen }: { project: Project; onOpen: (s: Shot) => void }) {
  const src = SHOT[project];
  if (!src) {
    return (
      <div className="pane pane-shot border-0 text-white">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(62%_72%_at_76%_16%,rgba(152,84,241,.24),transparent_72%)]"
        />
        <div
          aria-hidden
          className="scan-band absolute inset-x-0 h-[34%] bg-[linear-gradient(to_bottom,transparent,rgba(255,255,255,.07)_48%,rgba(255,255,255,.14)_50%,rgba(255,255,255,.07)_52%,transparent)]"
        />
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2.5 p-6">
          <span className="eyebrow text-white/55">{t('home.work.next_eyebrow')}</span>
          <span className="text-[clamp(19px,2.2vw,32px)] font-[580] leading-tight tracking-[-0.045em]">
            {t('home.work.next_caption')}
            <span
              aria-hidden
              className="caret ms-[.1em] inline-block h-[1em] w-[.46em] translate-y-[.12em] bg-wire-go"
            />
          </span>
        </div>
      </div>
    );
  }
  const alt = t(`home.work.${project}_alt`);
  return (
    <div className="pane pane-shot">
      <img src={src} alt={alt} width={1280} height={project === 'noctis' ? 800 : 495} />
      <button
        type="button"
        className="absolute inset-0 z-[4] cursor-zoom-in border-0 bg-transparent"
        onClick={() => onOpen({ src, alt })}
        aria-label={t('home.work.shot_open')}
      />
    </div>
  );
}

function Pane({ project, onOpen }: { project: Project; onOpen: (s: Shot) => void }) {
  return (
    <div
      className="mx-auto flex w-full max-w-[1200px] flex-none flex-col gap-3.5"
      data-product={project}
      id={project}
      role="tabpanel"
      aria-labelledby={`rail-${project}`}
      tabIndex={-1}
    >
      <div className="flex flex-wrap items-stretch gap-3.5">
        <Screen project={project} onOpen={onOpen} />

        <div className="pane pane-details">
          <div className="flex h-full flex-col gap-3.5 p-7">
            <div className="flex items-center gap-3">
              <C0nn3ctMark className="h-[34px] w-[34px] flex-none text-led" />
              <span className="flex min-w-0 flex-col gap-px">
                <h3 className="m-0 text-[clamp(26px,3vw,42px)] font-[640] leading-[0.98] tracking-[-0.05em]">
                  {name(project)}
                </h3>
                <span className="mono text-[9px] font-bold uppercase tracking-[0.15em] text-led-ink">
                  {t(`home.work.${project}_own`)}
                </span>
              </span>
            </div>
            <p className="m-0 text-[clamp(16px,1.5vw,20px)] leading-snug tracking-[-0.02em]">
              {t(`home.work.${project}_lead`)}
            </p>
            <div className="mt-auto flex flex-wrap items-center gap-x-1.5 gap-y-0.5 border-t border-outline-variant pt-2">
              {links(project).map((l) => (
                <a className="pane-link" href={l.href} key={l.href}>
                  {l.label}
                  {l.inPage ? (
                    <ArrowRight className="h-3.5 w-3.5 rtl:-scale-x-100" aria-hidden />
                  ) : (
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                  )}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="grid flex-1 basis-[230px] auto-rows-fr grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-2.5 [min-width:min(100%,215px)]">
          {['f1', 'f2', 'f3'].map((f, i) => (
            <div className="fact-card" key={f}>
              <span className="ordinal">{`0${i + 1}`}</span>
              <span className="text-pretty text-[13.5px] leading-snug">
                {t(`home.work.${project}_${f}`)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface WorkProps {
  project: Project;
  onPick: (p: Project) => void;
}

export function Work({ project, onPick }: WorkProps) {
  const [shot, setShot] = useState<Shot | null>(null);
  const rail = useRef<HTMLDivElement>(null);

  // Tab semantics all the way: arrows move the selection, as a tablist owes.
  const onKeyDown = (e: KeyboardEvent) => {
    const n = nextIndex(e.key, PROJECTS.indexOf(project), PROJECTS.length);
    if (n === null) return;
    e.preventDefault();
    onPick(PROJECTS[n]);
    rail.current?.querySelector<HTMLButtonElement>(`#rail-${PROJECTS[n]}`)?.focus();
  };

  return (
    <section
      id="work"
      className="flex min-h-[100svh] flex-col justify-center gap-[18px] px-5 pb-8 pt-[78px]"
    >
      <div className="grid items-start gap-6 [grid-template-columns:minmax(0,1fr)] min-[900px]:[grid-template-columns:minmax(190px,236px)_minmax(0,1fr)]">
        <div className="flex flex-col min-[900px]:sticky min-[900px]:top-24">
          <div className="flex items-baseline justify-between gap-2.5 pb-3">
            <h2 className="m-0 text-[clamp(24px,2.6vw,34px)] font-semibold leading-none tracking-[-0.045em]">
              {t('home.work.h2')}
            </h2>
            <span className="eyebrow text-on-surface-variant">{t('home.work.anno')}</span>
          </div>

          <div
            className="flex flex-col"
            role="tablist"
            aria-label={t('home.work.rail_aria')}
            aria-orientation="vertical"
            ref={rail}
            onKeyDown={onKeyDown}
          >
            {PROJECTS.map((p, i) => (
              <button
                type="button"
                key={p}
                id={`rail-${p}`}
                className="rail-btn hoverable"
                role="tab"
                aria-selected={p === project}
                aria-controls={p}
                tabIndex={p === project ? 0 : -1}
                onClick={() => onPick(p)}
              >
                <span className="ordinal">{`0${i + 1}`}</span>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="rail-name">{name(p)}</span>
                  <span className="mono text-[10px] uppercase tracking-[0.1em] text-on-surface-variant">
                    {t(`home.work.${p}_kind`)}
                  </span>
                </span>
              </button>
            ))}
          </div>

          <p className="mt-4 text-[13px] leading-normal text-on-surface-variant">
            {t('home.work.note')}
          </p>
        </div>

        <div className="flex min-h-[calc(100svh-124px)] flex-col justify-center gap-3.5">
          <Pane project={project} onOpen={setShot} />
        </div>
      </div>

      {shot && <Lightbox shot={shot} onClose={() => setShot(null)} />}
    </section>
  );
}
