import { describe, it, expect } from 'vitest';
import {
  buildSunoPromptReferenceBlock,
  getCatalogMeta,
  getCatalogSections,
  getRelevantSunoPromptEntries,
} from '../lib/llm/sunoPromptCatalog';

describe('sunoPromptCatalog', () => {
  it('should expose catalog metadata', async () => {
    const meta = await getCatalogMeta();
    expect(meta.sourceUrl).toBe('https://ai.suno.jp/prompt/');
    expect(meta.licenseUrl).toBe('https://ai.suno.jp/license/');
    expect(meta.entryCount).toBeGreaterThan(2000);
    expect(meta.enrichmentMeta).not.toBeNull();
    expect(meta.importantSectionMeta).not.toBeNull();
  });

  it('should find style-oriented entries from Japanese city pop prompts', async () => {
    const results = await getRelevantSunoPromptEntries({
      target: 'style',
      userPrompt: '80年代のシティポップで夜景を走る感じ',
      currentLyrics: '夜を越える\n朝へ向かう',
      currentStyle: '',
      currentVocal: '',
      limit: 5,
    });

    expect(results.length).toBeGreaterThan(0);
    expect(results.some((entry) => entry.prompt.toLowerCase().includes('city pop'))).toBe(true);
  });

  it('should prioritize vocal-oriented entries for vocal generation', async () => {
    const results = await getRelevantSunoPromptEntries({
      target: 'vocal',
      userPrompt: '女性ボーカルでささやく感じ',
      currentLyrics: '',
      currentStyle: '',
      currentVocal: 'breathy female vocal',
      limit: 5,
    });

    expect(results.length).toBeGreaterThan(0);
    expect(results.some((entry) => /vocal|voice|声|ボーカル/i.test(`${entry.title} ${entry.prompt}`))).toBe(true);
  });

  it('should expose available catalog sections by target', async () => {
    const sections = await getCatalogSections('style');
    expect(sections.length).toBeGreaterThan(20);
    expect(sections.some((section) => section.name === 'Pop')).toBe(true);
  });

  it('should build a reference block for matched entries with static enrichment', async () => {
    const block = await buildSunoPromptReferenceBlock({
      target: 'style',
      userPrompt: '80年代のシティポップ',
      currentLyrics: '',
      currentStyle: '',
      currentVocal: '',
      limit: 3,
    });

    expect(block).toContain('offline catalog facets');
    expect(block).toContain('Suno prompt references:');
    expect(block).toContain('City Pop');
    expect(block).toContain('route:');
  });
});
