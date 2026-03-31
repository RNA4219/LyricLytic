import { describe, it, expect } from 'vitest';
import { translations } from '../lib/i18n';

describe('i18n translations completeness', () => {
  const jaKeys = Object.keys(translations.ja) as (keyof typeof translations.ja)[];
  const enKeys = Object.keys(translations.en) as (keyof typeof translations.en)[];

  it.each(jaKeys)('should have Japanese translation for key %s', (key) => {
    expect(translations.ja[key]).toBeDefined();
    expect(translations.ja[key]).not.toBe('');
  });

  it.each(enKeys)('should have English translation for key %s', (key) => {
    expect(translations.en[key]).toBeDefined();
    expect(translations.en[key]).not.toBe('');
  });

  it('should have exactly the same keys in both languages', () => {
    expect(new Set(jaKeys)).toEqual(new Set(enKeys));
  });

  it('should have non-empty translations for all keys', () => {
    for (const key of jaKeys) {
      const jaValue = translations.ja[key];
      const enValue = translations.en[key];
      expect(jaValue.length).toBeGreaterThan(0);
      expect(enValue.length).toBeGreaterThan(0);
    }
  });
});

describe('i18n specific translations', () => {
  it('should have correct Japanese UI labels', () => {
    expect(translations.ja.appTitle).toBe('LyricLytic');
    expect(translations.ja.subtitle).toBe('AI音楽生成向け歌詞制作ツール');
    expect(translations.ja.projects).toBe('プロジェクト');
    expect(translations.ja.newProject).toBe('新規プロジェクト');
    expect(translations.ja.projectTitle).toBe('プロジェクト名');
    expect(translations.ja.create).toBe('作成');
    expect(translations.ja.cancel).toBe('キャンセル');
    expect(translations.ja.loading).toBe('読み込み中...');
    expect(translations.ja.trash).toBe('削除済み');
    expect(translations.ja.restore).toBe('復元');
    expect(translations.ja.close).toBe('閉じる');
    expect(translations.ja.more).toBe('その他');
  });

  it('should have correct English UI labels', () => {
    expect(translations.en.appTitle).toBe('LyricLytic');
    expect(translations.en.subtitle).toBe('Lyric production tool for AI music generation');
    expect(translations.en.projects).toBe('Projects');
    expect(translations.en.newProject).toBe('New Project');
    expect(translations.en.projectTitle).toBe('Project title');
    expect(translations.en.create).toBe('Create');
    expect(translations.en.cancel).toBe('Cancel');
    expect(translations.en.loading).toBe('Loading...');
    expect(translations.en.trash).toBe('Trash');
    expect(translations.en.restore).toBe('Restore');
    expect(translations.en.close).toBe('Close');
    expect(translations.en.more).toBe('More');
  });

  it('should have correct error messages in Japanese', () => {
    expect(translations.ja.deleteFailed).toBe('プロジェクトの削除に失敗しました');
    expect(translations.ja.createFailed).toBe('プロジェクトの作成に失敗しました');
    expect(translations.ja.loadFailed).toBe('プロジェクトの読み込みに失敗しました');
    expect(translations.ja.autoSaveFailed).toBe('自動保存に失敗しました');
    expect(translations.ja.saveSnapshotFailed).toBe('スナップショットの保存に失敗しました');
  });

  it('should have correct error messages in English', () => {
    expect(translations.en.deleteFailed).toBe('Failed to delete project');
    expect(translations.en.createFailed).toBe('Failed to create project');
    expect(translations.en.loadFailed).toBe('Failed to load projects');
    expect(translations.en.autoSaveFailed).toBe('Auto-save failed');
    expect(translations.en.saveSnapshotFailed).toBe('Failed to save snapshot');
  });

  it('should have correct delete confirmation messages', () => {
    expect(translations.ja.deleteConfirm).toContain('削除');
    expect(translations.ja.deleteConfirm).toContain('復元');
    expect(translations.en.deleteConfirm).toContain('Delete');
    expect(translations.en.deleteConfirm).toContain('restored');
  });

  it('should have correct empty state messages in Japanese', () => {
    expect(translations.ja.noProjects).toContain('プロジェクトがありません');
    expect(translations.ja.noDeleted).toContain('削除済みプロジェクトはありません');
    expect(translations.ja.noDeletedItems).toContain('削除済みアイテムはありません');
  });

  it('should have correct empty state messages in English', () => {
    expect(translations.en.noProjects).toContain('No projects');
    expect(translations.en.noDeleted).toContain('No deleted');
    expect(translations.en.noDeletedItems).toContain('No deleted items');
  });

  it('should have footer text in both languages', () => {
    expect(translations.ja.footerText).toContain('ローカルファースト');
    expect(translations.ja.footerText).toContain('自動保存');
    expect(translations.en.footerText).toContain('Local-first');
    expect(translations.en.footerText).toContain('Auto-save');
  });
});