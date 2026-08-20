import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, userEvent, waitFor } from '../test/render';
import { HomePage } from './home';
import { NotFoundPage } from './not-found';

function stubClipboard(value: { writeText: (text: string) => Promise<void> } | undefined) {
  Object.defineProperty(navigator, 'clipboard', { value, configurable: true });
}

describe('HomePage', () => {
  it('opens with the positioning line and one filled action', () => {
    render(<HomePage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Small, finished software that stays on your side of the wire',
    );
    expect(screen.getByRole('link', { name: /What we have made/ })).toHaveAttribute('href', '#made');
  });

  it('shows both products, their claim chips and their proof links', () => {
    render(<HomePage />);
    expect(screen.getByRole('link', { name: 'noctis' })).toHaveAttribute(
      'href',
      'https://noctis.c0nn3ct.info',
    );
    expect(screen.getByRole('link', { name: 'aria2t' })).toHaveAttribute(
      'href',
      'https://aria2t.c0nn3ct.info',
    );
    const claimLists = screen.getAllByRole('list', { name: 'Checkable claims' });
    expect(claimLists).toHaveLength(2);
    expect(screen.getAllByText('no telemetry')).toHaveLength(2);
    expect(screen.getByText('settings stay in your browser')).toBeInTheDocument();
    expect(screen.getByText('one static binary')).toBeInTheDocument();
    const privacyLinks = screen.getAllByRole('link', { name: 'privacy page' });
    expect(privacyLinks.map((a) => a.getAttribute('href'))).toEqual([
      'https://noctis.c0nn3ct.info/privacy/',
      'https://aria2t.c0nn3ct.info/privacy/',
    ]);
    const shaLinks = screen.getAllByRole('link', { name: 'sha256sums' });
    expect(shaLinks).toHaveLength(2);
    expect(shaLinks[0]).toHaveAttribute(
      'href',
      'https://github.com/c0nn3ct-info/noctis/releases/latest/download/SHA256SUMS',
    );
  });

  it('ends the products section on the checkable so-far line', () => {
    render(<HomePage />);
    expect(
      screen.getByText(
        'So far, nothing we have shipped has asked you for an account, and nothing we have shipped reports what you do with it.',
      ),
    ).toBeInTheDocument();
  });

  it('pairs the open room with the settled floor, each clause addressable', () => {
    render(<HomePage />);
    expect(screen.getByRole('heading', { name: 'Room we have kept open' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'What is settled' })).toBeInTheDocument();
    for (const id of ['on-price', 'on-openness', 'on-accounts', 'on-services', 'on-scope']) {
      expect(document.getElementById(id)).not.toBeNull();
    }
    for (const id of ['stays-yours', 'no-advertising', 'leaving-is-easy', 'keeps-working']) {
      expect(document.getElementById(id)).not.toBeNull();
    }
    expect(screen.getAllByText(/^so far:/)).toHaveLength(5);
  });

  it('closes with a person answering and the write-to-us action', () => {
    render(<HomePage />);
    expect(screen.getByText('a person answers')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Write to us/ })).toHaveAttribute(
      'href',
      'mailto:hello@c0nn3ct.info',
    );
    // The address is also plain selectable text (contact CTA row + footer link).
    expect(screen.getAllByText('hello@c0nn3ct.info').length).toBeGreaterThanOrEqual(2);
  });

  it('reveals the page content once mounted', () => {
    render(<HomePage />);
    expect(document.documentElement.classList.contains('js')).toBe(true);
  });

  it('cues the checksum badges as file downloads', () => {
    render(<HomePage />);
    const shaLinks = screen.getAllByRole('link', { name: 'sha256sums' });
    for (const link of shaLinks) {
      expect(link).toHaveAttribute('title', expect.stringContaining('checksum'));
      expect(link.querySelector('svg')).not.toBeNull();
    }
  });
});

describe('ClauseAnchor', () => {
  afterEach(() => {
    stubClipboard(undefined);
  });

  it('copies the clause link, acknowledges it, then settles back', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard({ writeText });
    render(<HomePage />);
    const anchor = screen.getAllByRole('link', { name: 'Copy a link to this decision' })[0];
    await userEvent.click(anchor);
    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/#on-price`);
    // A second click restarts the acknowledgment window instead of stacking timers.
    await userEvent.click(anchor);
    expect(screen.getByText('Link copied')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('Link copied')).toBeNull(), { timeout: 3000 });
  });

  it('still acknowledges when the browser offers no clipboard', async () => {
    stubClipboard(undefined);
    render(<HomePage />);
    await userEvent.click(screen.getAllByRole('link', { name: 'Copy a link to this commitment' })[0]);
    expect(screen.getByText('Link copied')).toBeInTheDocument();
  });

  it('swallows a refused clipboard write', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    stubClipboard({ writeText });
    render(<HomePage />);
    await userEvent.click(screen.getAllByRole('link', { name: 'Copy a link to this decision' })[1]);
    expect(writeText).toHaveBeenCalled();
    expect(screen.getByText('Link copied')).toBeInTheDocument();
  });
});

describe('NotFoundPage', () => {
  it('says nothing lives here and offers the way home', () => {
    render(<NotFoundPage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'There is nothing at this address.',
    );
    expect(screen.getByRole('link', { name: /Back to the home page/ })).toHaveAttribute('href', '/');
  });
});
