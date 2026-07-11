import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useWindowCloseFlush, type WindowCloseAdapter } from '../lib/hooks/useWindowCloseFlush';

function createAdapter() {
  let handler: ((event: { preventDefault: () => void }) => void | Promise<void>) | undefined;
  const adapter: WindowCloseAdapter = {
    onCloseRequested: vi.fn(async (next) => {
      handler = next as typeof handler;
      return vi.fn();
    }),
    destroy: vi.fn(async () => undefined),
  };
  return { adapter, requestClose: () => handler?.({ preventDefault: vi.fn() }) };
}

describe('useWindowCloseFlush', () => {
  afterEach(() => vi.restoreAllMocks());

  it('prevents close until flush succeeds, then destroys the window', async () => {
    const { adapter, requestClose } = createAdapter();
    const flush = vi.fn().mockResolvedValue(true);
    renderHook(() => useWindowCloseFlush({ flush, adapter }));

    await act(async () => {
      await requestClose();
    });

    expect(flush).toHaveBeenCalledTimes(1);
    expect(adapter.destroy).toHaveBeenCalledTimes(1);
  });

  it('keeps the window open and allows retry when flush fails', async () => {
    const { adapter, requestClose } = createAdapter();
    const flush = vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    renderHook(() => useWindowCloseFlush({ flush, adapter }));

    await act(async () => {
      await requestClose();
    });
    expect(adapter.destroy).not.toHaveBeenCalled();

    await act(async () => {
      await requestClose();
    });
    expect(adapter.destroy).toHaveBeenCalledTimes(1);
  });

  it('unregisters the close listener on unmount', async () => {
    const { adapter } = createAdapter();
    const unlisten = vi.fn();
    (adapter.onCloseRequested as ReturnType<typeof vi.fn>).mockResolvedValueOnce(unlisten);
    const { unmount } = renderHook(() => useWindowCloseFlush({ flush: vi.fn().mockResolvedValue(true), adapter }));
    await act(async () => undefined);
    unmount();
    expect(unlisten).toHaveBeenCalledTimes(1);
  });

  it('disposes a listener that resolves after unmount', async () => {
    let resolveSubscription!: (dispose: () => void) => void;
    const adapter: WindowCloseAdapter = {
      onCloseRequested: vi.fn(() => new Promise(resolve => { resolveSubscription = resolve; })),
      destroy: vi.fn(async () => undefined),
    };
    const { unmount } = renderHook(() => useWindowCloseFlush({ flush: vi.fn().mockResolvedValue(true), adapter }));
    unmount();
    const dispose = vi.fn();
    await act(async () => resolveSubscription(dispose));
    expect(dispose).toHaveBeenCalledTimes(1);
  });

  it('warns the browser when pending data exists', () => {
    const { adapter } = createAdapter();
    const { unmount } = renderHook(() => useWindowCloseFlush({ flush: vi.fn().mockResolvedValue(true), adapter, hasPending: true }));
    const event = new Event('beforeunload', { cancelable: true }) as BeforeUnloadEvent;
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    unmount();
  });
});
