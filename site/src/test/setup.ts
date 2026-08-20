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

afterEach(() => {
  cleanup();
  listeners.clear();
  localStore.clear();
  media = { ...DEFAULTS };
  setScrollY(0);
});
