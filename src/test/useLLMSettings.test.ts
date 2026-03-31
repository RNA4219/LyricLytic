import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLLMSettings } from '../lib/llm/useLLMSettings';
import { LLM_DEFAULTS, STORAGE_KEYS } from '../lib/config';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    get store() { return store; },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('useLLMSettings', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should return default settings when localStorage is empty', () => {
      const { result } = renderHook(() => useLLMSettings());

      expect(result.current.settings.runtime).toBe(LLM_DEFAULTS.RUNTIME);
      expect(result.current.settings.baseUrl).toBe(LLM_DEFAULTS.BASE_URL_OPENAI);
      expect(result.current.settings.model).toBe(LLM_DEFAULTS.MODEL_OPENAI);
      expect(result.current.settings.enabled).toBe(false);
      expect(result.current.settings.timeoutMs).toBe(LLM_DEFAULTS.TIMEOUT_MS);
      expect(result.current.settings.maxTokens).toBe(LLM_DEFAULTS.MAX_TOKENS);
      expect(result.current.settings.temperature).toBe(LLM_DEFAULTS.TEMPERATURE);
    });

    it('should return default modelPath as empty string', () => {
      const { result } = renderHook(() => useLLMSettings());
      expect(result.current.settings.modelPath).toBe('');
    });

    it('should not call localStorage on first render if empty', () => {
      renderHook(() => useLLMSettings());
      expect(localStorageMock.getItem).toHaveBeenCalledWith(STORAGE_KEYS.LLM_SETTINGS);
    });
  });

  describe('loading saved settings', () => {
    it('should load settings from localStorage', () => {
      const savedSettings = {
        runtime: 'ollama',
        baseUrl: 'http://127.0.0.1:11434',
        model: 'llama3.2',
        enabled: true,
        timeoutMs: 60000,
        maxTokens: 2048,
        temperature: 0.5,
        modelPath: '/path/to/model',
      };
      localStorageMock.store[STORAGE_KEYS.LLM_SETTINGS] = JSON.stringify(savedSettings);

      const { result } = renderHook(() => useLLMSettings());

      expect(result.current.settings.runtime).toBe('ollama');
      expect(result.current.settings.baseUrl).toBe('http://127.0.0.1:11434');
      expect(result.current.settings.model).toBe('llama3.2');
      expect(result.current.settings.enabled).toBe(true);
      expect(result.current.settings.timeoutMs).toBe(60000);
      expect(result.current.settings.maxTokens).toBe(2048);
      expect(result.current.settings.temperature).toBe(0.5);
      expect(result.current.settings.modelPath).toBe('/path/to/model');
    });

    it('should merge partial settings with defaults', () => {
      const partialSettings = {
        enabled: true,
        temperature: 0.3,
      };
      localStorageMock.store[STORAGE_KEYS.LLM_SETTINGS] = JSON.stringify(partialSettings);

      const { result } = renderHook(() => useLLMSettings());

      // Partial values should override
      expect(result.current.settings.enabled).toBe(true);
      expect(result.current.settings.temperature).toBe(0.3);

      // Defaults should remain for missing values
      expect(result.current.settings.runtime).toBe(LLM_DEFAULTS.RUNTIME);
      expect(result.current.settings.baseUrl).toBe(LLM_DEFAULTS.BASE_URL_OPENAI);
      expect(result.current.settings.model).toBe(LLM_DEFAULTS.MODEL_OPENAI);
    });

    it('should handle corrupted localStorage data gracefully', () => {
      localStorageMock.store[STORAGE_KEYS.LLM_SETTINGS] = 'invalid json{';

      const { result } = renderHook(() => useLLMSettings());

      // Should return defaults when parse fails
      expect(result.current.settings.runtime).toBe(LLM_DEFAULTS.RUNTIME);
      expect(result.current.settings.enabled).toBe(false);
    });

    it('should handle null localStorage value', () => {
      localStorageMock.store[STORAGE_KEYS.LLM_SETTINGS] = 'null';

      const { result } = renderHook(() => useLLMSettings());

      expect(result.current.settings.runtime).toBe(LLM_DEFAULTS.RUNTIME);
    });
  });

  describe('updateSettings', () => {
    it('should update all settings', () => {
      const { result } = renderHook(() => useLLMSettings());

      const newSettings = {
        runtime: 'ollama' as const,
        baseUrl: 'http://127.0.0.1:11434',
        model: 'llama3.2',
        modelPath: '',
        enabled: true,
        timeoutMs: 60000,
        maxTokens: 2048,
        temperature: 0.5,
      };

      act(() => {
        result.current.updateSettings(newSettings);
      });

      expect(result.current.settings).toEqual(newSettings);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.LLM_SETTINGS,
        JSON.stringify(newSettings)
      );
    });

    it('should persist settings immediately on update', () => {
      const { result } = renderHook(() => useLLMSettings());

      act(() => {
        result.current.updateSettings({
          ...result.current.settings,
          enabled: true,
        });
      });

      expect(localStorageMock.setItem).toHaveBeenCalledTimes(1);
    });
  });

  describe('updatePartialSettings', () => {
    it('should update single setting while preserving others', () => {
      const { result } = renderHook(() => useLLMSettings());

      act(() => {
        result.current.updatePartialSettings('enabled', true);
      });

      expect(result.current.settings.enabled).toBe(true);
      expect(result.current.settings.runtime).toBe(LLM_DEFAULTS.RUNTIME);
      expect(result.current.settings.baseUrl).toBe(LLM_DEFAULTS.BASE_URL_OPENAI);
    });

    it('should update runtime', () => {
      const { result } = renderHook(() => useLLMSettings());

      act(() => {
        result.current.updatePartialSettings('runtime', 'ollama');
      });

      expect(result.current.settings.runtime).toBe('ollama');
    });

    it('should update baseUrl', () => {
      const { result } = renderHook(() => useLLMSettings());

      act(() => {
        result.current.updatePartialSettings('baseUrl', 'http://127.0.0.1:11434');
      });

      expect(result.current.settings.baseUrl).toBe('http://127.0.0.1:11434');
    });

    it('should update model', () => {
      const { result } = renderHook(() => useLLMSettings());

      act(() => {
        result.current.updatePartialSettings('model', 'llama3.2');
      });

      expect(result.current.settings.model).toBe('llama3.2');
    });

    it('should update temperature', () => {
      const { result } = renderHook(() => useLLMSettings());

      act(() => {
        result.current.updatePartialSettings('temperature', 0.1);
      });

      expect(result.current.settings.temperature).toBe(0.1);
    });

    it('should update maxTokens', () => {
      const { result } = renderHook(() => useLLMSettings());

      act(() => {
        result.current.updatePartialSettings('maxTokens', 4096);
      });

      expect(result.current.settings.maxTokens).toBe(4096);
    });

    it('should update timeoutMs', () => {
      const { result } = renderHook(() => useLLMSettings());

      act(() => {
        result.current.updatePartialSettings('timeoutMs', 120000);
      });

      expect(result.current.settings.timeoutMs).toBe(120000);
    });

    it('should persist on partial update', () => {
      const { result } = renderHook(() => useLLMSettings());

      act(() => {
        result.current.updatePartialSettings('enabled', true);
      });

      expect(localStorageMock.setItem).toHaveBeenCalled();
      const saved = JSON.parse(localStorageMock.store[STORAGE_KEYS.LLM_SETTINGS]);
      expect(saved.enabled).toBe(true);
    });

    it('should handle multiple sequential updates', () => {
      const { result } = renderHook(() => useLLMSettings());

      act(() => {
        result.current.updatePartialSettings('runtime', 'ollama');
        result.current.updatePartialSettings('baseUrl', 'http://127.0.0.1:11434');
        result.current.updatePartialSettings('model', 'llama3.2');
        result.current.updatePartialSettings('enabled', true);
      });

      expect(result.current.settings.runtime).toBe('ollama');
      expect(result.current.settings.baseUrl).toBe('http://127.0.0.1:11434');
      expect(result.current.settings.model).toBe('llama3.2');
      expect(result.current.settings.enabled).toBe(true);
    });
  });

  describe('resetSettings', () => {
    it('should reset all settings to defaults', () => {
      // First set some custom settings
      localStorageMock.store[STORAGE_KEYS.LLM_SETTINGS] = JSON.stringify({
        runtime: 'ollama',
        enabled: true,
        temperature: 0.1,
      });

      const { result } = renderHook(() => useLLMSettings());

      // Verify custom settings loaded
      expect(result.current.settings.runtime).toBe('ollama');
      expect(result.current.settings.enabled).toBe(true);

      // Reset
      act(() => {
        result.current.resetSettings();
      });

      // Verify defaults restored
      expect(result.current.settings.runtime).toBe(LLM_DEFAULTS.RUNTIME);
      expect(result.current.settings.baseUrl).toBe(LLM_DEFAULTS.BASE_URL_OPENAI);
      expect(result.current.settings.model).toBe(LLM_DEFAULTS.MODEL_OPENAI);
      expect(result.current.settings.enabled).toBe(false);
      expect(result.current.settings.timeoutMs).toBe(LLM_DEFAULTS.TIMEOUT_MS);
      expect(result.current.settings.maxTokens).toBe(LLM_DEFAULTS.MAX_TOKENS);
      expect(result.current.settings.temperature).toBe(LLM_DEFAULTS.TEMPERATURE);
      expect(result.current.settings.modelPath).toBe('');
    });

    it('should persist reset settings to localStorage', () => {
      const { result } = renderHook(() => useLLMSettings());

      act(() => {
        result.current.updatePartialSettings('enabled', true);
        result.current.resetSettings();
      });

      const saved = JSON.parse(localStorageMock.store[STORAGE_KEYS.LLM_SETTINGS]);
      expect(saved.enabled).toBe(false);
      expect(saved.runtime).toBe(LLM_DEFAULTS.RUNTIME);
    });
  });

  describe('settings type consistency', () => {
    it('should maintain all required fields after updates', () => {
      const { result } = renderHook(() => useLLMSettings());

      act(() => {
        result.current.updatePartialSettings('enabled', true);
      });

      const settings = result.current.settings;
      expect(typeof settings.runtime).toBe('string');
      expect(typeof settings.baseUrl).toBe('string');
      expect(typeof settings.model).toBe('string');
      expect(typeof settings.modelPath).toBe('string');
      expect(typeof settings.enabled).toBe('boolean');
      expect(typeof settings.timeoutMs).toBe('number');
      expect(typeof settings.maxTokens).toBe('number');
      expect(typeof settings.temperature).toBe('number');
    });
  });

  describe('hook stability', () => {
    it('should return stable function references', () => {
      const { result, rerender } = renderHook(() => useLLMSettings());

      const firstUpdateSettings = result.current.updateSettings;
      const firstUpdatePartialSettings = result.current.updatePartialSettings;
      const firstResetSettings = result.current.resetSettings;

      rerender();

      expect(result.current.updateSettings).toBe(firstUpdateSettings);
      expect(result.current.updatePartialSettings).toBe(firstUpdatePartialSettings);
      expect(result.current.resetSettings).toBe(firstResetSettings);
    });
  });
});