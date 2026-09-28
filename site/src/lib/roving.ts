/** The index an arrow key moves a roving-tabindex list to, or null when the key
 * is not one the list owns. Wraps at both ends, and Home and End jump to them,
 * as a tablist is expected to. */
export function nextIndex(key: string, current: number, count: number): number | null {
  if (key === 'Home') return 0;
  if (key === 'End') return count - 1;
  const forward = key === 'ArrowDown' || key === 'ArrowRight';
  const back = key === 'ArrowUp' || key === 'ArrowLeft';
  if (!forward && !back) return null;
  return (current + (forward ? 1 : -1) + count) % count;
}
