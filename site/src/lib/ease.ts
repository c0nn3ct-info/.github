/**
 * The curve everything that arrives is timed on, read from the stylesheet so
 * CSS and the Web Animations API cannot drift apart.
 *
 * It used to be `cubic-bezier(0.16, 1, 0.3, 1)` typed by hand into two
 * different files, beside three ease tokens the page already had. Two
 * near-identical curves in a four-curve system is a consolidation finding, not
 * a preference.
 */
export function enterEase(): string {
  const token = getComputedStyle(document.documentElement)
    .getPropertyValue('--ease-enter')
    .trim();
  // A stylesheet that has not loaded yet still has to animate on something,
  // and the browser's own ease-out is the nearest weak relative of the token.
  return token || 'ease-out';
}
