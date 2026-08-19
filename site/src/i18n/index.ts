import en from './en.json';

export const LOCALES = ['en'] as const;
export type Locale = (typeof LOCALES)[number];

export const RTL_LOCALES: readonly Locale[] = [];

export function isRtl(locale: Locale): boolean {
  return RTL_LOCALES.includes(locale);
}

export function isLocale(x: string): x is Locale {
  return (LOCALES as readonly string[]).includes(x);
}

const DICTIONARIES: Record<Locale, Record<string, string>> = { en };

const NON_EN_LOCALES: readonly string[] = LOCALES.filter((l) => l !== 'en');

let currentLocale: Locale = 'en';

export function setLocale(locale: Locale): void {
  currentLocale = locale;
}

export function getLocale(): Locale {
  return currentLocale;
}

export function t(key: string): string {
  const dict = DICTIONARIES[currentLocale];
  const value = dict[key];
  if (value === undefined) {
    if (import.meta.env.DEV) console.warn(`[i18n] missing key: ${key} (${currentLocale})`);
    return key;
  }
  return value;
}

/** Strip a known non-English locale prefix from a path → its base form (`/`, …).
 * The locale list is a parameter so the branches stay exercisable while the
 * site ships English only. */
export function stripLocale(path: string, locales: readonly string[] = NON_EN_LOCALES): string {
  for (const l of locales) {
    if (path === `/${l}` || path === `/${l}/`) return '/';
    if (path.startsWith(`/${l}/`)) return path.slice(l.length + 1);
  }
  return path;
}

/** Prefix a base (English) path with a locale. English stays at the root. */
export function withLocale(base: string, locale: string): string {
  if (locale === 'en') return base;
  if (base === '/') return `/${locale}/`;
  return `/${locale}${base}`;
}

export function localePath(path: string): string {
  return withLocale(path, currentLocale);
}
