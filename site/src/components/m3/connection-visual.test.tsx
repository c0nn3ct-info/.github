import { describe, expect, it } from 'vitest';
import { render } from '@/test/render';
import { ConnectionVisual } from './connection-visual';

// The visual names each state through colour alone; the states are the test.
const STATES = ['idle', 'connecting', 'connected', 'error'] as const;

describe('ConnectionVisual', () => {
  it('renders each state differently', () => {
    const shots = STATES.map((state) => {
      const { container, unmount } = render(<ConnectionVisual state={state} />);
      const html = container.innerHTML;
      unmount();
      return html;
    });
    expect(new Set(shots).size).toBe(STATES.length);
  });

  it('stays static: no animation classes in any state', () => {
    for (const state of STATES) {
      const { container, unmount } = render(<ConnectionVisual state={state} />);
      expect(container.innerHTML, state).not.toMatch(/animate-/);
      unmount();
    }
  });

  it('draws one ring behind the core', () => {
    const { container } = render(<ConnectionVisual state="connected" />);
    const rings = [...container.querySelectorAll('span')].filter((s) =>
      s.className.includes('rounded-full'),
    );
    expect(rings).toHaveLength(2);
    expect(rings[0].className).toContain('bg-success/35');
    expect(rings[1].className).toContain('bg-success ');
  });

  it('scales with its size and merges a className', () => {
    const { container } = render(<ConnectionVisual state="connected" size={20} className="shrink-0" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass('shrink-0');
    expect(root.style.width).toBe('20px');
  });
});
