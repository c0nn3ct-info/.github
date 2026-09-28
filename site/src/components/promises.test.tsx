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
});
