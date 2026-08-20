import { describe, expect, it } from 'vitest';
import { render, screen, userEvent, within } from '../test/render';
import { setLocale } from '../i18n';
import { HomePage } from './home';
import { NotFoundPage } from './not-found';

describe('HomePage', () => {
  it('runs the hero, the belt, the work, the habits, the floor and the close', () => {
    render(<HomePage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Small, finished software that answers to you',
    );
    for (const id of ['top', 'work', 'how', 'settled', 'contact']) {
      expect(document.getElementById(id)).not.toBeNull();
    }
    expect(screen.getByRole('group', { name: 'How we work, in one line' })).toBeInTheDocument();
  });

  it('wires the hero index to the work rail', async () => {
    render(<HomePage />);
    // Two tablists live on this page; this one is the work section's.
    const shown = () => within(document.getElementById('work')!).getByRole('tabpanel');
    expect(shown()).toHaveAttribute('id', 'noctis');
    const index = screen.getByRole('complementary', { name: 'The products, in order' });
    await userEvent.click(within(index).getByRole('link', { name: /aria2t/ }));
    expect(shown()).toHaveAttribute('id', 'aria2t');
  });

  it('carries both the habits and the floor, each headed', () => {
    render(<HomePage />);
    expect(
      screen.getByRole('heading', { name: 'Five habits we would defend in writing' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: "Promises we can't take back" }),
    ).toBeInTheDocument();
  });

  it('closes on a person answering, at a real address', () => {
    render(<HomePage />);
    expect(screen.getByText('a person answers')).toBeInTheDocument();
    // Header CTA, hero index, contact, footer: every one of them is a mailto.
    expect(
      screen.getAllByRole('link', { name: /hello@c0nn3ct\.info/ }).length,
    ).toBeGreaterThanOrEqual(3);
  });

  it('speaks whichever language the shell asked for', () => {
    setLocale('ru');
    try {
      render(<HomePage />);
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        'Небольшие законченные программы, которые отвечают перед вами',
      );
    } finally {
      setLocale('en');
    }
  });
});

describe('NotFoundPage', () => {
  it('says nothing lives here and offers the way home', () => {
    render(<NotFoundPage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'There is nothing at this address.',
    );
    expect(screen.getByRole('link', { name: /Back to the home page/ })).toHaveAttribute(
      'href',
      '/',
    );
  });

  it('sends a non-English reader back to their own home page', () => {
    setLocale('es');
    try {
      render(<NotFoundPage />);
      expect(screen.getByRole('link', { name: /Volver a la página de inicio/ })).toHaveAttribute(
        'href',
        '/es/',
      );
    } finally {
      setLocale('en');
    }
  });
});
