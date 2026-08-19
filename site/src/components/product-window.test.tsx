import { describe, expect, it } from 'vitest';
import { render, screen } from '../test/render';
import { ProductWindow } from './product-window';

const base = {
  href: 'https://noctis.c0nn3ct.info',
  ariaLabel: 'the noctis site',
  title: 'noctis.c0nn3ct.info',
  led: 'noctis' as const,
  darkSrc: '/media/noctis-dark.png',
  lightSrc: '/media/noctis-light.png',
  alt: 'The noctis home screen.',
  width: 1280,
  height: 800,
};

describe('ProductWindow', () => {
  it('links the whole window to the product site as a single tab stop', () => {
    render(<ProductWindow {...base} />);
    const link = screen.getByLabelText('the noctis site');
    expect(link).toHaveAttribute('href', base.href);
    expect(link).toHaveAttribute('tabindex', '-1');
    expect(link).toHaveClass('window-frame');
  });

  it('serves one capture per colour scheme and defers its download', () => {
    const { container } = render(<ProductWindow {...base} />);
    const source = container.querySelector('picture > source');
    expect(source).toHaveAttribute('media', '(prefers-color-scheme: dark)');
    expect(source).toHaveAttribute('srcset', base.darkSrc);
    const img = screen.getByAltText(base.alt);
    expect(img).toHaveAttribute('src', base.lightSrc);
    expect(img).toHaveAttribute('width', '1280');
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(img).toHaveAttribute('decoding', 'async');
  });

  it('shows the window title and the product LED', () => {
    const { container } = render(<ProductWindow {...base} />);
    expect(screen.getByText('noctis.c0nn3ct.info')).toBeInTheDocument();
    expect(container.querySelector('.led-noctis')).not.toBeNull();
    expect(container.querySelector('.window-zoom')).toBeNull();
  });

  it('zooms the capture when asked and tints the other LED', () => {
    const { container } = render(
      <ProductWindow {...base} led="aria2t" zoom className="extra" />,
    );
    expect(container.querySelector('.window-zoom')).not.toBeNull();
    expect(container.querySelector('.led-aria2t')).not.toBeNull();
    expect(container.querySelector('.extra')).not.toBeNull();
  });
});
