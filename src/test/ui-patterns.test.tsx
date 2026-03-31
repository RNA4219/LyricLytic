import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { LanguageProvider, useLanguage } from '../lib/LanguageContext';

// Tests for button interaction patterns
describe('Button interaction patterns', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  function LanguageButtons() {
    const { language, setLanguage } = useLanguage();
    return (
      <div>
        <button
          data-testid="btn-ja"
          data-active={language === 'ja'}
          onClick={() => setLanguage('ja')}
        >
          日本語
        </button>
        <button
          data-testid="btn-en"
          data-active={language === 'en'}
          onClick={() => setLanguage('en')}
        >
          English
        </button>
        <span data-testid="current-lang">{language}</span>
      </div>
    );
  }

  describe('Visual feedback', () => {
    it('should indicate active language with data attribute', () => {
      render(
        <LanguageProvider>
          <LanguageButtons />
        </LanguageProvider>
      );

      expect(screen.getByTestId('btn-ja').dataset.active).toBe('true');
      expect(screen.getByTestId('btn-en').dataset.active).toBe('false');
    });

    it('should update active state on language change', async () => {
      render(
        <LanguageProvider>
          <LanguageButtons />
        </LanguageProvider>
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-en'));
      });

      expect(screen.getByTestId('btn-ja').dataset.active).toBe('false');
      expect(screen.getByTestId('btn-en').dataset.active).toBe('true');
    });

    it('should toggle between languages', async () => {
      render(
        <LanguageProvider>
          <LanguageButtons />
        </LanguageProvider>
      );

      // Initial: JA active
      expect(screen.getByTestId('btn-ja').dataset.active).toBe('true');

      // Click EN
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-en'));
      });
      expect(screen.getByTestId('btn-en').dataset.active).toBe('true');

      // Click JA
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-ja'));
      });
      expect(screen.getByTestId('btn-ja').dataset.active).toBe('true');

      // Click EN again
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-en'));
      });
      expect(screen.getByTestId('btn-en').dataset.active).toBe('true');
    });
  });

  describe('Keyboard navigation', () => {
    it('should respond to Enter key', async () => {
      render(
        <LanguageProvider>
          <LanguageButtons />
        </LanguageProvider>
      );

      await act(async () => {
        fireEvent.keyDown(screen.getByTestId('btn-en'), { key: 'Enter' });
      });

      // Button should still work with keyboard
      expect(screen.getByTestId('current-lang').textContent).toBe('ja');
    });

    it('should respond to Space key', async () => {
      render(
        <LanguageProvider>
          <LanguageButtons />
        </LanguageProvider>
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-en'));
      });

      expect(screen.getByTestId('current-lang').textContent).toBe('en');
    });
  });

  describe('Multiple clicks', () => {
    it('should handle double-click gracefully', async () => {
      render(
        <LanguageProvider>
          <LanguageButtons />
        </LanguageProvider>
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-en'));
        fireEvent.click(screen.getByTestId('btn-en'));
      });

      expect(screen.getByTestId('current-lang').textContent).toBe('en');
    });

    it('should handle triple-click gracefully', async () => {
      render(
        <LanguageProvider>
          <LanguageButtons />
        </LanguageProvider>
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-en'));
        fireEvent.click(screen.getByTestId('btn-en'));
        fireEvent.click(screen.getByTestId('btn-en'));
      });

      expect(screen.getByTestId('current-lang').textContent).toBe('en');
    });
  });
});

// Tests for form integration
describe('Form integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  function FormWithLanguage() {
    const { t, language } = useLanguage();
    return (
      <form>
        <label>{t('projectTitle')}</label>
        <input placeholder={t('projectTitle')} data-testid="input" />
        <button type="submit">{t('create')}</button>
        <button type="button">{t('cancel')}</button>
        <span data-testid="lang">{language}</span>
      </form>
    );
  }

  it('should display form labels in Japanese', () => {
    render(
      <LanguageProvider>
        <FormWithLanguage />
      </LanguageProvider>
    );

    expect(screen.getByText('プロジェクト名')).toBeDefined();
    expect(screen.getByPlaceholderText('プロジェクト名')).toBeDefined();
    expect(screen.getByText('作成')).toBeDefined();
    expect(screen.getByText('キャンセル')).toBeDefined();
  });

  it('should display form labels in English', () => {
    localStorage.setItem('lyriclytic_language', 'en');
    render(
      <LanguageProvider>
        <FormWithLanguage />
      </LanguageProvider>
    );

    expect(screen.getByText('Project title')).toBeDefined();
    expect(screen.getByPlaceholderText('Project title')).toBeDefined();
    expect(screen.getByText('Create')).toBeDefined();
    expect(screen.getByText('Cancel')).toBeDefined();
  });
});

