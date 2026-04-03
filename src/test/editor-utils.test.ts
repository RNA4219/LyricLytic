import { describe, it, expect } from 'vitest';
import { Section, buildLyricsOnlyBody } from '../lib/section';
import { countRomanizedGuideUnits } from '../lib/rhyme/analysis';

describe('Editor utility functions', () => {
  describe('countRomanizedGuideUnits', () => {
    it('should count tokens separated by spaces', () => {
      expect(countRomanizedGuideUnits('ka ra fu ru')).toBe(4);
    });

    it('should exclude pipe characters', () => {
      expect(countRomanizedGuideUnits('ka ra | mi ra i')).toBe(5);
    });

    it('should handle multiple pipes', () => {
      expect(countRomanizedGuideUnits('a | b | c')).toBe(3);
    });

    it('should handle empty string', () => {
      expect(countRomanizedGuideUnits('')).toBe(0);
    });

    it('should handle string with only pipes', () => {
      expect(countRomanizedGuideUnits('| | |')).toBe(0);
    });

    it('should handle string with only whitespace', () => {
      expect(countRomanizedGuideUnits('   ')).toBe(0);
    });

    it('should handle consecutive spaces', () => {
      expect(countRomanizedGuideUnits('a   b    c')).toBe(3);
    });
  });

  describe('buildLyricsOnlyBody', () => {
    it('should extract bodyText from sections', () => {
      const sections: Section[] = [
        { id: '1', type: 'Verse', displayName: 'Verse', sortOrder: 0, bodyText: 'Hello\nWorld' },
        { id: '2', type: 'Chorus', displayName: 'Chorus', sortOrder: 1, bodyText: 'Sing along' },
      ];
      expect(buildLyricsOnlyBody(sections)).toBe('Hello\nWorld\n\nSing along');
    });

    it('should filter out empty bodyText', () => {
      const sections: Section[] = [
        { id: '1', type: 'Verse', displayName: 'Verse', sortOrder: 0, bodyText: 'Hello' },
        { id: '2', type: 'Chorus', displayName: 'Chorus', sortOrder: 1, bodyText: '' },
        { id: '3', type: 'Bridge', displayName: 'Bridge', sortOrder: 2, bodyText: 'Bridge text' },
      ];
      expect(buildLyricsOnlyBody(sections)).toBe('Hello\n\nBridge text');
    });

    it('should trim trailing whitespace from bodyText', () => {
      const sections: Section[] = [
        { id: '1', type: 'Verse', displayName: 'Verse', sortOrder: 0, bodyText: 'Hello  \n  ' },
      ];
      expect(buildLyricsOnlyBody(sections)).toBe('Hello');
    });

    it('should return empty string for empty sections', () => {
      expect(buildLyricsOnlyBody([])).toBe('');
    });

    it('should return empty string when all bodyText are empty', () => {
      const sections: Section[] = [
        { id: '1', type: 'Verse', displayName: 'Verse', sortOrder: 0, bodyText: '' },
        { id: '2', type: 'Chorus', displayName: 'Chorus', sortOrder: 1, bodyText: '   ' },
      ];
      expect(buildLyricsOnlyBody(sections)).toBe('');
    });

    it('should join sections with double newline', () => {
      const sections: Section[] = [
        { id: '1', type: 'Verse', displayName: 'Verse', sortOrder: 0, bodyText: 'A' },
        { id: '2', type: 'Chorus', displayName: 'Chorus', sortOrder: 1, bodyText: 'B' },
        { id: '3', type: 'Outro', displayName: 'Outro', sortOrder: 2, bodyText: 'C' },
      ];
      expect(buildLyricsOnlyBody(sections)).toBe('A\n\nB\n\nC');
    });
  });
});