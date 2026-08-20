import { describe, expect, it } from 'vitest';
import { nextIndex } from './roving';

describe('nextIndex', () => {
  it('moves forward on both forward arrows', () => {
    expect(nextIndex('ArrowDown', 0, 3)).toBe(1);
    expect(nextIndex('ArrowRight', 1, 3)).toBe(2);
  });

  it('moves back on both back arrows', () => {
    expect(nextIndex('ArrowUp', 2, 3)).toBe(1);
    expect(nextIndex('ArrowLeft', 1, 3)).toBe(0);
  });

  it('wraps at both ends', () => {
    expect(nextIndex('ArrowDown', 2, 3)).toBe(0);
    expect(nextIndex('ArrowUp', 0, 3)).toBe(2);
  });

  it('ignores keys the list does not own', () => {
    expect(nextIndex('Enter', 0, 3)).toBeNull();
    expect(nextIndex('a', 0, 3)).toBeNull();
  });
});