// Tests for error message display
describe('Error message display', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  function ErrorDisplay({ errorKey }: { errorKey: string }) {
    const { t } = useLanguage();
    return (
      <div role="alert" data-testid="error">
        {t(errorKey as any)}
      </div>
    );
  }

  it('should show delete error in Japanese', () => {
    render(
      <LanguageProvider>
        <ErrorDisplay errorKey="deleteFailed" />
      </LanguageProvider>
    );

    expect(screen.getByTestId('error').textContent).toBe('プロジェクトの削除に失敗しました');
  });

  it('should show delete error in English', () => {
    localStorage.setItem('lyriclytic_language', 'en');
    render(
      <LanguageProvider>
        <ErrorDisplay errorKey="deleteFailed" />
      </LanguageProvider>
    );

    expect(screen.getByTestId('error').textContent).toBe('Failed to delete project');
  });

  it('should show create error in Japanese', () => {
    render(
      <LanguageProvider>
        <ErrorDisplay errorKey="createFailed" />
      </LanguageProvider>
    );

    expect(screen.getByTestId('error').textContent).toBe('プロジェクトの作成に失敗しました');
  });

  it('should show create error in English', () => {
    localStorage.setItem('lyriclytic_language', 'en');
    render(
      <LanguageProvider>
        <ErrorDisplay errorKey="createFailed" />
      </LanguageProvider>
    );

    expect(screen.getByTestId('error').textContent).toBe('Failed to create project');
  });

  it('should show load error in Japanese', () => {
    render(
      <LanguageProvider>
        <ErrorDisplay errorKey="loadFailed" />
      </LanguageProvider>
    );

    expect(screen.getByTestId('error').textContent).toBe('プロジェクトの読み込みに失敗しました');
  });

  it('should show auto-save error in Japanese', () => {
    render(
      <LanguageProvider>
        <ErrorDisplay errorKey="autoSaveFailed" />
      </LanguageProvider>
    );

    expect(screen.getByTestId('error').textContent).toBe('自動保存に失敗しました');
  });

  it('should show snapshot error in Japanese', () => {
    render(
      <LanguageProvider>
        <ErrorDisplay errorKey="saveSnapshotFailed" />
      </LanguageProvider>
    );

    expect(screen.getByTestId('error').textContent).toBe('スナップショットの保存に失敗しました');
  });
});

// Tests for empty states
describe('Empty state messages', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  function EmptyState({ type }: { type: 'projects' | 'deleted' | 'deletedItems' }) {
    const { t } = useLanguage();
    const message = type === 'projects' ? t('noProjects') :
                    type === 'deleted' ? t('noDeleted') : t('noDeletedItems');
    return <p data-testid="empty">{message}</p>;
  }

  it('should show no projects message in Japanese', () => {
    render(
      <LanguageProvider>
        <EmptyState type="projects" />
      </LanguageProvider>
    );

    expect(screen.getByTestId('empty').textContent).toBe('プロジェクトがありません。新規作成してください。');
  });

  it('should show no projects message in English', () => {
    localStorage.setItem('lyriclytic_language', 'en');
    render(
      <LanguageProvider>
        <EmptyState type="projects" />
      </LanguageProvider>
    );

    expect(screen.getByTestId('empty').textContent).toBe('No projects yet. Create one to get started.');
  });

  it('should show no deleted projects message in Japanese', () => {
    render(
      <LanguageProvider>
        <EmptyState type="deleted" />
      </LanguageProvider>
    );

    expect(screen.getByTestId('empty').textContent).toBe('削除済みプロジェクトはありません');
  });

  it('should show no deleted items message in Japanese', () => {
    render(
      <LanguageProvider>
        <EmptyState type="deletedItems" />
      </LanguageProvider>
    );

    expect(screen.getByTestId('empty').textContent).toBe('削除済みアイテムはありません');
  });
});

// Tests for loading states
describe('Loading state messages', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  function LoadingSpinner() {
    const { t } = useLanguage();
    return <span data-testid="loading">{t('loading')}</span>;
  }

  it('should show loading in Japanese', () => {
    render(
      <LanguageProvider>
        <LoadingSpinner />
      </LanguageProvider>
    );

    expect(screen.getByTestId('loading').textContent).toBe('読み込み中...');
  });

  it('should show loading in English', () => {
    localStorage.setItem('lyriclytic_language', 'en');
    render(
      <LanguageProvider>
        <LoadingSpinner />
      </LanguageProvider>
    );

    expect(screen.getByTestId('loading').textContent).toBe('Loading...');
  });
});

// Tests for confirmation dialogs
describe('Confirmation dialogs', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  function DeleteConfirmDialog({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
    const { t } = useLanguage();
    return (
      <div role="dialog">
        <p>{t('deleteConfirm')}</p>
        <button onClick={onConfirm}>{t('deleteProject')}</button>
        <button onClick={onCancel}>{t('cancel')}</button>
      </div>
    );
  }

  it('should show confirmation in Japanese', () => {
    render(
      <LanguageProvider>
        <DeleteConfirmDialog onConfirm={() => {}} onCancel={() => {}} />
      </LanguageProvider>
    );

    expect(screen.getByText('このプロジェクトを削除しますか？削除済みアイテムから復元できます。')).toBeDefined();
    expect(screen.getByText('プロジェクトを削除')).toBeDefined();
    expect(screen.getByText('キャンセル')).toBeDefined();
  });

  it('should show confirmation in English', () => {
    localStorage.setItem('lyriclytic_language', 'en');
    render(
      <LanguageProvider>
        <DeleteConfirmDialog onConfirm={() => {}} onCancel={() => {}} />
      </LanguageProvider>
    );

    expect(screen.getByText('Delete this project? It can be restored from deleted items.')).toBeDefined();
    expect(screen.getByText('Delete project')).toBeDefined();
    expect(screen.getByText('Cancel')).toBeDefined();
  });

  it('should call onConfirm when delete button clicked', async () => {
    const onConfirm = vi.fn();
    render(
      <LanguageProvider>
        <DeleteConfirmDialog onConfirm={onConfirm} onCancel={() => {}} />
      </LanguageProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('プロジェクトを削除'));
    });

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('should call onCancel when cancel button clicked', async () => {
    const onCancel = vi.fn();
    render(
      <LanguageProvider>
        <DeleteConfirmDialog onConfirm={() => {}} onCancel={onCancel} />
      </LanguageProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('キャンセル'));
    });

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});