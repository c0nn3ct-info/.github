import { describe, expect, it } from 'vitest';
import { CONTACT_ADDRESS, mailto } from './constants';

describe('mailto', () => {
  it('addresses the shared inbox with the subject already filled in', () => {
    expect(mailto('Saying hello')).toBe(`mailto:${CONTACT_ADDRESS}?subject=Saying%20hello`);
  });

  it('escapes a subject that carries its own punctuation', () => {
    expect(mailto('A rough edge & a fix')).toContain('A%20rough%20edge%20%26%20a%20fix');
  });
});
