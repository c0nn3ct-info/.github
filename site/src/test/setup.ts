// Global test setup: the jsdom gaps the site actually hits, plus RTL teardown.
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// ── matchMedia ───────────────────────────────────────────────────────────────
// The page asks three different questions of the environment, so the stub
// answers per query rather than handing every query the same boolean.
type MqlListener = (ev: MediaQueryListEvent) => void;

const DARK = '(prefers-color-scheme: dark)';
const MOTION = '(prefers-reduced-motion: no-preference)';
const FINE = '(hover: hover) and (pointer: fine)';

const DEFAULTS: Record<string, boolean> = {
  [DARK]: false,
  [MOTION]: true,
  [FINE]: true,
};

let media: Record<string, boolean> = { ...DEFAULTS };
const listeners = new Map<string, Set<MqlListener>>();

export function setMedia(query: string, matches: boolean): void {
  media[query] = matches;
  const ev = { matches, media: query } as MediaQueryListEvent;
  for (const l of [...(listeners.get(query) ?? [])]) l(ev);
}

export function setSystemDark(dark: boolean): void {
  setMedia(DARK, dark);
}

/** Reduced motion, coarse pointer: the environment a phone or an accessibility
 * preference presents, which several components branch on. */
export function setReducedMotion(reduced: boolean): void {
  setMedia(MOTION, !reduced);
}

export function setFinePointer(fine: boolean): void {
  setMedia(FINE, fine);
}

window.matchMedia = ((query: string) => {
  const bucket = listeners.get(query) ?? new Set<MqlListener>();
  listeners.set(query, bucket);
  return {
    get matches() {
      return media[query] ?? false;
    },
    media: query,
    onchange: null,
    addEventListener: (_: string, l: MqlListener) => void bucket.add(l),
    removeEventListener: (_: string, l: MqlListener) => void bucket.delete(l),
    addListener: (l: MqlListener) => void bucket.add(l),
    removeListener: (l: MqlListener) => void bucket.delete(l),
    dispatchEvent: () => true,
  } as unknown as MediaQueryList;
}) as typeof window.matchMedia;

// ── PointerEvent ─────────────────────────────────────────────────────────────
// jsdom has no PointerEvent, and the header and the hero both listen for one.
// MouseEvent carries every field they read.
if (typeof window.PointerEvent === 'undefined') {
  class PointerEventShim extends MouseEvent {
    readonly pointerType: string;
    constructor(type: string, init: MouseEventInit & { pointerType?: string } = {}) {
      super(type, init);
      this.pointerType = init.pointerType ?? 'mouse';
    }
  }
  window.PointerEvent = PointerEventShim as unknown as typeof PointerEvent;
  globalThis.PointerEvent = window.PointerEvent;
}

// ── localStorage ─────────────────────────────────────────────────────────────
// jsdom hands back a bare object with no Storage methods under this environment.
const localStore = new Map<string, string>();
if (typeof window.localStorage?.getItem !== 'function') {
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      get length() {
        return localStore.size;
      },
      key: (i: number) => [...localStore.keys()][i] ?? null,
      getItem: (k: string) => localStore.get(k) ?? null,
      setItem: (k: string, v: string) => void localStore.set(k, String(v)),
      removeItem: (k: string) => void localStore.delete(k),
      clear: () => localStore.clear(),
    } satisfies Storage,
  });
}

// ── scrolling ────────────────────────────────────────────────────────────────
// jsdom has no layout, so scrollTo is a stub that keeps scrollY consistent for
// anything reading it back.
export function setScrollY(y: number): void {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true, writable: true });
}
window.scrollTo = ((_x: number, y: number) => setScrollY(y)) as typeof window.scrollTo;

// A carousel chevron's whole job is the delta it hands its scroller, and jsdom
// has neither Element.scrollBy nor Element.scrollTo to hand it to, so the calls
// are recorded rather than swallowed. Before this the two chevron clicks in the
// suite threw inside React's handler and were reported as unhandled errors
// beside a green run.
export interface RecordedScroll {
  target: Element;
  /** `by` is a delta and `to` is a destination, and the carousel uses both: one
   * capture along, or back to the first from the last. */
  kind: 'by' | 'to';
  options: ScrollToOptions;
}

export const scrolls: RecordedScroll[] = [];

Element.prototype.scrollBy = function scrollBy(this: Element, options?: ScrollToOptions | number) {
  scrolls.push({ target: this, kind: 'by', options: (options ?? {}) as ScrollToOptions });
} as typeof Element.prototype.scrollBy;

Element.prototype.scrollTo = function scrollTo(this: Element, options?: ScrollToOptions | number) {
  scrolls.push({ target: this, kind: 'to', options: (options ?? {}) as ScrollToOptions });
} as typeof Element.prototype.scrollTo;

// ── Web Animations ───────────────────────────────────────────────────────────
// jsdom has no Element.animate, and the work pane uses it to acknowledge a
// product swap. Recording the calls rather than swallowing them, so a test can
// ask what the motion actually was instead of only that it did not throw.
export interface RecordedAnimation {
  target: Element;
  keyframes: Keyframe[];
  options: KeyframeAnimationOptions;
}

export const animations: RecordedAnimation[] = [];

