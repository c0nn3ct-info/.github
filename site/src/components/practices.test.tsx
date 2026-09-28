import { describe, expect, it } from 'vitest';
import { render, screen, userEvent } from '../test/render';
import { animations, setReducedMotion } from '../test/setup';
import { Practices } from './practices';

describe('Practices', () => {
  it('lists five habits and opens on the first', () => {
    render(<Practices />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(5);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent(
      'Every product so far began with a task one of us could not finish',
    );
  });

  // Stacked below 900px the panel sat under all five rows, so a tap on the
  // first opened something a screen below it. The list steps aside there
  // (display: contents) and the order puts the one panel under the open row.
  it('opens its panel under the row that was chosen, on a phone', async () => {
    render(<Practices />);
    const list = screen.getByRole('tablist');
    expect(list).toHaveClass('max-[899px]:contents');
    const tabs = screen.getAllByRole('tab');
    expect(tabs.map((b) => b.style.order)).toEqual(['0', '2', '4', '6', '8']);
    const panel = screen.getByRole('tabpanel');
    expect(panel.style.order).toBe('1');
    await userEvent.click(tabs[3]);
    expect(panel.style.order).toBe('7');
  });

  it('asks a reader to choose, which a finger can do', () => {
    render(<Practices />);
    expect(screen.getByText('Choose a line')).toBeInTheDocument();
  });

  // The panel used to be a bare aria-live region, which announced itself on top
  // of the tab a reader had just moved to. Naming it after the selected tab is
  // what a tablist owes, and it is how the work rail next door already reads.
  it('names its panel after whichever habit is open', async () => {
    render(<Practices />);
    const panel = screen.getByRole('tabpanel');
    expect(panel).not.toHaveAttribute('aria-live');
    expect(panel).toHaveAccessibleName(/We build the tools we need/);
    await userEvent.click(screen.getByRole('tab', { name: /We build on proven work/ }));
    expect(panel).toHaveAccessibleName(/We build on proven work/);
  });

  // The panel follows the pointer, so it is a preview, and it used to change
  // with a hard cut: sweeping the five habits strobed the card.
  it('dips rather than blinks when the panel follows the pointer', async () => {
    render(<Practices />);
    await userEvent.hover(screen.getByRole('tab', { name: /We build on proven work/ }));
    // Both halves of the card, the ordinal and the reasoning, move together.
    expect(animations).toHaveLength(2);
    expect(animations[0].keyframes).toEqual([{ opacity: 0.45 }, { opacity: 1 }]);
    expect(animations[0].options.duration).toBe(160);
  });

  it('says nothing on first paint, and nothing when the same habit is re-entered', async () => {
    render(<Practices />);
    expect(animations).toHaveLength(0);
    const first = screen.getAllByRole('tab')[0];
    await userEvent.hover(first);
    expect(animations).toHaveLength(0);
  });

  it('changes without moving when the reader asked for reduced motion', async () => {
    setReducedMotion(true);
    render(<Practices />);
    await userEvent.click(screen.getByRole('tab', { name: /We build on proven work/ }));
    expect(animations).toHaveLength(0);
    expect(screen.getByRole('tabpanel')).toHaveTextContent('05');
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
    await userEvent.hover(screen.getByRole('tab', { name: /We build on proven work/ }));
    expect(screen.getByRole('tabpanel')).toHaveTextContent(
      'spend our effort on the parts you touch',
    );
    expect(screen.getByRole('tabpanel')).toHaveTextContent('05');
  });

  it('commits on a click', async () => {
    render(<Practices />);
    await userEvent.click(screen.getByRole('tab', { name: /We leave out what does not earn its place/ }));
    expect(screen.getByRole('tab', { name: /We leave out what does not earn its place/ })).toHaveAttribute(
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

  it('jumps to either end on Home and End', async () => {
    render(<Practices />);
    screen.getAllByRole('tab')[0].focus();
    await userEvent.keyboard('{End}');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('05');
    await userEvent.keyboard('{Home}');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('01');
  });

  it('leaves keys it does not own to the browser', async () => {
    render(<Practices />);
    screen.getAllByRole('tab')[0].focus();
    await userEvent.keyboard('{PageDown}');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('01');
  });
});
