/**
 * LLM utility functions shared across components
 */

export type LLMRuntime = 'openai_compatible' | 'ollama' | 'lm_studio';

export interface LLMConfig {
  runtime: LLMRuntime;
  baseUrl: string;
  model: string;
  timeoutMs?: number;
  maxTokens?: number;
  temperature?: number;
}

export function isManagedLlamaCppRuntime(runtime: LLMRuntime): boolean {
  return runtime === 'openai_compatible';
}

export interface LLMModelListResult {
  success: boolean;
  models?: string[];
  error?: string;
}

/**
 * Validates that the base URL points to localhost or 127.0.0.1
 * for security reasons (only local LLM connections allowed)
 */
export function isAllowedLocalBaseUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost';
  } catch {
    return false;
  }
}

/**
 * Builds the request URL based on runtime type and base URL
 */
export function buildLLMRequestUrl(runtime: LLMRuntime, baseUrl: string): string {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');

  if (runtime === 'ollama') {
    return `${normalizedBaseUrl}/api/chat`;
  }

  return normalizedBaseUrl.endsWith('/v1')
    ? `${normalizedBaseUrl}/chat/completions`
    : `${normalizedBaseUrl}/v1/chat/completions`;
}

function buildModelListUrl(runtime: LLMRuntime, baseUrl: string): string {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');

  if (runtime === 'ollama') {
    return `${normalizedBaseUrl}/api/tags`;
  }

  return normalizedBaseUrl.endsWith('/v1')
    ? `${normalizedBaseUrl}/models`
    : `${normalizedBaseUrl}/v1/models`;
}

export async function fetchLLMModels(
  runtime: LLMRuntime,
  baseUrl: string
): Promise<LLMModelListResult> {
  try {
    if (!isAllowedLocalBaseUrl(baseUrl)) {
      return { success: false, error: 'LLM base URL must point to localhost or 127.0.0.1' };
    }

    const response = await fetch(buildModelListUrl(runtime, baseUrl), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }

    const data = await response.json();
    const models = runtime === 'ollama'
      ? ((data.models as Array<{ name?: string }> | undefined) ?? [])
          .map((entry) => entry.name?.trim())
          .filter((name): name is string => Boolean(name))
      : ((data.data as Array<{ id?: string }> | undefined) ?? [])
          .map((entry) => entry.id?.trim())
          .filter((id): id is string => Boolean(id));

    return { success: true, models };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Request failed' };
  }
}

/**
 * Builds the request body based on runtime type
 */
export function buildLLMRequestBody(
  runtime: LLMRuntime,
  model: string,
  prompt: string,
  options?: { maxTokens?: number; temperature?: number }
): Record<string, unknown> {
  const temperature = options?.temperature ?? 0.7;

  if (runtime === 'ollama') {
    return {
      model,
      stream: false,
      messages: [{ role: 'user', content: prompt }],
      options: { temperature },
    };
  }

  return {
    model,
    max_tokens: options?.maxTokens ?? 1024,
    temperature,
    messages: [{ role: 'user', content: prompt }],
  };
}

/**
 * Extracts the response content from LLM API response
 */
export function extractLLMResponseContent(
  runtime: LLMRuntime,
  data: Record<string, unknown>
): string {
  if (runtime === 'ollama') {
    return (data.message as { content?: string })?.content || '';
  }

  return ((data.choices as Array<{ message?: { content?: string } }>)?.[0]?.message?.content) || '';
}

/**
 * Parses JSON from LLM response, handling cases where model adds extra text
 */
export function parseLLMJsonResponse<T>(text: string, arrayKey: string): T[] {
  // Try to extract JSON from response (handle cases where model adds extra text)
  let jsonStr = text;

  // Remove potential markdown code blocks
  const jsonMatch = text.match(new RegExp(`\\{[\\s\\S]*"${arrayKey}"[\\s\\S]*\\}`));
  if (jsonMatch) {
    jsonStr = jsonMatch[0];
  }

  try {
    const parsed = JSON.parse(jsonStr);
    if (parsed[arrayKey] && Array.isArray(parsed[arrayKey])) {
      return parsed[arrayKey];
    }
  } catch {
    // JSON parse failed
    return [];
  }

  return [];
}

/**
 * Calls LLM API with timeout and error handling
 */
export async function callLLMAPI(
  config: LLMConfig,
  prompt: string
): Promise<{ success: true; content: string } | { success: false; error: string }> {
  const { runtime, baseUrl, model, timeoutMs = 60000, maxTokens, temperature } = config;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const requestUrl = buildLLMRequestUrl(runtime, baseUrl);
    const requestBody = buildLLMRequestBody(runtime, model, prompt, { maxTokens, temperature });

    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return { success: false, error: `API error: ${response.status}` };
    }

    const data = await response.json();
    const content = extractLLMResponseContent(runtime, data);

    return { success: true, content };
  } catch (e) {
    clearTimeout(timeoutId);

    if (e instanceof Error && e.name === 'AbortError') {
      return { success: false, error: 'Request timed out' };
    }

    return { success: false, error: e instanceof Error ? e.message : 'Request failed' };
  }
}
