import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, userEvent } from '../test/render';
import { animations, fireResize, setReducedMotion } from '../test/setup';
import { Work, type Project } from './work';

/** The page owns the choice, so the harness does too. */
function Harness({ start = 'noctis' as Project }) {
  const [project, setProject] = useState<Project>(start);
  return <Work project={project} onPick={setProject} />;
}

describe('Work rail', () => {
  it('offers the three slots as a tablist, opening on noctis', () => {
    render(<Harness />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs.map((b) => b.textContent)).toEqual([
      '01noctisbrowser proxy',
      '02aria2tdownload manager',
      '03the workshopwhat comes next',
    ]);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('swaps the panel on a click', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('tab', { name: /aria2t/ }));
    expect(screen.getByRole('tabpanel')).toHaveAttribute('id', 'aria2t');
    expect(
      screen.getByText('Twelve downloads on one screen, no window management.', { exact: false }),
    ).toBeInTheDocument();
  });

  it('walks the rail with the arrow keys and wraps round', async () => {
    render(<Harness />);
    screen.getAllByRole('tab')[0].focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('tabpanel')).toHaveAttribute('id', 'aria2t');
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('tabpanel')).toHaveAttribute('id', 'next');
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('tabpanel')).toHaveAttribute('id', 'noctis');
    await userEvent.keyboard('{ArrowUp}');
    expect(screen.getByRole('tabpanel')).toHaveAttribute('id', 'next');
  });

  it('leaves other keys to the browser', async () => {
    render(<Harness />);
    screen.getAllByRole('tab')[0].focus();
    await userEvent.keyboard('{End}');
    expect(screen.getByRole('tabpanel')).toHaveAttribute('id', 'noctis');
  });
});

describe('Work rail marker', () => {
  /** jsdom has no layout, so the rows are given boxes to be measured from. */
  function measure(container: HTMLElement, height = 78) {
    container.querySelectorAll<HTMLElement>('[role="tab"]').forEach((row, i) => {
      Object.defineProperty(row, 'offsetTop', {
        value: i * height,
        configurable: true,
      });
      Object.defineProperty(row, 'offsetHeight', {
        value: height,
        configurable: true,
      });
    });
  }
  const mark = (container: HTMLElement) => {
    const list = container.querySelector<HTMLElement>('.rail-list')!;
    return [list.style.getPropertyValue('--mark-y'), list.style.getPropertyValue('--mark-h')];
  };

  // The marker used to be a ::before on whichever row was selected, destroyed
  // on one row and created on another, so the selection teleported.
  it('travels to the row that is open', async () => {
    const { container } = render(<Harness />);
    measure(container);
    fireResize();
    expect(mark(container)).toEqual(['0px', '78']);
    await userEvent.click(screen.getByRole('tab', { name: /the workshop/ }));
    expect(mark(container)).toEqual(['156px', '78']);
  });

  // A row wraps its name at a narrow width, and the marker has to match its
  // length without waiting for the next selection.
  it('follows a row that changes height under it', () => {
    const { container } = render(<Harness />);
    measure(container, 78);
    fireResize();
    expect(mark(container)).toEqual(['0px', '78']);
    measure(container, 104);
    fireResize();
    expect(mark(container)).toEqual(['0px', '104']);
  });

  it('stays put when there is no open row to measure', () => {
    const { container } = render(<Harness />);
    const list = container.querySelector<HTMLElement>('.rail-list')!;
    list.querySelectorAll('[role="tab"]').forEach((r) => r.setAttribute('aria-selected', 'false'));
    expect(() => fireResize()).not.toThrow();
    expect(mark(container)).toEqual(['0px', '0']);
  });
});

