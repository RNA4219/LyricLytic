import { useState, useRef, useCallback } from 'react';
import type { RhymeGuideRow } from '../rhyme/analysis';

export interface UsePhoneticGuideOptions {
  minHeight?: number;
  maxHeight?: number;
  defaultHeight?: number;
}

export interface UsePhoneticGuideReturn {
  height: number;
  rows: RhymeGuideRow[];
  isResizing: boolean;
  setHeight: (height: number) => void;
  setRows: React.Dispatch<React.SetStateAction<RhymeGuideRow[]>>;
  handleResizeStart: () => void;
  handleResizeEnd: () => void;
}

export function usePhoneticGuide(options: UsePhoneticGuideOptions = {}): UsePhoneticGuideReturn {
  const { minHeight = 80, maxHeight = 500, defaultHeight = 220 } = options;

  const [height, setHeightState] = useState(defaultHeight);
  const [rows, setRows] = useState<RhymeGuideRow[]>([]);
  const [isResizing, setIsResizing] = useState(false);

  const setHeight = useCallback((newHeight: number) => {
    const clampedHeight = Math.min(maxHeight, Math.max(minHeight, newHeight));
    setHeightState(clampedHeight);
  }, [minHeight, maxHeight]);

  const handleResizeStart = useCallback(() => {
    setIsResizing(true);
  }, []);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
  }, []);

  return {
    height,
    rows,
    isResizing,
    setHeight,
    setRows,
    handleResizeStart,
    handleResizeEnd,
  };
}