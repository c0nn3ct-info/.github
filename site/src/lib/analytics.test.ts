import { beforeEach, describe, expect, it, vi } from 'vitest';

const initAll = vi.fn();
vi.mock('@amplitude/unified', () => ({ initAll }));

function setWebdriver(on: boolean): void {
  Object.defineProperty(navigator, 'webdriver', { value: on, configurable: true });
}

/** A fresh module, since starting twice is the thing being tested. */
async function load(): Promise<() => Promise<void>> {
  vi.resetModules();
  return (await import('./analytics')).startAnalytics;
}

beforeEach(() => {
  vi.clearAllMocks();
  setWebdriver(false);
});

describe('startAnalytics', () => {
  it('starts analytics and session replay once per page', async () => {
    const startAnalytics = await load();
    await startAnalytics();
    await startAnalytics();

    expect(initAll).toHaveBeenCalledTimes(1);
    expect(initAll).toHaveBeenCalledWith('96f7941f6d4de59052948004b54b7bda', {
      analytics: { autocapture: true },
      sessionReplay: { sampleRate: 1 },
    });
  });

  it('leaves the prerender out of the counts', async () => {
    setWebdriver(true);
    const startAnalytics = await load();
    await startAnalytics();

    expect(initAll).not.toHaveBeenCalled();
  });
});
