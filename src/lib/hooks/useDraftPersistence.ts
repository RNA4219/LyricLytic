import { useCallback, useEffect } from 'react';
import { DraftSectionInput, saveDraft } from '../api';
import { sectionsToBody } from '../section';
import { Section } from '../section/types';
import { useAutoSave } from './useAutoSave';
import { useWindowCloseFlush } from './useWindowCloseFlush';

export interface DraftSaveSnapshot {
  projectId: string;
  sections: Section[];
  bpm: number;
  styleText: string;
  vocalText: string;
}

interface DraftPersistenceOptions {
  projectId?: string;
  bpm: number;
  styleText: string;
  vocalText: string;
  setBeforeLeave: (handler: (() => Promise<boolean>) | null) => void;
}

export function useDraftPersistence({
  projectId,
  bpm,
  styleText,
  vocalText,
  setBeforeLeave,
}: DraftPersistenceOptions) {
  const persistDraft = useCallback(async (snapshot: DraftSaveSnapshot) => {
    const sectionInputs: DraftSectionInput[] = snapshot.sections.map((section) => ({
      draft_section_id: section.id,
      section_type: section.type,
      display_name: section.displayName,
      sort_order: section.sortOrder,
      body_text: section.bodyText,
    }));
    await saveDraft({
      project_id: snapshot.projectId,
      body_text: sectionsToBody(snapshot.sections),
      sections: sectionInputs,
      bpm: snapshot.bpm,
      style_text: snapshot.styleText,
      vocal_text: snapshot.vocalText,
    });
  }, []);

  const autoSave = useAutoSave<DraftSaveSnapshot>({ saveFn: persistDraft, delayMs: 1000 });
  const { flush, hasPending } = autoSave;

  useEffect(() => {
    setBeforeLeave(flush);
    return () => setBeforeLeave(null);
  }, [flush, setBeforeLeave]);
  useWindowCloseFlush({ flush, hasPending });

  const createSnapshot = useCallback((
    nextSections: Section[],
    overrides?: { styleText?: string; vocalText?: string; bpm?: number },
  ): DraftSaveSnapshot | null => {
    if (!projectId) return null;
    return {
      projectId,
      sections: nextSections.map((section) => ({ ...section })),
      bpm: overrides?.bpm ?? bpm,
      styleText: overrides?.styleText ?? styleText,
      vocalText: overrides?.vocalText ?? vocalText,
    };
  }, [bpm, projectId, styleText, vocalText]);

  const queueAutoSave = useCallback((nextSections: Section[], overrides?: { styleText?: string; vocalText?: string; bpm?: number }) => {
    const snapshot = createSnapshot(nextSections, overrides);
    if (snapshot) autoSave.queueAutoSave(snapshot);
  }, [autoSave, createSnapshot]);

  const saveNow = useCallback(async (nextSections: Section[], overrides?: { styleText?: string; vocalText?: string; bpm?: number }) => {
    const snapshot = createSnapshot(nextSections, overrides);
    if (snapshot) return autoSave.saveNow(snapshot);
    return true;
  }, [autoSave, createSnapshot]);

  return { ...autoSave, queueAutoSave, saveNow };
}
