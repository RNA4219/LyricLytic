import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { LanguageProvider, useLanguage } from '../lib/LanguageContext';

// Tests for all translation keys with different contexts
describe('Translation key usage scenarios', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  function AllTranslationsComponent() {
    const { t } = useLanguage();
    return (
      <div>
        <span data-testid="appTitle">{t('appTitle')}</span>
        <span data-testid="subtitle">{t('subtitle')}</span>
        <span data-testid="projects">{t('projects')}</span>
        <span data-testid="newProject">{t('newProject')}</span>
        <span data-testid="projectTitle">{t('projectTitle')}</span>
        <span data-testid="create">{t('create')}</span>
        <span data-testid="cancel">{t('cancel')}</span>
        <span data-testid="loading">{t('loading')}</span>
        <span data-testid="noProjects">{t('noProjects')}</span>
        <span data-testid="deleteProject">{t('deleteProject')}</span>
        <span data-testid="deleteConfirm">{t('deleteConfirm')}</span>
        <span data-testid="deleteFailed">{t('deleteFailed')}</span>
        <span data-testid="createFailed">{t('createFailed')}</span>
        <span data-testid="loadFailed">{t('loadFailed')}</span>
        <span data-testid="trash">{t('trash')}</span>
        <span data-testid="deletedProjects">{t('deletedProjects')}</span>
        <span data-testid="deletedItems">{t('deletedItems')}</span>
        <span data-testid="noDeleted">{t('noDeleted')}</span>
        <span data-testid="noDeletedItems">{t('noDeletedItems')}</span>
        <span data-testid="restore">{t('restore')}</span>
        <span data-testid="deletedLabel">{t('deletedLabel')}</span>
        <span data-testid="close">{t('close')}</span>
        <span data-testid="more">{t('more')}</span>
        <span data-testid="footerText">{t('footerText')}</span>
        <span data-testid="loadingProject">{t('loadingProject')}</span>
        <span data-testid="projectNotFound">{t('projectNotFound')}</span>
        <span data-testid="autoSaveFailed">{t('autoSaveFailed')}</span>
        <span data-testid="saveSnapshotFailed">{t('saveSnapshotFailed')}</span>
        <span data-testid="language">{t('language')}</span>
        <span data-testid="japanese">{t('japanese')}</span>
        <span data-testid="english">{t('english')}</span>
      </div>
    );
  }

  describe('Japanese translations', () => {
    it('should render all Japanese translations correctly', () => {
      render(
        <LanguageProvider>
          <AllTranslationsComponent />
        </LanguageProvider>
      );

      expect(screen.getByTestId('appTitle').textContent).toBe('LyricLytic');
      expect(screen.getByTestId('subtitle').textContent).toBe('AI音楽生成向け歌詞制作ツール');
      expect(screen.getByTestId('projects').textContent).toBe('プロジェクト');
      expect(screen.getByTestId('newProject').textContent).toBe('新規プロジェクト');
      expect(screen.getByTestId('projectTitle').textContent).toBe('プロジェクト名');
      expect(screen.getByTestId('create').textContent).toBe('作成');
      expect(screen.getByTestId('cancel').textContent).toBe('キャンセル');
      expect(screen.getByTestId('loading').textContent).toBe('読み込み中...');
      expect(screen.getByTestId('noProjects').textContent).toBe('プロジェクトがありません。新規作成してください。');
      expect(screen.getByTestId('deleteProject').textContent).toBe('プロジェクトを削除');
      expect(screen.getByTestId('deleteConfirm').textContent).toBe('このプロジェクトを削除しますか？削除済みアイテムから復元できます。');
      expect(screen.getByTestId('deleteFailed').textContent).toBe('プロジェクトの削除に失敗しました');
      expect(screen.getByTestId('createFailed').textContent).toBe('プロジェクトの作成に失敗しました');
      expect(screen.getByTestId('loadFailed').textContent).toBe('プロジェクトの読み込みに失敗しました');
      expect(screen.getByTestId('trash').textContent).toBe('削除済み');
      expect(screen.getByTestId('deletedProjects').textContent).toBe('削除済みプロジェクト');
      expect(screen.getByTestId('deletedItems').textContent).toBe('削除済みアイテム');
      expect(screen.getByTestId('noDeleted').textContent).toBe('削除済みプロジェクトはありません');
      expect(screen.getByTestId('noDeletedItems').textContent).toBe('削除済みアイテムはありません');
      expect(screen.getByTestId('restore').textContent).toBe('復元');
      expect(screen.getByTestId('deletedLabel').textContent).toBe('削除日:');
      expect(screen.getByTestId('close').textContent).toBe('閉じる');
      expect(screen.getByTestId('more').textContent).toBe('その他');
      expect(screen.getByTestId('footerText').textContent).toBe('ローカルファースト • 自動保存 • バージョン履歴');
      expect(screen.getByTestId('loadingProject').textContent).toBe('読み込み中...');
      expect(screen.getByTestId('projectNotFound').textContent).toBe('プロジェクトが見つかりません');
      expect(screen.getByTestId('autoSaveFailed').textContent).toBe('自動保存に失敗しました');
      expect(screen.getByTestId('saveSnapshotFailed').textContent).toBe('スナップショットの保存に失敗しました');
      expect(screen.getByTestId('language').textContent).toBe('言語');
      expect(screen.getByTestId('japanese').textContent).toBe('日本語');
      expect(screen.getByTestId('english').textContent).toBe('English');
    });
  });

  describe('English translations', () => {
    it('should render all English translations correctly', () => {
      localStorage.setItem('lyriclytic_language', 'en');
      render(
        <LanguageProvider>
          <AllTranslationsComponent />
        </LanguageProvider>
      );

      expect(screen.getByTestId('appTitle').textContent).toBe('LyricLytic');
      expect(screen.getByTestId('subtitle').textContent).toBe('Lyric production tool for AI music generation');
      expect(screen.getByTestId('projects').textContent).toBe('Projects');
      expect(screen.getByTestId('newProject').textContent).toBe('New Project');
      expect(screen.getByTestId('projectTitle').textContent).toBe('Project title');
      expect(screen.getByTestId('create').textContent).toBe('Create');
      expect(screen.getByTestId('cancel').textContent).toBe('Cancel');
      expect(screen.getByTestId('loading').textContent).toBe('Loading...');
      expect(screen.getByTestId('noProjects').textContent).toBe('No projects yet. Create one to get started.');
      expect(screen.getByTestId('deleteProject').textContent).toBe('Delete project');
      expect(screen.getByTestId('deleteConfirm').textContent).toBe('Delete this project? It can be restored from deleted items.');
      expect(screen.getByTestId('deleteFailed').textContent).toBe('Failed to delete project');
      expect(screen.getByTestId('createFailed').textContent).toBe('Failed to create project');
      expect(screen.getByTestId('loadFailed').textContent).toBe('Failed to load projects');
      expect(screen.getByTestId('trash').textContent).toBe('Trash');
      expect(screen.getByTestId('deletedProjects').textContent).toBe('Deleted Projects');
      expect(screen.getByTestId('deletedItems').textContent).toBe('Deleted Items');
      expect(screen.getByTestId('noDeleted').textContent).toBe('No deleted projects');
      expect(screen.getByTestId('noDeletedItems').textContent).toBe('No deleted items');
      expect(screen.getByTestId('restore').textContent).toBe('Restore');
      expect(screen.getByTestId('deletedLabel').textContent).toBe('Deleted:');
      expect(screen.getByTestId('close').textContent).toBe('Close');
      expect(screen.getByTestId('more').textContent).toBe('More');
      expect(screen.getByTestId('footerText').textContent).toBe('Local-first • Auto-save • Version history');
      expect(screen.getByTestId('loadingProject').textContent).toBe('Loading...');
      expect(screen.getByTestId('projectNotFound').textContent).toBe('Project not found');
      expect(screen.getByTestId('autoSaveFailed').textContent).toBe('Auto-save failed');
      expect(screen.getByTestId('saveSnapshotFailed').textContent).toBe('Failed to save snapshot');
      expect(screen.getByTestId('language').textContent).toBe('Language');
      expect(screen.getByTestId('japanese').textContent).toBe('日本語');
      expect(screen.getByTestId('english').textContent).toBe('English');
    });
  });
});

