import { useState, useCallback } from 'react';

export interface UseStyleVocalOptions {
  initialStyleText?: string;
  initialVocalText?: string;
  onChange?: (data: { styleText: string; vocalText: string }) => void;
}

export interface UseStyleVocalReturn {
  styleText: string;
  vocalText: string;
  setStyleText: (text: string) => void;
  setVocalText: (text: string) => void;
  reset: () => void;
}

export function useStyleVocal(options: UseStyleVocalOptions = {}): UseStyleVocalReturn {
  const { initialStyleText = '', initialVocalText = '', onChange } = options;

  const [styleText, setStyleTextState] = useState(initialStyleText);
  const [vocalText, setVocalTextState] = useState(initialVocalText);

  const setStyleText = useCallback((text: string) => {
    setStyleTextState(text);
    onChange?.({ styleText: text, vocalText });
  }, [vocalText, onChange]);

  const setVocalText = useCallback((text: string) => {
    setVocalTextState(text);
    onChange?.({ styleText, vocalText: text });
  }, [styleText, onChange]);

  const reset = useCallback(() => {
    setStyleTextState(initialStyleText);
    setVocalTextState(initialVocalText);
  }, [initialStyleText, initialVocalText]);

  return {
    styleText,
    vocalText,
    setStyleText,
    setVocalText,
    reset,
  };
}