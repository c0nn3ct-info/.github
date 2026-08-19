import { describe, expect, it } from 'vitest';
import { render, screen } from './test/render';
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
      screen.getByText('A static page with no analytics and no cookies. It makes no third-party requests.'),
    ).toBeInTheDocument();
    expect(screen.getByText('hello@c0nn3ct.info')).toBeInTheDocument();
    expect(screen.getByText('github.com/c0nn3ct-info')).toBeInTheDocument();
  });
});
