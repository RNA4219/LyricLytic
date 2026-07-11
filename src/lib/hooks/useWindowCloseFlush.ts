import { useEffect, useRef } from 'react';
import { getCurrentWindow, type CloseRequestedEvent } from '@tauri-apps/api/window';
import type { UnlistenFn } from '@tauri-apps/api/event';

export interface WindowCloseAdapter {
  onCloseRequested(handler: (event: CloseRequestedEvent) => void | Promise<void>): Promise<UnlistenFn>;
  destroy(): Promise<void>;
}

interface UseWindowCloseFlushOptions {
  flush: () => Promise<boolean>;
  enabled?: boolean;
  hasPending?: boolean;
  adapter?: WindowCloseAdapter;
}

/**
 * Prevents Tauri from destroying the window until the latest autosave has completed.
 * The adapter is injectable so the close protocol can be tested without a native window.
 */
export function useWindowCloseFlush({ flush, enabled = true, hasPending = false, adapter }: UseWindowCloseFlushOptions): void {
  const flushRef = useRef(flush);
  useEffect(() => {
    flushRef.current = flush;
  }, [flush]);

  useEffect(() => {
    const runningInTauri = typeof window !== 'undefined' && Boolean((window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__);
    if (!enabled || typeof window === 'undefined' || (!adapter && !runningInTauri)) return undefined;

    const target = adapter ?? getCurrentWindow();
    let disposed = false;
    let closing = false;
    let unlisten: UnlistenFn | undefined;

    const onCloseRequested = async (event: CloseRequestedEvent) => {
      event.preventDefault();
      if (closing) return;
      closing = true;
      const flushed = await flushRef.current();
      if (flushed && !disposed) {
        await target.destroy();
      } else {
        closing = false;
      }
    };

    void target.onCloseRequested(onCloseRequested).then((dispose) => {
      if (disposed) dispose();
      else unlisten = dispose;
    });

    return () => {
      disposed = true;
      unlisten?.();
    };
  }, [adapter, enabled]);

  useEffect(() => {
    if (!enabled || !hasPending || typeof window === 'undefined') return undefined;
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warnBeforeUnload);
    return () => window.removeEventListener('beforeunload', warnBeforeUnload);
  }, [enabled, hasPending]);
}
