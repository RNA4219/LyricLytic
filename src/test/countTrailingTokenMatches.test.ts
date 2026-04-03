import { describe, it, expect } from 'vitest';
import { countTrailingTokenMatches } from '../lib/rhyme/analysis';

describe('countTrailingTokenMatches', () => {
  it('should count matching trailing tokens', () => {
    const base = 'a b c d e';
    const target = 'x y c d e';
    expect(countTrailingTokenMatches(base, target)).toBe(3);
  });

  it('should return 0 for no matches', () => {
    const base = 'a b c';
    const target = 'x y z';
    expect(countTrailingTokenMatches(base, target)).toBe(0);
  });

  it('should return full length for identical strings', () => {
    const base = 'a b c d';
    const target = 'a b c d';
    expect(countTrailingTokenMatches(base, target)).toBe(4);
  });

  it('should handle pipe characters', () => {
    // Tokens after last pipe: ['d'] for both
    const base = 'a | b c | d';
    const target = 'x | b c | d';
    expect(countTrailingTokenMatches(base, target)).toBe(1);
  });

  it('should compare tokens after last pipe', () => {
    const base = 'a | b c d e';
    const target = 'x | c d e';
    expect(countTrailingTokenMatches(base, target)).toBe(3);
  });

  it('should handle empty strings', () => {
    expect(countTrailingTokenMatches('', 'a b c')).toBe(0);
    expect(countTrailingTokenMatches('a b c', '')).toBe(0);
  });

  it('should limit to 6 trailing tokens', () => {
    const base = '1 2 3 4 5 6 7 8 9';
    const target = 'a b c 4 5 6 7 8 9';
    expect(countTrailingTokenMatches(base, target)).toBe(6);
  });

  it('should handle whitespace', () => {
    const base = '  a   b   c  ';
    const target = 'x b c';
    expect(countTrailingTokenMatches(base, target)).toBe(2);
  });
});