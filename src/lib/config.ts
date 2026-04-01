/**
 * Application-wide constants and configuration
 */

// ===== Layout Constants =====

export const LAYOUT = {
  LEFT_PANE: {
    MIN_WIDTH: 240,
    MAX_WIDTH: 420,
    DEFAULT_WIDTH: 296,
  },
  RIGHT_PANE: {
    MIN_WIDTH: 280,
    MAX_WIDTH: 520,
    DEFAULT_WIDTH: 320,
  },
  SECTION_PANE: {
    MIN_HEIGHT_PERCENT: 20,
    MAX_HEIGHT_PERCENT: 80,
    DEFAULT_HEIGHT_PERCENT: 50,
  },
} as const;

// ===== Editor Constants =====

export const EDITOR = {
  ALL_SECTIONS_ID: '__all__',
  AUTO_SAVE_DEBOUNCE_MS: 1000,
} as const;

// ===== Section Presets =====

export const SECTION_PRESETS = [
  'Intro',
  'Verse',
  'Pre-Chorus',
  'Chorus',
  'Bridge',
  'Outro',
] as const;

export type SectionPreset = typeof SECTION_PRESETS[number];

// ===== Copy Options Defaults =====

export const COPY_OPTIONS = {
  DEFAULT_INCLUDE_HEADINGS: true,
  DEFAULT_PRESERVE_BLANK_LINES: true,
  STORAGE_KEY: 'lyriclytic_copy_options',
} as const;

// ===== LLM Defaults =====

export const LLM_DEFAULTS = {
  RUNTIME: 'openai_compatible' as const,
  BASE_URL_OPENAI: 'http://127.0.0.1:8080',
  MODEL_OPENAI: 'local-model',
  EXECUTABLE_PATH: '',
  TIMEOUT_MS: 300000,
  MAX_TOKENS: 262144,
  TEMPERATURE: 0.7,
} as const;

// ===== Export Settings =====

export const EXPORT = {
  FILE_EXTENSION: '.lyrlytic.zip',
  FILE_FILTER_NAME: 'LyricLytic Export',
} as const;

// ===== Storage Keys =====

export const STORAGE_KEYS = {
  LANGUAGE: 'lyriclytic_language',
  LLM_SETTINGS: 'lyriclytic_llm_settings',
  COPY_OPTIONS: 'lyriclytic_copy_options',
} as const;
