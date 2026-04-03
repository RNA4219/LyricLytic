import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStyleVocal } from '../lib/hooks/useStyleVocal';

describe('useStyleVocal', () => {
  describe('initial state', () => {
    it('should have empty styleText', () => {
      const { result } = renderHook(() => useStyleVocal());
      expect(result.current.styleText).toBe('');
    });

    it('should have empty vocalText', () => {
      const { result } = renderHook(() => useStyleVocal());
      expect(result.current.vocalText).toBe('');
    });

    it('should accept initial values', () => {
      const { result } = renderHook(() => useStyleVocal({
        initialStyleText: 'upbeat pop',
        initialVocalText: 'soft vocals',
      }));
      expect(result.current.styleText).toBe('upbeat pop');
      expect(result.current.vocalText).toBe('soft vocals');
    });
  });

  describe('setStyleText', () => {
    it('should update styleText', () => {
      const { result } = renderHook(() => useStyleVocal());

      act(() => {
        result.current.setStyleText('melancholic');
      });

      expect(result.current.styleText).toBe('melancholic');
    });
  });

  describe('setVocalText', () => {
    it('should update vocalText', () => {
      const { result } = renderHook(() => useStyleVocal());

      act(() => {
        result.current.setVocalText('powerful belt');
      });

      expect(result.current.vocalText).toBe('powerful belt');
    });
  });

  describe('reset', () => {
    it('should reset both texts', () => {
      const { result } = renderHook(() => useStyleVocal({
        initialStyleText: 'pop',
        initialVocalText: 'soft',
      }));

      act(() => {
        result.current.setStyleText('rock');
        result.current.setVocalText('harsh');
      });

      expect(result.current.styleText).toBe('rock');
      expect(result.current.vocalText).toBe('harsh');

      act(() => {
        result.current.reset();
      });

      expect(result.current.styleText).toBe('pop');
      expect(result.current.vocalText).toBe('soft');
    });
  });

  describe('onChange callback', () => {
    it('should call onChange when styleText changes', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() => useStyleVocal({ onChange }));

      act(() => {
        result.current.setStyleText('jazz');
      });

      expect(onChange).toHaveBeenCalledWith({ styleText: 'jazz', vocalText: '' });
    });

    it('should call onChange when vocalText changes', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() => useStyleVocal({ onChange }));

      act(() => {
        result.current.setVocalText('raspy');
      });

      expect(onChange).toHaveBeenCalledWith({ styleText: '', vocalText: 'raspy' });
    });
  });
});