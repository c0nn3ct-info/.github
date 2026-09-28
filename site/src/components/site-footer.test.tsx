import { afterEach, describe, expect, it } from 'vitest';
import { render, screen, within } from '../test/render';
import { setLocale } from '../i18n';
import { SiteFooter } from './site-footer';

afterEach(() => setLocale('en'));

describe('SiteFooter', () => {
  // The same shape both products close on: the mark and one line about the
  // work, a column per kind of link, and the languages as plain links under a
  // rule, so a crawler finds every locale without opening a menu.
  it('opens on the mark and a line about the work', () => {
    render(<SiteFooter />);
    const footer = screen.getByRole('contentinfo');
    expect(within(footer).getByRole('link', { name: 'c0nn3ct.info' })).toHaveAttribute('href', '/');
    expect(
      within(footer).getByText('Software you can rely on every day.'),
    ).toBeInTheDocument();
    expect(within(footer).queryByText(/Amplitude/)).toBeNull();
    expect(within(footer).queryByText(/publish source/)).toBeNull();
  });

  it('links both products at their own sites', () => {
    render(<SiteFooter />);
    const products = screen.getByRole('navigation', { name: 'Products' });
    expect(within(products).getByRole('link', { name: 'Noctis' })).toHaveAttribute(
      'href',
      'https://noctis.c0nn3ct.info',
    );
    expect(within(products).getByRole('link', { name: 'Aria2t' })).toHaveAttribute(
      'href',
      'https://aria2t.c0nn3ct.info',
    );
  });

  it('offers both ways to reach a person', () => {
    render(<SiteFooter />);
    const contacts = screen.getByRole('navigation', { name: 'Contacts' });
    expect(within(contacts).getByRole('link', { name: 'GitHub' })).toHaveAttribute(
      'href',
      'https://github.com/c0nn3ct-info',
    );
    expect(within(contacts).getByRole('link', { name: 'hello@c0nn3ct.info' })).toHaveAttribute(
      'href',
      'mailto:hello@c0nn3ct.info?subject=Saying%20hello',
    );
  });

  it('lists every language as a link to this page in it, marking the current one', () => {
    setLocale('ru');
    render(<SiteFooter />);
    const langs = within(screen.getByRole('navigation', { name: 'Языки' })).getAllByRole('link');
    expect(langs.map((a) => a.textContent)).toEqual(['English', 'Русский', 'Español', '中文', 'فارسی', 'العربية']);
    expect(langs.map((a) => a.getAttribute('hreflang'))).toEqual(['en', 'ru', 'es', 'zh-CN', 'fa', 'ar']);
    expect(langs.filter((a) => a.getAttribute('aria-current') === 'true').map((a) => a.textContent)).toEqual([
      'Русский',
    ]);
  });
});