describe('Work carousel', () => {
  const track = () => screen.getByRole('group', { name: 'Screens' });
  const shots = () => screen.getAllByRole('img').map((i) => i.getAttribute('src'));
  /** jsdom has no layout and no scrolling, so the track is given both. */
  function scrollable(width = 900) {
    const el = track();
    Object.defineProperty(el, 'clientWidth', { value: width, configurable: true });
    const by = vi.fn();
    el.scrollBy = by;
    return by;
  }

  // Every capture is in the document at once. There is no index, so nothing can
  // disagree about which one is showing.
  it('holds every screen the product has, each its own zoom target', () => {
    render(<Harness />);
    expect(shots()).toEqual([
      '/media/noctis-home-light.webp',
      '/media/noctis-servers-light.webp',
      '/media/noctis-routing-light.webp',
    ]);
    expect(screen.getAllByRole('button', { name: /Open the screenshot full size/ })).toHaveLength(
      3,
    );
  });

  // A scrolling region has to be reachable and named, or a keyboard reader
  // cannot get to what is inside it.
  it('is a named region the keyboard can enter', () => {
    render(<Harness />);
    expect(track()).toHaveAttribute('tabindex', '0');
    expect(track()).toHaveAccessibleName('Screens');
  });

  it('steps one capture at a time, in both directions', async () => {
    render(<Harness />);
    const by = scrollable();
    await userEvent.click(screen.getByRole('button', { name: 'Next screen' }));
    expect(by).toHaveBeenLastCalledWith({ left: 900, behavior: 'smooth' });
    await userEvent.click(screen.getByRole('button', { name: 'Previous screen' }));
    expect(by).toHaveBeenLastCalledWith({ left: -900, behavior: 'smooth' });
  });

  it('jumps rather than glides when the reader asked for reduced motion', async () => {
    setReducedMotion(true);
    render(<Harness />);
    const by = scrollable();
    await userEvent.click(screen.getByRole('button', { name: 'Next screen' }));
    expect(by).toHaveBeenLastCalledWith({ left: 900, behavior: 'auto' });
  });

  it('opens the capture that was clicked, not whichever one is current', async () => {
    render(<Harness />);
    await userEvent.click(screen.getAllByRole('button', { name: /Open the screenshot/ })[2]);
    expect(screen.getByRole('dialog')).toHaveAccessibleName('noctis · Routing');
  });

  it('tells the hairline how many there are', () => {
    render(<Harness />);
    expect(track().parentElement).toHaveStyle({ '--shots': '3' });
  });

  // The workshop has nothing to capture, so it has no track either.
  it('is absent from a pane with no captures', () => {
    render(<Harness start="next" />);
    expect(screen.queryByRole('group', { name: 'Screens' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Next screen' })).toBeNull();
  });
});

describe('Work swap', () => {
  /** The translateY the pane entered from, or null if it did not animate. */
  const entry = () => {
    const a = animations.at(-1);
    return a ? String(a.keyframes[0].transform) : null;
  };

  // Choosing a product replaced the whole pane with no acknowledgement at all:
  // a different capture, name, sentence and set of facts simply appeared.
  it('acknowledges a swap, entering from the direction the rail moved', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('tab', { name: /aria2t/ }));
    expect(entry()).toBe('translateY(10px)');
    await userEvent.click(screen.getByRole('tab', { name: /noctis/ }));
    expect(entry()).toBe('translateY(-10px)');
  });

  // The animation rides a stable wrapper instead of a remounted pane. Keying
  // the pane on the product would restart it cleanly but tear the capture out
  // of the document and put a fresh one back, which flashes.
  it('runs on a wrapper that survives the swap', async () => {
    render(<Harness />);
    const shot = screen.getAllByRole('img')[0];
    await userEvent.click(screen.getByRole('tab', { name: /aria2t/ }));
    const target = animations.at(-1)?.target as HTMLElement;
    expect(target).toContainElement(screen.getAllByRole('img')[0]);
    // React keeps both the wrapper and the image node, and swaps the source.
    expect(screen.getAllByRole('img')[0]).toBe(shot);
    expect(shot).toHaveAttribute('src', '/media/aria2t-home-light.webp');
    await userEvent.click(screen.getByRole('tab', { name: /noctis/ }));
    expect(animations.at(-1)?.target).toBe(target);
  });

  it('lands on an already-visible resting state, so a failed script hides nothing', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('tab', { name: /aria2t/ }));
    expect(animations.at(-1)?.keyframes.at(-1)).toEqual({
      opacity: 1,
      transform: 'none',
    });
  });

  it('is a routine state change, not a focal entrance', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('tab', { name: /aria2t/ }));
    const { duration, easing } = animations.at(-1)!.options;
    expect(duration).toBeLessThanOrEqual(300);
    // The same curve the page's entrances use, read from the same token.
    expect(easing).toBe('ease-out');
  });

  it('says nothing on first paint, because nothing was replaced', () => {
    render(<Harness />);
    expect(animations).toHaveLength(0);
  });

  it('stays still when the reader asked for reduced motion', async () => {
    setReducedMotion(true);
    render(<Harness />);
    await userEvent.click(screen.getByRole('tab', { name: /aria2t/ }));
    expect(animations).toHaveLength(0);
    // The swap still happened; only its motion did not.
    expect(screen.getByRole('tabpanel')).toHaveAttribute('id', 'aria2t');
  });
});

