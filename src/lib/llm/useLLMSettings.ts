import { useState, useCallback } from 'react';
import { LLMRuntime } from './utils';
import { LLM_DEFAULTS, STORAGE_KEYS } from '../config';

export interface LLMSettings {
  runtime: LLMRuntime;
  baseUrl: string;
  model: string;
  executablePath: string;
  modelPath: string;
  enabled: boolean;
  timeoutMs: number;
  maxTokens: number;
  temperature: number;
}

const DEFAULT_SETTINGS: LLMSettings = {
  runtime: LLM_DEFAULTS.RUNTIME,
  baseUrl: LLM_DEFAULTS.BASE_URL_OPENAI,
  model: LLM_DEFAULTS.MODEL_OPENAI,
  executablePath: LLM_DEFAULTS.EXECUTABLE_PATH,
  modelPath: '',
  enabled: false,
  timeoutMs: LLM_DEFAULTS.TIMEOUT_MS,
  maxTokens: LLM_DEFAULTS.MAX_TOKENS,
  temperature: LLM_DEFAULTS.TEMPERATURE,
};

function loadSettings(): LLMSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.LLM_SETTINGS);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_SETTINGS, ...parsed, runtime: 'openai_compatible' };
    }
  } catch {
    // Ignore parse errors
  }
  return DEFAULT_SETTINGS;
}

function saveSettings(settings: LLMSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LLM_SETTINGS, JSON.stringify(settings));
  } catch {
    // Ignore storage errors
  }
}

export function useLLMSettings() {
  const [settings, setSettings] = useState<LLMSettings>(loadSettings);

  const updateSettings = useCallback((newSettings: LLMSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  }, []);

  const updatePartialSettings = useCallback(
    <K extends keyof LLMSettings>(key: K, value: LLMSettings[K]) => {
      setSettings((prev) => {
        const next = { ...prev, [key]: value };
        saveSettings(next);
        return next;
      });
    },
    []
  );

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    saveSettings(DEFAULT_SETTINGS);
  }, []);

  return {
    settings,
    updateSettings,
    updatePartialSettings,
    resetSettings,
  };
}