if (typeof Element.prototype.animate !== 'function') {
  Element.prototype.animate = function animate(
    this: Element,
    keyframes: Keyframe[] | PropertyIndexedKeyframes | null,
    options?: number | KeyframeAnimationOptions,
  ) {
    animations.push({
      target: this,
      keyframes: (keyframes ?? []) as Keyframe[],
      options: (typeof options === 'number'
        ? { duration: options }
        : (options ?? {})) as KeyframeAnimationOptions,
    });
    // `finished` is a real promise: the mask reveal hands its paint layer back
    // when the sweep resolves, and a stub without it would skip that silently.
    return {
      cancel() {},
      finish() {},
      playState: 'finished',
      finished: Promise.resolve(),
    } as unknown as Animation;
  } as typeof Element.prototype.animate;
}

// ── IntersectionObserver ─────────────────────────────────────────────────────
// jsdom has none, and the loop pauser is built on it. The shim keeps every live
// instance so a test can drive an element on and off screen by hand.
type IoCallback = (entries: IntersectionObserverEntry[], o: IntersectionObserver) => void;

class IntersectionObserverShim implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin: string;
  readonly thresholds: number[];
  readonly targets = new Set<Element>();
  constructor(
    private readonly cb: IoCallback,
    init?: IntersectionObserverInit,
  ) {
    this.rootMargin = init?.rootMargin ?? '0px';
    // Recorded rather than assumed: how much of a region counts as seen is a
    // decision, and the autoplay's is different from the loop pauser's.
    this.thresholds = [init?.threshold ?? 0].flat();
    observers.add(this);
  }
  observe(el: Element) {
    this.targets.add(el);
  }
  unobserve(el: Element) {
    this.targets.delete(el);
  }
  disconnect() {
    this.targets.clear();
    observers.delete(this);
  }
  takeRecords() {
    return [];
  }
  /** Report every observed target as on or off screen. */
  fire(isIntersecting: boolean) {
    this.report(
      [...this.targets].map((target) => ({ target, isIntersecting }) as IntersectionObserverEntry),
    );
  }

  report(entries: IntersectionObserverEntry[]) {
    this.cb(entries, this);
  }
}

const observers = new Set<IntersectionObserverShim>();

/** Report one watched region on or off screen, leaving the others as they are. */
export function fireRegion(region: Element, isIntersecting: boolean): void {
  for (const o of [...observers]) {
    if (!o.targets.has(region)) continue;
    o.report([{ target: region, isIntersecting } as IntersectionObserverEntry]);
  }
}

/** The rootMargin each live observer was created with, one per observer. */
export function observerMargins(): string[] {
  return [...observers].map((o) => o.rootMargin);
}

/** The threshold each live observer was created with. */
export function observerThresholds(): number[][] {
  return [...observers].map((o) => o.thresholds);
}

/** Everything the live observers are actually watching. */
export function observedTargets(): Element[] {
  return [...observers].flatMap((o) => [...o.targets]);
}

/** Drive every live observer's targets on or off screen. */
export function setOnScreen(isIntersecting: boolean): void {
  for (const o of [...observers]) o.fire(isIntersecting);
}

/** Flip document.hidden and fire the event the pauser listens for. */
export function setPageHidden(hidden: boolean): void {
  Object.defineProperty(document, 'hidden', { value: hidden, configurable: true });
  document.dispatchEvent(new Event('visibilitychange'));
}

window.IntersectionObserver = IntersectionObserverShim as unknown as typeof IntersectionObserver;
globalThis.IntersectionObserver = window.IntersectionObserver;

// ── CSS.supports ─────────────────────────────────────────────────────────────
// The entrances are a scroll-driven CSS animation where `view()` timelines
// exist and a JS fallback where they do not, and jsdom answers `supports` too
// generously to tell the two apart on its own.
let viewTimelines = false;

/** Choose which entrance path is live for this test. */
export function setScrollDriven(on: boolean): void {
  viewTimelines = on;
}

if (typeof CSS === 'undefined') {
  (globalThis as { CSS?: unknown }).CSS = {};
}
CSS.supports = ((property: string, value?: string) =>
  property === 'animation-timeline' || value === 'view()'
    ? viewTimelines
    : false) as typeof CSS.supports;

// ── ResizeObserver ───────────────────────────────────────────────────────────
// jsdom has none, and the rail's marker follows its rows with one. jsdom also
// has no layout, so the shim never fires on its own; a test drives it.
class ResizeObserverShim implements ResizeObserver {
  readonly targets = new Set<Element>();
  constructor(private readonly cb: ResizeObserverCallback) {
    resizers.add(this);
  }
  observe(el: Element) {
    this.targets.add(el);
  }
  unobserve(el: Element) {
    this.targets.delete(el);
  }
  disconnect() {
    this.targets.clear();
    resizers.delete(this);
  }
  run() {
    this.cb(
      [...this.targets].map((target) => ({ target }) as ResizeObserverEntry),
      this,
    );
  }
}

const resizers = new Set<ResizeObserverShim>();

/** Tell every live ResizeObserver its targets changed size. */
export function fireResize(): void {
  for (const r of [...resizers]) r.run();
}

window.ResizeObserver = ResizeObserverShim as unknown as typeof ResizeObserver;
globalThis.ResizeObserver = window.ResizeObserver;

afterEach(() => {
  cleanup();
  listeners.clear();
  localStore.clear();
  media = { ...DEFAULTS };
  setScrollY(0);
  animations.length = 0;
  scrolls.length = 0;
  observers.clear();
  resizers.clear();
  viewTimelines = false;
  Object.defineProperty(document, 'hidden', { value: false, configurable: true });
});
