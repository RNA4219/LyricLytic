/**
 * LLM utility functions shared across components
 */

export type LLMRuntime = 'openai_compatible';

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
export function buildLLMRequestUrl(_runtime: LLMRuntime, baseUrl: string): string {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');

  return normalizedBaseUrl.endsWith('/v1')
    ? `${normalizedBaseUrl}/chat/completions`
    : `${normalizedBaseUrl}/v1/chat/completions`;
}

function buildModelListUrl(_runtime: LLMRuntime, baseUrl: string): string {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');

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
    const models = ((data.data as Array<{ id?: string }> | undefined) ?? [])
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
  _runtime: LLMRuntime,
  model: string,
  prompt: string,
  options?: { maxTokens?: number; temperature?: number }
): Record<string, unknown> {
  const temperature = options?.temperature ?? 0.7;

  return {
    model,
    max_tokens: options?.maxTokens ?? 1024,
    temperature,
    messages: [{ role: 'user', content: prompt }],
    chat_template_kwargs: {
      enable_thinking: false,
    },
  };
}

/**
 * Extracts the response content from LLM API response
 */
export function extractLLMResponseContent(
  _runtime: LLMRuntime,
  data: Record<string, unknown>
): string {
  const message = (data.choices as Array<{
    message?: { content?: string; reasoning_content?: string };
  }>)?.[0]?.message;

  return message?.content || message?.reasoning_content || '';
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
    const recovered = recoverArrayItemsFromPartialJson<T>(jsonStr, arrayKey);
    if (recovered.length > 0) {
      return recovered;
    }

    return [];
  }

  return [];
}

function recoverArrayItemsFromPartialJson<T>(text: string, arrayKey: string): T[] {
  const keyIndex = text.indexOf(`"${arrayKey}"`);
  if (keyIndex === -1) {
    return [];
  }

  const arrayStart = text.indexOf('[', keyIndex);
  if (arrayStart === -1) {
    return [];
  }

  const results: T[] = [];
  let depth = 0;
  let inString = false;
  let escaped = false;
  let objectStart = -1;

  for (let i = arrayStart + 1; i < text.length; i += 1) {
    const ch = text[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (ch === '\\') {
      escaped = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      continue;
    }

    if (inString) {
      continue;
    }

    if (ch === '{') {
      if (depth === 0) {
        objectStart = i;
      }
      depth += 1;
      continue;
    }

    if (ch === '}') {
      if (depth > 0) {
        depth -= 1;
      }

      if (depth === 0 && objectStart !== -1) {
        const objectText = text.slice(objectStart, i + 1);
        try {
          results.push(JSON.parse(objectText) as T);
        } catch {
          // ignore incomplete or malformed fragments
        }
        objectStart = -1;
      }
      continue;
    }

    if (ch === ']' && depth === 0) {
      break;
    }
  }

  return results;
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
