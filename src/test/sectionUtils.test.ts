import { describe, it, expect } from 'vitest';
import {
  Section,
  SECTION_PRESETS,
  generateUniqueSectionName,
  parseBodyToSections,
  sectionsToBody,
  mapDraftSections,
} from '../lib/section';
import { DraftSection } from '../lib/api';

describe('sectionUtils', () => {
  describe('SECTION_PRESETS', () => {
    it('should have correct preset values', () => {
      expect(SECTION_PRESETS).toEqual(['Intro', 'Verse', 'Pre-Chorus', 'Chorus', 'Bridge', 'Outro']);
    });

    it('should have 6 presets', () => {
      expect(SECTION_PRESETS.length).toBe(6);
    });

    it('should include all common song sections', () => {
      expect(SECTION_PRESETS).toContain('Verse');
      expect(SECTION_PRESETS).toContain('Chorus');
      expect(SECTION_PRESETS).toContain('Bridge');
      expect(SECTION_PRESETS).toContain('Intro');
      expect(SECTION_PRESETS).toContain('Outro');
      expect(SECTION_PRESETS).toContain('Pre-Chorus');
    });
  });

  describe('generateUniqueSectionName', () => {
    it('should return base name when no existing sections', () => {
      const result = generateUniqueSectionName('Verse', []);
      expect(result).toBe('Verse');
    });

    it('should return base name when section does not exist', () => {
      const existing: Section[] = [
        { id: '1', type: 'Chorus', displayName: 'Chorus', sortOrder: 0, bodyText: '' },
      ];
      const result = generateUniqueSectionName('Verse', existing);
      expect(result).toBe('Verse');
    });

    it('should append number when section already exists', () => {
      const existing: Section[] = [
        { id: '1', type: 'Verse', displayName: 'Verse', sortOrder: 0, bodyText: '' },
      ];
      const result = generateUniqueSectionName('Verse', existing);
      expect(result).toBe('Verse 2');
    });

    it('should increment number for multiple existing sections', () => {
      const existing: Section[] = [
        { id: '1', type: 'Verse', displayName: 'Verse', sortOrder: 0, bodyText: '' },
        { id: '2', type: 'Verse', displayName: 'Verse 2', sortOrder: 1, bodyText: '' },
      ];
      const result = generateUniqueSectionName('Verse', existing);
      expect(result).toBe('Verse 3');
    });

    it('should handle sections with number gaps', () => {
      const existing: Section[] = [
        { id: '1', type: 'Verse', displayName: 'Verse', sortOrder: 0, bodyText: '' },
        { id: '2', type: 'Verse', displayName: 'Verse 5', sortOrder: 1, bodyText: '' },
      ];
      const result = generateUniqueSectionName('Verse', existing);
      expect(result).toBe('Verse 6');
    });

    it('should handle different base names independently', () => {
      const existing: Section[] = [
        { id: '1', type: 'Verse', displayName: 'Verse', sortOrder: 0, bodyText: '' },
        { id: '2', type: 'Verse', displayName: 'Verse 2', sortOrder: 1, bodyText: '' },
      ];
      const result = generateUniqueSectionName('Chorus', existing);
      expect(result).toBe('Chorus');
    });

    it('should handle empty display name', () => {
      const result = generateUniqueSectionName('', []);
      expect(result).toBe('');
    });
  });

  describe('parseBodyToSections', () => {
    it('should parse single section', () => {
      const body = '[Verse]\nHello world';
      const result = parseBodyToSections(body);

      expect(result.length).toBe(1);
      expect(result[0].displayName).toBe('Verse');
      expect(result[0].bodyText).toBe('Hello world');
    });

    it('should parse multiple sections', () => {
      const body = '[Verse]\nHello\n\n[Chorus]\nWorld';
      const result = parseBodyToSections(body);

      expect(result.length).toBe(2);
      expect(result[0].displayName).toBe('Verse');
      expect(result[0].bodyText).toBe('Hello');
      expect(result[1].displayName).toBe('Chorus');
      expect(result[1].bodyText).toBe('World');
    });

    it('should set correct sort order', () => {
      const body = '[Intro]\nStart\n\n[Verse]\nMiddle\n\n[Outro]\nEnd';
      const result = parseBodyToSections(body);

      expect(result[0].sortOrder).toBe(0);
      expect(result[1].sortOrder).toBe(1);
      expect(result[2].sortOrder).toBe(2);
    });

    it('should generate unique IDs', () => {
      const body = '[Verse]\nOne\n\n[Verse]\nTwo';
      const result = parseBodyToSections(body);

      expect(result[0].id).not.toBe(result[1].id);
    });

    it('should handle empty body', () => {
      const result = parseBodyToSections('');

      expect(result.length).toBe(1);
      expect(result[0].displayName).toBe('Verse');
      expect(result[0].bodyText).toBe('');
    });

    it('should handle body without section headers', () => {
      const body = 'Just some lyrics\nwithout headers';
      const result = parseBodyToSections(body);

      expect(result.length).toBe(1);
      expect(result[0].displayName).toBe('Verse');
      expect(result[0].bodyText).toBe(body);
    });

    it('should handle multiline content', () => {
      const body = '[Verse]\nLine 1\nLine 2\nLine 3';
      const result = parseBodyToSections(body);

      expect(result[0].bodyText).toBe('Line 1\nLine 2\nLine 3');
    });

    it('should handle custom section names', () => {
      const body = '[Custom Section]\nContent';
      const result = parseBodyToSections(body);

      expect(result[0].displayName).toBe('Custom Section');
      expect(result[0].type).toBe('Custom Section');
    });

    it('should handle sections with empty content', () => {
      const body = '[Verse]\n\n[Chorus]\nContent';
      const result = parseBodyToSections(body);

      expect(result.length).toBe(2);
      expect(result[0].bodyText).toBe('');
      expect(result[1].bodyText).toBe('Content');
    });
  });

  describe('sectionsToBody', () => {
    it('should convert single section to body', () => {
      const sections: Section[] = [
        { id: '1', type: 'Verse', displayName: 'Verse', sortOrder: 0, bodyText: 'Hello' },
      ];
      const result = sectionsToBody(sections);

      expect(result).toBe('[Verse]\nHello');
    });

    it('should convert multiple sections to body', () => {
      const sections: Section[] = [
        { id: '1', type: 'Verse', displayName: 'Verse', sortOrder: 0, bodyText: 'Hello' },
        { id: '2', type: 'Chorus', displayName: 'Chorus', sortOrder: 1, bodyText: 'World' },
      ];
      const result = sectionsToBody(sections);

      expect(result).toBe('[Verse]\nHello\n\n[Chorus]\nWorld');
    });

    it('should handle empty bodyText', () => {
      const sections: Section[] = [
        { id: '1', type: 'Verse', displayName: 'Verse', sortOrder: 0, bodyText: '' },
      ];
      const result = sectionsToBody(sections);

      expect(result).toBe('[Verse]\n');
    });

    it('should preserve section display names', () => {
      const sections: Section[] = [
        { id: '1', type: 'Verse', displayName: 'Verse 2', sortOrder: 0, bodyText: 'Text' },
      ];
      const result = sectionsToBody(sections);

      expect(result).toContain('[Verse 2]');
    });
  });

  describe('round-trip conversion', () => {
    it('should maintain section names through parse and convert', () => {
      const originalBody = '[Verse]\nHello world\n\n[Chorus]\nSing along';
      const sections = parseBodyToSections(originalBody);
      const resultBody = sectionsToBody(sections);

      expect(resultBody).toContain('[Verse]');
      expect(resultBody).toContain('[Chorus]');
      expect(resultBody).toContain('Hello world');
      expect(resultBody).toContain('Sing along');
    });

    it('should maintain section count through parse and convert', () => {
      const originalBody = '[Verse]\nFirst verse\n\n[Verse]\nSecond verse';
      const sections = parseBodyToSections(originalBody);

      expect(sections.length).toBe(2);
    });

    it('should preserve body content', () => {
      const sections: Section[] = [
        { id: '1', type: 'Verse', displayName: 'Verse', sortOrder: 0, bodyText: 'Hello world' },
        { id: '2', type: 'Chorus', displayName: 'Chorus', sortOrder: 1, bodyText: 'Sing along' },
      ];
      const body = sectionsToBody(sections);
      const parsed = parseBodyToSections(body);

      expect(parsed[0].bodyText.trim()).toBe('Hello world');
      expect(parsed[1].bodyText.trim()).toBe('Sing along');
    });
  });

  describe('mapDraftSections', () => {
    it('should map draft sections to sections', () => {
      const draftSections: DraftSection[] = [
        {
          draft_section_id: '1',
          section_type: 'Verse',
          display_name: 'Verse',
          sort_order: 0,
          body_text: 'Hello',
        },
      ];
      const result = mapDraftSections(draftSections);

      expect(result.length).toBe(1);
      expect(result[0].id).toBe('1');
      expect(result[0].type).toBe('Verse');
      expect(result[0].displayName).toBe('Verse');
      expect(result[0].sortOrder).toBe(0);
      expect(result[0].bodyText).toBe('Hello');
    });

    it('should handle null section_type', () => {
      const draftSections: DraftSection[] = [
        {
          draft_section_id: '1',
          section_type: null,
          display_name: 'Custom',
          sort_order: 0,
          body_text: 'Text',
        },
      ];
      const result = mapDraftSections(draftSections);

      expect(result[0].type).toBe('Custom');
    });

    it('should map multiple sections', () => {
      const draftSections: DraftSection[] = [
        { draft_section_id: '1', section_type: 'Intro', display_name: 'Intro', sort_order: 0, body_text: 'Start' },
        { draft_section_id: '2', section_type: 'Verse', display_name: 'Verse', sort_order: 1, body_text: 'Main' },
        { draft_section_id: '3', section_type: 'Outro', display_name: 'Outro', sort_order: 2, body_text: 'End' },
      ];
      const result = mapDraftSections(draftSections);

      expect(result.length).toBe(3);
      expect(result[0].displayName).toBe('Intro');
      expect(result[1].displayName).toBe('Verse');
      expect(result[2].displayName).toBe('Outro');
    });
  });
});

