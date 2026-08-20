import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen, userEvent } from '../test/render';
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

describe('Work panes', () => {
  it('gives noctis its capture, its own line and three places to go', () => {
    render(<Harness />);
    expect(screen.getByRole('img')).toHaveAttribute('src', '/media/noctis-dark.png');
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
    const shot = screen.getByRole('img');
    expect(shot).toHaveAttribute('src', '/media/aria2t-dark.png');
    expect(shot).toHaveAttribute('height', '495');
    expect(screen.queryByRole('link', { name: /Chrome Web Store/ })).toBeNull();
    expect(screen.getByRole('link', { name: /Project page/ })).toHaveAttribute(
      'href',
      'https://aria2t.c0nn3ct.info',
    );
  });

  it('says plainly that the workshop has nothing to show, and offers no capture', () => {
    render(<Harness start="next" />);
    expect(screen.queryByRole('img')).toBeNull();
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
    await userEvent.click(screen.getByRole('button', { name: 'Open the screenshot full size' }));
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
    await userEvent.click(screen.getByRole('button', { name: 'Open the screenshot full size' }));
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('stays open for any other key', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'Open the screenshot full size' }));
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('shows the capture it was opened from, alt text and all', async () => {
    render(<Harness start="aria2t" />);
    await userEvent.click(screen.getByRole('button', { name: 'Open the screenshot full size' }));
    const shots = screen.getAllByRole('img');
    expect(shots[shots.length - 1]).toHaveAttribute('src', '/media/aria2t-dark.png');
    expect(screen.getByRole('dialog')).toHaveAccessibleName(
      'The aria2t download list running in a terminal, with progress, speed and time remaining.',
    );
  });
});
