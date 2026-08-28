import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from 'react';
import { ArrowDown, Chrome, Github, Globe, Mail, type LucideIcon } from 'lucide-react';
import { enterEase } from '@/lib/ease';
import { C0nn3ctMark } from '@/components/c0nn3ct-mark';
import { Aria2tMark, NoctisMark } from '@/components/product-mark';
import { Lightbox } from '@/components/lightbox';
import { ShotTrack, type Shot } from '@/components/shot-track';
import { nextIndex } from '@/lib/roving';
import {
  ARIA2T_SITE,
  ARIA2T_SRC,
  NOCTIS_SITE,
  NOCTIS_SRC,
  NOCTIS_STORE,
  PRODUCT_NAME,
  mailto,
} from '@/constants';
import { t } from '../i18n';

export type Project = 'noctis' | 'aria2t' | 'next';

export const PROJECTS: readonly Project[] = ['noctis', 'aria2t', 'next'];

/** The screens each product has, in the order its carousel shows them. Both
 * sets come from the products' own screenshot skills at 1280x800, which is the
 * shot pane's 16/10 exactly, so nothing is cropped or letterboxed any more. */
const SLIDES: Partial<Record<Project, readonly string[]>> = {
  // Both open on their promo tile (owner-directed): it names the product and
  // says what it does before the reader is asked to read an interface.
  noctis: ['promo', 'home', 'servers', 'routing'],
  aria2t: ['promo', 'home', 'detail', 'settings'],
};

/** Each product's own mark, from its own repository. The workshop has no
 * product yet, so it borrows the org's. */
const MARK: Record<Project, typeof C0nn3ctMark> = {
  noctis: NoctisMark,
  aria2t: Aria2tMark,
  next: C0nn3ctMark,
};

interface PaneLink {
  label: string;
  href: string;
  /** Named on the left rather than trailed by an arrow: destinations of
   * different kinds are told apart by what they are, and an arrow on each said
   * only that all of them lead away. */
  icon: LucideIcon;
}

/**
 * Where the pane sends a reader, in order of how likely they want it.
 *
 * The product's own page is the whole point of the entry, so it is a button
 * across the card rather than the first of three equal names in a row
 * (owner-directed). The store and the repository keep the row under it: they are
 * for a reader who came looking for them.
 */
function links(p: Project): { lead: PaneLink; rest: PaneLink[] } {
  if (p === 'noctis')
    return {
      lead: { label: t('home.work.link_site'), href: NOCTIS_SITE, icon: Globe },
      rest: [
        { label: t('home.work.link_store'), href: NOCTIS_STORE, icon: Chrome },
        { label: t('home.work.link_src'), href: NOCTIS_SRC, icon: Github },
      ],
    };
  if (p === 'aria2t')
    return {
      lead: { label: t('home.work.link_site'), href: ARIA2T_SITE, icon: Globe },
      rest: [{ label: t('home.work.link_src'), href: ARIA2T_SRC, icon: Github }],
    };
  return {
    lead: { label: t('home.work.link_suggest'), href: mailto(t('mail.suggest')), icon: Mail },
    rest: [{ label: t('home.work.link_promises'), href: '#settled', icon: ArrowDown }],
  };
}

function name(p: Project): string {
  return p === 'next' ? t('home.work.next_name') : PRODUCT_NAME[p];
}

/** One capture, in both themes, named after the screen it shows. The name is
 * the product's own word for that screen, lifted from its locale files. */
function capture(project: Project, key: string): Shot {
  return {
    light: `/media/${project}-${key}-light.webp`,
    dark: `/media/${project}-${key}-dark.webp`,
    alt: `${name(project)} · ${t(`home.work.shot_${key}`)}`,
  };
}

interface ScreenProps {
  project: Project;
  onOpen: (shots: Shot[], at: number) => void;
  /** False while a capture is open full size: the pane is still on screen
   * behind the dialog, and a reader who closes it should find the capture they
   * opened rather than one the pane moved on to without them. */
  auto: boolean;
}

/** The screen half of a pane: the product's captures as a carousel, or the
 * placeholder that says plainly there is nothing to capture yet. */
function Screen({ project, onOpen, auto }: ScreenProps) {
  const keys = SLIDES[project];
  if (!keys) {
    return (
      <div className="pane pane-shot pane-stage border-0 text-white">
        {/* The same frame a capture gets, so the workshop's pane is the size of
            the other two rather than the height of the words inside it: it used
            to measure 300px against their 400 at 1440. */}
        <div className="shot-frame">
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(62%_72%_at_76%_16%,rgb(var(--glow-noctis)/0.24),transparent_72%)]"
          />
          <div
            aria-hidden
            data-loop
            className="scan-band absolute inset-x-0 h-[34%] bg-[linear-gradient(to_bottom,transparent,rgba(255,255,255,.07)_48%,rgba(255,255,255,.14)_50%,rgba(255,255,255,.07)_52%,transparent)]"
          />
          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2.5 p-6">
            <span className="eyebrow text-white/55">{t('home.work.next_eyebrow')}</span>
            <span className="text-balance text-[clamp(19px,2.2vw,32px)] font-[580] leading-tight tracking-[var(--track-display)]">
              {t('home.work.next_caption')}
              <span
                aria-hidden
                data-loop
                className="caret ms-[.1em] inline-block h-[1em] w-[.46em] translate-y-[.12em] bg-wire-go"
              />
            </span>
          </div>
        </div>
      </div>
    );
  }
  const shots = keys.map((k) => capture(project, k));
  return (
    <div className="pane pane-shot">
      <ShotTrack
        shots={shots}
        auto={auto}
        label={t('home.work.shots_aria')}
        pick={{
          verb: t('home.work.shot_open'),
          onPick: (shot) => onOpen(shots, shots.indexOf(shot)),
        }}
      />
    </div>
  );
}

