import { describe, expect, it } from 'vitest';
import { render, screen } from '../test/render';
import { WireStrip } from './wire-strip';

describe('WireStrip', () => {
  it('names the group and both sides of the wire', () => {
    render(<WireStrip />);
    expect(screen.getByRole('group', { name: 'Where our work lives' })).toBeInTheDocument();
    expect(screen.getByText('Your machine')).toBeInTheDocument();
    expect(screen.getByText('The tools we make')).toBeInTheDocument();
    expect(screen.getByText('The rest of the wire')).toBeInTheDocument();
    expect(screen.getByText('Everything else')).toBeInTheDocument();
  });

  it('labels the crossing with the only-what-you-send pill', () => {
    render(<WireStrip />);
    expect(screen.getByText('only what you send')).toBeInTheDocument();
  });
});
