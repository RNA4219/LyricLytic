import { beforeEach, describe, expect, it } from 'vitest';
import {
  buildProjectPreview,
  clearLastProjectId,
  extractSectionPreview,
  getLastProjectId,
  normalizeSectionName,
  readProjectOrder,
  removeProjectFromOrder,
  setLastProjectId,
  touchProjectOrder,
} from '../lib/utils/projectStorage';

describe('projectStorage', () => {
  beforeEach(() => localStorage.clear());

  it('recovers from missing, malformed, and mixed project ordering data', () => {
    expect(readProjectOrder()).toEqual([]);
    localStorage.setItem('lyriclytic_project_order', 'not-json');
    expect(readProjectOrder()).toEqual([]);
    localStorage.setItem('lyriclytic_project_order', JSON.stringify(['one', 2, null, 'two']));
    expect(readProjectOrder()).toEqual(['one', 'two']);
  });

  it('keeps the most recently touched project first and removes deleted IDs', () => {
    localStorage.setItem('lyriclytic_project_order', JSON.stringify(['one', 'two', 'one']));
    expect(touchProjectOrder('two')).toEqual(['two', 'one', 'one']);
    expect(removeProjectFromOrder('one')).toEqual(['two']);
  });

  it('normalizes section names and selects the most useful preview section', () => {
    expect(normalizeSectionName()).toBe('');
    expect(normalizeSectionName(' Chorus ')).toBe('chorus');
    expect(buildProjectPreview([
      { draft_section_id: 'verse', section_type: 'Verse', display_name: 'Verse', sort_order: 0, body_text: '静かな朝' },
      { draft_section_id: 'chorus', section_type: 'Chorus', display_name: 'Chorus', sort_order: 1, body_text: '大きな光' },
    ], '', 'ja')).toBe('Chorus: 大きな光');
  });

  it('falls back through section and body text previews without exposing section tags', () => {
    expect(extractSectionPreview(undefined, 'ja')).toBeNull();
    expect(extractSectionPreview({ draft_section_id: 'empty', display_name: 'Verse', sort_order: 0, body_text: '  \n ' }, 'ja')).toBeNull();
    expect(extractSectionPreview({ draft_section_id: 'plain', display_name: ' ', sort_order: 0, body_text: 'First line\nSecond' }, 'en')).toBe('Lyrics: First line');
    expect(buildProjectPreview([], '[Verse]\nBody fallback', 'en')).toBe('Body fallback');
  });

  it('stores and clears the last opened project', () => {
    expect(getLastProjectId()).toBeNull();
    setLastProjectId('project-1');
    expect(getLastProjectId()).toBe('project-1');
    clearLastProjectId();
    expect(getLastProjectId()).toBeNull();
  });
});
