import { describe, expect, it } from 'vitest';
import { render } from '../test/render';
import { C0nn3ctMark } from './c0nn3ct-mark';

describe('C0nn3ctMark', () => {
  it('renders the shared figure as a decorative SVG', () => {
    const { container } = render(<C0nn3ctMark className="h-6 w-6" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('viewBox', '0 0 736 736');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveClass('h-6', 'w-6');
    expect(container.querySelector('path')).toHaveAttribute('fill', 'currentColor');
  });
});
