import { describe, it, expect } from 'vitest';
import {
  LAYOUT,
  EDITOR,
  SECTION_PRESETS,
  COPY_OPTIONS,
  LLM_DEFAULTS,
  EXPORT,
  STORAGE_KEYS,
} from '../lib/config';

describe('config.ts', () => {
  describe('LAYOUT constants', () => {
    it('should have valid left pane width constraints', () => {
      expect(LAYOUT.LEFT_PANE.MIN_WIDTH).toBe(240);
      expect(LAYOUT.LEFT_PANE.MAX_WIDTH).toBe(420);
      expect(LAYOUT.LEFT_PANE.DEFAULT_WIDTH).toBe(296);
      expect(LAYOUT.LEFT_PANE.MIN_WIDTH).toBeLessThan(LAYOUT.LEFT_PANE.MAX_WIDTH);
      expect(LAYOUT.LEFT_PANE.DEFAULT_WIDTH).toBeGreaterThanOrEqual(LAYOUT.LEFT_PANE.MIN_WIDTH);
      expect(LAYOUT.LEFT_PANE.DEFAULT_WIDTH).toBeLessThanOrEqual(LAYOUT.LEFT_PANE.MAX_WIDTH);
    });

    it('should have valid right pane width constraints', () => {
      expect(LAYOUT.RIGHT_PANE.MIN_WIDTH).toBe(280);
      expect(LAYOUT.RIGHT_PANE.MAX_WIDTH).toBe(520);
      expect(LAYOUT.RIGHT_PANE.DEFAULT_WIDTH).toBe(320);
      expect(LAYOUT.RIGHT_PANE.MIN_WIDTH).toBeLessThan(LAYOUT.RIGHT_PANE.MAX_WIDTH);
      expect(LAYOUT.RIGHT_PANE.DEFAULT_WIDTH).toBeGreaterThanOrEqual(LAYOUT.RIGHT_PANE.MIN_WIDTH);
      expect(LAYOUT.RIGHT_PANE.DEFAULT_WIDTH).toBeLessThanOrEqual(LAYOUT.RIGHT_PANE.MAX_WIDTH);
    });

    it('should have valid section pane height constraints', () => {
      expect(LAYOUT.SECTION_PANE.MIN_HEIGHT_PERCENT).toBe(20);
      expect(LAYOUT.SECTION_PANE.MAX_HEIGHT_PERCENT).toBe(80);
      expect(LAYOUT.SECTION_PANE.DEFAULT_HEIGHT_PERCENT).toBe(50);
      expect(LAYOUT.SECTION_PANE.MIN_HEIGHT_PERCENT).toBeLessThan(LAYOUT.SECTION_PANE.MAX_HEIGHT_PERCENT);
      expect(LAYOUT.SECTION_PANE.DEFAULT_HEIGHT_PERCENT).toBeGreaterThanOrEqual(LAYOUT.SECTION_PANE.MIN_HEIGHT_PERCENT);
      expect(LAYOUT.SECTION_PANE.DEFAULT_HEIGHT_PERCENT).toBeLessThanOrEqual(LAYOUT.SECTION_PANE.MAX_HEIGHT_PERCENT);
    });

    it('should be immutable (as const)', () => {
      // TypeScript enforces this at compile time
      // Runtime test just verifies structure
      expect(typeof LAYOUT.LEFT_PANE.MIN_WIDTH).toBe('number');
      expect(typeof LAYOUT.RIGHT_PANE.DEFAULT_WIDTH).toBe('number');
    });
  });

  describe('EDITOR constants', () => {
    it('should have valid ALL_SECTIONS_ID', () => {
      expect(EDITOR.ALL_SECTIONS_ID).toBe('__all__');
      expect(typeof EDITOR.ALL_SECTIONS_ID).toBe('string');
    });

    it('should have reasonable auto-save debounce time', () => {
      expect(EDITOR.AUTO_SAVE_DEBOUNCE_MS).toBe(1000);
      expect(EDITOR.AUTO_SAVE_DEBOUNCE_MS).toBeGreaterThan(0);
      expect(EDITOR.AUTO_SAVE_DEBOUNCE_MS).toBeLessThan(10000);
    });
  });

  describe('SECTION_PRESETS', () => {
    it('should have exactly 6 presets', () => {
      expect(SECTION_PRESETS.length).toBe(6);
    });

    it('should include all common song sections', () => {
      expect(SECTION_PRESETS).toContain('Intro');
      expect(SECTION_PRESETS).toContain('Verse');
      expect(SECTION_PRESETS).toContain('Pre-Chorus');
      expect(SECTION_PRESETS).toContain('Chorus');
      expect(SECTION_PRESETS).toContain('Bridge');
      expect(SECTION_PRESETS).toContain('Outro');
    });

    it('should be in logical song order', () => {
      expect(SECTION_PRESETS[0]).toBe('Intro');
      expect(SECTION_PRESETS[1]).toBe('Verse');
      expect(SECTION_PRESETS[2]).toBe('Pre-Chorus');
      expect(SECTION_PRESETS[3]).toBe('Chorus');
      expect(SECTION_PRESETS[4]).toBe('Bridge');
      expect(SECTION_PRESETS[5]).toBe('Outro');
    });

    it('should be readonly array', () => {
      // TypeScript enforces this, runtime check verifies structure
      expect(Array.isArray(SECTION_PRESETS)).toBe(true);
    });
  });

  describe('COPY_OPTIONS defaults', () => {
    it('should have include headings enabled by default', () => {
      expect(COPY_OPTIONS.DEFAULT_INCLUDE_HEADINGS).toBe(true);
    });

    it('should preserve blank lines by default', () => {
      expect(COPY_OPTIONS.DEFAULT_PRESERVE_BLANK_LINES).toBe(true);
    });

    it('should have unique storage key', () => {
      expect(COPY_OPTIONS.STORAGE_KEY).toBe('lyriclytic_copy_options');
      expect(COPY_OPTIONS.STORAGE_KEY).toContain('lyriclytic');
    });
  });

  describe('LLM_DEFAULTS', () => {
    it('should have valid runtime', () => {
      expect(LLM_DEFAULTS.RUNTIME).toBe('openai_compatible');
    });

    it('should have localhost URL for OpenAI compatible', () => {
      expect(LLM_DEFAULTS.BASE_URL_OPENAI).toContain('127.0.0.1');
    });

    it('should have correct default port for OpenAI compatible', () => {
      expect(LLM_DEFAULTS.BASE_URL_OPENAI).toContain(':8080');
    });

    it('should have reasonable timeout', () => {
      // 300000ms = 5 minutes, suitable for long LLM operations
      expect(LLM_DEFAULTS.TIMEOUT_MS).toBe(300000);
      expect(LLM_DEFAULTS.TIMEOUT_MS).toBeGreaterThan(1000);
    });

    it('should have reasonable max tokens', () => {
      // 262144 = large context window support
      expect(LLM_DEFAULTS.MAX_TOKENS).toBe(262144);
      expect(LLM_DEFAULTS.MAX_TOKENS).toBeGreaterThan(0);
    });

    it('should have valid temperature range', () => {
      expect(LLM_DEFAULTS.TEMPERATURE).toBe(0.7);
      expect(LLM_DEFAULTS.TEMPERATURE).toBeGreaterThanOrEqual(0);
      expect(LLM_DEFAULTS.TEMPERATURE).toBeLessThanOrEqual(2);
    });

    it('should have model name defined for OpenAI compatible', () => {
      expect(LLM_DEFAULTS.MODEL_OPENAI).toBe('local-model');
    });
  });

  describe('EXPORT settings', () => {
    it('should have correct file extension', () => {
      expect(EXPORT.FILE_EXTENSION).toBe('.lyrlytic.zip');
      expect(EXPORT.FILE_EXTENSION).toContain('.zip');
    });

    it('should have descriptive filter name', () => {
      expect(EXPORT.FILE_FILTER_NAME).toBe('LyricLytic Export');
      expect(EXPORT.FILE_FILTER_NAME).toContain('LyricLytic');
    });
  });

  describe('STORAGE_KEYS', () => {
    it('should have unique keys for each storage item', () => {
      const keys = Object.values(STORAGE_KEYS);
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(keys.length);
    });

    it('should all contain app prefix', () => {
      expect(STORAGE_KEYS.LANGUAGE).toContain('lyriclytic');
      expect(STORAGE_KEYS.LLM_SETTINGS).toContain('lyriclytic');
      expect(STORAGE_KEYS.COPY_OPTIONS).toContain('lyriclytic');
    });

    it('should be lowercase with underscores', () => {
      expect(STORAGE_KEYS.LANGUAGE).toBe('lyriclytic_language');
      expect(STORAGE_KEYS.LLM_SETTINGS).toBe('lyriclytic_llm_settings');
      expect(STORAGE_KEYS.COPY_OPTIONS).toBe('lyriclytic_copy_options');
    });
  });

  describe('constant relationships', () => {
    it('should have pane widths that allow reasonable UI layout', () => {
      const minTotalWidth = LAYOUT.LEFT_PANE.MIN_WIDTH + LAYOUT.RIGHT_PANE.MIN_WIDTH;
      // Minimum total pane width should allow for content space
      expect(minTotalWidth).toBeLessThan(800);
    });

    it('should have timeout longer than auto-save debounce', () => {
      expect(LLM_DEFAULTS.TIMEOUT_MS).toBeGreaterThan(EDITOR.AUTO_SAVE_DEBOUNCE_MS);
    });
  });
});