import { useCallback } from 'react';
import type { Section } from '../section';

export interface UseSectionActionsOptions {
  sections: Section[];
  onReorder: (sections: Section[]) => void;
  activeSectionId?: string | null;
  onActiveChange?: (id: string | null) => void;
  generateName?: (type: string, sections: Section[]) => string;
}

export interface UseSectionActionsReturn {
  addSection: (type: string) => Section | null;
  renameSection: (id: string, newName: string) => void;
  deleteSection: (id: string) => void;
}

function defaultGenerateName(type: string, sections: Section[]): string {
  const existingNames = new Set(sections.map((s) => s.displayName));
  let name = type;
  let counter = 1;
  while (existingNames.has(name)) {
    name = `${type} ${counter}`;
    counter += 1;
  }
  return name;
}

export function useSectionActions(options: UseSectionActionsOptions): UseSectionActionsReturn {
  const {
    sections,
    onReorder,
    activeSectionId,
    onActiveChange,
    generateName = defaultGenerateName,
  } = options;

  const addSection = useCallback((type: string): Section | null => {
    const displayName = generateName(type, sections);
    const newSection: Section = {
      id: crypto.randomUUID(),
      type,
      displayName,
      sortOrder: sections.length,
      bodyText: '',
    };

    const nextSections = [...sections, newSection];
    onReorder(nextSections);
    onActiveChange?.(newSection.id);

    return newSection;
  }, [sections, onReorder, onActiveChange, generateName]);

  const renameSection = useCallback((id: string, newName: string) => {
    const nextSections = sections.map((s) =>
      s.id === id ? { ...s, displayName: newName, type: newName } : s
    );
    onReorder(nextSections);
  }, [sections, onReorder]);

  const deleteSection = useCallback((id: string) => {
    const remainingSections = sections.filter((s) => s.id !== id);
    onReorder(remainingSections);

    if (activeSectionId === id) {
      const nextActiveId = remainingSections[0]?.id ?? null;
      onActiveChange?.(nextActiveId);
    }
  }, [sections, onReorder, activeSectionId, onActiveChange]);

  return {
    addSection,
    renameSection,
    deleteSection,
  };
}