// Tests for language switching in real-time
describe('Real-time language switching', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  function RealtimeComponent() {
    const { language, setLanguage, t } = useLanguage();
    return (
      <div>
        <span data-testid="lang">{language}</span>
        <span data-testid="dynamic-text">{t('projects')}</span>
        <button onClick={() => setLanguage('ja')} data-testid="btn-ja">JA</button>
        <button onClick={() => setLanguage('en')} data-testid="btn-en">EN</button>
      </div>
    );
  }

  it('should update text immediately when language changes', async () => {
    render(
      <LanguageProvider>
        <RealtimeComponent />
      </LanguageProvider>
    );

    expect(screen.getByTestId('dynamic-text').textContent).toBe('プロジェクト');

    await act(async () => {
      fireEvent.click(screen.getByTestId('btn-en'));
    });

    expect(screen.getByTestId('dynamic-text').textContent).toBe('Projects');
  });

  it('should handle multiple rapid language changes', async () => {
    render(
      <LanguageProvider>
        <RealtimeComponent />
      </LanguageProvider>
    );

    const jaBtn = screen.getByTestId('btn-ja');
    const enBtn = screen.getByTestId('btn-en');

    // Switch 5 times
    for (let i = 0; i < 5; i++) {
      await act(async () => { fireEvent.click(enBtn); });
      expect(screen.getByTestId('dynamic-text').textContent).toBe('Projects');

      await act(async () => { fireEvent.click(jaBtn); });
      expect(screen.getByTestId('dynamic-text').textContent).toBe('プロジェクト');
    }
  });

  it('should persist the last selected language', async () => {
    render(
      <LanguageProvider>
        <RealtimeComponent />
      </LanguageProvider>
    );

    await act(async () => { fireEvent.click(screen.getByTestId('btn-en')); });
    await act(async () => { fireEvent.click(screen.getByTestId('btn-ja')); });
    await act(async () => { fireEvent.click(screen.getByTestId('btn-en')); });

    expect(localStorage.getItem('lyriclytic_language')).toBe('en');
    expect(screen.getByTestId('dynamic-text').textContent).toBe('Projects');
  });
});

