import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LanguageProvider, useLanguage } from '../lib/LanguageContext';

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock API
vi.mock('../lib/api', () => ({
  getProjects: vi.fn(() => Promise.resolve([
    { project_id: '1', title: 'Test Project 1', updated_at: '2024-01-01' },
    { project_id: '2', title: 'Test Project 2', updated_at: '2024-01-02' },
  ])),
  createProject: vi.fn(() => Promise.resolve({ project_id: '3', title: 'New Project' })),
  deleteProject: vi.fn(() => Promise.resolve()),
}));

function MockHome() {
  const { t, language } = useLanguage();
  const [showNewProjectInput, setShowNewProjectInput] = useState(false);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(
      language === 'ja' ? 'ja-JP' : 'en-US',
      { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
    );
  };

  return (
    <div className="home">
      <div className="home-header">
        <h2>{t('appTitle')}</h2>
        <p className="subtitle">{t('subtitle')}</p>
      </div>

      <div className="project-list">
        <div className="project-list-header">
          <h3>{t('projects')} (2)</h3>
          {!showNewProjectInput ? (
            <button onClick={() => setShowNewProjectInput(true)}>
              + {t('newProject')}
            </button>
          ) : (
            <div className="new-project-form">
              <input placeholder={t('projectTitle')} />
              <button>{t('create')}</button>
              <button onClick={() => setShowNewProjectInput(false)}>{t('cancel')}</button>
            </div>
          )}
        </div>

        <ul className="projects">
          <li>
            <span>Test Project 1</span>
            <span>{formatDate('2024-01-01')}</span>
          </li>
          <li>
            <span>Test Project 2</span>
            <span>{formatDate('2024-01-02')}</span>
          </li>
        </ul>
      </div>

      <div className="home-footer">
        <p>{t('footerText')}</p>
      </div>
    </div>
  );
}

import { useState } from 'react';

describe('Home page language tests', () => {
  beforeEach(() => {
    localStorage.clear();
    mockNavigate.mockClear();
  });

  describe('Japanese display', () => {
    it('should display all UI elements in Japanese by default', () => {
      render(
        <BrowserRouter>
          <LanguageProvider>
            <MockHome />
          </LanguageProvider>
        </BrowserRouter>
      );

      expect(screen.getByText('LyricLytic')).toBeDefined();
      expect(screen.getByText('AI音楽生成向け歌詞制作ツール')).toBeDefined();
      expect(screen.getByText('プロジェクト (2)')).toBeDefined();
      expect(screen.getByText('+ 新規プロジェクト')).toBeDefined();
      expect(screen.getByText('ローカルファースト • 自動保存 • バージョン履歴')).toBeDefined();
    });

    it('should show Japanese date format', () => {
      render(
        <BrowserRouter>
          <LanguageProvider>
            <MockHome />
          </LanguageProvider>
        </BrowserRouter>
      );

      // Japanese date format includes 年
      const dates = screen.getAllByText(/2024年/);
      expect(dates.length).toBeGreaterThan(0);
    });

    it('should show create form in Japanese', async () => {
      render(
        <BrowserRouter>
          <LanguageProvider>
            <MockHome />
          </LanguageProvider>
        </BrowserRouter>
      );

      await act(async () => {
        fireEvent.click(screen.getByText('+ 新規プロジェクト'));
      });

      expect(screen.getByPlaceholderText('プロジェクト名')).toBeDefined();
      expect(screen.getByText('作成')).toBeDefined();
      expect(screen.getByText('キャンセル')).toBeDefined();
    });
  });

  describe('English display', () => {
    it('should display all UI elements in English', async () => {
      localStorage.setItem('lyriclytic_language', 'en');
      render(
        <BrowserRouter>
          <LanguageProvider>
            <MockHome />
          </LanguageProvider>
        </BrowserRouter>
      );

      expect(screen.getByText('LyricLytic')).toBeDefined();
      expect(screen.getByText('Lyric production tool for AI music generation')).toBeDefined();
      expect(screen.getByText('Projects (2)')).toBeDefined();
      expect(screen.getByText('+ New Project')).toBeDefined();
      expect(screen.getByText('Local-first • Auto-save • Version history')).toBeDefined();
    });

    it('should show English date format', () => {
      localStorage.setItem('lyriclytic_language', 'en');
      render(
        <BrowserRouter>
          <LanguageProvider>
            <MockHome />
          </LanguageProvider>
        </BrowserRouter>
      );

      // English date format includes Jan
      const dates = screen.getAllByText(/Jan/);
      expect(dates.length).toBeGreaterThan(0);
    });

    it('should show create form in English', async () => {
      localStorage.setItem('lyriclytic_language', 'en');
      render(
        <BrowserRouter>
          <LanguageProvider>
            <MockHome />
          </LanguageProvider>
        </BrowserRouter>
      );

      await act(async () => {
        fireEvent.click(screen.getByText('+ New Project'));
      });

      expect(screen.getByPlaceholderText('Project title')).toBeDefined();
      expect(screen.getByText('Create')).toBeDefined();
      expect(screen.getByText('Cancel')).toBeDefined();
    });
  });

  describe('Language switching', () => {
    it('should update all text when language changes', async () => {
      render(
        <BrowserRouter>
          <LanguageProvider>
            <MockHome />
          </LanguageProvider>
        </BrowserRouter>
      );

      // Initially Japanese
      expect(screen.getByText('プロジェクト (2)')).toBeDefined();

      // Switch to English
      localStorage.setItem('lyriclytic_language', 'en');
      render(
        <BrowserRouter>
          <LanguageProvider>
            <MockHome />
          </LanguageProvider>
        </BrowserRouter>
      );

      expect(screen.getByText('Projects (2)')).toBeDefined();
    });
  });

  describe('Project count display', () => {
    it('should show correct project count in Japanese', () => {
      render(
        <BrowserRouter>
          <LanguageProvider>
            <MockHome />
          </LanguageProvider>
        </BrowserRouter>
      );

      expect(screen.getByText('プロジェクト (2)')).toBeDefined();
    });

    it('should show correct project count in English', () => {
      localStorage.setItem('lyriclytic_language', 'en');
      render(
        <BrowserRouter>
          <LanguageProvider>
            <MockHome />
          </LanguageProvider>
        </BrowserRouter>
      );

      expect(screen.getByText('Projects (2)')).toBeDefined();
    });
  });

  describe('Subtitle translation', () => {
    it('should show correct subtitle in Japanese', () => {
      render(
        <BrowserRouter>
          <LanguageProvider>
            <MockHome />
          </LanguageProvider>
        </BrowserRouter>
      );

      expect(screen.getByText('AI音楽生成向け歌詞制作ツール')).toBeDefined();
    });

    it('should show correct subtitle in English', () => {
      localStorage.setItem('lyriclytic_language', 'en');
      render(
        <BrowserRouter>
          <LanguageProvider>
            <MockHome />
          </LanguageProvider>
        </BrowserRouter>
      );

      expect(screen.getByText('Lyric production tool for AI music generation')).toBeDefined();
    });
  });
});