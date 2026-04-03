import { describe, it, expect } from 'vitest';
import {
  buildLanguageInstruction,
  buildJsonResponseFormat,
} from '../lib/llm/promptBuilder';

describe('promptBuilder', () => {
  describe('buildLanguageInstruction', () => {
    it('should return English instruction for forceEnglish true', () => {
      const result = buildLanguageInstruction({ forceEnglish: true });
      expect(result).toBe('Generate all output text in English.');
    });

    it('should return Japanese instruction for ja locale', () => {
      const result = buildLanguageInstruction({ language: 'ja' });
      expect(result).toBe('Generate all output text in Japanese.');
    });

    it('should return English instruction for en locale', () => {
      const result = buildLanguageInstruction({ language: 'en' });
      expect(result).toBe('Generate all output text in English.');
    });

    it('should prioritize forceEnglish over language', () => {
      const result = buildLanguageInstruction({ language: 'ja', forceEnglish: true });
      expect(result).toBe('Generate all output text in English.');
    });
  });

  describe('buildJsonResponseFormat', () => {
    it('should build JSON format with single field', () => {
      const result = buildJsonResponseFormat({
        arrayName: 'candidates',
        fields: [
          { name: 'id', type: 'number', description: 'Candidate ID' },
          { name: 'text', type: 'string', description: 'The text content' },
        ],
      });

      expect(result).toContain('"candidates"');
      expect(result).toContain('"id"');
      expect(result).toContain('"text"');
    });

    it('should include example values', () => {
      const result = buildJsonResponseFormat({
        arrayName: 'items',
        fields: [
          { name: 'title', type: 'string', description: 'Item title' },
        ],
      });

      expect(result).toContain('"items"');
      expect(result).toContain('"title"');
    });

    it('should handle optional fields', () => {
      const result = buildJsonResponseFormat({
        arrayName: 'data',
        fields: [
          { name: 'required', type: 'string', description: 'Required field' },
          { name: 'optional', type: 'number', description: 'Optional field', optional: true },
        ],
      });

      expect(result).toContain('required');
      expect(result).toContain('optional');
    });
  });
});