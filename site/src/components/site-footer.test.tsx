import { describe, expect, it } from 'vitest';
import { render, screen } from '../test/render';
import { SiteFooter } from './site-footer';

describe('SiteFooter', () => {
  it('states the byline and both ways to reach a person', () => {
    render(<SiteFooter />);
    expect(
      screen.getByText('Small, finished software with source available when it helps you verify our work.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'hello@c0nn3ct.info' })).toHaveAttribute(
      'href',
      'mailto:hello@c0nn3ct.info?subject=Saying%20hello',
    );
    expect(screen.getByRole('link', { name: /github\.com\/c0nn3ct-info/ })).toHaveAttribute(
      'href',
      'https://github.com/c0nn3ct-info',
    );
  });

  it('links both products at their own sites', () => {
    render(<SiteFooter />);
    expect(screen.getByRole('link', { name: 'Noctis' })).toHaveAttribute(
      'href',
      'https://noctis.c0nn3ct.info',
    );
    expect(screen.getByRole('link', { name: 'Aria2t' })).toHaveAttribute(
      'href',
      'https://aria2t.c0nn3ct.info',
    );
  });
});
