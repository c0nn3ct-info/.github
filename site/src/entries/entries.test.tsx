import { beforeEach, describe, expect, it, vi } from 'vitest';

const mountPage = vi.fn();
vi.mock('../main', () => ({ mountPage }));
vi.mock('../pages/home', () => ({ HomePage: () => <p>home</p> }));
vi.mock('../pages/not-found', () => ({ NotFoundPage: () => <p>missing</p> }));

beforeEach(() => {
  vi.resetModules();
  mountPage.mockClear();
});

describe('home entry', () => {
  it('adopts the document language when it is a shipped locale', async () => {
    document.documentElement.lang = 'en';
    await import('./home');
    const { getLocale } = await import('../i18n');
    expect(getLocale()).toBe('en');
    expect(mountPage).toHaveBeenCalledTimes(1);
  });

  it('falls back to English for an unknown document language', async () => {
    document.documentElement.lang = 'xx';
    await import('./home');
    const { getLocale } = await import('../i18n');
    expect(getLocale()).toBe('en');
    expect(mountPage).toHaveBeenCalled();
  });
});

describe('not-found entry', () => {
  it('adopts the document language when it is a shipped locale', async () => {
    document.documentElement.lang = 'en';
    await import('./not-found');
    const { getLocale } = await import('../i18n');
    expect(getLocale()).toBe('en');
    expect(mountPage).toHaveBeenCalledTimes(1);
  });

  it('falls back to English for an unknown document language', async () => {
    document.documentElement.lang = 'xx';
    await import('./not-found');
    const { getLocale } = await import('../i18n');
    expect(getLocale()).toBe('en');
    expect(mountPage).toHaveBeenCalled();
  });
});