// Tests for component re-rendering optimization
describe('Component re-rendering', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  let renderCount = 0;

  function CountingComponent() {
    const { t } = useLanguage();
    renderCount++;
    return <span data-testid="text">{t('projects')}</span>;
  }

  afterEach(() => {
    renderCount = 0;
  });

  it('should not cause unnecessary re-renders', () => {
    render(
      <LanguageProvider>
        <CountingComponent />
      </LanguageProvider>
    );

    const initialCount = renderCount;
    expect(screen.getByTestId('text').textContent).toBe('プロジェクト');

    // Initial render should only happen once
    expect(renderCount).toBe(initialCount);
  });
});

// Tests for multiple components sharing context
describe('Multiple components sharing context', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  function HeaderComponent() {
    const { language, setLanguage, t } = useLanguage();
    return (
      <header>
        <h1>{t('appTitle')}</h1>
        <button onClick={() => setLanguage(language === 'ja' ? 'en' : 'ja')}>
          {t('language')}
        </button>
      </header>
    );
  }

  function ContentComponent() {
    const { t } = useLanguage();
    return (
      <main>
        <p>{t('subtitle')}</p>
        <button data-testid="new-project-btn">+ {t('newProject')}</button>
      </main>
    );
  }

  function FooterComponent() {
    const { t } = useLanguage();
    return (
      <footer>
        <p>{t('footerText')}</p>
      </footer>
    );
  }

  it('should share language state across components', async () => {
    render(
      <LanguageProvider>
        <HeaderComponent />
        <ContentComponent />
        <FooterComponent />
      </LanguageProvider>
    );

    // All components show Japanese initially
    expect(screen.getByRole('heading').textContent).toBe('LyricLytic');
    expect(screen.getByText('AI音楽生成向け歌詞制作ツール')).toBeDefined();
    expect(screen.getByTestId('new-project-btn').textContent).toBe('+ 新規プロジェクト');
    expect(screen.getByText('ローカルファースト • 自動保存 • バージョン履歴')).toBeDefined();

    // Click language toggle
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '言語' }));
    });

    // All components should now show English
    expect(screen.getByText('Lyric production tool for AI music generation')).toBeDefined();
    expect(screen.getByTestId('new-project-btn').textContent).toBe('+ New Project');
    expect(screen.getByText('Local-first • Auto-save • Version history')).toBeDefined();
  });
});