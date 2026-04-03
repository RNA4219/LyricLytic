import { useState, useCallback } from 'react';

export const BPM_PRESETS = [172, 144, 132, 128, 124, 122, 121, 120, 92, 90] as const;

export interface UseBpmReturn {
  bpmValue: number;
  bpmMode: 'preset' | 'custom';
  handleBpmPresetChange: (value: string) => void;
  handleCustomBpmChange: (value: string) => void;
  setBpmValue: (value: number) => void;
  calculateEstimatedSeconds: (characterCount: number) => number;
}

export function useBpm(initialBpm?: number): UseBpmReturn {
  const defaultBpm = initialBpm ?? 120;
  const initialMode = BPM_PRESETS.includes(defaultBpm) ? 'preset' : 'custom';

  const [bpmValue, setBpmValueState] = useState(defaultBpm);
  const [bpmMode, setBpmMode] = useState<'preset' | 'custom'>(initialMode);

  const handleBpmPresetChange = useCallback((value: string) => {
    if (value === 'custom') {
      setBpmMode('custom');
      return;
    }

    setBpmMode('preset');
    setBpmValueState(Number(value));
  }, []);

  const handleCustomBpmChange = useCallback((value: string) => {
    const nextBpm = Math.max(40, Number(value) || 120);
    setBpmValueState(nextBpm);
  }, []);

  const setBpmValue = useCallback((value: number) => {
    setBpmValueState(value);
    setBpmMode(BPM_PRESETS.includes(value) ? 'preset' : 'custom');
  }, []);

  const calculateEstimatedSeconds = useCallback((characterCount: number) => {
    if (bpmValue <= 0) return 0;
    return Math.max(0, Math.round((characterCount * 60) / bpmValue));
  }, [bpmValue]);

  return {
    bpmValue,
    bpmMode,
    handleBpmPresetChange,
    handleCustomBpmChange,
    setBpmValue,
    calculateEstimatedSeconds,
  };
}