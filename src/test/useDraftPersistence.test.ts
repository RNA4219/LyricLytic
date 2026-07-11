import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { saveDraft } from '../lib/api';
import { useDraftPersistence } from '../lib/hooks/useDraftPersistence';

vi.mock('../lib/api', () => ({ saveDraft: vi.fn().mockResolvedValue(undefined) }));

const sections = [{ id: 'verse-1', type: 'Verse', displayName: 'Verse', sortOrder: 0, bodyText: 'hello' }];

describe('useDraftPersistence', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.clearAllMocks(); });
  afterEach(() => vi.useRealTimers());

  it('queues one snapshot containing sections and style metadata', async () => {
    const setBeforeLeave = vi.fn();
    const { result } = renderHook(() => useDraftPersistence({
      projectId: 'project-1',
      bpm: 120,
      styleText: 'bright',
      vocalText: 'soft',
      setBeforeLeave,
    }));
    act(() => result.current.queueAutoSave(sections));
    await act(async () => vi.advanceTimersByTimeAsync(1000));
    expect(saveDraft).toHaveBeenCalledWith(expect.objectContaining({
      project_id: 'project-1',
      bpm: 120,
      style_text: 'bright',
      vocal_text: 'soft',
      sections: [expect.objectContaining({ draft_section_id: 'verse-1', body_text: 'hello' })],
    }));
    expect(setBeforeLeave).toHaveBeenCalled();
  });

  it('flushes an override immediately and succeeds without a project id', async () => {
    const setBeforeLeave = vi.fn();
    const { result } = renderHook(() => useDraftPersistence({
      bpm: 120,
      styleText: '',
      vocalText: '',
      setBeforeLeave,
    }));
    await act(async () => {
      await expect(result.current.saveNow(sections)).resolves.toBe(true);
    });
    expect(saveDraft).not.toHaveBeenCalled();
  });
});
