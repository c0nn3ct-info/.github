import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { act, render, screen, userEvent } from '../test/render';
import { scrolls, setOnScreen, setReducedMotion } from '../test/setup';
import { ShotTrack, type Shot } from './shot-track';

const SHOTS: Shot[] = [
  { light: '/a-light.webp', dark: '/a-dark.webp', alt: 'first' },
  { light: '/b-light.webp', dark: '/b-dark.webp', alt: 'second' },
];

describe('ShotTrack', () => {
  // `at` is a prop, so a caller can name a capture that is not there: an index
  // carried over from a set that has since changed length, or the -1 an
  // unsuccessful lookup returns. It shows the first capture rather than
  // throwing out of a layout effect, which would take the whole dialog with it.
  it('shows the first capture when asked for one that is not there', () => {
    render(<ShotTrack shots={SHOTS} at={SHOTS.length} label="Screens" />);
    const track = screen.getByRole('group', { name: 'Screens' });
    expect(track.scrollLeft).toBe(0);
    expect(track.querySelector('img')).toHaveAttribute('src', '/a-light.webp');
  });

  // Both themes ship, because the capture is of a themed interface and the
  // wrong one beside the page's own ground reads as a different product.
  it('offers the dark capture to a dark reader', () => {
    render(<ShotTrack shots={SHOTS} label="Screens" />);
    const source = document.querySelector('picture source');
    expect(source).toHaveAttribute('media', '(prefers-color-scheme: dark)');
    expect(source).toHaveAttribute('srcset', '/a-dark.webp');
  });

  // One capture per press, measured against the scrollport rather than against a
  // slide, since the two are the same width by construction and only one of them
  // is a number the browser will hand back.
  it('steps one capture the way the chevron points', async () => {
    render(<ShotTrack shots={SHOTS} label="Screens" />);
    const track = screen.getByRole('group', { name: 'Screens' });
    Object.defineProperty(track, 'clientWidth', { value: 640, configurable: true });
    await userEvent.click(screen.getByRole('button', { name: 'Next screen' }));
    await userEvent.click(screen.getByRole('button', { name: 'Previous screen' }));
    expect(scrolls.map((s) => s.options)).toEqual([
      { left: 640, behavior: 'smooth' },
      { left: -640, behavior: 'smooth' },
    ]);
    expect(scrolls[0].target).toBe(track);
  });

  // The step itself is the point, so it still happens under the preference; what
  // goes is the travel a reader did not ask to watch.
  it('arrives without the travel for a reader who asked for less motion', async () => {
    setReducedMotion(true);
    render(<ShotTrack shots={SHOTS} label="Screens" />);
    await userEvent.click(screen.getByRole('button', { name: 'Next screen' }));
    expect(scrolls[0].options.behavior).toBe('auto');
  });
});

describe('the loop', () => {
  const flat = readFileSync('src/styles/globals.css', 'utf8').replace(/\s/g, '');

  // The track carries one slide more than it has captures, and the extra one is
  // the first capture again, so closing the loop is a step forward onto the same
  // pixels rather than a rewind across the whole track.
  it('keeps a copy of the first capture at the end of a looping track', () => {
    render(<ShotTrack shots={SHOTS} label="Screens" auto />);
    const track = screen.getByRole('group', { name: 'Screens' });
    expect(track.children).toHaveLength(SHOTS.length + 1);
    const copy = track.lastElementChild!;
    expect(copy).toHaveAttribute('aria-hidden', 'true');
    expect(copy.querySelector('img')).toHaveAttribute('src', SHOTS[0].light);
    // Not a zoom target and not a capture anything reads out: the set has the
    // number of captures it has.
    expect(copy.tagName).toBe('DIV');
    // The captures a reader can open are the real ones.
    expect(document.querySelectorAll('.shot-slide img')).toHaveLength(SHOTS.length + 1);
    expect(document.querySelectorAll('button.shot-slide')).toHaveLength(0);
  });

  it('carries no copy where nothing turns over on its own', () => {
    render(<ShotTrack shots={SHOTS} label="Screens" />);
    expect(screen.getByRole('group', { name: 'Screens' }).children).toHaveLength(SHOTS.length);
  });

  it('leaves a single capture alone', () => {
    render(<ShotTrack shots={[SHOTS[0]]} label="Screens" auto />);
    expect(screen.getByRole('group', { name: 'Screens' }).children).toHaveLength(1);
  });

  // The mark has to finish its travel on the last real capture rather than on
  // the copy, so the row and the track are counted separately.
  it('counts the marks and the steps apart', () => {
    render(<ShotTrack shots={SHOTS} label="Screens" auto />);
    const frame = screen.getByRole('group', { name: 'Screens' }).parentElement;
    expect(frame).toHaveStyle({ '--shots': String(SHOTS.length), '--shot-steps': String(SHOTS.length) });
    expect(flat).toContain(
      'animation-range:normalcalc(100%*(var(--shots)-1)/var(--shot-steps));',
    );
  });
});

