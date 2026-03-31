import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSections } from '../lib/hooks/useSections';

describe('useSections', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('should start with empty sections', () => {
      const { result } = renderHook(() => useSections());

      expect(result.current.sections).toEqual([]);
      expect(result.current.activeSectionId).toBe(null);
      expect(result.current.isAllView).toBe(false);
    });

    it('should accept initial sections via resetFromData', () => {
      const { result } = renderHook(() => useSections());

      const initialSections = [
        { id: '1', type: 'Verse', displayName: 'Verse', sortOrder: 0, bodyText: 'Hello' },
      ];

      act(() => {
        result.current.resetFromData(initialSections);
      });

      expect(result.current.sections).toEqual(initialSections);
      expect(result.current.activeSectionId).toBe('__all__');
    });
  });

  describe('addSection', () => {
    it('should add a new section', () => {
      const { result } = renderHook(() => useSections());

      act(() => {
        result.current.addSection('Verse');
      });

      expect(result.current.sections.length).toBe(1);
      expect(result.current.sections[0].type).toBe('Verse');
      expect(result.current.sections[0].displayName).toBe('Verse');
      expect(result.current.activeSectionId).toBe(result.current.sections[0].id);
    });

    it('should generate unique names for duplicate types', () => {
      const { result } = renderHook(() => useSections());

      // Add first Verse
      act(() => {
        result.current.addSection('Verse');
      });
      expect(result.current.sections[0].displayName).toBe('Verse');

      // Add second Verse - should get unique name
      act(() => {
        result.current.addSection('Verse');
      });
      expect(result.current.sections.length).toBe(2);
      // Second verse should have a unique name (Verse 2)
      expect(result.current.sections[1].displayName).toMatch(/^Verse/);
    });

    it('should set new section as active', () => {
      const { result } = renderHook(() => useSections());

      act(() => {
        result.current.addSection('Verse');
      });

      const newSectionId = result.current.sections[0].id;
      expect(result.current.activeSectionId).toBe(newSectionId);
    });

    it('should add section with empty bodyText', () => {
      const { result } = renderHook(() => useSections());

      act(() => {
        result.current.addSection('Chorus');
      });

      expect(result.current.sections[0].bodyText).toBe('');
    });
  });

  describe('renameSection', () => {
    it('should rename section displayName', () => {
      const { result } = renderHook(() => useSections());

      act(() => {
        result.current.addSection('Verse');
      });

      const sectionId = result.current.sections[0].id;

      act(() => {
        result.current.renameSection(sectionId, 'Verse 1');
      });

      expect(result.current.sections[0].displayName).toBe('Verse 1');
    });

    it('should update type when renaming', () => {
      const { result } = renderHook(() => useSections());

      act(() => {
        result.current.addSection('Verse');
      });

      const sectionId = result.current.sections[0].id;

      act(() => {
        result.current.renameSection(sectionId, 'Chorus');
      });

      expect(result.current.sections[0].type).toBe('Chorus');
    });

    it('should not affect other sections', () => {
      const { result } = renderHook(() => useSections());

      act(() => {
        result.current.addSection('Verse');
        result.current.addSection('Chorus');
      });

      const verseId = result.current.sections[0].id;

      act(() => {
        result.current.renameSection(verseId, 'Verse 1');
      });

      expect(result.current.sections[0].displayName).toBe('Verse 1');
      expect(result.current.sections[1].displayName).toMatch(/^Chorus/);
    });
  });

  describe('deleteSection', () => {
    it('should remove section', () => {
      const { result } = renderHook(() => useSections());

      act(() => {
        result.current.addSection('Verse');
        result.current.addSection('Chorus');
      });

      expect(result.current.sections.length).toBe(2);

      const verseId = result.current.sections[0].id;

      act(() => {
        result.current.deleteSection(verseId);
      });

      expect(result.current.sections.length).toBe(1);
      expect(result.current.sections[0].type).toBe('Chorus');
    });

    it('should update active section when deleting active', () => {
      const { result } = renderHook(() => useSections());

      act(() => {
        result.current.addSection('Verse');
        result.current.addSection('Chorus');
      });

      const verseId = result.current.sections[0].id;
      const chorusId = result.current.sections[1].id;

      act(() => {
        result.current.setActiveSectionId(verseId);
      });

      act(() => {
        result.current.deleteSection(verseId);
      });

      expect(result.current.activeSectionId).toBe(chorusId);
    });

    it('should set active to null when deleting last section', () => {
      const { result } = renderHook(() => useSections());

      act(() => {
        result.current.addSection('Verse');
      });

      const verseId = result.current.sections[0].id;

      act(() => {
        result.current.deleteSection(verseId);
      });

      expect(result.current.sections.length).toBe(0);
      expect(result.current.activeSectionId).toBe(null);
    });
  });

  describe('moveSection', () => {
    it('should move section up', () => {
      const { result } = renderHook(() => useSections());

      act(() => {
        result.current.addSection('Intro');
        result.current.addSection('Verse');
        result.current.addSection('Chorus');
      });

      const chorusId = result.current.sections[2].id;

      act(() => {
        result.current.moveSection(chorusId, 'up');
      });

      expect(result.current.sections[1].type).toBe('Chorus');
      expect(result.current.sections[2].type).toBe('Verse');
    });

    it('should move section down', () => {
      const { result } = renderHook(() => useSections());

      act(() => {
        result.current.addSection('Intro');
        result.current.addSection('Verse');
        result.current.addSection('Chorus');
      });

      const introId = result.current.sections[0].id;

      act(() => {
        result.current.moveSection(introId, 'down');
      });

      expect(result.current.sections[0].type).toBe('Verse');
      expect(result.current.sections[1].type).toBe('Intro');
    });

    it('should not move first section up', () => {
      const { result } = renderHook(() => useSections());

      act(() => {
        result.current.addSection('Intro');
        result.current.addSection('Verse');
      });

      const introId = result.current.sections[0].id;

      act(() => {
        result.current.moveSection(introId, 'up');
      });

      expect(result.current.sections[0].type).toBe('Intro');
    });

    it('should not move last section down', () => {
      const { result } = renderHook(() => useSections());

      act(() => {
        result.current.addSection('Intro');
        result.current.addSection('Verse');
      });

      const verseId = result.current.sections[1].id;

      act(() => {
        result.current.moveSection(verseId, 'down');
      });

      expect(result.current.sections[1].type).toBe('Verse');
    });
  });

  describe('updateSectionBody', () => {
    it('should update body text', () => {
      const { result } = renderHook(() => useSections());

      act(() => {
        result.current.addSection('Verse');
      });

      const sectionId = result.current.sections[0].id;

      act(() => {
        result.current.updateSectionBody(sectionId, 'New lyrics');
      });

      expect(result.current.sections[0].bodyText).toBe('New lyrics');
    });

    it('should preserve other properties', () => {
      const { result } = renderHook(() => useSections());

      act(() => {
        result.current.addSection('Verse');
      });

      const sectionId = result.current.sections[0].id;
      const originalId = result.current.sections[0].id;
      const originalDisplayName = result.current.sections[0].displayName;

      act(() => {
        result.current.updateSectionBody(sectionId, 'New lyrics');
      });

      expect(result.current.sections[0].id).toBe(originalId);
      expect(result.current.sections[0].displayName).toBe(originalDisplayName);
    });
  });

  describe('insertText', () => {
    it('should insert text into active section', () => {
      const { result } = renderHook(() => useSections());

      act(() => {
        result.current.addSection('Verse');
      });

      const sectionId = result.current.sections[0].id;

      act(() => {
        result.current.setActiveSectionId(sectionId);
        result.current.insertText('First line');
      });

      expect(result.current.sections[0].bodyText).toBe('First line');
    });

    it('should append text with newline', () => {
      const { result } = renderHook(() => useSections());

      act(() => {
        result.current.addSection('Verse');
      });

      const sectionId = result.current.sections[0].id;

      act(() => {
        result.current.setActiveSectionId(sectionId);
        result.current.insertText('First line');
        result.current.insertText('Second line');
      });

      expect(result.current.sections[0].bodyText).toBe('First line\nSecond line');
    });

    it('should not insert when no active section', () => {
      const { result } = renderHook(() => useSections());

      act(() => {
        result.current.insertText('Some text');
      });

      expect(result.current.sections).toEqual([]);
    });

    it('should not insert when in all view', () => {
      const { result } = renderHook(() => useSections());

      act(() => {
        result.current.addSection('Verse');
        result.current.setActiveSectionId('__all__');
        result.current.insertText('Some text');
      });

      expect(result.current.sections[0].bodyText).toBe('');
    });
  });

  describe('setActiveSectionId', () => {
    it('should set active section', () => {
      const { result } = renderHook(() => useSections());

      act(() => {
        result.current.addSection('Verse');
      });

      const sectionId = result.current.sections[0].id;

      act(() => {
        result.current.setActiveSectionId(sectionId);
      });

      expect(result.current.activeSectionId).toBe(sectionId);
    });

    it('should set to null', () => {
      const { result } = renderHook(() => useSections());

      act(() => {
        result.current.addSection('Verse');
        result.current.setActiveSectionId(null);
      });

      expect(result.current.activeSectionId).toBe(null);
    });
  });

  describe('isAllView', () => {
    it('should be true when active is ALL_SECTIONS_ID', () => {
      const { result } = renderHook(() => useSections());

      act(() => {
        result.current.addSection('Verse');
        result.current.setActiveSectionId('__all__');
      });

      expect(result.current.isAllView).toBe(true);
    });

    it('should be false when active is a section', () => {
      const { result } = renderHook(() => useSections());

      act(() => {
        result.current.addSection('Verse');
      });

      expect(result.current.isAllView).toBe(false);
    });
  });

  describe('queueAutoSave', () => {
    it('should be callable', () => {
      const { result } = renderHook(() => useSections());

      act(() => {
        result.current.addSection('Verse');
      });

      // queueAutoSave should not throw
      expect(() => {
        result.current.queueAutoSave(result.current.sections);
      }).not.toThrow();
    });
  });

  describe('resetFromData', () => {
    it('should replace all sections', () => {
      const { result } = renderHook(() => useSections());

      act(() => {
        result.current.addSection('Verse');
        result.current.addSection('Chorus');
      });

      expect(result.current.sections.length).toBe(2);

      const newData = [
        { id: 'new-1', type: 'Bridge', displayName: 'Bridge', sortOrder: 0, bodyText: '' },
      ];

      act(() => {
        result.current.resetFromData(newData);
      });

      expect(result.current.sections.length).toBe(1);
      expect(result.current.sections[0].displayName).toBe('Bridge');
    });

    it('should set active to ALL_SECTIONS_ID when data has sections', () => {
      const { result } = renderHook(() => useSections());

      const newData = [
        { id: '1', type: 'Verse', displayName: 'Verse', sortOrder: 0, bodyText: '' },
      ];

      act(() => {
        result.current.resetFromData(newData);
      });

      expect(result.current.activeSectionId).toBe('__all__');
    });

    it('should set active to null when data is empty', () => {
      const { result } = renderHook(() => useSections());

      act(() => {
        result.current.resetFromData([]);
      });

      expect(result.current.activeSectionId).toBe(null);
    });
  });
});