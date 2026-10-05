import { describe, expect, it } from 'vitest';
import { render, screen } from '../test/render';
import { Promises } from './promises';

describe('Promises', () => {
  it('heads the floor with no eyebrow and no intro', () => {
    render(<Promises />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      "Promises wecan't take back",
    );
    expect(screen.queryByText('The floor · four of them')).toBeNull();
    expect(screen.queryByText(/hold us to these/)).toBeNull();
  });

  it('sets out all four commitments, numbered', () => {
    render(<Promises />);
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(4);
    expect(screen.getByRole('heading', { name: "It's yours, and it stays yours" })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'It keeps working if we stop' })).toBeInTheDocument();
    expect(items[3]).toHaveTextContent('04');
  });

  it('sends a reader who wants the reasoning to the contact section', () => {
    render(<Promises />);
    expect(screen.getByRole('link', { name: /Ask us why/ })).toHaveAttribute('href', '#contact');
  });

  // The stretched card's middle carries the habits card's ring, drawn still:
  // hidden from assistive tech and left out of the page's loops.
  it('fills the card with two still rings', () => {
    const { container } = render(<Promises />);
    const rings = container.querySelectorAll('.block-card .floor-ring');
    expect(rings).toHaveLength(2);
    for (const r of rings) {
      expect(r).toHaveAttribute('aria-hidden', 'true');
      expect(r).not.toHaveAttribute('data-loop');
    }
  });
});