describe('Section move operations', () => {
  // Test the logic for moving sections up/down
  function moveSectionUp(sections: Section[], id: string): Section[] {
    const idx = sections.findIndex(s => s.id === id);
    if (idx <= 0) return sections;

    const newSections = [...sections];
    [newSections[idx - 1], newSections[idx]] = [newSections[idx], newSections[idx - 1]];
    return newSections.map((section, order) => ({ ...section, sortOrder: order }));
  }

  function moveSectionDown(sections: Section[], id: string): Section[] {
    const idx = sections.findIndex(s => s.id === id);
    if (idx < 0 || idx >= sections.length - 1) return sections;

    const newSections = [...sections];
    [newSections[idx], newSections[idx + 1]] = [newSections[idx + 1], newSections[idx]];
    return newSections.map((section, order) => ({ ...section, sortOrder: order }));
  }

  const createTestSections = (): Section[] => [
    { id: '1', type: 'Intro', displayName: 'Intro', sortOrder: 0, bodyText: 'Intro text' },
    { id: '2', type: 'Verse', displayName: 'Verse', sortOrder: 1, bodyText: 'Verse text' },
    { id: '3', type: 'Chorus', displayName: 'Chorus', sortOrder: 2, bodyText: 'Chorus text' },
    { id: '4', type: 'Outro', displayName: 'Outro', sortOrder: 3, bodyText: 'Outro text' },
  ];

  describe('moveSectionUp', () => {
    it('should move section up by one position', () => {
      const sections = createTestSections();
      const result = moveSectionUp(sections, '2');

      expect(result[0].id).toBe('2');
      expect(result[1].id).toBe('1');
    });

    it('should not move first section up', () => {
      const sections = createTestSections();
      const result = moveSectionUp(sections, '1');

      expect(result[0].id).toBe('1');
      expect(result).toEqual(sections);
    });

    it('should update sortOrder after move', () => {
      const sections = createTestSections();
      const result = moveSectionUp(sections, '3');

      expect(result[0].sortOrder).toBe(0);
      expect(result[1].sortOrder).toBe(1);
      expect(result[2].sortOrder).toBe(2);
      expect(result[3].sortOrder).toBe(3);
    });

    it('should handle non-existent section', () => {
      const sections = createTestSections();
      const result = moveSectionUp(sections, 'non-existent');

      expect(result).toEqual(sections);
    });

    it('should move middle section correctly', () => {
      const sections = createTestSections();
      const result = moveSectionUp(sections, '3');

      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('3');
      expect(result[2].id).toBe('2');
      expect(result[3].id).toBe('4');
    });
  });

  describe('moveSectionDown', () => {
    it('should move section down by one position', () => {
      const sections = createTestSections();
      const result = moveSectionDown(sections, '1');

      expect(result[0].id).toBe('2');
      expect(result[1].id).toBe('1');
    });

    it('should not move last section down', () => {
      const sections = createTestSections();
      const result = moveSectionDown(sections, '4');

      expect(result[3].id).toBe('4');
      expect(result).toEqual(sections);
    });

    it('should update sortOrder after move', () => {
      const sections = createTestSections();
      const result = moveSectionDown(sections, '1');

      expect(result[0].sortOrder).toBe(0);
      expect(result[1].sortOrder).toBe(1);
      expect(result[2].sortOrder).toBe(2);
      expect(result[3].sortOrder).toBe(3);
    });

    it('should handle non-existent section', () => {
      const sections = createTestSections();
      const result = moveSectionDown(sections, 'non-existent');

      expect(result).toEqual(sections);
    });

    it('should move middle section correctly', () => {
      const sections = createTestSections();
      const result = moveSectionDown(sections, '2');

      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('3');
      expect(result[2].id).toBe('2');
      expect(result[3].id).toBe('4');
    });
  });

  describe('multiple moves', () => {
    it('should handle consecutive moves up', () => {
      let sections = createTestSections();
      sections = moveSectionUp(sections, '3');
      sections = moveSectionUp(sections, '3');

      expect(sections[0].id).toBe('3');
      expect(sections[1].id).toBe('1');
      expect(sections[2].id).toBe('2');
    });

    it('should handle consecutive moves down', () => {
      let sections = createTestSections();
      sections = moveSectionDown(sections, '1');
      sections = moveSectionDown(sections, '1');

      expect(sections[0].id).toBe('2');
      expect(sections[1].id).toBe('3');
      expect(sections[2].id).toBe('1');
      expect(sections[3].id).toBe('4');
    });

    it('should handle alternating moves', () => {
      let sections = createTestSections();
      sections = moveSectionDown(sections, '2');
      sections = moveSectionUp(sections, '2');

      expect(sections).toEqual(createTestSections());
    });
  });

  describe('edge cases', () => {
    it('should handle single section', () => {
      const sections: Section[] = [
        { id: '1', type: 'Verse', displayName: 'Verse', sortOrder: 0, bodyText: 'Text' },
      ];

      expect(moveSectionUp(sections, '1')).toEqual(sections);
      expect(moveSectionDown(sections, '1')).toEqual(sections);
    });

    it('should handle two sections', () => {
      const sections: Section[] = [
        { id: '1', type: 'Verse', displayName: 'Verse', sortOrder: 0, bodyText: 'Text 1' },
        { id: '2', type: 'Chorus', displayName: 'Chorus', sortOrder: 1, bodyText: 'Text 2' },
      ];

      const movedUp = moveSectionUp(sections, '2');
      expect(movedUp[0].id).toBe('2');
      expect(movedUp[1].id).toBe('1');

      const movedDown = moveSectionDown(sections, '1');
      expect(movedDown[0].id).toBe('2');
      expect(movedDown[1].id).toBe('1');
    });
  });
});