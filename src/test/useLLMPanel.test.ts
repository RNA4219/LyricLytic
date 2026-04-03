import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLLMPanel } from '../lib/hooks/useLLMPanel';

describe('useLLMPanel', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('should have empty error', () => {
      const { result } = renderHook(() => useLLMPanel());
      expect(result.current.error).toBe(null);
    });

    it('should have null copyMessage', () => {
      const { result } = renderHook(() => useLLMPanel());
      expect(result.current.copyMessage).toBe(null);
    });

    it('should have null lastResponse', () => {
      const { result } = renderHook(() => useLLMPanel());
      expect(result.current.lastResponse).toBe(null);
    });
  });

  describe('error handling', () => {
    it('should set error', () => {
      const { result } = renderHook(() => useLLMPanel());

      act(() => {
        result.current.setError('Something went wrong');
      });

      expect(result.current.error).toBe('Something went wrong');
    });

    it('should clear error', () => {
      const { result } = renderHook(() => useLLMPanel());

      act(() => {
        result.current.setError('Error');
      });

      expect(result.current.error).toBe('Error');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
    });
  });

  describe('copy functionality', () => {
    it('should show copy message', async () => {
      // Mock clipboard API
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        writable: true,
      });

      const { result } = renderHook(() => useLLMPanel());

      await act(async () => {
        await result.current.copyToClipboard('Test text', 'Copied!');
      });

      expect(writeTextMock).toHaveBeenCalledWith('Test text');
      expect(result.current.copyMessage).toBe('Copied!');
    });
  });

  describe('response tracking', () => {
    it('should store last response', () => {
      const { result } = renderHook(() => useLLMPanel());

      act(() => {
        result.current.setLastResponse('API response');
      });

      expect(result.current.lastResponse).toBe('API response');
    });

    it('should clear last response', () => {
      const { result } = renderHook(() => useLLMPanel());

      act(() => {
        result.current.setLastResponse('Response');
      });

      expect(result.current.lastResponse).toBe('Response');

      act(() => {
        result.current.clearLastResponse();
      });

      expect(result.current.lastResponse).toBe(null);
    });
  });

  describe('reset', () => {
    it('should reset error', () => {
      const { result } = renderHook(() => useLLMPanel());

      act(() => {
        result.current.setError('Error');
      });

      expect(result.current.error).toBe('Error');

      act(() => {
        result.current.reset();
      });

      expect(result.current.error).toBe(null);
    });

    it('should reset lastResponse', () => {
      const { result } = renderHook(() => useLLMPanel());

      act(() => {
        result.current.setLastResponse('Response');
      });

      expect(result.current.lastResponse).toBe('Response');

      act(() => {
        result.current.reset();
      });

      expect(result.current.lastResponse).toBe(null);
    });
  });
});