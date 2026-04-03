import { useState, useCallback, useRef, useEffect } from 'react';

export interface UseAutoSaveOptions<T> {
  saveFn: (data: T) => Promise<void>;
  delayMs?: number;
}

export interface UseAutoSaveReturn<T> {
  saving: boolean;
  lastSaved: Date | null;
  error: string | null;
  queueAutoSave: (data: T) => void;
  saveNow: (data: T) => Promise<void>;
  cancelPending: () => void;
  clearError: () => void;
}

const DEFAULT_DELAY_MS = 1000;

export function useAutoSave<T>(options: UseAutoSaveOptions<T>): UseAutoSaveReturn<T> {
  const { saveFn, delayMs = DEFAULT_DELAY_MS } = options;

  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingDataRef = useRef<T | null>(null);
  const isSavingRef = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const executeSave = useCallback(async (data: T) => {
    if (isSavingRef.current) return;

    isSavingRef.current = true;
    setSaving(true);
    setError(null);

    try {
      await saveFn(data);
      setLastSaved(new Date());
    } catch (e) {
      setError('Auto-save failed');
      console.error(e);
    } finally {
      setSaving(false);
      isSavingRef.current = false;
    }
  }, [saveFn]);

  const queueAutoSave = useCallback((data: T) => {
    pendingDataRef.current = data;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      if (pendingDataRef.current !== null) {
        void executeSave(pendingDataRef.current);
        pendingDataRef.current = null;
      }
    }, delayMs);
  }, [delayMs, executeSave]);

  const saveNow = useCallback(async (data: T) => {
    // Cancel any pending save
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    pendingDataRef.current = null;

    await executeSave(data);
  }, [executeSave]);

  const cancelPending = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    pendingDataRef.current = null;
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    saving,
    lastSaved,
    error,
    queueAutoSave,
    saveNow,
    cancelPending,
    clearError,
  };
}