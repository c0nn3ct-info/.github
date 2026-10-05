import { describe, expect, it, vi } from 'vitest';
import { act } from '@testing-library/react';
import { render, screen, userEvent } from '../test/render';
import { fireResize } from '../test/setup';
import { Hero } from './hero';

describe('Hero', () => {
  it('states the positioning and one action, with nothing between them', () => {
    render(<Hero onPick={vi.fn()} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Powerful tools, made easy to live with',
    );
    // No eyebrow over the claim (owner-directed): the headline speaks first.
    expect(screen.queryByText('independent software studio')).toBeNull();
    // No lede either (owner-directed): the claim and the button carry it.
    expect(screen.queryByText(/capable under the hood/)).toBeNull();
    expect(screen.getByRole('link', { name: /See the products/ })).toHaveAttribute('href', '#work');
  });

  it('indexes both shipped products with their status', () => {
    render(<Hero onPick={vi.fn()} />);
    const index = screen.getByRole('complementary', { name: 'The products, in order' });
    expect(index).toBeInTheDocument();
    expect(screen.getByText('proxy client · out now')).toBeInTheDocument();
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
    expect(screen.getByText('Workshop')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Workshop/ })).toBeNull();
    expect(screen.getByText('listed when it is ready to ship')).toBeInTheDocument();
  });

  it('offers the address in the index as well', () => {
    render(<Hero onPick={vi.fn()} />);
    expect(screen.getByRole('link', { name: /hello@c0nn3ct\.info/ })).toHaveAttribute(
      'href',
      'mailto:hello@c0nn3ct.info?subject=Saying%20hello',
    );
  });

  // Pinned to the foot of the column it sat 450px below the rows at 1440x900;
  // it follows them, and the ground below is the column's own.
  it('sets the address straight under the rows', () => {
    render(<Hero onPick={vi.fn()} />);
    expect(screen.getByRole('link', { name: /hello@c0nn3ct\.info/ })).not.toHaveClass('mt-auto');
  });
});

describe('the ring text', () => {
  const SEP = '\u00a0/\u00a0';
  const FIVE =
    ['We put no advertising in our products', 'Our products work without an account',
      'We do not track how you use them', 'You can leave without losing your data',
      'You can verify each promise'].join(SEP) + SEP;

  function ring() {
    const { container } = render(<Hero onPick={vi.fn()} />);
    const svg = container.querySelector('.ring-text') as SVGSVGElement;
    return {
      svg,
      orbit: svg.querySelector('path') as SVGPathElement,
      run: svg.querySelector('textPath') as SVGTextPathElement & {
        getComputedTextLength?: () => number;
      },
    };
  }

  // Decoration that is never read twice: the belt keeps the five sentences for
  // the tree, and the ring repeats them for the eye and pauses with the loops.
  it('sets the five refusals along the ring, out of the tree, as one loop', () => {
    const { svg, run } = ring();
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('data-loop');
    expect(run).toHaveAttribute('href', '#ring-orbit');
    expect(run.textContent).toBe(FIVE);
    expect(svg.querySelectorAll('.sep')).toHaveLength(5);
    expect(
      screen.queryByText(/We put no advertising/, { ignore: '[aria-hidden="true"] *' }),
    ).toBeNull();
  });

  // jsdom has no layout, so the orbit is drawn only once the box has a width,
  // and the words are stretched around it in their spacing while they fit.
  it('draws the orbit from the box and stretches the words around it', () => {
    const { svg, orbit, run } = ring();
    expect(orbit).not.toHaveAttribute('d');
    Object.defineProperty(svg, 'clientWidth', { value: 680, configurable: true });
    run.getComputedTextLength = () => 1200;
    act(() => fireResize());
    expect(orbit.getAttribute('d')).toMatch(
      /^M 340 40\.8\d* a 299\.2\d* 299\.2\d* 0 1 1 0 598\.4\d* a 299\.2\d* 299\.2\d* 0 1 1 0 -598\.4\d*$/,
    );
    expect(Number(run.getAttribute('textLength'))).toBeCloseTo(2 * Math.PI * 299.2, 3);
    expect(run).toHaveAttribute('lengthAdjust', 'spacing');
    // Longer than the circle, which only a short window can produce: squeezed.
    run.getComputedTextLength = () => 3000;
    act(() => fireResize());
    expect(run).toHaveAttribute('lengthAdjust', 'spacingAndGlyphs');
  });

  it('leaves the words at their own length where the browser cannot measure them', () => {
    const { svg, orbit, run } = ring();
    Object.defineProperty(svg, 'clientWidth', { value: 500, configurable: true });
    act(() => fireResize());
    expect(orbit.getAttribute('d')).toMatch(/^M 250 30\d* a 220/);
    expect(run).not.toHaveAttribute('textLength');
  });

  // The mono face can land after the first fit, so the fit runs again once
  // the fonts are ready; a browser without document.fonts gets the one fit.
  it('fits again once the fonts have landed', async () => {
    Object.defineProperty(document, 'fonts', {
      value: { ready: Promise.resolve() },
      configurable: true,
    });
    try {
      const { svg, orbit } = ring();
      expect(orbit).not.toHaveAttribute('d');
      Object.defineProperty(svg, 'clientWidth', { value: 600, configurable: true });
      await act(async () => {
        await Promise.resolve();
      });
      expect(orbit.getAttribute('d')).toMatch(/^M 300 36\d* a 264/);
    } finally {
      delete (document as { fonts?: unknown }).fonts;
    }
  });
});
