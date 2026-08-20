import { describe, expect, it } from 'vitest';
import { render, screen } from './test/render';
import { Layout } from './layout';

describe('Layout', () => {
  it('frames its children with the bar and the footer', () => {
    render(
      <Layout home>
        <main>the page</main>
      </Layout>,
    );
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByText('the page')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('drops the section nav on routes that have no sections', () => {
    render(<Layout home={false}>x</Layout>);
    expect(screen.queryByRole('link', { name: 'Work' })).toBeNull();
    expect(screen.getByRole('banner')).toHaveAttribute('data-ground', 'page');
  });
});