describe('the readout under autoplay', () => {
  // The fill is the browser's animation and the only way to start one again is a
  // new element, so a dwell the reader restarted has to take the mark with it.
  it('replaces the travelling mark when the dwell starts again', () => {
    render(<ShotTrack shots={SHOTS} label="Screens" auto />);
    const frame = document.querySelector('.shot-frame') as HTMLElement;
    act(() => setOnScreen(true));
    const first = document.querySelector('.shot-at');
    expect(document.querySelector('.shot-progress')).toHaveAttribute('data-playing');
    act(() => void frame.dispatchEvent(new Event('pointerdown')));
    expect(document.querySelector('.shot-at')).not.toBe(first);
  });

  it('leaves the mark alone where nothing is turning over', () => {
    render(<ShotTrack shots={SHOTS} label="Screens" />);
    expect(document.querySelector('.shot-progress')).not.toHaveAttribute('data-playing');
  });
});

describe('the carousel in motion', () => {
  const flat = readFileSync('src/styles/globals.css', 'utf8').replace(/\s/g, '');

  // The capture that fills the frame is the settled one and the ones beside it
  // sit back, which is the carousel saying where the reader is. Position drives
  // it, not a clock: a timeline started by a gesture disagrees with the finger
  // still moving it.
  it('takes its progress from the scroller', () => {
    expect(flat).toContain('.shot-slide{animation:shot-settlelinearboth;animation-timeline:view(inline);}');
  });

  it('is gated on the preference outside the capability', () => {
    const gate = flat.indexOf('@media(prefers-reduced-motion:no-preference){@supports(animation-timeline:view()){.shot-slide{animation:shot-settle');
    expect(gate).toBeGreaterThan(-1);
  });

  // Scale alone. Dimming the slide worked against the one thing the pane is
  // for: two dark captures at 0.7 over a #08080a stage spend the screenshot's
  // contrast on the transition between them.
  it('recedes without fading the capture', () => {
    const frames = flat.slice(flat.indexOf('@keyframesshot-settle'));
    const body = frames.slice(0, frames.indexOf('}}') + 2);
    expect(body).toContain('transform:scale(0.9)');
    expect(body).not.toContain('opacity');
  });

  // A flick otherwise carries the scroller past two captures and a reader who
  // wanted the next one has to come back for it.
  it('lands on one capture per gesture', () => {
    expect(flat).toContain('scroll-snap-stop:always;');
  });

  // Both chevrons were hit targets the whole time, so the one at the end of the
  // track answered a click with nothing. The scroll position decides it, which
  // is why there is no state here to disagree with where the track actually is.
  it('takes away the chevron with nowhere to go', () => {
    expect(flat).toContain('.shot-nav-prev{animation-name:shot-edge-start;}');
    expect(flat).toContain('.shot-nav-next{animation-name:shot-edge-end;}');
    // Two keyframes at the same end, because visibility resolves to visible
    // across any interval with one visible endpoint.
    expect(flat).toContain('@keyframesshot-edge-start{0%,0.4%{visibility:hidden;}');
  });

  // It was a 2px rule from edge to edge of the pane: larger than a readout needs
  // to be, and in the light theme white on a near-white capture, which said
  // nothing at all. One mark per capture now, spaced apart so the count reads,
  // centred logically so nothing here has to know which way the page reads.
  it('reads position from spaced marks rather than a full-width rule', () => {
    const bar = flat.slice(flat.indexOf('.shot-progress{'));
    const body = bar.slice(0, bar.indexOf('}') + 1);
    expect(body).toContain('--shot-gap:4px;');
    expect(body).toContain('gap:var(--shot-gap);');
    expect(body).toContain('width:clamp(48px,16%,80px);');
    expect(body).toContain('margin-inline:auto;');
    expect(flat).toContain('.shot-seg{flex:1;height:4px;border-radius:999px;');
  });

  it('gives each capture a mark of its own', () => {
    render(<ShotTrack shots={SHOTS} label="Screens" />);
    expect(document.querySelectorAll('.shot-seg')).toHaveLength(SHOTS.length);
    expect(document.querySelectorAll('.shot-at')).toHaveLength(1);
  });

  // One mark plus one gap per step, because the marks no longer touch.
  it('steps the travelling mark by a mark and a gap', () => {
    expect(flat).toContain(
      'translateX(calc((100%+var(--shot-gap))*(var(--shots)-1)*var(--scrub,1)))',
    );
    expect(flat).toContain("[dir='rtl'].shot-progress{--scrub:-1;}");
  });

  // The pill sits on the capture, not on the page, so it takes the capture's
  // own theme: the picture element serves a light capture to a light reader, and
  // a white mark on that read as a hole rather than as the marker.
  it('takes its colour from the theme the capture is in', () => {
    expect(flat).toContain('background:var(--shot-bar);');
    expect(flat).toContain('background:var(--shot-bar-ink);');
  });

  // Turning over on its own, the current mark fills over exactly one dwell, so
  // the change is something a reader saw coming. The moment they take the
  // carousel over the fill goes and the mark is simply the bright one.
  it('fills the current mark only while the captures turn themselves over', () => {
    expect(flat).toContain(
      ".shot-progress[data-playing].shot-at::after{content:'';position:absolute;",
    );
    expect(flat).toContain('animation:shot-dwellvar(--shot-dwell)linearinfinite;');
    expect(flat).toContain('@keyframesshot-dwell{from{transform:scaleX(0);}to{transform:scaleX(1);}}');
    // Held back by colour rather than by opacity: a group's own opacity is the
    // ceiling for everything inside it, so the fill could never come up bright.
    expect(flat).toContain('.shot-progress[data-playing].shot-at{');
    expect(flat).toContain('background:color-mix(inoklab,var(--shot-bar-ink)42%,transparent);');
  });

  // One number for the fill and for the timer that moves the captures.
  it('keeps the dwell in one place', () => {
    expect(flat).toContain('--shot-dwell:5000ms;');
    expect(flat.match(/--shot-dwell:/g)).toHaveLength(1);
  });

  // An image is a drag source by default, and a press that slid a few pixels
  // dragged the screenshot instead of clicking it: measured, a clean click
  // closed the dialog and the same click with 6px of travel did nothing.
  it('does not let a capture be dragged out of the page', () => {
    render(<ShotTrack shots={SHOTS} label="Screens" />);
    expect(document.querySelector('img')).toHaveAttribute('draggable', 'false');
    expect(flat).toContain('-webkit-user-drag:none;');
  });

  // A hover zoom on a screenshot reads as the content creeping sideways, which
  // is what it was: measured, the capture's left edge moved 6.4px and its width
  // grew 13px over 700ms, inside a frame that clipped the difference.
  it('holds the capture still under the pointer', () => {
    expect(flat).not.toContain('.pane-shot:hoverimg');
  });

  // The press is the only thing here that moves, so it is the only thing behind
  // the preference; the darkening on hover answers a reduced-motion reader.
  it('answers a press without asking the preference for permission to darken', () => {
    expect(flat).toContain('.shot-nav:hover{background:rgb(131315/0.86)');
    expect(flat).toContain(
      '@media(prefers-reduced-motion:no-preference){.shot-nav:active{transform:translateY(-50%)scale(0.92);}}',
    );
  });
});

