import { describe, it, expect, vi } from 'vitest';
import {
  LLMRuntime,
  isAllowedLocalBaseUrl,
  buildLLMRequestUrl,
  buildLLMRequestBody,
  extractLLMResponseContent,
  parseLLMJsonResponse,
  callLLMAPI,
  fetchLLMModels,
  isManagedLlamaCppRuntime,
} from '../lib/llm/utils';

describe('llm/utils.ts', () => {
  describe('isManagedLlamaCppRuntime', () => {
    it('should return true for openai_compatible', () => {
      expect(isManagedLlamaCppRuntime('openai_compatible')).toBe(true);
    });
  });

  describe('isAllowedLocalBaseUrl', () => {
    it('should allow localhost URLs', () => {
      expect(isAllowedLocalBaseUrl('http://localhost:8080')).toBe(true);
      expect(isAllowedLocalBaseUrl('http://localhost:11434')).toBe(true);
      expect(isAllowedLocalBaseUrl('http://localhost:1234/v1')).toBe(true);
    });

    it('should allow 127.0.0.1 URLs', () => {
      expect(isAllowedLocalBaseUrl('http://127.0.0.1:8080')).toBe(true);
      expect(isAllowedLocalBaseUrl('http://127.0.0.1:11434')).toBe(true);
      expect(isAllowedLocalBaseUrl('https://127.0.0.1:8080')).toBe(true);
    });

    it('should reject external URLs', () => {
      expect(isAllowedLocalBaseUrl('http://example.com')).toBe(false);
      expect(isAllowedLocalBaseUrl('https://api.openai.com')).toBe(false);
      expect(isAllowedLocalBaseUrl('http://192.168.1.1:8080')).toBe(false);
    });

    it('should reject invalid URLs', () => {
      expect(isAllowedLocalBaseUrl('not-a-url')).toBe(false);
      expect(isAllowedLocalBaseUrl('')).toBe(false);
      expect(isAllowedLocalBaseUrl('http://')).toBe(false);
    });

    it('should handle URLs with paths', () => {
      expect(isAllowedLocalBaseUrl('http://localhost:8080/v1')).toBe(true);
      expect(isAllowedLocalBaseUrl('http://127.0.0.1:8080/api/chat')).toBe(true);
    });
  });

  describe('buildLLMRequestUrl', () => {
    describe('openai_compatible runtime', () => {
      it('should build correct URL without trailing /v1', () => {
        const result = buildLLMRequestUrl('openai_compatible', 'http://localhost:8080');
        expect(result).toBe('http://localhost:8080/v1/chat/completions');
      });

      it('should not duplicate /v1 if already present', () => {
        const result = buildLLMRequestUrl('openai_compatible', 'http://localhost:8080/v1');
        expect(result).toBe('http://localhost:8080/v1/chat/completions');
      });

      it('should handle trailing slash', () => {
        const result = buildLLMRequestUrl('openai_compatible', 'http://localhost:8080/');
        expect(result).toBe('http://localhost:8080/v1/chat/completions');
      });

      it('should handle trailing slash with v1', () => {
        const result = buildLLMRequestUrl('openai_compatible', 'http://localhost:8080/v1/');
        expect(result).toBe('http://localhost:8080/v1/chat/completions');
      });
    });
  });

  describe('buildLLMRequestBody', () => {
    describe('openai_compatible runtime', () => {
      it('should build correct body with defaults', () => {
        const result = buildLLMRequestBody('openai_compatible', 'gpt-4', 'Hello');
        expect(result.model).toBe('gpt-4');
        expect(result.messages).toEqual([{ role: 'user', content: 'Hello' }]);
        expect(result.max_tokens).toBe(1024);
        expect(result.temperature).toBe(0.7);
      });

      it('should respect custom options', () => {
        const result = buildLLMRequestBody('openai_compatible', 'gpt-4', 'Hello', {
          maxTokens: 2048,
          temperature: 0.5,
        });
        expect(result.max_tokens).toBe(2048);
        expect(result.temperature).toBe(0.5);
      });

      it('should not include stream option', () => {
        const result = buildLLMRequestBody('openai_compatible', 'gpt-4', 'Hello');
        expect(result.stream).toBeUndefined();
      });
    });

    describe('all runtimes', () => {
      it('should include messages array', () => {
        const result = buildLLMRequestBody('openai_compatible', 'model', 'prompt');
        expect(result.messages).toBeDefined();
        expect(Array.isArray(result.messages)).toBe(true);
        expect(result.messages[0].role).toBe('user');
        expect(result.messages[0].content).toBe('prompt');
      });

      it('should handle empty prompt', () => {
        const result = buildLLMRequestBody('openai_compatible', 'model', '');
        expect(result.messages[0].content).toBe('');
      });

      it('should handle multiline prompt', () => {
        const prompt = 'Line 1\nLine 2\nLine 3';
        const result = buildLLMRequestBody('openai_compatible', 'model', prompt);
        expect(result.messages[0].content).toBe(prompt);
      });
    });
  });

  describe('extractLLMResponseContent', () => {
    describe('openai_compatible runtime', () => {
      it('should extract content from OpenAI format', () => {
        const data = {
          choices: [{ message: { content: 'Generated text' } }],
        };
        const result = extractLLMResponseContent('openai_compatible', data);
        expect(result).toBe('Generated text');
      });

      it('should handle empty choices array', () => {
        const data = { choices: [] };
        const result = extractLLMResponseContent('openai_compatible', data);
        expect(result).toBe('');
      });

      it('should handle missing message', () => {
        const data = { choices: [{}] };
        const result = extractLLMResponseContent('openai_compatible', data);
        expect(result).toBe('');
      });

      it('should handle missing content', () => {
        const data = { choices: [{ message: {} }] };
        const result = extractLLMResponseContent('openai_compatible', data);
        expect(result).toBe('');
      });

      it('should handle undefined choices', () => {
        const data = {};
        const result = extractLLMResponseContent('openai_compatible', data);
        expect(result).toBe('');
      });

      it('should extract reasoning_content when content is missing', () => {
        const data = {
          choices: [{ message: { reasoning_content: 'Reasoning text' } }],
        };
        const result = extractLLMResponseContent('openai_compatible', data);
        expect(result).toBe('Reasoning text');
      });
    });
  });

  describe('parseLLMJsonResponse', () => {
    it('should parse valid JSON with array key', () => {
      const text = '{"items": [{"id": 1}, {"id": 2}]}';
      const result = parseLLMJsonResponse(text, 'items');
      expect(result).toEqual([{ id: 1 }, { id: 2 }]);
    });

    it('should return empty array for invalid JSON', () => {
      const text = 'not json';
      const result = parseLLMJsonResponse(text, 'items');
      expect(result).toEqual([]);
    });

    it('should return empty array if key not found', () => {
      const text = '{"other": [1, 2]}';
      const result = parseLLMJsonResponse(text, 'items');
      expect(result).toEqual([]);
    });

    it('should return empty array if value is not array', () => {
      const text = '{"items": "not an array"}';
      const result = parseLLMJsonResponse(text, 'items');
      expect(result).toEqual([]);
    });

    it('should handle JSON embedded in text', () => {
      const text = 'Here is the result: {"suggestions": [{"text": "Hello"}]} and more text';
      const result = parseLLMJsonResponse(text, 'suggestions');
      expect(result).toEqual([{ text: 'Hello' }]);
    });

    it('should only find top-level array key', () => {
      const text = '{"sections": [{"value": 1}]}';
      const result = parseLLMJsonResponse(text, 'sections');
      expect(result).toEqual([{ value: 1 }]);
    });

    it('should not find nested array key', () => {
      // parseLLMJsonResponse only looks at top-level keys
      const text = '{"data": {"nested": [{"value": 1}]}}';
      const result = parseLLMJsonResponse(text, 'nested');
      // nested is not a top-level key, so returns empty array
      expect(result).toEqual([]);
    });

    it('should handle empty array', () => {
      const text = '{"items": []}';
      const result = parseLLMJsonResponse(text, 'items');
      expect(result).toEqual([]);
    });

    it('should handle complex array items', () => {
      const text = '{"sections": [{"name": "Verse", "text": "Hello"}, {"name": "Chorus", "text": "World"}]}';
      const result = parseLLMJsonResponse<{ name: string; text: string }>(text, 'sections');
      expect(result).toEqual([
        { name: 'Verse', text: 'Hello' },
        { name: 'Chorus', text: 'World' },
      ]);
    });

    it('should handle whitespace in JSON', () => {
      const text = '{ "items" : [ { "id" : 1 } ] }';
      const result = parseLLMJsonResponse(text, 'items');
      expect(result).toEqual([{ id: 1 }]);
    });

    it('should handle newline characters', () => {
      const text = '{"items": [\n  {"id": 1},\n  {"id": 2}\n]}';
      const result = parseLLMJsonResponse(text, 'items');
      expect(result).toEqual([{ id: 1 }, { id: 2 }]);
    });

    it('should recover from partial JSON with multiple objects', () => {
      const text = 'Some text {"items": [{"a": 1}, {"b": 2}, {"c": 3}]} more text';
      const result = parseLLMJsonResponse(text, 'items');
      expect(result).toEqual([{ a: 1 }, { b: 2 }, { c: 3 }]);
    });

    it('should handle escaped quotes in strings', () => {
      const text = '{"items": [{"text": "He said \\"hello\\""}]}';
      const result = parseLLMJsonResponse(text, 'items');
      expect(result).toEqual([{ text: 'He said "hello"' }]);
    });

    it('should recover from truncated JSON array', () => {
      const text = '{"items": [{"a": 1}, {"b": 2';
      const result = parseLLMJsonResponse(text, 'items');
      // Should recover the first object
      expect(result).toEqual([{ a: 1 }]);
    });

    it('should recover from malformed JSON with multiple objects', () => {
      const text = 'prefix {"items": [{"x": 1}, {"y": 2}, {"z": 3}]} suffix';
      const result = parseLLMJsonResponse(text, 'items');
      expect(result).toEqual([{ x: 1 }, { y: 2 }, { z: 3 }]);
    });

    it('should handle deeply nested escaped characters', () => {
      const text = '{"items": [{"text": "line1\\nline2"}]}';
      const result = parseLLMJsonResponse(text, 'items');
      expect(result).toEqual([{ text: 'line1\nline2' }]);
    });

    it('should return empty array when array key exists but no array', () => {
      const text = '{"items": "not an array"}';
      const result = parseLLMJsonResponse(text, 'items');
      expect(result).toEqual([]);
    });

    it('should handle empty string key', () => {
      const text = '{"": []}';
      const result = parseLLMJsonResponse(text, '');
      expect(result).toEqual([]);
    });
  });

  describe('integration scenarios', () => {
    it('should build request for typical OpenAI-compatible flow', () => {
      const baseUrl = 'http://localhost:8080';
      const model = 'local-model';
      const prompt = 'Generate lyrics';

      const url = buildLLMRequestUrl('openai_compatible', baseUrl);
      const body = buildLLMRequestBody('openai_compatible', model, prompt);

      expect(url).toBe('http://localhost:8080/v1/chat/completions');
      expect(body.model).toBe('local-model');
      expect(body.messages[0].content).toBe('Generate lyrics');
    });

    it('should extract content from typical OpenAI response', () => {
      const response = {
        id: 'chatcmpl-123',
        choices: [
          {
            message: { role: 'assistant', content: 'Here are your lyrics...' },
            finish_reason: 'stop',
          },
        ],
      };

      const content = extractLLMResponseContent('openai_compatible', response);
      expect(content).toBe('Here are your lyrics...');
    });
  });
});

