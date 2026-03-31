import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { LanguageProvider, useLanguage } from '../lib/LanguageContext';

// Tests for snapshot and version related translations
describe('Snapshot and version translations', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  function VersionInfo() {
    const { t } = useLanguage();
    return (
      <div>
        <span data-testid="loading-project">{t('loadingProject')}</span>
        <span data-testid="project-not-found">{t('projectNotFound')}</span>
        <span data-testid="auto-save-failed">{t('autoSaveFailed')}</span>
        <span data-testid="snapshot-failed">{t('saveSnapshotFailed')}</span>
      </div>
    );
  }

  it('should show version messages in Japanese', () => {
    render(
      <LanguageProvider>
        <VersionInfo />
      </LanguageProvider>
    );

    expect(screen.getByTestId('loading-project').textContent).toBe('読み込み中...');
    expect(screen.getByTestId('project-not-found').textContent).toBe('プロジェクトが見つかりません');
    expect(screen.getByTestId('auto-save-failed').textContent).toBe('自動保存に失敗しました');
    expect(screen.getByTestId('snapshot-failed').textContent).toBe('スナップショットの保存に失敗しました');
  });

  it('should show version messages in English', () => {
    localStorage.setItem('lyriclytic_language', 'en');
    render(
      <LanguageProvider>
        <VersionInfo />
      </LanguageProvider>
    );

    expect(screen.getByTestId('loading-project').textContent).toBe('Loading...');
    expect(screen.getByTestId('project-not-found').textContent).toBe('Project not found');
    expect(screen.getByTestId('auto-save-failed').textContent).toBe('Auto-save failed');
    expect(screen.getByTestId('snapshot-failed').textContent).toBe('Failed to save snapshot');
  });
});

// Tests for deleted item type translations
describe('Deleted item type labels', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  function DeletedItemsList() {
    const { t } = useLanguage();
    return (
      <ul>
        <li data-testid="type-project">📁 {t('projects')}</li>
        <li data-testid="type-deleted-projects">🗑️ {t('deletedProjects')}</li>
        <li data-testid="type-deleted-items">🗑️ {t('deletedItems')}</li>
        <li data-testid="type-trash">🗑️ {t('trash')}</li>
      </ul>
    );
  }

  it('should show item type labels in Japanese', () => {
    render(
      <LanguageProvider>
        <DeletedItemsList />
      </LanguageProvider>
    );

    expect(screen.getByTestId('type-project').textContent).toBe('📁 プロジェクト');
    expect(screen.getByTestId('type-deleted-projects').textContent).toBe('🗑️ 削除済みプロジェクト');
    expect(screen.getByTestId('type-deleted-items').textContent).toBe('🗑️ 削除済みアイテム');
    expect(screen.getByTestId('type-trash').textContent).toBe('🗑️ 削除済み');
  });

  it('should show item type labels in English', () => {
    localStorage.setItem('lyriclytic_language', 'en');
    render(
      <LanguageProvider>
        <DeletedItemsList />
      </LanguageProvider>
    );

    expect(screen.getByTestId('type-project').textContent).toBe('📁 Projects');
    expect(screen.getByTestId('type-deleted-projects').textContent).toBe('🗑️ Deleted Projects');
    expect(screen.getByTestId('type-deleted-items').textContent).toBe('🗑️ Deleted Items');
    expect(screen.getByTestId('type-trash').textContent).toBe('🗑️ Trash');
  });
});

// Tests for date label translations
describe('Date label translations', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  function DateLabel() {
    const { t } = useLanguage();
    return (
      <div>
        <span data-testid="deleted-label">{t('deletedLabel')}</span>
      </div>
    );
  }

  it('should show deleted label in Japanese', () => {
    render(
      <LanguageProvider>
        <DateLabel />
      </LanguageProvider>
    );

    expect(screen.getByTestId('deleted-label').textContent).toBe('削除日:');
  });

  it('should show deleted label in English', () => {
    localStorage.setItem('lyriclytic_language', 'en');
    render(
      <LanguageProvider>
        <DateLabel />
      </LanguageProvider>
    );

    expect(screen.getByTestId('deleted-label').textContent).toBe('Deleted:');
  });
});

// Tests for action button states
describe('Action button states', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  function ActionButtons({ disabled = false }: { disabled?: boolean }) {
    const { t } = useLanguage();
    return (
      <div>
        <button disabled={disabled} data-testid="create-btn">{t('create')}</button>
        <button disabled={disabled} data-testid="cancel-btn">{t('cancel')}</button>
        <button disabled={disabled} data-testid="restore-btn">{t('restore')}</button>
        <button disabled={disabled} data-testid="close-btn">{t('close')}</button>
      </div>
    );
  }

  it('should show action buttons in Japanese', () => {
    render(
      <LanguageProvider>
        <ActionButtons />
      </LanguageProvider>
    );

    expect(screen.getByTestId('create-btn').textContent).toBe('作成');
    expect(screen.getByTestId('cancel-btn').textContent).toBe('キャンセル');
    expect(screen.getByTestId('restore-btn').textContent).toBe('復元');
    expect(screen.getByTestId('close-btn').textContent).toBe('閉じる');
  });

  it('should show action buttons in English', () => {
    localStorage.setItem('lyriclytic_language', 'en');
    render(
      <LanguageProvider>
        <ActionButtons />
      </LanguageProvider>
    );

    expect(screen.getByTestId('create-btn').textContent).toBe('Create');
    expect(screen.getByTestId('cancel-btn').textContent).toBe('Cancel');
    expect(screen.getByTestId('restore-btn').textContent).toBe('Restore');
    expect(screen.getByTestId('close-btn').textContent).toBe('Close');
  });

  it('should show disabled action buttons', () => {
    render(
      <LanguageProvider>
        <ActionButtons disabled={true} />
      </LanguageProvider>
    );

    expect(screen.getByTestId('create-btn').disabled).toBe(true);
    expect(screen.getByTestId('cancel-btn').disabled).toBe(true);
    expect(screen.getByTestId('restore-btn').disabled).toBe(true);
    expect(screen.getByTestId('close-btn').disabled).toBe(true);
  });
});

