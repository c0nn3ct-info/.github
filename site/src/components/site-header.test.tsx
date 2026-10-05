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
  // No GitHub in the bar (owner-directed 2026-10-05): the repository link sits
  // in each product's pane and in the footer, and the bar was seven targets.
  it('carries the brand and the way to write, and leaves the source to the page', () => {
    render(<SiteHeader home />);
    expect(screen.getByLabelText('c0nn3ct.info home')).toHaveAttribute('href', '/');
    expect(screen.queryByRole('link', { name: /GitHub/ })).toBeNull();
    expect(screen.getByRole('link', { name: /Write to us/ })).toHaveAttribute(
      'href',
      'mailto:hello@c0nn3ct.info?subject=Saying%20hello',
    );
  });

  it('lets a keyboard skip straight to the page', () => {
    render(<SiteHeader home />);
    const skip = screen.getByRole('link', { name: 'Skip to content' });
    expect(skip).toHaveAttribute('href', '#main');
    expect(screen.getByRole('banner').querySelector('a')).toBe(skip);
  });

  it('keeps its name when the call to action is only an icon', () => {
    render(<SiteHeader home />);
    // Below 900px the label goes and the envelope stays, so the bar holds one
    // row at 320px; the link keeps the words as its accessible name.
    const cta = screen.getByRole('link', { name: 'Write to us' });
    expect(cta).toHaveAttribute('aria-label', 'Write to us');
    expect(cta.querySelector('.header-cta-icon')).not.toBeNull();
    expect(cta.querySelector('.header-cta-label')).toHaveTextContent('Write to us');
  });

  it('offers the section nav on the home page only', () => {
    const { unmount } = render(<SiteHeader home />);
    expect(screen.getByRole('link', { name: 'Products' })).toHaveAttribute('href', '#work');
    expect(screen.getByRole('link', { name: 'Principles' })).toHaveAttribute('href', '#how');
    expect(screen.getByRole('link', { name: 'Promises' })).toHaveAttribute('href', '#settled');
    unmount();

    render(<SiteHeader home={false} />);
    expect(screen.queryByRole('link', { name: 'Products' })).toBeNull();
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
