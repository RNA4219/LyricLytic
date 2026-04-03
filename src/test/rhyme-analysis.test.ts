import { describe, expect, it, vi } from 'vitest';
import {
  buildRhymeGuideRows,
  getGuideHighlightParts,
  buildFallbackRhymeGuideRows,
  analyzeRhymeGuideRows,
} from '../lib/rhyme/analysis';

// Mock API
vi.mock('../lib/api', () => ({
  analyzeRhymeText: vi.fn(),
}));

import { analyzeRhymeText } from '../lib/api';

const mockAnalyzeRhymeText = analyzeRhymeText as ReturnType<typeof vi.fn>;

describe('rhyme/analysis.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('buildRhymeGuideRows', () => {
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

    it('カタカナをひらがなに変換して処理する', () => {
      const rows = buildRhymeGuideRows('カラフル');
      expect(rows[0].romanizedText).toContain('ka');
      expect(rows[0].romanizedText).toContain('ra');
    });

    it('拗音を正しく処理する', () => {
      const rows = buildRhymeGuideRows('きゃってぃ');
      expect(rows[0].romanizedText).toContain('kya');
      expect(rows[0].romanizedText).toContain('ti');
    });

    it('英語を含む行を処理する', () => {
      const rows = buildRhymeGuideRows('hello world');
      expect(rows).toHaveLength(1);
      expect(rows[0].romanizedText).toContain('hello');
    });

    it('空白のみの行を除外する', () => {
      const rows = buildRhymeGuideRows('   \n\t\n');
      expect(rows).toHaveLength(0);
    });

    it('んを正しく処理する', () => {
      const rows = buildRhymeGuideRows('さんか');
      expect(rows[0].romanizedText).toContain('n');
      expect(rows[0].romanizedText).toContain('ka');
    });

    it('濁音・半濁音を正しく処理する', () => {
      const rows = buildRhymeGuideRows('がぱ');
      expect(rows[0].romanizedText).toContain('ga');
      expect(rows[0].romanizedText).toContain('pa');
    });

    it('ヴを正しく処理する', () => {
      const rows = buildRhymeGuideRows('ゔぁゔぃ');
      expect(rows[0].romanizedText).toContain('va');
      expect(rows[0].romanizedText).toContain('vi');
    });

    it('小さい文字を正しく処理する', () => {
      const rows = buildRhymeGuideRows('ふぁふぃふぇふぉ');
      expect(rows[0].romanizedText).toContain('fa');
      expect(rows[0].romanizedText).toContain('fi');
    });

    it('複数行を処理する', () => {
      const rows = buildRhymeGuideRows('あいう\nえお\nかきく');
      expect(rows).toHaveLength(3);
    });
  });

  describe('getGuideHighlightParts', () => {
    it('末尾一致部分を抽出できる', () => {
      const parts = getGuideHighlightParts('ka ra fu ru mi ra i', 'yo a ke mi ra i');
      expect(parts.prefix).toBe('ka ra fu ru');
      expect(parts.match).toBe('mi ra i');
    });

    it('一致がない場合は全体がprefixになる', () => {
      const parts = getGuideHighlightParts('ka ra fu ru', 'yo a ke sa');
      expect(parts.prefix).toBe('ka ra fu ru');
      expect(parts.match).toBe('');
    });

    it('previousValueがない場合は全体がprefixになる', () => {
      const parts = getGuideHighlightParts('ka ra fu ru', null);
      expect(parts.prefix).toBe('ka ra fu ru');
      expect(parts.match).toBe('');
    });

    it('パイプで区切られた場合はそこで止まる', () => {
      const parts = getGuideHighlightParts('ka ra | mi ra i', 'yo a ke | sa');
      expect(parts.match).toBe('');
    });

    it('完全一致の場合は全体がmatchになる', () => {
      const parts = getGuideHighlightParts('mi ra i', 'mi ra i');
      expect(parts.prefix).toBe('');
      expect(parts.match).toBe('mi ra i');
    });

    it('前の行が短い場合', () => {
      const parts = getGuideHighlightParts('ka ra mi ra i', 'mi ra i');
      expect(parts.prefix).toBe('ka ra');
      expect(parts.match).toBe('mi ra i');
    });
  });

  describe('buildFallbackRhymeGuideRows', () => {
    it('空文字で空配列を返す', () => {
      const rows = buildFallbackRhymeGuideRows('');
      expect(rows).toHaveLength(0);
    });

    it('空白のみで空配列を返す', () => {
      const rows = buildFallbackRhymeGuideRows('   \n   ');
      expect(rows).toHaveLength(0);
    });

    it('source属性がfallbackになる', () => {
      const rows = buildFallbackRhymeGuideRows('あいう');
      expect(rows[0].source).toBe('fallback');
    });
  });

  describe('analyzeRhymeGuideRows', () => {
    it('空文字で空配列を返す', async () => {
      const rows = await analyzeRhymeGuideRows('');
      expect(rows).toHaveLength(0);
    });

    it('空白のみで空配列を返す', async () => {
      const rows = await analyzeRhymeGuideRows('   ');
      expect(rows).toHaveLength(0);
    });

    it('APIが結果を返した場合はそれを使用する', async () => {
      const mockRows = [
        {
          line: 'あいう',
          romanized_text: 'a i u',
          vowel_text: 'a i u',
          consonant_text: '— — —',
        },
      ];
      mockAnalyzeRhymeText.mockResolvedValue(mockRows);

      const rows = await analyzeRhymeGuideRows('あいう');

      expect(mockAnalyzeRhymeText).toHaveBeenCalledWith('あいう');
      expect(rows).toEqual(mockRows);
    });

    it('APIが空配列を返した場合はフォールバックを使用する', async () => {
      mockAnalyzeRhymeText.mockResolvedValue([]);

      const rows = await analyzeRhymeGuideRows('あいう');

      expect(rows).toHaveLength(1);
      expect(rows[0].line).toBe('あいう');
      expect(rows[0].source).toBe('fallback');
    });

    it('APIがエラーの場合はフォールバックを使用する', async () => {
      mockAnalyzeRhymeText.mockRejectedValue(new Error('API error'));

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const rows = await analyzeRhymeGuideRows('あいう');

      expect(rows).toHaveLength(1);
      expect(rows[0].source).toBe('fallback');
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});
