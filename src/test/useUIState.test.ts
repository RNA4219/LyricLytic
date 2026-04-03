import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUIState } from '../lib/hooks/useUIState';

describe('useUIState', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
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

    it('should toggle export panel', () => {
      const { result } = renderHook(() => useUIState());

      act(() => {
        result.current.setShowExportPanel(true);
      });

      expect(result.current.showExportPanel).toBe(true);

      act(() => {
        result.current.setShowExportPanel(false);
      });

      expect(result.current.showExportPanel).toBe(false);
    });

    it('should toggle import dialog', () => {
      const { result } = renderHook(() => useUIState());

      act(() => {
        result.current.setShowImportDialog(true);
      });

      expect(result.current.showImportDialog).toBe(true);
    });

    it('should allow multiple dialogs open simultaneously', () => {
      const { result } = renderHook(() => useUIState());

      act(() => {
        result.current.setShowDeleteDialog(true);
        result.current.setShowDiffViewer(true);
      });

      expect(result.current.showDeleteDialog).toBe(true);
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

    it('should show all copy feedback temporarily', () => {
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

    it('should show lyrics only copy feedback temporarily', () => {
      const { result } = renderHook(() => useUIState());

      act(() => {
        result.current.showLyricsOnlyCopyFeedback();
      });

      expect(result.current.lyricsOnlyCopyFeedback).toBe(true);

      act(() => {
        vi.advanceTimersByTime(1500);
      });

      expect(result.current.lyricsOnlyCopyFeedback).toBe(false);
    });

    it('should reset timer when showSaveToast called multiple times', () => {
      const { result } = renderHook(() => useUIState());

      act(() => {
        result.current.showSaveToast();
      });

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.saveToastVisible).toBe(true);

      act(() => {
        result.current.showSaveToast();
      });

      act(() => {
        vi.advanceTimersByTime(1500);
      });

      expect(result.current.saveToastVisible).toBe(true);

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current.saveToastVisible).toBe(false);
    });

    it('should reset timer when showAllCopyFeedback called multiple times', () => {
      const { result } = renderHook(() => useUIState());

      act(() => {
        result.current.showAllCopyFeedback();
      });

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.allCopyFeedback).toBe(true);

      act(() => {
        result.current.showAllCopyFeedback();
      });

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.allCopyFeedback).toBe(true);

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current.allCopyFeedback).toBe(false);
    });

    it('should allow multiple toasts visible simultaneously', () => {
      const { result } = renderHook(() => useUIState());

      act(() => {
        result.current.showSaveToast();
        result.current.showAllCopyFeedback();
      });

      expect(result.current.saveToastVisible).toBe(true);
      expect(result.current.allCopyFeedback).toBe(true);
    });
  });
});