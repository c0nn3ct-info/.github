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
  // A disclosure, not a menu: role="menu" promised arrow keys and focus moving
  // into it, and neither happened. The links are plain links Tab reaches.
  it('opens and closes the list from its own button', async () => {
    render(<LanguageSwitcher />);
    const button = screen.getByRole('button', { name: 'Language' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).not.toHaveAttribute('aria-haspopup');
    expect(screen.queryByRole('list')).toBeNull();
    await userEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-controls', screen.getByRole('list').id);
    await userEvent.click(button);
    expect(screen.queryByRole('list')).toBeNull();
  });

  it('offers every language, each naming itself and linking to its own path', async () => {
    at('/');
    render(<LanguageSwitcher />);
    await userEvent.click(screen.getByRole('button', { name: 'Language' }));
    const items = screen.getAllByRole('link');
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
    const current = screen.getAllByRole('link').filter((a) => a.getAttribute('aria-current'));
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
    await userEvent.click(screen.getByRole('list'));
    expect(screen.getByRole('list')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'outside' }));
    expect(screen.queryByRole('list')).toBeNull();
  });

  it('closes on Escape, and stays open for any other key', async () => {
    render(<LanguageSwitcher />);
    await userEvent.click(screen.getByRole('button', { name: 'Language' }));
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('list')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('list')).toBeNull();
  });

  it('gives focus back to its button on Escape', async () => {
    render(<LanguageSwitcher />);
    const trigger = screen.getByRole('button', { name: 'Language' });
    await userEvent.click(trigger);
    await userEvent.tab();
    expect(screen.getAllByRole('link')[0]).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    expect(trigger).toHaveFocus();
  });

  it('closes when the keyboard tabs out past it, and not while it moves inside', async () => {
    render(
      <div>
        <LanguageSwitcher />
        <button type="button">after</button>
      </div>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Language' }));
    await userEvent.tab();
    expect(screen.getByRole('list')).toBeInTheDocument();
    screen.getAllByRole('link')[5].focus();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'after' })).toHaveFocus();
    expect(screen.queryByRole('list')).toBeNull();
  });

  it('stays open when focus leaves for nowhere, as a click on blank page does', async () => {
    render(<LanguageSwitcher />);
    await userEvent.click(screen.getByRole('button', { name: 'Language' }));
    screen.getByRole('button', { name: 'Language' }).blur();
    expect(screen.getByRole('list')).toBeInTheDocument();
  });
});
