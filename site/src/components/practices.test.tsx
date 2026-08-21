import { describe, expect, it } from 'vitest';
import { render, screen, userEvent } from '../test/render';
import { Practices } from './practices';

describe('Practices', () => {
  it('lists five habits and opens on the first', () => {
    render(<Practices />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(5);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent(
      'Both of these began as a tool one of us wanted on an ordinary evening',
    );
  });

  // The panel used to be a bare aria-live region, which announced itself on top
  // of the tab a reader had just moved to. Naming it after the selected tab is
  // what a tablist owes, and it is how the work rail next door already reads.
  it('names its panel after whichever habit is open', async () => {
    render(<Practices />);
    const panel = screen.getByRole('tabpanel');
    expect(panel).not.toHaveAttribute('aria-live');
    expect(panel).toHaveAccessibleName(/It starts as something we needed ourselves/);
    await userEvent.click(screen.getByRole('tab', { name: /We test against the real thing/ }));
    expect(panel).toHaveAccessibleName(/We test against the real thing/);
  });

  it('speaks as "we" in every title, so the list has one voice', () => {
    render(<Practices />);
    for (const tab of screen.getAllByRole('tab')) {
      // The ordinal leads, then the title; the title is what must say "we".
      const title = tab.textContent?.replace(/^\d+/, '') ?? '';
      expect({ title, we: title.trim().startsWith('We ') || title.includes('we ') }).toEqual({
        title,
        we: true,
      });
    }
  });

  it('follows the pointer', async () => {
    render(<Practices />);
    await userEvent.hover(screen.getByRole('tab', { name: /We test against the real thing/ }));
    expect(screen.getByRole('tabpanel')).toHaveTextContent(
      'tests that only confirm what we already believed',
    );
    expect(screen.getByRole('tabpanel')).toHaveTextContent('05');
  });

  it('commits on a click', async () => {
    render(<Practices />);
    await userEvent.click(screen.getByRole('tab', { name: /We build on work that already holds up/ }));
    expect(screen.getByRole('tab', { name: /We build on work/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tabpanel')).toHaveTextContent('03');
  });

  it('is reachable without a pointer at all', async () => {
    render(<Practices />);
    const first = screen.getAllByRole('tab')[0];
    first.focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('02');
    await userEvent.keyboard('{ArrowUp}{ArrowUp}');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('05');
  });

  it('leaves keys it does not own to the browser', async () => {
    render(<Practices />);
    screen.getAllByRole('tab')[0].focus();
    await userEvent.keyboard('{End}');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('01');
  });
});