// Tests for language name display
describe('Language name display', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  function LanguageNameDisplay() {
    const { t, language } = useLanguage();
    return (
      <div>
        <span data-testid="current-lang">{language}</span>
        <span data-testid="lang-label">{t('language')}</span>
        <span data-testid="ja-name">{t('japanese')}</span>
        <span data-testid="en-name">{t('english')}</span>
      </div>
    );
  }

  it('should display language names correctly', () => {
    render(
      <LanguageProvider>
        <LanguageNameDisplay />
      </LanguageProvider>
    );

    expect(screen.getByTestId('current-lang').textContent).toBe('ja');
    expect(screen.getByTestId('lang-label').textContent).toBe('言語');
    expect(screen.getByTestId('ja-name').textContent).toBe('日本語');
    expect(screen.getByTestId('en-name').textContent).toBe('English');
  });

  it('should display language label in English', () => {
    localStorage.setItem('lyriclytic_language', 'en');
    render(
      <LanguageProvider>
        <LanguageNameDisplay />
      </LanguageProvider>
    );

    expect(screen.getByTestId('current-lang').textContent).toBe('en');
    expect(screen.getByTestId('lang-label').textContent).toBe('Language');
    // Japanese and English names stay the same
    expect(screen.getByTestId('ja-name').textContent).toBe('日本語');
    expect(screen.getByTestId('en-name').textContent).toBe('English');
  });
});

// Tests for footer display
describe('Footer display', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  function Footer() {
    const { t } = useLanguage();
    return (
      <footer data-testid="footer">
        <p>{t('footerText')}</p>
      </footer>
    );
  }

  it('should show Japanese footer', () => {
    render(
      <LanguageProvider>
        <Footer />
      </LanguageProvider>
    );

    expect(screen.getByTestId('footer').textContent).toBe('ローカルファースト • 自動保存 • バージョン履歴');
  });

  it('should show English footer', () => {
    localStorage.setItem('lyriclytic_language', 'en');
    render(
      <LanguageProvider>
        <Footer />
      </LanguageProvider>
    );

    expect(screen.getByTestId('footer').textContent).toBe('Local-first • Auto-save • Version history');
  });

  it('should contain bullet separator in both languages', () => {
    const { rerender } = render(
      <LanguageProvider>
        <Footer />
      </LanguageProvider>
    );

    expect(screen.getByTestId('footer').textContent).toContain('•');

    localStorage.setItem('lyriclytic_language', 'en');
    rerender(
      <LanguageProvider>
        <Footer />
      </LanguageProvider>
    );

    expect(screen.getByTestId('footer').textContent).toContain('•');
  });
});

// Tests for subtitle with correct context
describe('Subtitle context', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  function AppSubtitle() {
    const { t } = useLanguage();
    return <p data-testid="subtitle">{t('subtitle')}</p>;
  }

  it('should show Japanese subtitle mentioning AI music', () => {
    render(
      <LanguageProvider>
        <AppSubtitle />
      </LanguageProvider>
    );

    const text = screen.getByTestId('subtitle').textContent;
    expect(text).toContain('AI音楽');
    expect(text).toContain('歌詞');
  });

  it('should show English subtitle mentioning AI music', () => {
    localStorage.setItem('lyriclytic_language', 'en');
    render(
      <LanguageProvider>
        <AppSubtitle />
      </LanguageProvider>
    );

    const text = screen.getByTestId('subtitle').textContent;
    expect(text).toContain('AI music');
    expect(text).toContain('Lyric');
  });
});

// Tests for app title consistency
describe('App title consistency', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  function AppTitle() {
    const { t } = useLanguage();
    return <h1 data-testid="title">{t('appTitle')}</h1>;
  }

  it('should show same title in both languages', () => {
    const { rerender } = render(
      <LanguageProvider>
        <AppTitle />
      </LanguageProvider>
    );

    expect(screen.getByTestId('title').textContent).toBe('LyricLytic');

    localStorage.setItem('lyriclytic_language', 'en');
    rerender(
      <LanguageProvider>
        <AppTitle />
      </LanguageProvider>
    );

    expect(screen.getByTestId('title').textContent).toBe('LyricLytic');
  });

  it('should not change title with language', async () => {
    const { rerender } = render(
      <LanguageProvider>
        <AppTitle />
      </LanguageProvider>
    );

    const titleBefore = screen.getByTestId('title').textContent;

    localStorage.setItem('lyriclytic_language', 'en');
    rerender(
      <LanguageProvider>
        <AppTitle />
      </LanguageProvider>
    );

    const titleAfter = screen.getByTestId('title').textContent;

    expect(titleBefore).toBe(titleAfter);
    expect(titleAfter).toBe('LyricLytic');
  });
});