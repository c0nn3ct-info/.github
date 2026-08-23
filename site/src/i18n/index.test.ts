import { afterEach, describe, expect, it, vi } from 'vitest';
import en from './en.json';
import ru from './ru.json';
import es from './es.json';
import zhCN from './zh-CN.json';
import fa from './fa.json';
import ar from './ar.json';
import {
  LOCALES,
  LOCALE_LABEL,
  getLocale,
  isLocale,
  isRtl,
  localePath,
  setLocale,
  stripLocale,
  t,
  withLocale,
} from './index';

afterEach(() => {
  setLocale('en');
  vi.restoreAllMocks();
});

const DICTS: Record<string, Record<string, string>> = {
  en,
  ru,
  es,
  'zh-CN': zhCN,
  fa,
  ar,
};

describe('locale registry', () => {
  it('ships the six languages the switcher offers', () => {
    expect([...LOCALES]).toEqual(['en', 'ru', 'es', 'zh-CN', 'fa', 'ar']);
    expect(isLocale('zh-CN')).toBe(true);
    expect(isLocale('xx')).toBe(false);
  });

  it('names every locale in its own language', () => {
    for (const l of LOCALES) expect(LOCALE_LABEL[l]).toBeTruthy();
    expect(LOCALE_LABEL.fa).toBe('فارسی');
  });

  it('marks Persian and Arabic as right-to-left and nothing else', () => {
    expect(LOCALES.filter(isRtl)).toEqual(['fa', 'ar']);
  });

  it('tracks the current locale', () => {
    expect(getLocale()).toBe('en');
    setLocale('ru');
    expect(getLocale()).toBe('ru');
  });
});

describe('dictionaries', () => {
  // The key set is the contract: a locale missing one would silently ship the
  // raw key to a reader.
  it('carry an identical key set in every language', () => {
    const keys = Object.keys(en).sort();
    for (const [locale, dict] of Object.entries(DICTS)) {
      expect({ locale, keys: Object.keys(dict).sort() }).toEqual({ locale, keys });
    }
  });

  // The port updated the headline and left the head behind, so every locale
  // shipped a tab title and a search snippet claiming a positioning the page
  // itself had dropped. The tie is asserted rather than remembered.
  it('title and description carry the headline the page actually shows', () => {
    for (const [locale, dict] of Object.entries(DICTS)) {
      const claim = dict['home.hero.h1_em'];
      expect({ locale, inTitle: dict['home.title'].includes(claim) }).toEqual({
        locale,
        inTitle: true,
      });
      expect({ locale, inDesc: dict['home.description'].includes(claim) }).toEqual({
        locale,
        inDesc: true,
      });
    }
  });

  it('leave no value empty', () => {
    for (const [locale, dict] of Object.entries(DICTS)) {
      for (const [k, v] of Object.entries(dict)) {
        expect({ locale, k, empty: v.trim() === '' }).toEqual({ locale, k, empty: false });
      }
    }
  });
});

describe('t', () => {
  it('resolves known keys in the current locale', () => {
    expect(t('home.hero.h1_em')).toBe('answers to you');
    setLocale('ru');
    expect(t('home.hero.h1_em')).toBe('которые служат вам');
  });

  it('returns the key and warns for unknown keys', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(t('nope.missing')).toBe('nope.missing');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('nope.missing'));
  });

  it('stays quiet about unknown keys outside dev builds', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const wasDev = import.meta.env.DEV;
    import.meta.env.DEV = false;
    try {
      expect(t('nope.prod')).toBe('nope.prod');
      expect(warn).not.toHaveBeenCalled();
    } finally {
      import.meta.env.DEV = wasDev;
    }
  });
});

describe('paths', () => {
  it('keeps English at the root', () => {
    expect(withLocale('/', 'en')).toBe('/');
    expect(withLocale('/404.html', 'en')).toBe('/404.html');
    expect(localePath('/')).toBe('/');
  });

  it('prefixes other locales on both root and nested paths', () => {
    expect(withLocale('/', 'ru')).toBe('/ru/');
    expect(withLocale('/404.html', 'zh-CN')).toBe('/zh-CN/404.html');
    setLocale('ar');
    expect(localePath('/')).toBe('/ar/');
  });

  it('strips a locale prefix and leaves everything else alone', () => {
    expect(stripLocale('/ru')).toBe('/');
    expect(stripLocale('/ru/')).toBe('/');
    expect(stripLocale('/zh-CN/404.html')).toBe('/404.html');
    expect(stripLocale('/404.html')).toBe('/404.html');
    expect(stripLocale('/')).toBe('/');
  });

  it('round-trips every locale through strip and re-prefix', () => {
    for (const l of LOCALES) expect(stripLocale(withLocale('/', l))).toBe('/');
  });
});
