import { useState, useCallback, useRef, useEffect } from 'react';

export interface UseClipboardOptions {
  feedbackDuration?: number;
  onError?: (error: Error) => void;
}

export interface UseClipboardReturn {
  feedback: string | null;
  copy: (text: string, message?: string) => Promise<void>;
  copyMultiple: (texts: string[], separator?: string, message?: string) => Promise<void>;
  clearFeedback: () => void;
}

const DEFAULT_FEEDBACK_DURATION = 1800;

export function useClipboard(options: UseClipboardOptions = {}): UseClipboardReturn {
  const { feedbackDuration = DEFAULT_FEEDBACK_DURATION, onError } = options;

  const [feedback, setFeedback] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const copy = useCallback(async (text: string, message?: string) => {
    if (!text.trim()) return;

    try {
      await navigator.clipboard.writeText(text);
      if (message) {
        setFeedback(message);

        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          setFeedback((current) => (current === message ? null : current));
        }, feedbackDuration);
      }
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Copy failed'));
    }
  }, [feedbackDuration, onError]);

  const copyMultiple = useCallback(async (
    texts: string[],
    separator: string = '\n\n',
    message?: string
  ) => {
    const combined = texts.filter(Boolean).join(separator);
    await copy(combined, message);
  }, [copy]);

  const clearFeedback = useCallback(() => {
    setFeedback(null);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return {
    feedback,
    copy,
    copyMultiple,
    clearFeedback,
  };
}