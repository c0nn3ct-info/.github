import { describe, expect, it } from 'vitest';
import { act } from '@testing-library/react';
import { render, screen } from '../test/render';
import { setScrollY } from '../test/setup';
import { SiteHeader } from './site-header';

function scrollTo(y: number) {
  act(() => {
    setScrollY(y);
    window.dispatchEvent(new Event('scroll'));
  });
}

describe('SiteHeader', () => {
  it('carries the brand, the source and the way to write', () => {
    render(<SiteHeader home />);
    expect(screen.getByLabelText('c0nn3ct.info home')).toHaveAttribute('href', '/');
    expect(screen.getByLabelText('c0nn3ct.info on GitHub')).toHaveAttribute(
      'href',
      'https://github.com/c0nn3ct-info',
    );
    expect(screen.getByRole('link', { name: /Write to us/ })).toHaveAttribute(
      'href',
      'mailto:hello@c0nn3ct.info?subject=Saying%20hello',
    );
  });

  it('offers the section nav on the home page only', () => {
    const { unmount } = render(<SiteHeader home />);
    expect(screen.getByRole('link', { name: 'Work' })).toHaveAttribute('href', '#work');
    expect(screen.getByRole('link', { name: 'How we work' })).toHaveAttribute('href', '#how');
    expect(screen.getByRole('link', { name: 'Settled' })).toHaveAttribute('href', '#settled');
    unmount();

    render(<SiteHeader home={false} />);
    expect(screen.queryByRole('link', { name: 'Work' })).toBeNull();
  });

  it('takes the page colours once the hero has scrolled past', () => {
    render(<SiteHeader home />);
    const bar = screen.getByRole('banner');
    expect(bar).toHaveAttribute('data-ground', 'stage');
    scrollTo(900);
    expect(bar).toHaveAttribute('data-ground', 'page');
  });

  it('gets out of the way on the way down', () => {
    render(<SiteHeader home />);
    const bar = screen.getByRole('banner');
    expect(bar).toHaveAttribute('data-hidden', 'false');
    scrollTo(600);
    expect(bar).toHaveAttribute('data-hidden', 'true');
  });
});
