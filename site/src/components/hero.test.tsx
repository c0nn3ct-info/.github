import { describe, expect, it, vi } from 'vitest';
import { render, screen, userEvent } from '../test/render';
import { Hero } from './hero';

describe('Hero', () => {
  it('states the positioning, the lede and one action', () => {
    render(<Hero onPick={vi.fn()} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Small, finished software that answers to you',
    );
    expect(screen.getByText('on your side of the wire')).toBeInTheDocument();
    expect(
      screen.getByText('Capable software for people who should not have to study it first.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /See the work/ })).toHaveAttribute('href', '#work');
  });

  it('indexes both shipped products with their status', () => {
    render(<Hero onPick={vi.fn()} />);
    const index = screen.getByRole('complementary', { name: 'The products, in order' });
    expect(index).toBeInTheDocument();
    expect(screen.getByText('browser proxy · out now')).toBeInTheDocument();
    expect(screen.getByText('download manager · soon')).toBeInTheDocument();
  });

  it('hands the work section the product a reader picked from the index', async () => {
    const onPick = vi.fn();
    render(<Hero onPick={onPick} />);
    await userEvent.click(screen.getByRole('link', { name: /Noctis/ }));
    expect(onPick).toHaveBeenCalledWith('noctis');
    await userEvent.click(screen.getByRole('link', { name: /Aria2t/ }));
    expect(onPick).toHaveBeenCalledWith('aria2t');
  });

  it('lists the unbuilt third slot as a statement rather than a control', () => {
    render(<Hero onPick={vi.fn()} />);
    expect(screen.getByText('in the workshop')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /in the workshop/ })).toBeNull();
    expect(screen.getByText('listed when it is ready to ship')).toBeInTheDocument();
  });

  it('offers the address in the index as well', () => {
    render(<Hero onPick={vi.fn()} />);
    expect(screen.getByRole('link', { name: /hello@c0nn3ct\.info/ })).toHaveAttribute(
      'href',
      'mailto:hello@c0nn3ct.info?subject=Saying%20hello',
    );
  });
});
