import { describe, expect, it } from 'vitest';
import {
  createStarterDraftSections,
  createStarterSections,
  getStarterProject,
  isDraftEmpty,
} from '../lib/onboarding';

describe('starter project', () => {
  it('provides a Japanese sample with a clear verse-to-chorus arc', () => {
    const starter = getStarterProject('ja');

    expect(starter.title).toBe('はじまりのサンプル');
    expect(starter.bpm).toBe(124);
    expect(starter.sections.map((section) => section.displayName)).toEqual([
      'Verse', 'Pre-Chorus', 'Chorus', 'Outro',
    ]);
    expect(starter.sections.find((section) => section.displayName === 'Chorus')?.bodyText)
      .toContain('明日へ飛び出せ');
  });

  it('materializes independent section IDs for a persisted starter draft', () => {
    const sections = createStarterSections('en');
    const draftSections = createStarterDraftSections('en');

    expect(sections).toHaveLength(4);
    expect(new Set(sections.map((section) => section.id)).size).toBe(4);
    expect(draftSections).toHaveLength(4);
    expect(draftSections.every((section) => Boolean(section.draft_section_id))).toBe(true);
    expect(draftSections.map((section) => section.display_name)).toContain('Chorus');
  });

  it('only offers a starter overwrite when lyrics, style, and vocal are empty', () => {
    expect(isDraftEmpty([])).toBe(true);
    expect(isDraftEmpty([{ id: 'section-1', type: 'Verse', displayName: 'Verse', sortOrder: 0, bodyText: 'line' }])).toBe(false);
    expect(isDraftEmpty([], 'synth pop')).toBe(false);
    expect(isDraftEmpty([], '', 'clear vocal')).toBe(false);
  });
});
