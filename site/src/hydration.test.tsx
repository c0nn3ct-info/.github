import { StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { act } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HomePage } from './pages/home';

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('the served page', () => {
  // The site ships a capture of the rendered page and hydrates it, and React
  // compares that markup with the first client render only. Anything decided
  // at render time from the browser, or rendered only once a ref has landed,
  // is a mismatch, and a mismatch throws the whole root away on every load:
  // the pane's chevrons did exactly that (#418 six times, then #423) until
  // they rendered from the first paint.
  it('hydrates its own first render without a single mismatch', async () => {
    const warn = vi.spyOn(console, 'error').mockImplementation(() => {});
    const root = document.createElement('div');
    root.innerHTML = renderToString(
      <StrictMode>
        <HomePage />
      </StrictMode>,
    );
    document.body.append(root);
    const recovered: unknown[] = [];
    await act(async () => {
      hydrateRoot(
        root,
        <StrictMode>
          <HomePage />
        </StrictMode>,
        { onRecoverableError: (e) => recovered.push(e) },
      );
    });
    expect(recovered).toEqual([]);
    // renderToString also notes that layout effects do not run on a server,
    // which is true and beside the point: the served markup is a browser's
    // capture, and the effects have run in it.
    const mismatches = warn.mock.calls
      .map((c) => String(c[0]))
      .filter((m) => /did not match|server HTML|Extra attributes|during hydration/.test(m));
    expect(mismatches).toEqual([]);
  });
});
