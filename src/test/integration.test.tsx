import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { LanguageProvider, useLanguage } from '../lib/LanguageContext';

// Mock component simulating full app language behavior
function MockApp() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <MockHeader />
        <MockHome />
      </LanguageProvider>
    </BrowserRouter>
  );
}

function MockHeader() {
  const { language, setLanguage, t } = useLanguage();
  const isJa = language === 'ja';

  return (
    <header>
      <h1>{t('appTitle')}</h1>
      <div className="language-switch">
        <button
          className={`lang-btn ${isJa ? 'active' : ''}`}
          onClick={() => setLanguage('ja')}
          data-testid="btn-ja"
          title={t('japanese')}
        >
          JA
        </button>
        <button
          className={`lang-btn ${!isJa ? 'active' : ''}`}
          onClick={() => setLanguage('en')}
          data-testid="btn-en"
          title={t('english')}
        >
          EN
        </button>
      </div>
    </header>
  );
}

function MockHome() {
  const { t, language } = useLanguage();
  const [projects] = useState([{ title: 'Test Project', updated_at: '2024-01-01' }]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(
      language === 'ja' ? 'ja-JP' : 'en-US',
      { year: 'numeric', month: 'short', day: 'numeric' }
    );
  };

  return (
    <main>
      <h2>{t('appTitle')}</h2>
      <p className="subtitle">{t('subtitle')}</p>

      <div className="project-list">
        <h3>{t('projects')} (1)</h3>
        <ul>
          <li>
            <span>{projects[0].title}</span>
            <span>{formatDate(projects[0].updated_at)}</span>
          </li>
        </ul>
        <button>+ {t('newProject')}</button>
      </div>

      <button className="more-btn">⋯ {t('more')}</button>

      <footer>
        <p>{t('footerText')}</p>
      </footer>
    </main>
  );
}

describe('Language integration tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('full page language switching', () => {
    it('should show Japanese content by default', () => {
      render(<MockApp />);

      expect(screen.getByText('AI音楽生成向け歌詞制作ツール')).toBeDefined();
      expect(screen.getByText('プロジェクト (1)')).toBeDefined();
      expect(screen.getByText('+ 新規プロジェクト')).toBeDefined();
      expect(screen.getByText('⋯ その他')).toBeDefined();
      expect(screen.getByText('ローカルファースト • 自動保存 • バージョン履歴')).toBeDefined();
    });

    it('should show English content after switching', async () => {
      render(<MockApp />);

      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-en'));
      });

      await waitFor(() => {
        expect(screen.getByText('Lyric production tool for AI music generation')).toBeDefined();
      });

      expect(screen.getByText('Projects (1)')).toBeDefined();
      expect(screen.getByText('+ New Project')).toBeDefined();
      expect(screen.getByText('⋯ More')).toBeDefined();
      expect(screen.getByText('Local-first • Auto-save • Version history')).toBeDefined();
    });

    it('should switch all text elements at once', async () => {
      render(<MockApp />);

      expect(screen.getByText('プロジェクト (1)')).toBeDefined();

      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-en'));
      });

      await waitFor(() => {
        expect(screen.getByText('Projects (1)')).toBeDefined();
      });
    });

    it('should maintain button state consistency across re-renders', async () => {
      const { rerender } = render(<MockApp />);

      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-en'));
      });

      rerender(<MockApp />);

      await waitFor(() => {
        expect(screen.getByTestId('btn-en').classList.contains('active')).toBe(true);
        expect(screen.getByTestId('btn-ja').classList.contains('active')).toBe(false);
      });
    });
  });

  describe('date formatting by language', () => {
    it('should format dates in Japanese locale for JA', () => {
      render(<MockApp />);
      expect(screen.getByText('2024年1月1日')).toBeDefined();
    });

    it('should format dates in English locale for EN', async () => {
      render(<MockApp />);

      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-en'));
      });

      await waitFor(() => {
        expect(screen.getByText(/Jan.*1.*2024/)).toBeDefined();
      });
    });
  });

  describe('language button interaction', () => {
    it('should toggle active class correctly', async () => {
      render(<MockApp />);

      const jaBtn = screen.getByTestId('btn-ja');
      const enBtn = screen.getByTestId('btn-en');

      expect(jaBtn.classList.contains('active')).toBe(true);
      expect(enBtn.classList.contains('active')).toBe(false);

      await act(async () => {
        fireEvent.click(enBtn);
      });

      await waitFor(() => {
        expect(jaBtn.classList.contains('active')).toBe(false);
        expect(enBtn.classList.contains('active')).toBe(true);
      });

      await act(async () => {
        fireEvent.click(jaBtn);
      });

      await waitFor(() => {
        expect(jaBtn.classList.contains('active')).toBe(true);
        expect(enBtn.classList.contains('active')).toBe(false);
      });
    });

    it('should handle rapid clicks without state issues', async () => {
      render(<MockApp />);

      const enBtn = screen.getByTestId('btn-en');
      const jaBtn = screen.getByTestId('btn-ja');

      await act(async () => {
        fireEvent.click(enBtn);
        fireEvent.click(jaBtn);
        fireEvent.click(enBtn);
        fireEvent.click(jaBtn);
      });

      await waitFor(() => {
        expect(screen.getByTestId('btn-ja').classList.contains('active')).toBe(true);
      });
    });
  });

  describe('accessibility', () => {
    it('should have title attribute on language buttons', () => {
      render(<MockApp />);

      expect(screen.getByTestId('btn-ja').getAttribute('title')).toBe('日本語');
      expect(screen.getByTestId('btn-en').getAttribute('title')).toBe('English');
    });

    it('should have button elements for language switching', () => {
      render(<MockApp />);

      const jaBtn = screen.getByTestId('btn-ja');
      const enBtn = screen.getByTestId('btn-en');

      expect(jaBtn.tagName).toBe('BUTTON');
      expect(enBtn.tagName).toBe('BUTTON');
    });
  });

  describe('storage synchronization', () => {
    it('should sync localStorage with UI state', async () => {
      render(<MockApp />);

      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-en'));
      });

      await waitFor(() => {
        expect(localStorage.getItem('lyriclytic_language')).toBe('en');
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-ja'));
      });

      await waitFor(() => {
        expect(localStorage.getItem('lyriclytic_language')).toBe('ja');
      });
    });

    it('should load from localStorage on subsequent renders', async () => {
      localStorage.setItem('lyriclytic_language', 'en');

      render(<MockApp />);

      await waitFor(() => {
        expect(screen.getByTestId('btn-en').classList.contains('active')).toBe(true);
      });
    });
  });
});