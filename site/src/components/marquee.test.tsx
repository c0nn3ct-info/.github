import { describe, expect, it } from 'vitest';
import { render, screen } from '../test/render';
import { Marquee } from './marquee';

describe('Marquee', () => {
  it('reads out the five habits exactly once to a screen reader', () => {
    render(<Marquee />);
    const belt = screen.getByRole('group', { name: 'How we work, in one line' });
    expect(belt).toBeInTheDocument();
    // The duplicate run is the loop's seam, so it is hidden from the tree.
    const spoken = screen.getAllByText('Nothing here is built to be hard to leave', {
      ignore: '[aria-hidden="true"], [aria-hidden="true"] *',
    });
    expect(spoken).toHaveLength(1);
  });

  it('repeats the run once in the DOM so the loop has no gap', () => {
    const { container } = render(<Marquee />);
    const runs = container.querySelectorAll('.marquee-run');
    expect(runs).toHaveLength(2);
    expect(runs[1]).toHaveAttribute('aria-hidden', 'true');
  });
});
