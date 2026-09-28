import { describe, expect, it } from 'vitest';
import { render, screen } from '../test/render';
import { Talk } from './talk';

describe('Talk', () => {
  it('leads with the address itself', () => {
    render(<Talk />);
    expect(screen.getByRole('link', { name: 'hello@c0nn3ct.info' })).toHaveAttribute(
      'href',
      'mailto:hello@c0nn3ct.info?subject=Saying%20hello',
    );
  });

  it('offers three openers, each arriving with its own subject', () => {
    render(<Talk />);
    expect(screen.getByRole('link', { name: /I want to suggest an idea/ })).toHaveAttribute(
      'href',
      'mailto:hello@c0nn3ct.info?subject=An%20idea%20I%20want%20to%20suggest',
    );
    expect(screen.getByRole('link', { name: /I found something that needs work/ })).toHaveAttribute(
      'href',
      'mailto:hello@c0nn3ct.info?subject=Something%20that%20needs%20work',
    );
    expect(screen.getByRole('link', { name: /I want to help with one of these/ })).toHaveAttribute(
      'href',
      'mailto:hello@c0nn3ct.info?subject=I%20want%20to%20help%20with%20one%20of%20these',
    );
  });

  // Minimal (owner-directed): no eyebrow over the heading, no footnote under
  // the openers; the heading already says a person reads it.
  it('carries no eyebrow and no footnote', () => {
    render(<Talk />);
    expect(screen.queryByText('a person answers')).toBeNull();
    expect(screen.queryByText(/without a form or ticket number/)).toBeNull();
  });
});
