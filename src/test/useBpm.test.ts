import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBpm } from '../lib/hooks/useBpm';

const BPM_PRESETS = [172, 144, 132, 128, 124, 122, 121, 120, 92, 90];

describe('useBpm', () => {
  describe('initial state', () => {
    it('should have default bpm value of 120', () => {
      const { result } = renderHook(() => useBpm());
      expect(result.current.bpmValue).toBe(120);
    });

    it('should have preset mode for default bpm', () => {
      const { result } = renderHook(() => useBpm());
      expect(result.current.bpmMode).toBe('preset');
    });

    it('should accept initial bpm value', () => {
      const { result } = renderHook(() => useBpm(144));
      expect(result.current.bpmValue).toBe(144);
      expect(result.current.bpmMode).toBe('preset');
    });

    it('should use custom mode for non-preset initial value', () => {
      const { result } = renderHook(() => useBpm(100));
      expect(result.current.bpmValue).toBe(100);
      expect(result.current.bpmMode).toBe('custom');
    });
  });

  describe('preset mode', () => {
    it('should switch to preset mode when selecting preset value', () => {
      const { result } = renderHook(() => useBpm(100));

      act(() => {
        result.current.handleBpmPresetChange('128');
      });

      expect(result.current.bpmValue).toBe(128);
      expect(result.current.bpmMode).toBe('preset');
    });

    it('should switch to custom mode when selecting custom', () => {
      const { result } = renderHook(() => useBpm(120));

      act(() => {
        result.current.handleBpmPresetChange('custom');
      });

      expect(result.current.bpmMode).toBe('custom');
    });
  });

  describe('custom bpm input', () => {
    it('should update bpm value from custom input', () => {
      const { result } = renderHook(() => useBpm());

      act(() => {
        result.current.handleCustomBpmChange('150');
      });

      expect(result.current.bpmValue).toBe(150);
    });

    it('should clamp bpm value to minimum 40', () => {
      const { result } = renderHook(() => useBpm());

      act(() => {
        result.current.handleCustomBpmChange('30');
      });

      expect(result.current.bpmValue).toBe(40);
    });

    it('should default to 120 for invalid input', () => {
      const { result } = renderHook(() => useBpm());

      act(() => {
        result.current.handleCustomBpmChange('abc');
      });

      expect(result.current.bpmValue).toBe(120);
    });

    it('should handle empty input', () => {
      const { result } = renderHook(() => useBpm(150));

      act(() => {
        result.current.handleCustomBpmChange('');
      });

      expect(result.current.bpmValue).toBe(120);
    });
  });

  describe('setBpmValue', () => {
    it('should set bpm value directly', () => {
      const { result } = renderHook(() => useBpm());

      act(() => {
        result.current.setBpmValue(132);
      });

      expect(result.current.bpmValue).toBe(132);
    });

    it('should update mode based on preset membership', () => {
      const { result } = renderHook(() => useBpm(100));

      act(() => {
        result.current.setBpmValue(120);
      });

      expect(result.current.bpmMode).toBe('preset');
    });
  });

  describe('estimated seconds calculation', () => {
    it('should calculate estimated seconds for given character count', () => {
      const { result } = renderHook(() => useBpm(120));

      // 120 chars at 120 bpm = 60 seconds
      expect(result.current.calculateEstimatedSeconds(120)).toBe(60);
    });

    it('should return 0 for zero bpm', () => {
      const { result } = renderHook(() => useBpm(0));

      expect(result.current.calculateEstimatedSeconds(100)).toBe(0);
    });

    it('should return 0 for negative bpm', () => {
      const { result } = renderHook(() => useBpm(-10));

      expect(result.current.calculateEstimatedSeconds(100)).toBe(0);
    });

    it('should return 0 for zero characters', () => {
      const { result } = renderHook(() => useBpm(120));

      expect(result.current.calculateEstimatedSeconds(0)).toBe(0);
    });
  });
});