import { describe, expect, it } from 'vitest';
import { buildRhymeGuideRows, getGuideHighlightParts } from '../lib/rhyme/analysis';

describe('rhyme/analysis.ts', () => {
  it('セクションタグ行を除外する', () => {
    const rows = buildRhymeGuideRows('[Intro]\n夜を越える');
    expect(rows).toHaveLength(1);
    expect(rows[0].line).toBe('夜を越える');
  });

  it('日本語行からローマ字・母音・子音を作る', () => {
    const rows = buildRhymeGuideRows('かなしい');
    expect(rows[0].romanizedText.length).toBeGreaterThan(0);
    expect(rows[0].vowelText.length).toBeGreaterThan(0);
    expect(rows[0].consonantText.length).toBeGreaterThan(0);
  });

  it('空行はガイド対象外にする', () => {
    const rows = buildRhymeGuideRows('a\n\nb');
    expect(rows).toHaveLength(2);
  });

  it('長音と促音を含む行でもローマ字化が破綻しない', () => {
    const rows = buildRhymeGuideRows('ずっとメロディー');
    expect(rows[0].romanizedText).toContain('zu');
    expect(rows[0].romanizedText).toContain('me');
  });

  it('末尾一致部分を抽出できる', () => {
    const parts = getGuideHighlightParts('ka ra fu ru mi ra i', 'yo a ke mi ra i');
    expect(parts.prefix).toBe('ka ra fu ru');
    expect(parts.match).toBe('mi ra i');
  });
});
