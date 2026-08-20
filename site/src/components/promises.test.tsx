import { describe, expect, it } from 'vitest';
import { render, screen } from '../test/render';
import { Promises } from './promises';

describe('Promises', () => {
  it('heads the floor and says how many there are', () => {
    render(<Promises />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      "Promises wecan't take back",
    );
    expect(screen.getByText('The floor · four of them')).toBeInTheDocument();
  });

  it('sets out all four commitments, numbered', () => {
    render(<Promises />);
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(4);
    expect(screen.getByRole('heading', { name: "It's yours, and it stays yours" })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'We answer for our own mistakes' })).toBeInTheDocument();
    expect(items[3]).toHaveTextContent('04');
  });

  it('sends a reader who wants the reasoning to the contact section', () => {
    render(<Promises />);
    expect(screen.getByRole('link', { name: /Ask us why/ })).toHaveAttribute('href', '#contact');
  });
});
