import { describe, expect, it } from 'vitest';
import { render, screen } from '../test/render';
import {
  fireRegion,
  observedTargets,
  setOnScreen,
  setPageHidden,
  setReducedMotion,
} from '../test/setup';
import { useIdleLoops } from './use-loops';

function Loops({ refresh, extra = false }: { refresh?: unknown; extra?: boolean }) {
  useIdleLoops(refresh);
  return (
    <div>
      <section>
        <span data-loop data-testid="ring" />
        {extra && <span data-loop data-testid="caret" />}
      </section>
      <span data-testid="still" />
    </div>
  );
}

/** A loop with no section around it, like the belt between two of them. */
function LooseLoop() {
  useIdleLoops();
  return <span data-loop data-testid="belt" />;
}

/** Both kinds at once, which is what the real page has. */
function MixedLoops() {
  useIdleLoops();
  return (
    <div>
      <section data-testid="sect">
        <span data-loop data-testid="ring" />
      </section>
      <span data-loop data-testid="belt" />
    </div>
  );
}

const state = (id: string) => (screen.getByTestId(id) as HTMLElement).style.animationPlayState;

describe('useIdleLoops', () => {
  // Four loops ran permanently on the built page, two of them already off
  // screen on a fresh load and all four still running with the hero a full
  // viewport away.
  it('pauses a loop once it leaves the screen and starts it again when it returns', () => {
    render(<Loops />);
    setOnScreen(true);
    expect(state('ring')).toBe('');
    setOnScreen(false);
    expect(state('ring')).toBe('paused');
    setOnScreen(true);
    expect(state('ring')).toBe('');
  });

  it('pauses everything while the tab is in the background', () => {
    render(<Loops />);
    setOnScreen(true);
    setPageHidden(true);
    expect(state('ring')).toBe('paused');
    setPageHidden(false);
    expect(state('ring')).toBe('');
  });

  // A loop that has never been reported on screen is left alone rather than
  // paused, so nothing is frozen in the frame before the observer first runs.
  it('leaves a loop running until the observer has said otherwise', () => {
    render(<Loops />);
    expect(state('ring')).toBe('');
  });

  it('touches only the elements that carry a loop', () => {
    render(<Loops />);
    setOnScreen(false);
    expect(state('still')).toBe('');
  });

  // The workshop pane brings a scan band and a caret with it, so the set has to
  // be gathered again when the open product changes.
  it('picks up loops that appear later, when refresh changes', () => {
    const { rerender } = render(<Loops refresh="noctis" />);
    rerender(<Loops refresh="next" extra />);
    setOnScreen(false);
    expect(state('caret')).toBe('paused');
    expect(state('ring')).toBe('paused');
  });

  it('does nothing at all when the reader asked for reduced motion', () => {
    setReducedMotion(true);
    render(<Loops />);
    setOnScreen(false);
    expect(state('ring')).toBe('');
  });

  // Nothing marked means nothing to observe, and the hook has to leave without
  // installing a listener it would then have to clean up.
  it('survives a page with no loops on it', () => {
    const bare = render(<BareLoops />);
    expect(bare.container.querySelectorAll('[data-loop]')).toHaveLength(0);
    expect(() => setPageHidden(true)).not.toThrow();
  });

  // The dot on the hero wire rests off the left edge, because that is where it
  // enters from. Observing the dot itself paused it there for good, so what is
  // watched is the section it belongs to.
  it('watches the section a loop sits in, not the moving part', () => {
    const { container } = render(<Loops />);
    const section = container.querySelector('section')!;
    const io = observedTargets();
    expect(io).toContain(section);
    expect(io).not.toContain(screen.getByTestId('ring'));
  });

  it('falls back to the element itself when nothing encloses it', () => {
    render(<LooseLoop />);
    expect(observedTargets()).toContain(screen.getByTestId('belt'));
    setOnScreen(false);
    expect((screen.getByTestId('belt') as HTMLElement).style.animationPlayState).toBe('paused');
  });

  // Two regions means each entry has to reach only its own loops: the belt
  // sitting between two sections must not be paused by a section leaving.
  it('keeps regions apart when a page has both kinds', () => {
    const { container } = render(<MixedLoops />);
    const section = container.querySelector('section')!;
    const belt = screen.getByTestId('belt');
    expect(observedTargets()).toEqual(expect.arrayContaining([section, belt]));

    fireRegion(section, false);
    expect(state('ring')).toBe('paused');
    expect(state('belt')).toBe('');

    fireRegion(belt, false);
    expect(state('belt')).toBe('paused');
    fireRegion(section, true);
    expect(state('ring')).toBe('');
    expect(state('belt')).toBe('paused');
  });

  it('hands the loops back when it unmounts', () => {
    const { unmount } = render(<Loops />);
    setOnScreen(false);
    expect(state('ring')).toBe('paused');
    const el = screen.getByTestId('ring');
    unmount();
    expect(el.style.animationPlayState).toBe('');
  });
});

function BareLoops() {
  useIdleLoops();
  return <span data-testid="nothing" />;
}
