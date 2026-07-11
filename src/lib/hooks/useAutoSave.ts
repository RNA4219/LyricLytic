import { useState, useCallback, useRef, useEffect } from 'react';

export interface UseAutoSaveOptions<T> {
  saveFn: (data: T) => Promise<void>;
  delayMs?: number;
}

export interface UseAutoSaveReturn<T> {
  saving: boolean;
  hasPending: boolean;
  lastSaved: Date | null;
  error: string | null;
  queueAutoSave: (data: T) => void;
  saveNow: (data: T) => Promise<boolean>;
  flush: () => Promise<boolean>;
  retry: () => Promise<boolean>;
  cancelPending: () => void;
  clearError: () => void;
}

const DEFAULT_DELAY_MS = 1000;

export function useAutoSave<T>(options: UseAutoSaveOptions<T>): UseAutoSaveReturn<T> {
  const { saveFn, delayMs = DEFAULT_DELAY_MS } = options;

  const [saving, setSaving] = useState(false);
  const [hasPending, setHasPending] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingDataRef = useRef<T | null>(null);
  const drainPromiseRef = useRef<Promise<boolean> | null>(null);
  const saveFnRef = useRef(saveFn);
  const mountedRef = useRef(true);

  useEffect(() => {
    saveFnRef.current = saveFn;
  }, [saveFn]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const drainPending = useCallback((): Promise<boolean> => {
    if (drainPromiseRef.current) {
      return drainPromiseRef.current;
    }

    const run = async (): Promise<boolean> => {
      let succeeded = true;
      if (mountedRef.current) setSaving(true);
      try {
        while (pendingDataRef.current !== null) {
          const data = pendingDataRef.current;
          pendingDataRef.current = null;
          if (mountedRef.current) {
            setHasPending(false);
            setError(null);
          }
          try {
            await saveFnRef.current(data);
            if (mountedRef.current) setLastSaved(new Date());
          } catch (saveError) {
            if (pendingDataRef.current === null) pendingDataRef.current = data;
            if (mountedRef.current) {
              setHasPending(true);
              setError('Auto-save failed');
            }
            console.error(saveError);
            succeeded = false;
            break;
          }
        }
      } finally {
        if (mountedRef.current) setSaving(false);
        return succeeded;
      }
    };

    const promise = run();
    drainPromiseRef.current = promise;
    void promise.finally(() => {
      if (drainPromiseRef.current === promise) drainPromiseRef.current = null;
    });
    return promise;
  }, []);

  const flush = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    return drainPending();
  }, [drainPending]);

  const queueAutoSave = useCallback((data: T) => {
    pendingDataRef.current = data;
    setHasPending(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      void drainPending();
    }, delayMs);
  }, [delayMs, drainPending]);

  const saveNow = useCallback(async (data: T): Promise<boolean> => {
    pendingDataRef.current = data;
    setHasPending(true);
    return flush();
  }, [flush]);

  const retry = useCallback(async (): Promise<boolean> => {
    setError(null);
    return flush();
  }, [flush]);

  const cancelPending = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    pendingDataRef.current = null;
    setHasPending(false);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    saving,
    hasPending,
    lastSaved,
    error,
    queueAutoSave,
    saveNow,
    flush,
    retry,
    cancelPending,
    clearError,
  };
}
