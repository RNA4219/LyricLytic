import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePhoneticGuide } from '../lib/hooks/usePhoneticGuide';

describe('usePhoneticGuide', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('should have default height', () => {
      const { result } = renderHook(() => usePhoneticGuide());
      expect(result.current.height).toBe(220);
    });

    it('should have empty rows initially', () => {
      const { result } = renderHook(() => usePhoneticGuide());
      expect(result.current.rows).toEqual([]);
    });
  });

  describe('setHeight', () => {
    it('should update height', () => {
      const { result } = renderHook(() => usePhoneticGuide());

      act(() => {
        result.current.setHeight(300);
      });

      expect(result.current.height).toBe(300);
    });
  });

  describe('setRows', () => {
    it('should update rows', () => {
      const { result } = renderHook(() => usePhoneticGuide());
      const mockRows = [
        { line: 'test', romanizedText: 'te su to', vowelText: 'e u o', consonantText: 't s t', source: 'fallback' as const },
      ];

      act(() => {
        result.current.setRows(mockRows);
      });

      expect(result.current.rows).toEqual(mockRows);
    });
  });

  describe('resize handling', () => {
    it('should track resizing state', () => {
      const { result } = renderHook(() => usePhoneticGuide());

      expect(result.current.isResizing).toBe(false);

      act(() => {
        result.current.handleResizeStart();
      });

      expect(result.current.isResizing).toBe(true);
    });

    it('should stop resizing', () => {
      const { result } = renderHook(() => usePhoneticGuide());

      act(() => {
        result.current.handleResizeStart();
      });

      expect(result.current.isResizing).toBe(true);

      act(() => {
        result.current.handleResizeEnd();
      });

      expect(result.current.isResizing).toBe(false);
    });
  });

  describe('height constraints', () => {
    it('should clamp height to minimum', () => {
      const { result } = renderHook(() => usePhoneticGuide({ minHeight: 100, maxHeight: 400 }));

      act(() => {
        result.current.setHeight(50);
      });

      expect(result.current.height).toBe(100);
    });

    it('should clamp height to maximum', () => {
      const { result } = renderHook(() => usePhoneticGuide({ minHeight: 100, maxHeight: 400 }));

      act(() => {
        result.current.setHeight(500);
      });

      expect(result.current.height).toBe(400);
    });
  });
});