interface PaneProps {
  project: Project;
  onOpen: (shots: Shot[], at: number) => void;
  auto: boolean;
}

function Pane({ project, onOpen, auto }: PaneProps) {
  const Mark = MARK[project];
  return (
    <div
      className="flex w-full flex-none flex-col gap-[var(--gap-part)]"
      data-product={project}
      id={project}
      role="tabpanel"
      aria-labelledby={`rail-${project}`}
      tabIndex={-1}
    >
      {/* An explicit grid, because flex-wrap left the arrangement to arithmetic
          and the answer changed twice on the way out: the three facts sat in one
          column to 1100, spread to three to 1440, then collapsed back into a
          234px column above 1600. Two rows now, at every width that has room
          for them, so a reader resizing sees one layout. */}
      <div className="grid gap-[var(--gap-part)] [grid-template-columns:minmax(0,1fr)] min-[1100px]:[grid-template-columns:minmax(0,1.5fr)_minmax(0,1fr)]">
        <Screen project={project} onOpen={onOpen} auto={auto} />

        <div className="pane pane-details">
          {/* The spacing steps down with the column. Above 1340 the card has room
                for the wide rhythm; below it the same 28px inset and 24px separations
                sat in a 330px column, which is what pushed the card past the capture
                beside it and left the pane a 52px matte to make up the difference. */}
            <div className="flex h-full flex-col gap-[var(--gap-group)] p-6 min-[1340px]:gap-[var(--gap-part)] min-[1340px]:p-7">
            {/* A grid rather than a flex row, so the mark takes its height from
                the type rather than from the block beside it. Stretching it in
                a flex row was circular, the mark grew the row and the row sized
                the mark, and it settled at 372px.
                
                The height is the name plus one line of the kind under it, held
                there whatever the kind does: noctis wraps to two lines below
                about 1300px, and a mark that followed the wrap grew a fifth
                taller than aria2t's and closed the gap to the name. One --title
                so the name's size and the mark's height cannot drift. */}
            <div
              className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3"
              style={{ '--title': 'clamp(26px, 3vw, 42px)' } as CSSProperties}
            >
              <Mark className="row-span-2 h-[calc(var(--title)*0.98+26px)] w-auto text-led" />
              <h3 className="m-0 text-[length:var(--title)] font-[640] leading-[0.98] tracking-[var(--track-display)]">
                {name(project)}
              </h3>
              <span className="tag text-led-ink">{t(`home.work.${project}_own`)}</span>
            </div>
            <p className="m-0 text-pretty text-[clamp(16px,1.5vw,20px)] leading-snug tracking-[var(--track-name)]">
              {t(`home.work.${project}_lead`)}
            </p>
            <PaneLinks project={project} />
          </div>
        </div>

        <div className="grid auto-rows-fr grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-[var(--gap-group)] min-[1100px]:col-span-2">
          {['f1', 'f2', 'f3'].map((f, i) => (
            <div className="fact-card" key={f}>
              <span className="ordinal">{`0${i + 1}`}</span>
              <span className="note">{t(`home.work.${project}_${f}`)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** The button the pane is pointing at, then the row of names under the line. */
function PaneLinks({ project }: { project: Project }) {
  const { lead, rest } = links(project);
  const Lead = lead.icon;
  return (
    <div className="mt-auto flex flex-col gap-[var(--gap-group)]">
      <a className="pane-cta" href={lead.href}>
        <Lead className="h-[1.15em] w-[1.15em] flex-none" aria-hidden />
        {lead.label}
      </a>
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 border-t border-outline-variant pt-2">
        {rest.map(({ label, href, icon: Icon }) => (
          <a className="pane-link" href={href} key={href}>
            <Icon className="h-[1.15em] w-[1.15em] flex-none" aria-hidden />
            {label}
          </a>
        ))}
      </div>
    </div>
  );
}

interface WorkProps {
  project: Project;
  onPick: (p: Project) => void;
}

export function Work({ project, onPick }: WorkProps) {
  const [zoom, setZoom] = useState<{ shots: Shot[]; at: number } | null>(null);
  // The tablist arrives through state rather than a ref, so the effects below
  // re-run when it attaches and their "not yet" case is the real one every
  // mount passes through, instead of a guard against a ref that is never null.
  const [rail, setRail] = useState<HTMLDivElement | null>(null);
  const pane = useRef<HTMLDivElement>(null);
  const shown = useRef(PROJECTS.indexOf(project));

  // Choosing a product replaces the whole pane, and it used to happen with no
  // acknowledgement at all: the screenshot, the name, the sentence and the
  // three facts were simply different ones. This is the page's main
  // interaction, so the swap says which way the rail moved, entering from
  // below when the reader picks something further down the list and from above
  // when they go back up.
  //
  // The pane animates rather than remounting, because remounting would drop
  // and refetch the capture and the swap would flash. The resting state is the
  // finished one, so a reader whose scripts never run still sees the pane.
  // Where the travelling marker has to be. Measured rather than computed, so a
  // row that wraps its name at a narrow width still gets a marker its own
  // length. Layout effect, because reading offsetTop after paint would show the
  // marker at its old row for a frame.
  useLayoutEffect(() => {
    if (!rail) return;
    const place = () => {
      const row = rail.querySelector<HTMLElement>('[aria-selected="true"]');
      if (!row) return;
      rail.style.setProperty('--mark-y', `${row.offsetTop}px`);
      rail.style.setProperty('--mark-h', String(row.offsetHeight));
    };
    place();
    // The rows change height when their names wrap, which the marker has to
    // follow without waiting for the next selection.
    const ro = new ResizeObserver(place);
    ro.observe(rail);
    return () => ro.disconnect();
  }, [rail, project]);

  useEffect(() => {
    const to = PROJECTS.indexOf(project);
    const from = shown.current;
    shown.current = to;
    if (to === from || !pane.current) return;
    if (!window.matchMedia('(prefers-reduced-motion: no-preference)').matches) return;
    pane.current.animate(
      [
        { opacity: 0, transform: `translateY(${to > from ? 10 : -10}px)` },
        { opacity: 1, transform: 'none' },
      ],
      { duration: 260, easing: enterEase() },
    );
  }, [project]);

  // Tab semantics all the way: arrows move the selection, as a tablist owes.
  const onKeyDown = (e: KeyboardEvent) => {
    const n = nextIndex(e.key, PROJECTS.indexOf(project), PROJECTS.length);
    if (n === null) return;
    e.preventDefault();
    onPick(PROJECTS[n]);
    rail?.querySelector<HTMLButtonElement>(`#rail-${PROJECTS[n]}`)?.focus();
  };

  return (
    <section
      id="work"
      aria-labelledby="work-h"
      data-enter-section
      /* Geometric centre reads low here, because the block's own weight sits
         under its top edge: the rail's three rows and the screenshot are dark
         mass, and the fact cards below them are mostly ground. The extra
         bottom padding lifts it 24px above the middle, which is the optical
         centre rather than the arithmetic one. It is scoped to the two-column
         width, because below 900px the block is taller than the screen it
         sits in and there is no slack to spend: the lift would land as 48px of
         extra ground above the next section's border instead. */
      className="page-pad flex min-h-[100svh] flex-col justify-center gap-6 py-16 min-[900px]:pb-28"
    >
      <div className="page-col grid items-start gap-6 [grid-template-columns:minmax(0,1fr)] min-[900px]:[grid-template-columns:minmax(190px,236px)_minmax(0,1fr)]">
        <div className="flex flex-col min-[900px]:sticky min-[900px]:top-24">
          <div data-enter className="flex items-baseline justify-between gap-2.5 pb-3">
            <h2
              id="work-h"
              className="m-0 text-balance text-[clamp(24px,2.6vw,34px)] font-semibold leading-none tracking-[var(--track-display)]"
            >
              {t('home.work.h2')}
            </h2>
            <span className="eyebrow text-on-surface-variant">{t('home.work.anno')}</span>
          </div>

          <div
            data-enter-stagger="wipe"
            className="rail-list flex flex-col"
            role="tablist"
            aria-label={t('home.work.rail_aria')}
            aria-orientation="vertical"
            ref={setRail}
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
                <span className="ordinal" data-product={p}>{`0${i + 1}`}</span>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="rail-name">{name(p)}</span>
                  <span className="tag text-on-surface-variant">{t(`home.work.${p}_kind`)}</span>
                </span>
              </button>
            ))}
          </div>

          <p data-enter className="note mt-4 text-on-surface-variant">
            {t('home.work.note')}
          </p>
        </div>

        {/* Two different centrings, and only one of them is wanted. The pane
            keeps the rail's top edge, because the grid is items-start and
            centring it inside its own column put the two halves of one section
            260px apart on a 1080-tall screen. The pair then centres together in
            the section, which is what the height reservation used to prevent:
            asking the pane for calc(100svh - 124px) made the column taller than
            its contents, so the block hung from the top of a full-height
            section with 251px of dead air under it at 1440x900. Its natural
            height rides the section's own justify-center now, the same way
            #how and #settled do. */}
        <div ref={pane} data-enter className="flex flex-col gap-[var(--gap-part)]">
          <Pane
            project={project}
            onOpen={(shots, at) => setZoom({ shots, at })}
            auto={!zoom}
          />
        </div>
      </div>

      {zoom && <Lightbox shots={zoom.shots} at={zoom.at} onClose={() => setZoom(null)} />}
    </section>
  );
}