describe('Work panes', () => {
  it('gives noctis its capture, its own line and three places to go', () => {
    render(<Harness />);
    expect(screen.getAllByRole('img')[0]).toHaveAttribute('src', '/media/noctis-home-light.webp');
    expect(screen.getByText('vless browser extension for chrome')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Project page/ })).toHaveAttribute(
      'href',
      'https://noctis.c0nn3ct.info',
    );
    expect(screen.getByRole('link', { name: /Chrome Web Store/ })).toHaveAttribute(
      'href',
      'https://chromewebstore.google.com/detail/noctis/nmhobajopepdpihahepaddpdifdcenpn',
    );
    expect(screen.getByRole('link', { name: /GitHub/ })).toHaveAttribute(
      'href',
      'https://github.com/c0nn3ct-info/noctis',
    );
  });

  it('gives aria2t its own capture and the two places it has', async () => {
    render(<Harness start="aria2t" />);
    const shot = screen.getAllByRole('img')[0];
    expect(shot).toHaveAttribute('src', '/media/aria2t-home-light.webp');
    // Both products' captures are 1280x800 now, which is the pane's own 16/10,
    // so nothing is cropped and nothing is letterboxed.
    expect(shot).toHaveAttribute('height', '800');
    expect(screen.queryByRole('link', { name: /Chrome Web Store/ })).toBeNull();
    expect(screen.getByRole('link', { name: /Project page/ })).toHaveAttribute(
      'href',
      'https://aria2t.c0nn3ct.info',
    );
  });

  it('says plainly that the workshop has nothing to show, and offers no capture', () => {
    render(<Harness start="next" />);
    expect(screen.queryAllByRole('img')).toHaveLength(0);
    expect(screen.getByText('Nothing to show yet')).toBeInTheDocument();
    expect(screen.getByText('A screenshot here would only be a promise')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Suggest something/ })).toHaveAttribute(
      'href',
      'mailto:hello@c0nn3ct.info?subject=An%20idea%20for%20the%20workshop',
    );
    expect(screen.getByRole('link', { name: /See the promises/ })).toHaveAttribute(
      'href',
      '#settled',
    );
  });

  it('carries three checkable facts per product', () => {
    render(<Harness />);
    expect(
      screen.getByText('Installs without admin rights, and uninstalls the same way'),
    ).toBeInTheDocument();
    // Once on the rail, once on the first fact card.
    expect(screen.getAllByText('01')).toHaveLength(2);
  });
});

describe('Work lightbox', () => {
  it('opens the capture full size and closes again', async () => {
    render(<Harness />);
    await userEvent.click(
      screen.getAllByRole('button', { name: /Open the screenshot full size/ })[0],
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText('Click anywhere to close')).toBeInTheDocument();
    const close = screen.getByRole('button', { name: 'Close the preview' });
    expect(close).toHaveFocus();
    await userEvent.click(close);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('closes on Escape', async () => {
    render(<Harness />);
    await userEvent.click(
      screen.getAllByRole('button', { name: /Open the screenshot full size/ })[0],
    );
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('stays open for any other key', async () => {
    render(<Harness />);
    await userEvent.click(
      screen.getAllByRole('button', { name: /Open the screenshot full size/ })[0],
    );
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('shows the capture it was opened from, and names itself after it once', async () => {
    render(<Harness start="aria2t" />);
    await userEvent.click(
      screen.getAllByRole('button', { name: /Open the screenshot full size/ })[0],
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog.querySelector('img')).toHaveAttribute('src', '/media/aria2t-home-light.webp');
    expect(dialog).toHaveAccessibleName('aria2t · Home');
    // The description is the dialog's name, so the image itself stays out of
    // the tree rather than reading the same sentence a second time.
    expect(dialog.querySelector('img')).toHaveAttribute('alt', '');
  });

  // aria-modal hides the page behind from a screen reader but leaves the tab
  // ring alone, so without this Tab walked into content the reader could not
  // see and gave no way back.
  it('keeps Tab inside the dialog', async () => {
    render(<Harness />);
    await userEvent.click(
      screen.getAllByRole('button', { name: /Open the screenshot full size/ })[0],
    );
    const close = screen.getByRole('button', { name: 'Close the preview' });
    await userEvent.tab();
    expect(close).toHaveFocus();
    await userEvent.tab({ shift: true });
    expect(close).toHaveFocus();
  });

  it('hands the keyboard back to the thumbnail it was opened from', async () => {
    render(<Harness />);
    const opener = screen.getAllByRole('button', { name: /Open the screenshot full size/ })[0];
    await userEvent.click(opener);
    await userEvent.keyboard('{Escape}');
    expect(opener).toHaveFocus();
  });
});