describe('the carousel controls in a dialog', () => {
  const CSS = readFileSync('src/styles/globals.css', 'utf8');
  const flat = CSS.replace(/\s/g, '');

  // In the pane the chevrons appear on approach, because the capture is worth
  // more than the controls over it. In the dialog that rule would leave a
  // control the keyboard can focus and nobody can see, and the surface they sit
  // on closes on a click, so they have to read as the exception to it.
  it('stays visible rather than waiting to be approached', () => {
    expect(flat).toMatch(/\.lightbox\.shot-nav\{[^}]*opacity:1;\}/);
  });

  // A chevron that reads right over a full-width capture covers a quarter of a
  // narrow one, so it is sized against the frame rather than against the
  // window, which is whichever axis ran out first.
  it('is sized against the capture rather than the window', () => {
    expect(flat).toMatch(/\.lightbox\.shot-frame\{[^}]*container-type:inline-size;/);
    expect(flat).toContain('width:clamp(32px,3.2cqi,40px);');
  });

  // The reveal it is overriding is scoped to the pane, which is what made the
  // dialog's pair invisible in the first place.
  it('leaves the pane to reveal its own on approach', () => {
    expect(flat).toContain(
      '.pane-shot:hover.shot-nav,.pane-shot:focus-within.shot-nav{opacity:1;}',
    );
  });
});
