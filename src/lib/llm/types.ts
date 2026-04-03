import type { LLMRuntime } from './utils';

/**
 * Common props shared by all LLM panels
 */
export interface LLMPanelBaseProps {
  runtime: LLMRuntime;
  baseUrl: string;
  model: string;
  modelPath: string;
  enabled: boolean;
  timeoutMs?: number;
  maxTokens?: number;
  temperature?: number;
}

/**
 * Result of an LLM API call
 */
export interface LLMAPIResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Common state for LLM panels
 */
export interface LLMPanelState {
  loading: boolean;
  error: string | null;
  copyMessage: string | null;
}