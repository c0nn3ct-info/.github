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
    expect(screen.getByText('a person answers')).toBeInTheDocument();
  });

  it('offers three openers, each arriving with its own subject', () => {
    render(<Talk />);
    expect(screen.getByRole('link', { name: /I want to suggest an idea/ })).toHaveAttribute(
      'href',
      'mailto:hello@c0nn3ct.info?subject=An%20idea%20I%20want%20to%20suggest',
    );
    expect(screen.getByRole('link', { name: /A rough edge you could smooth/ })).toHaveAttribute(
      'href',
      'mailto:hello@c0nn3ct.info?subject=A%20rough%20edge',
    );
    expect(screen.getByRole('link', { name: /I want to help with one of these/ })).toHaveAttribute(
      'href',
      'mailto:hello@c0nn3ct.info?subject=I%20want%20to%20help%20with%20one%20of%20these',
    );
  });

  it('says plainly that there is no form behind it', () => {
    render(<Talk />);
    expect(
      screen.getByText('No form, no ticket number — it lands in a real inbox'),
    ).toBeInTheDocument();
  });
});
