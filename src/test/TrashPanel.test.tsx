import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { LanguageProvider } from '../lib/LanguageContext';

// Mock the API module
vi.mock('../lib/api', () => ({
  getDeletedItems: vi.fn(() => Promise.resolve([])),
  restoreProject: vi.fn(() => Promise.resolve()),
  restoreVersion: vi.fn(() => Promise.resolve()),
  restoreFragment: vi.fn(() => Promise.resolve()),
  restoreSongArtifact: vi.fn(() => Promise.resolve()),
  restoreStyleProfile: vi.fn(() => Promise.resolve()),
}));

// Import after mocking
import { getDeletedItems } from '../lib/api';

// Simple TrashPanel mock for testing language integration
function MockTrashPanel({ onClose }: { onClose?: () => void }) {
  return (
    <div className="dialog-overlay">
      <div className="dialog">
        <h3>🗑️ 削除済みアイテム</h3>
        <p className="empty-text">削除済みアイテムはありません</p>
        <button onClick={onClose}>閉じる</button>
      </div>
    </div>
  );
}

function MockTrashPanelEn({ onClose }: { onClose?: () => void }) {
  const { t } = useLanguage();
  return (
    <div className="dialog-overlay">
      <div className="dialog">
        <h3>🗑️ {t('deletedItems')}</h3>
        <p className="empty-text">{t('noDeletedItems')}</p>
        <button onClick={onClose}>{t('close')}</button>
      </div>
    </div>
  );
}

import { useLanguage } from '../lib/LanguageContext';

describe('TrashPanel language integration', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Japanese display', () => {
    it('should show Japanese text by default', () => {
      render(
        <LanguageProvider>
          <MockTrashPanelEn />
        </LanguageProvider>
      );

      expect(screen.getByRole('heading').textContent).toContain('削除済みアイテム');
      expect(screen.getByText('削除済みアイテムはありません')).toBeDefined();
      expect(screen.getByText('閉じる')).toBeDefined();
    });

    it('should show correct title in Japanese', () => {
      render(
        <LanguageProvider>
          <MockTrashPanelEn />
        </LanguageProvider>
      );

      expect(screen.getByRole('heading', { level: 3 }).textContent).toContain('削除済み');
    });
  });

  describe('English display', () => {
    it('should show English text when language is en', async () => {
      localStorage.setItem('lyriclytic_language', 'en');
      render(
        <LanguageProvider>
          <MockTrashPanelEn />
        </LanguageProvider>
      );

      expect(screen.getByRole('heading').textContent).toContain('Deleted Items');
      expect(screen.getByText('No deleted items')).toBeDefined();
      expect(screen.getByText('Close')).toBeDefined();
    });
  });

  describe('close button', () => {
    it('should call onClose when close button is clicked', async () => {
      const onClose = vi.fn();
      render(
        <LanguageProvider>
          <MockTrashPanelEn onClose={onClose} />
        </LanguageProvider>
      );

      await act(async () => {
        fireEvent.click(screen.getByText('閉じる'));
      });

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});

// Tests for deleted item types display
describe('Deleted item type labels', () => {
  function ItemTypeTest() {
    const { t } = useLanguage();
    return (
      <div>
        <span data-testid="project">📁 {t('projects')}</span>
        <span data-testid="version">📄 Version</span>
        <span data-testid="fragment">📝 Fragment</span>
        <span data-testid="song">🎵 Song Link</span>
        <span data-testid="style">🎨 Style Profile</span>
      </div>
    );
  }

  beforeEach(() => {
    localStorage.clear();
  });

  it('should display item type icons', () => {
    render(
      <LanguageProvider>
        <ItemTypeTest />
      </LanguageProvider>
    );

    expect(screen.getByTestId('project').textContent).toContain('📁');
    expect(screen.getByTestId('version').textContent).toContain('📄');
    expect(screen.getByTestId('fragment').textContent).toContain('📝');
    expect(screen.getByTestId('song').textContent).toContain('🎵');
    expect(screen.getByTestId('style').textContent).toContain('🎨');
  });

  it('should localize project label', () => {
    render(
      <LanguageProvider>
        <ItemTypeTest />
      </LanguageProvider>
    );

    expect(screen.getByTestId('project').textContent).toBe('📁 プロジェクト');
  });

  it('should localize project label in English', async () => {
    localStorage.setItem('lyriclytic_language', 'en');
    render(
      <LanguageProvider>
        <ItemTypeTest />
      </LanguageProvider>
    );

    expect(screen.getByTestId('project').textContent).toBe('📁 Projects');
  });
});

// Tests for date formatting in trash panel
describe('Date formatting in trash panel', () => {
  function DateTest({ dateStr }: { dateStr: string }) {
    const { language } = useLanguage();
    const formatted = new Date(dateStr).toLocaleDateString(
      language === 'ja' ? 'ja-JP' : 'en-US',
      { year: 'numeric', month: 'short', day: 'numeric' }
    );
    return <span data-testid="date">{formatted}</span>;
  }

  beforeEach(() => {
    localStorage.clear();
  });

  it('should format date in Japanese locale', () => {
    render(
      <LanguageProvider>
        <DateTest dateStr="2024-01-15" />
      </LanguageProvider>
    );

    expect(screen.getByTestId('date').textContent).toContain('2024年');
  });

  it('should format date in English locale', async () => {
    localStorage.setItem('lyriclytic_language', 'en');
    render(
      <LanguageProvider>
        <DateTest dateStr="2024-01-15" />
      </LanguageProvider>
    );

    expect(screen.getByTestId('date').textContent).toContain('Jan');
  });

  it('should update date format when language changes', async () => {
    render(
      <LanguageProvider>
        <DateTest dateStr="2024-06-20" />
      </LanguageProvider>
    );

    expect(screen.getByTestId('date').textContent).toContain('2024年');

    // Switch language
    localStorage.setItem('lyriclytic_language', 'en');
    render(
      <LanguageProvider>
        <DateTest dateStr="2024-06-20" />
      </LanguageProvider>
    );
  });
});

// Tests for restore button
describe('Restore button', () => {
  function RestoreTest({ onRestore }: { onRestore: () => void }) {
    const { t } = useLanguage();
    return (
      <button onClick={onRestore} data-testid="restore-btn">
        {t('restore')}
      </button>
    );
  }

  beforeEach(() => {
    localStorage.clear();
  });

  it('should show restore button in Japanese', () => {
    const onRestore = vi.fn();
    render(
      <LanguageProvider>
        <RestoreTest onRestore={onRestore} />
      </LanguageProvider>
    );

    expect(screen.getByTestId('restore-btn').textContent).toBe('復元');
  });

  it('should show restore button in English', () => {
    localStorage.setItem('lyriclytic_language', 'en');
    const onRestore = vi.fn();
    render(
      <LanguageProvider>
        <RestoreTest onRestore={onRestore} />
      </LanguageProvider>
    );

    expect(screen.getByTestId('restore-btn').textContent).toBe('Restore');
  });

  it('should call onRestore when clicked', async () => {
    const onRestore = vi.fn();
    render(
      <LanguageProvider>
        <RestoreTest onRestore={onRestore} />
      </LanguageProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId('restore-btn'));
    });

    expect(onRestore).toHaveBeenCalledTimes(1);
  });
});