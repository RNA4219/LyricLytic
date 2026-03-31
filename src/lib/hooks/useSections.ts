import { useState, useCallback, useRef, useEffect } from 'react';
import { EDITOR, SECTION_PRESETS } from '../config';
import { generateUniqueSectionName } from '../../pages/editor/sectionUtils';

export interface Section {
  id: string;
  type: string;
  displayName: string;
  sortOrder: number;
  bodyText: string;
}

export type SectionPreset = typeof SECTION_PRESETS[number];

export interface UseSectionsOptions {
  autoSaveDelay?: number;
  onSave?: (sections: Section[]) => void;
}

export interface UseSectionsReturn {
  sections: Section[];
  activeSectionId: string | null;
  isAllView: boolean;
  setSections: React.Dispatch<React.SetStateAction<Section[]>>;
  setActiveSectionId: (id: string | null) => void;
  addSection: (type: string) => void;
  renameSection: (id: string, newName: string) => void;
  deleteSection: (id: string) => void;
  moveSection: (id: string, direction: 'up' | 'down') => void;
  updateSectionBody: (id: string, bodyText: string) => void;
  insertText: (text: string) => void;
  queueAutoSave: (sections: Section[]) => void;
  resetFromData: (data: Section[]) => void;
}

/**
 * Hook for managing lyric sections with auto-save support
 */
export function useSections(options: UseSectionsOptions = {}): UseSectionsReturn {
  const { autoSaveDelay = EDITOR.AUTO_SAVE_DEBOUNCE_MS, onSave } = options;

  const [sections, setSections] = useState<Section[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const isAllView = activeSectionId === EDITOR.ALL_SECTIONS_ID;

  const addSection = useCallback((type: string) => {
    const uniqueName = generateUniqueSectionName(type, sections);
    const newSection: Section = {
      id: crypto.randomUUID(),
      type,
      displayName: uniqueName,
      sortOrder: sections.length,
      bodyText: '',
    };
    setSections(prev => [...prev, newSection]);
    setActiveSectionId(newSection.id);
  }, [sections]);

  const renameSection = useCallback((id: string, newName: string) => {
    setSections(prev => prev.map(s =>
      s.id === id ? { ...s, displayName: newName, type: newName } : s
    ));
  }, []);

  const deleteSection = useCallback((id: string) => {
    setSections(prev => {
      const remaining = prev.filter(s => s.id !== id);
      // Re-sort remaining sections
      return remaining.map((s, idx) => ({ ...s, sortOrder: idx }));
    });
    // Update active section if needed
    setActiveSectionId(prev => {
      if (prev === id) {
        return sections.length > 1 ? sections.find(s => s.id !== id)?.id ?? null : null;
      }
      return prev;
    });
  }, [sections]);

  const moveSection = useCallback((id: string, direction: 'up' | 'down') => {
    setSections(prev => {
      const idx = prev.findIndex(s => s.id === id);
      if (idx < 0) return prev;

      const newIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= prev.length) return prev;

      const next = [...prev];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return next.map((s, order) => ({ ...s, sortOrder: order }));
    });
  }, []);

  const updateSectionBody = useCallback((id: string, bodyText: string) => {
    setSections(prev => prev.map(s =>
      s.id === id ? { ...s, bodyText } : s
    ));
  }, []);

  const insertText = useCallback((text: string) => {
    if (!activeSectionId || activeSectionId === EDITOR.ALL_SECTIONS_ID) return;

    setSections(prev => prev.map(s => {
      if (s.id !== activeSectionId) return s;
      const newBodyText = s.bodyText ? `${s.bodyText}\n${text}` : text;
      return { ...s, bodyText: newBodyText };
    }));
  }, [activeSectionId]);

  const queueAutoSave = useCallback((secs: Section[]) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      onSave?.(secs);
    }, autoSaveDelay);
  }, [autoSaveDelay, onSave]);

  const resetFromData = useCallback((data: Section[]) => {
    setSections(data);
    setActiveSectionId(data.length > 0 ? EDITOR.ALL_SECTIONS_ID : null);
  }, []);

  return {
    sections,
    activeSectionId,
    isAllView,
    setSections,
    setActiveSectionId,
    addSection,
    renameSection,
    deleteSection,
    moveSection,
    updateSectionBody,
    insertText,
    queueAutoSave,
    resetFromData,
  };
}
