/** The index an arrow key moves a roving-tabindex list to, or null when the key
 * is not one the list owns. Wraps at both ends, as a tablist is expected to. */
export function nextIndex(key: string, current: number, count: number): number | null {
  const forward = key === 'ArrowDown' || key === 'ArrowRight';
  const back = key === 'ArrowUp' || key === 'ArrowLeft';
  if (!forward && !back) return null;
  return (current + (forward ? 1 : -1) + count) % count;
}
