import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAutoSave } from '../lib/hooks/useAutoSave';

describe('useAutoSave', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('should have saving as false', () => {
      const saveFn = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useAutoSave({ saveFn }));

      expect(result.current.saving).toBe(false);
    });

    it('should have lastSaved as null', () => {
      const saveFn = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useAutoSave({ saveFn }));

      expect(result.current.lastSaved).toBe(null);
    });

    it('should have error as null', () => {
      const saveFn = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useAutoSave({ saveFn }));

      expect(result.current.error).toBe(null);
    });
  });

  describe('queueAutoSave', () => {
    it('should queue save with delay', async () => {
      const saveFn = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useAutoSave({ saveFn, delayMs: 1000 }));

      act(() => {
        result.current.queueAutoSave('test data');
      });

      expect(saveFn).not.toHaveBeenCalled();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });

      expect(saveFn).toHaveBeenCalledWith('test data');
    });

    it('should debounce multiple calls', async () => {
      const saveFn = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useAutoSave({ saveFn, delayMs: 1000 }));

      act(() => {
        result.current.queueAutoSave('data1');
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(500);
      });

      act(() => {
        result.current.queueAutoSave('data2');
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });

      expect(saveFn).toHaveBeenCalledTimes(1);
      expect(saveFn).toHaveBeenCalledWith('data2');
    });

    it('should set saving to true during save', async () => {
      let resolveSave: () => void;
      const saveFn = vi.fn().mockImplementation(() => new Promise<void>((resolve) => {
        resolveSave = resolve;
      }));
      const { result } = renderHook(() => useAutoSave({ saveFn, delayMs: 100 }));

      act(() => {
        result.current.queueAutoSave('data');
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });

      expect(result.current.saving).toBe(true);

      await act(async () => {
        resolveSave!();
        await vi.runAllTimersAsync();
      });

      expect(result.current.saving).toBe(false);
    });

    it('should set error when save fails', async () => {
      const saveFn = vi.fn().mockRejectedValue(new Error('Save failed'));
      const { result } = renderHook(() => useAutoSave({ saveFn, delayMs: 100 }));

      act(() => {
        result.current.queueAutoSave('data');
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });

      expect(result.current.error).toBe('Auto-save failed');
    });
  });

  describe('saveNow', () => {
    it('should save immediately', async () => {
      const saveFn = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useAutoSave({ saveFn }));

      await act(async () => {
        await result.current.saveNow('test data');
      });

      expect(saveFn).toHaveBeenCalledWith('test data');
    });

    it('should update lastSaved on success', async () => {
      const saveFn = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useAutoSave({ saveFn }));

      await act(async () => {
        await result.current.saveNow('test data');
      });

      expect(result.current.lastSaved).toBeInstanceOf(Date);
    });

    it('should not save while already saving', async () => {
      let resolveSave: () => void;
      const saveFn = vi.fn().mockImplementation(() => new Promise<void>((resolve) => {
        resolveSave = resolve;
      }));
      const { result } = renderHook(() => useAutoSave({ saveFn }));

      act(() => {
        void result.current.saveNow('data1');
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });

      await act(async () => {
        await result.current.saveNow('data2');
      });

      resolveSave!();
      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(saveFn).toHaveBeenCalledTimes(1);
    });

    it('should cancel pending save when called', async () => {
      const saveFn = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useAutoSave({ saveFn, delayMs: 1000 }));

      act(() => {
        result.current.queueAutoSave('queued data');
      });

      await act(async () => {
        await result.current.saveNow('immediate data');
      });

      // saveNow should cancel the queued save and save immediately
      expect(saveFn).toHaveBeenCalledTimes(1);
      expect(saveFn).toHaveBeenCalledWith('immediate data');
    });

    it('should set error when save fails', async () => {
      const saveFn = vi.fn().mockRejectedValue(new Error('Save failed'));
      const { result } = renderHook(() => useAutoSave({ saveFn }));

      await act(async () => {
        await result.current.saveNow('data');
      });

      expect(result.current.error).toBe('Auto-save failed');
    });
  });

  describe('cancelPending', () => {
    it('should cancel pending save', async () => {
      const saveFn = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useAutoSave({ saveFn, delayMs: 1000 }));

      act(() => {
        result.current.queueAutoSave('data');
        result.current.cancelPending();
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000);
      });

      expect(saveFn).not.toHaveBeenCalled();
    });
  });

  describe('clearError', () => {
    it('should clear error', async () => {
      const saveFn = vi.fn().mockRejectedValue(new Error('Save failed'));
      const { result } = renderHook(() => useAutoSave({ saveFn, delayMs: 100 }));

      act(() => {
        result.current.queueAutoSave('data');
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });

      expect(result.current.error).toBe('Auto-save failed');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
    });
  });
});