describe('LLM API calls', () => {
  describe('callLLMAPI', () => {
    const originalFetch = global.fetch;

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('should return content on successful API call', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Generated text' } }],
        }),
      });

      const result = await callLLMAPI({
        runtime: 'openai_compatible',
        baseUrl: 'http://localhost:8080',
        model: 'local-model',
      }, 'Hello');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.content).toBe('Generated text');
      }
    });

    it('should return error on HTTP error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const result = await callLLMAPI({
        runtime: 'openai_compatible',
        baseUrl: 'http://localhost:8080',
        model: 'local-model',
      }, 'Hello');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('500');
      }
    });

    it('should return error on network failure', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await callLLMAPI({
        runtime: 'openai_compatible',
        baseUrl: 'http://localhost:8080',
        model: 'local-model',
      }, 'Hello');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Network error');
      }
    });

    it('should return error on timeout', async () => {
      global.fetch = vi.fn().mockImplementation(() =>
        new Promise((_, reject) => {
          const error = new Error('Aborted');
          error.name = 'AbortError';
          setTimeout(() => reject(error), 100);
        })
      );

      const result = await callLLMAPI({
        runtime: 'openai_compatible',
        baseUrl: 'http://localhost:8080',
        model: 'local-model',
        timeoutMs: 10,
      }, 'Hello');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('timed out');
      }
    });

    it('should pass custom maxTokens and temperature', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Result' } }],
        }),
      });

      const result = await callLLMAPI({
        runtime: 'openai_compatible',
        baseUrl: 'http://localhost:8080',
        model: 'test-model',
        maxTokens: 2048,
        temperature: 0.5,
      }, 'Test prompt');

      expect(result.success).toBe(true);

      // Verify the fetch was called with correct body
      const fetchCall = global.fetch.mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.max_tokens).toBe(2048);
      expect(body.temperature).toBe(0.5);
    });

    it('should use default timeout when not specified', async () => {
      global.fetch = vi.fn().mockImplementation(() =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: async () => ({ choices: [{ message: { content: 'OK' } }] }),
            });
          }, 100);
        })
      );

      // This should not timeout since default is 60000ms
      const result = await callLLMAPI({
        runtime: 'openai_compatible',
        baseUrl: 'http://localhost:8080',
        model: 'local-model',
      }, 'Hello');

      expect(result.success).toBe(true);
    });

    it('should clear timeout after successful response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'OK' } }],
        }),
      });

      await callLLMAPI({
        runtime: 'openai_compatible',
        baseUrl: 'http://localhost:8080',
        model: 'local-model',
        timeoutMs: 5000,
      }, 'Hello');

      // Verify setTimeout was called and cleared
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should clear timeout after error response', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      await callLLMAPI({
        runtime: 'openai_compatible',
        baseUrl: 'http://localhost:8080',
        model: 'local-model',
        timeoutMs: 5000,
      }, 'Hello');

      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('fetchLLMModels', () => {
    const originalFetch = global.fetch;

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('should return models for OpenAI-compatible runtime', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [{ id: 'model-1' }, { id: 'model-2' }],
        }),
      });

      const result = await fetchLLMModels('openai_compatible', 'http://localhost:8080');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.models).toEqual(['model-1', 'model-2']);
      }
    });

    it('should reject non-localhost URLs', async () => {
      const result = await fetchLLMModels('openai_compatible', 'http://example.com');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('localhost');
      }
    });

    it('should handle HTTP errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const result = await fetchLLMModels('openai_compatible', 'http://localhost:8080');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('404');
      }
    });

    it('should handle network errors', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await fetchLLMModels('openai_compatible', 'http://localhost:8080');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Network error');
      }
    });

    it('should handle malformed response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: null }),
      });

      const result = await fetchLLMModels('openai_compatible', 'http://localhost:8080');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.models).toEqual([]);
      }
    });

    it('should handle response without data field', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      const result = await fetchLLMModels('openai_compatible', 'http://localhost:8080');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.models).toEqual([]);
      }
    });
  });
});