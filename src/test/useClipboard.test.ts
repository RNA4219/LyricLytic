import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useClipboard } from '../lib/hooks/useClipboard';

describe('useClipboard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('should have null feedback', () => {
      const { result } = renderHook(() => useClipboard());
      expect(result.current.feedback).toBe(null);
    });
  });

  describe('copy', () => {
    it('should copy text to clipboard', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        writable: true,
      });

      const { result } = renderHook(() => useClipboard());

      await act(async () => {
        await result.current.copy('test text');
      });

      expect(writeTextMock).toHaveBeenCalledWith('test text');
    });

    it('should show feedback message', async () => {
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: vi.fn().mockResolvedValue(undefined) },
        writable: true,
      });

      const { result } = renderHook(() => useClipboard({ feedbackDuration: 1500 }));

      await act(async () => {
        await result.current.copy('test', 'Copied!');
      });

      expect(result.current.feedback).toBe('Copied!');
    });

    it('should clear feedback after duration', async () => {
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: vi.fn().mockResolvedValue(undefined) },
        writable: true,
      });

      const { result } = renderHook(() => useClipboard({ feedbackDuration: 1500 }));

      await act(async () => {
        await result.current.copy('test', 'Copied!');
      });

      expect(result.current.feedback).toBe('Copied!');

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1500);
      });

      expect(result.current.feedback).toBe(null);
    });

    it('should not copy empty text', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        writable: true,
      });

      const { result } = renderHook(() => useClipboard());

      await act(async () => {
        await result.current.copy('');
      });

      expect(writeTextMock).not.toHaveBeenCalled();
    });

    it('should not copy whitespace-only text', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        writable: true,
      });

      const { result } = renderHook(() => useClipboard());

      await act(async () => {
        await result.current.copy('   ');
      });

      expect(writeTextMock).not.toHaveBeenCalled();
    });

    it('should call onError on failure', async () => {
      const onError = vi.fn();
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: vi.fn().mockRejectedValue(new Error('Failed')) },
        writable: true,
      });

      const { result } = renderHook(() => useClipboard({ onError }));

      await act(async () => {
        await result.current.copy('test');
      });

      expect(onError).toHaveBeenCalled();
    });

    it('should not show feedback without message', async () => {
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: vi.fn().mockResolvedValue(undefined) },
        writable: true,
      });

      const { result } = renderHook(() => useClipboard());

      await act(async () => {
        await result.current.copy('test');
      });

      expect(result.current.feedback).toBe(null);
    });
  });

  describe('copyMultiple', () => {
    it('should join multiple texts with separator', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        writable: true,
      });

      const { result } = renderHook(() => useClipboard());

      await act(async () => {
        await result.current.copyMultiple(['line1', 'line2', 'line3'], '\n');
      });

      expect(writeTextMock).toHaveBeenCalledWith('line1\nline2\nline3');
    });

    it('should use default separator', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        writable: true,
      });

      const { result } = renderHook(() => useClipboard());

      await act(async () => {
        await result.current.copyMultiple(['line1', 'line2']);
      });

      expect(writeTextMock).toHaveBeenCalledWith('line1\n\nline2');
    });

    it('should filter empty strings', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        writable: true,
      });

      const { result } = renderHook(() => useClipboard());

      await act(async () => {
        await result.current.copyMultiple(['line1', '', 'line2'], '\n');
      });

      expect(writeTextMock).toHaveBeenCalledWith('line1\nline2');
    });

    it('should show feedback message', async () => {
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: vi.fn().mockResolvedValue(undefined) },
        writable: true,
      });

      const { result } = renderHook(() => useClipboard());

      await act(async () => {
        await result.current.copyMultiple(['line1', 'line2'], '\n', 'All copied!');
      });

      expect(result.current.feedback).toBe('All copied!');
    });
  });

  describe('clearFeedback', () => {
    it('should clear feedback immediately', async () => {
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: vi.fn().mockResolvedValue(undefined) },
        writable: true,
      });

      const { result } = renderHook(() => useClipboard());

      await act(async () => {
        await result.current.copy('test', 'Copied!');
      });

      expect(result.current.feedback).toBe('Copied!');

      act(() => {
        result.current.clearFeedback();
      });

      expect(result.current.feedback).toBe(null);
    });

    it('should cancel pending timeout', async () => {
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: vi.fn().mockResolvedValue(undefined) },
        writable: true,
      });

      const { result } = renderHook(() => useClipboard({ feedbackDuration: 1500 }));

      await act(async () => {
        await result.current.copy('test', 'Copied!');
      });

      act(() => {
        result.current.clearFeedback();
      });

      // Timer should have been cleared
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000);
      });

      // Should still be null (no state change from cleared timeout)
      expect(result.current.feedback).toBe(null);
    });
  });
});