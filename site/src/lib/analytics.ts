/** The project's browser write key. It ships in the bundle because that is what
 * a browser key is for: it can write events into this project and read nothing.
 */
const API_KEY = '96f7941f6d4de59052948004b54b7bda';

let started = false;

/**
 * Amplitude analytics and session replay, started once for the page.
 *
 * The SDK is imported here rather than at the top of the module so it lands in
 * its own chunk: session replay carries rrweb, and statically imported it put
 * 436KB on the chunk the page hydrates from. Measuring a page is worth less
 * than the page arriving, so it loads after the mount.
 *
 * The build loads every locale in Puppeteer to capture its DOM, and a robot
 * reading the site is not a visit, so `navigator.webdriver` keeps the prerender
 * out of the counts and out of the replays.
 */
export async function startAnalytics(): Promise<void> {
  if (started || navigator.webdriver) return;
  started = true;
  const { initAll } = await import('@amplitude/unified');
  initAll(API_KEY, { analytics: { autocapture: true }, sessionReplay: { sampleRate: 1 } });
}
