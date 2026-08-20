import { afterEach, describe, expect, it } from 'vitest';
import { render, screen, userEvent } from '../test/render';
import { setLocale } from '../i18n';
import { LanguageSwitcher, pairPath } from './language-switcher';

afterEach(() => setLocale('en'));

function at(path: string) {
  window.history.replaceState({}, '', path);
}

describe('pairPath', () => {
  it('swaps one locale prefix for another and keeps the place', () => {
    expect(pairPath('/', 'ru')).toBe('/ru/');
    expect(pairPath('/ru/', 'es')).toBe('/es/');
    expect(pairPath('/zh-CN/404.html', 'en')).toBe('/404.html');
    expect(pairPath('/404.html', 'ar')).toBe('/ar/404.html');
  });
});

describe('LanguageSwitcher', () => {
  it('opens and closes the menu from its own button', async () => {
    render(<LanguageSwitcher />);
    const button = screen.getByRole('button', { name: 'Language' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('menu')).toBeNull();
    await userEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('menu')).toBeInTheDocument();
    await userEvent.click(button);
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('offers every language, each naming itself and linking to its own path', async () => {
    at('/');
    render(<LanguageSwitcher />);
    await userEvent.click(screen.getByRole('button', { name: 'Language' }));
    const items = screen.getAllByRole('menuitem');
    expect(items.map((a) => a.textContent)).toEqual([
      'English',
      'Русский',
      'Español',
      '中文',
      'فارسی',
      'العربية',
    ]);
    expect(items.map((a) => a.getAttribute('href'))).toEqual([
      '/',
      '/ru/',
      '/es/',
      '/zh-CN/',
      '/fa/',
      '/ar/',
    ]);
  });

  it('marks the language being read', async () => {
    setLocale('fa');
    at('/fa/');
    render(<LanguageSwitcher />);
    await userEvent.click(screen.getByRole('button', { name: 'زبان' }));
    const current = screen.getAllByRole('menuitem').filter((a) => a.getAttribute('aria-current'));
    expect(current.map((a) => a.textContent)).toEqual(['فارسی']);
  });

  it('closes on a click elsewhere but not on a click inside it', async () => {
    render(
      <div>
        <LanguageSwitcher />
        <button type="button">outside</button>
      </div>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Language' }));
    await userEvent.click(screen.getByRole('menu'));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'outside' }));
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('closes on Escape, and stays open for any other key', async () => {
    render(<LanguageSwitcher />);
    await userEvent.click(screen.getByRole('button', { name: 'Language' }));
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('menu')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).toBeNull();
  });
});
