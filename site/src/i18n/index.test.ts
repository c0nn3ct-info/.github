import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  LOCALES,
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

describe('locale registry', () => {
  it('ships English and recognises it', () => {
    expect(LOCALES).toContain('en');
    expect(isLocale('en')).toBe(true);
    expect(isLocale('xx')).toBe(false);
  });

  it('has no right-to-left locales', () => {
    expect(isRtl('en')).toBe(false);
  });

  it('tracks the current locale', () => {
    expect(getLocale()).toBe('en');
    setLocale('en');
    expect(getLocale()).toBe('en');
  });
});

describe('t', () => {
  it('resolves known keys', () => {
    expect(t('home.hero.h1')).toBe('Small, finished software');
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
    expect(localePath('/')).toBe('/');
  });

  it('prefixes other locales on both root and nested paths', () => {
    expect(withLocale('/', 'ru')).toBe('/ru/');
    expect(withLocale('/privacy/', 'ru')).toBe('/ru/privacy/');
  });

  it('strips locale prefixes it is given and leaves the rest alone', () => {
    expect(stripLocale('/ru', ['ru'])).toBe('/');
    expect(stripLocale('/ru/', ['ru'])).toBe('/');
    expect(stripLocale('/ru/privacy/', ['ru'])).toBe('/privacy/');
    expect(stripLocale('/privacy/', ['ru'])).toBe('/privacy/');
    expect(stripLocale('/anything/')).toBe('/anything/');
  });
});
