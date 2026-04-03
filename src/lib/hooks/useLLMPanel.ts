import { useState, useCallback, useRef, useEffect } from 'react';

export interface UseLLMPanelReturn {
  error: string | null;
  copyMessage: string | null;
  lastResponse: string | null;
  setError: (error: string | null) => void;
  clearError: () => void;
  copyToClipboard: (text: string, message: string) => Promise<void>;
  setLastResponse: (response: string | null) => void;
  clearLastResponse: () => void;
  reset: () => void;
}

const COPY_MESSAGE_DURATION_MS = 1800;

export function useLLMPanel(): UseLLMPanelReturn {
  const [error, setErrorState] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [lastResponse, setLastResponseState] = useState<string | null>(null);

  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const setError = useCallback((newError: string | null) => {
    setErrorState(newError);
  }, []);

  const clearError = useCallback(() => {
    setErrorState(null);
  }, []);

  const copyToClipboard = useCallback(async (text: string, message: string) => {
    await navigator.clipboard.writeText(text);
    setCopyMessage(message);

    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
    }

    copyTimeoutRef.current = setTimeout(() => {
      setCopyMessage((current) => (current === message ? null : current));
    }, COPY_MESSAGE_DURATION_MS);
  }, []);

  const setLastResponse = useCallback((response: string | null) => {
    setLastResponseState(response);
  }, []);

  const clearLastResponse = useCallback(() => {
    setLastResponseState(null);
  }, []);

  const reset = useCallback(() => {
    setErrorState(null);
    setCopyMessage(null);
    setLastResponseState(null);
    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
    }
  }, []);

  return {
    error,
    copyMessage,
    lastResponse,
    setError,
    clearError,
    copyToClipboard,
    setLastResponse,
    clearLastResponse,
    reset,
  };
}