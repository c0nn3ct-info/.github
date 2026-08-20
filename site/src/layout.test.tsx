import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, userEvent } from './test/render';
import { Layout } from './layout';

describe('Layout', () => {
  it('names the brand and both nav actions', () => {
    render(<Layout>content</Layout>);
    expect(screen.getByLabelText('c0nn3ct.info home')).toHaveAttribute('href', '/');
    expect(screen.getByLabelText('c0nn3ct.info on GitHub')).toHaveAttribute(
      'href',
      'https://github.com/c0nn3ct-info',
    );
    expect(screen.getByLabelText('Write to hello@c0nn3ct.info')).toHaveAttribute(
      'href',
      'mailto:hello@c0nn3ct.info',
    );
  });

  it('renders its children between nav and footer', () => {
    render(
      <Layout>
        <main>the page</main>
      </Layout>,
    );
    expect(screen.getByText('the page')).toBeInTheDocument();
  });

  it('states the colophon and the reach-us links in the footer', () => {
    render(<Layout>x</Layout>);
    expect(
      screen.getByText('A static page with no analytics and no cookies. It makes no third-party requests.', {
        exact: false,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('hello@c0nn3ct.info')).toBeInTheDocument();
    expect(screen.getByText('github.com/c0nn3ct-info')).toBeInTheDocument();
  });
});

describe('RequestReceipts', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('opens the browser-recorded request list, reports no third parties, and closes again', async () => {
    render(<Layout>x</Layout>);
    const toggle = screen.getByRole('button', { name: 'see every request' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(toggle);
    expect(screen.getByText('Every request this page made, as your browser recorded it:')).toBeInTheDocument();
    expect(screen.getByText('none')).toBeInTheDocument();
    const hide = screen.getByRole('button', { name: 'hide the list' });
    expect(hide).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(hide);
    expect(screen.queryByText('none')).toBeNull();
  });

  it('shows same-origin requests as paths, deduplicated, and counts a foreign one honestly', async () => {
    const entry = (name: string, initiatorType: string) => ({ name, initiatorType });
    vi.spyOn(performance, 'getEntriesByType').mockReturnValue([
      entry(`${window.location.origin}/fonts/hanken-grotesk-var.woff2`, 'css'),
      entry(`${window.location.origin}/fonts/hanken-grotesk-var.woff2`, 'css'),
      entry('https://tracker.example/t.js', 'script'),
    ] as unknown as PerformanceEntryList);
    render(<Layout>x</Layout>);
    await userEvent.click(screen.getByRole('button', { name: 'see every request' }));
    expect(screen.getAllByText('/fonts/hanken-grotesk-var.woff2 · css')).toHaveLength(1);
    expect(screen.getByText('https://tracker.example/t.js · script')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.queryByText('none')).toBeNull();
  });
});
