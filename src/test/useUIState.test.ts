import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUIState } from '../lib/hooks/useUIState';

describe('useUIState', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  describe('dialogs', () => {
    it('should have all dialogs closed initially', () => {
      const { result } = renderHook(() => useUIState());
      expect(result.current.showDeleteDialog).toBe(false);
      expect(result.current.showDiffViewer).toBe(false);
      expect(result.current.showExportPanel).toBe(false);
      expect(result.current.showImportDialog).toBe(false);
    });

    it('should toggle delete dialog', () => {
      const { result } = renderHook(() => useUIState());

      act(() => {
        result.current.setShowDeleteDialog(true);
      });

      expect(result.current.showDeleteDialog).toBe(true);
    });

    it('should toggle diff viewer', () => {
      const { result } = renderHook(() => useUIState());

      act(() => {
        result.current.setShowDiffViewer(true);
      });

      expect(result.current.showDiffViewer).toBe(true);
    });
  });

  describe('toasts', () => {
    it('should have all toasts hidden initially', () => {
      const { result } = renderHook(() => useUIState());
      expect(result.current.saveToastVisible).toBe(false);
      expect(result.current.hideToastVisible).toBe(false);
      expect(result.current.allCopyFeedback).toBe(false);
      expect(result.current.lyricsOnlyCopyFeedback).toBe(false);
    });

    it('should show save toast temporarily', () => {
      const { result } = renderHook(() => useUIState());

      act(() => {
        result.current.showSaveToast();
      });

      expect(result.current.saveToastVisible).toBe(true);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.saveToastVisible).toBe(false);
    });

    it('should show hide toast temporarily', () => {
      const { result } = renderHook(() => useUIState());

      act(() => {
        result.current.showHideToast();
      });

      expect(result.current.hideToastVisible).toBe(true);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.hideToastVisible).toBe(false);
    });

    it('should show copy feedback temporarily', () => {
      const { result } = renderHook(() => useUIState());

      act(() => {
        result.current.showAllCopyFeedback();
      });

      expect(result.current.allCopyFeedback).toBe(true);

      act(() => {
        vi.advanceTimersByTime(1500);
      });

      expect(result.current.allCopyFeedback).toBe(false);
    });
  });
});