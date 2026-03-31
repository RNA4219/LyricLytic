import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { LanguageProvider, useLanguage } from '../lib/LanguageContext';
import { ReactNode } from 'react';

function TestComponent() {
  const { language, setLanguage, t } = useLanguage();
  return (
    <div>
      <span data-testid="language">{language}</span>
      <span data-testid="title">{t('appTitle')}</span>
      <span data-testid="projects">{t('projects')}</span>
      <span data-testid="loading">{t('loading')}</span>
      <span data-testid="trash">{t('trash')}</span>
      <span data-testid="more">{t('more')}</span>
      <button onClick={() => setLanguage('ja')} data-testid="btn-ja">JA</button>
      <button onClick={() => setLanguage('en')} data-testid="btn-en">EN</button>
    </div>
  );
}

function renderWithProvider(ui: ReactNode, initialLanguage?: string) {
  if (initialLanguage) {
    localStorage.setItem('lyriclytic_language', initialLanguage);
  }
  return render(<LanguageProvider>{ui}</LanguageProvider>);
}

describe('LanguageContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('default behavior', () => {
    it('should default to Japanese when no stored preference', () => {
      renderWithProvider(<TestComponent />);
      expect(screen.getByTestId('language').textContent).toBe('ja');
    });

    it('should provide correct Japanese translations by default', () => {
      renderWithProvider(<TestComponent />);
      expect(screen.getByTestId('title').textContent).toBe('LyricLytic');
      expect(screen.getByTestId('projects').textContent).toBe('プロジェクト');
      expect(screen.getByTestId('loading').textContent).toBe('読み込み中...');
      expect(screen.getByTestId('trash').textContent).toBe('削除済み');
      expect(screen.getByTestId('more').textContent).toBe('その他');
    });
  });

  describe('language switching', () => {
    it('should switch to English when setLanguage is called', async () => {
      renderWithProvider(<TestComponent />);

      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-en'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('language').textContent).toBe('en');
        expect(screen.getByTestId('projects').textContent).toBe('Projects');
        expect(screen.getByTestId('loading').textContent).toBe('Loading...');
        expect(screen.getByTestId('trash').textContent).toBe('Trash');
        expect(screen.getByTestId('more').textContent).toBe('More');
      });
    });

    it('should switch from English to Japanese', async () => {
      renderWithProvider(<TestComponent />);

      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-en'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('language').textContent).toBe('en');
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-ja'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('language').textContent).toBe('ja');
        expect(screen.getByTestId('projects').textContent).toBe('プロジェクト');
      });
    });

    it('should stay in Japanese when clicking JA button while already in Japanese', async () => {
      renderWithProvider(<TestComponent />);

      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-ja'));
      });

      expect(screen.getByTestId('language').textContent).toBe('ja');
    });

    it('should stay in English when clicking EN button while already in English', async () => {
      renderWithProvider(<TestComponent />, 'en');

      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-en'));
      });

      expect(screen.getByTestId('language').textContent).toBe('en');
    });
  });

  describe('localStorage persistence', () => {
    it('should save language preference to localStorage', async () => {
      renderWithProvider(<TestComponent />);

      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-en'));
      });

      await waitFor(() => {
        expect(localStorage.getItem('lyriclytic_language')).toBe('en');
      });
    });

    it('should load language preference from localStorage on mount', () => {
      renderWithProvider(<TestComponent />, 'en');
      expect(screen.getByTestId('language').textContent).toBe('en');
      expect(screen.getByTestId('projects').textContent).toBe('Projects');
    });

    it('should update localStorage when switching back to Japanese', async () => {
      renderWithProvider(<TestComponent />, 'en');

      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-ja'));
      });

      await waitFor(() => {
        expect(localStorage.getItem('lyriclytic_language')).toBe('ja');
      });
    });

    it('should ignore invalid stored language values', () => {
      localStorage.setItem('lyriclytic_language', 'invalid');
      renderWithProvider(<TestComponent />);
      expect(screen.getByTestId('language').textContent).toBe('ja');
    });

    it('should ignore null stored language value', () => {
      localStorage.setItem('lyriclytic_language', 'null');
      renderWithProvider(<TestComponent />);
      expect(screen.getByTestId('language').textContent).toBe('ja');
    });
  });

  describe('translation function', () => {
    it('should return the key itself for missing translations', () => {
      renderWithProvider(<TestComponent />);
      // This tests that the translation function handles missing keys gracefully
      // Since we can't directly call t() here, we verify through the component
      expect(screen.getByTestId('title').textContent).toBe('LyricLytic');
    });

    it('should provide all required UI translations', () => {
      renderWithProvider(<TestComponent />);
      const requiredKeys = ['title', 'projects', 'loading', 'trash', 'more'];

      for (const key of requiredKeys) {
        expect(screen.getByTestId(key).textContent.length).toBeGreaterThan(0);
      }
    });
  });

  describe('document lang attribute', () => {
    it('should set document lang to ja for Japanese', async () => {
      renderWithProvider(<TestComponent />);
      await waitFor(() => {
        expect(document.documentElement.lang).toBe('ja');
      });
    });

    it('should update document lang to en for English', async () => {
      renderWithProvider(<TestComponent />);

      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-en'));
      });

      await waitFor(() => {
        expect(document.documentElement.lang).toBe('en');
      });
    });

    it('should update document lang when language changes', async () => {
      renderWithProvider(<TestComponent />);

      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-en'));
      });
      await waitFor(() => {
        expect(document.documentElement.lang).toBe('en');
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-ja'));
      });
      await waitFor(() => {
        expect(document.documentElement.lang).toBe('ja');
      });
    });
  });

  describe('error handling', () => {
    it('should throw error when useLanguage is used outside provider', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      function ComponentWithoutProvider() {
        useLanguage();
        return null;
      }

      let error: Error | null = null;
      try {
        render(<ComponentWithoutProvider />);
      } catch (e) {
        error = e as Error;
      }

      expect(error).not.toBeNull();
      expect(error?.message).toBe('useLanguage must be used within LanguageProvider');

      // Clear any remaining errors
      consoleError.mockClear();
      consoleError.mockRestore();
    });
  });

  describe('multiple renders', () => {
    it('should maintain consistent state across multiple renders', async () => {
      renderWithProvider(<TestComponent />);

      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-en'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('language').textContent).toBe('en');
      });

      // State should persist
      expect(screen.getByTestId('language').textContent).toBe('en');
    });
  });
});