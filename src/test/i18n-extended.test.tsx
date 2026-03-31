import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { LanguageProvider, useLanguage } from '../lib/LanguageContext';
import { ReactNode } from 'react';

// Tests for translation key coverage
describe('Translation key coverage', () => {
  const allKeys = [
    'appTitle',
    'subtitle',
    'projects',
    'newProject',
    'projectTitle',
    'create',
    'cancel',
    'loading',
    'noProjects',
    'deleteProject',
    'deleteConfirm',
    'deleteFailed',
    'createFailed',
    'loadFailed',
    'trash',
    'deletedProjects',
    'deletedItems',
    'noDeleted',
    'noDeletedItems',
    'restore',
    'deletedLabel',
    'close',
    'more',
    'footerText',
    'loadingProject',
    'projectNotFound',
    'autoSaveFailed',
    'saveSnapshotFailed',
    'language',
    'japanese',
    'english',
  ] as const;

  function TestComponent({ keyName }: { keyName: string }) {
    const { t } = useLanguage();
    return <span data-testid="translation">{t(keyName as any)}</span>;
  }

  function renderWithProvider(ui: ReactNode) {
    return render(<LanguageProvider>{ui}</LanguageProvider>);
  }

  beforeEach(() => {
    localStorage.clear();
  });

  describe('Japanese translations', () => {
    it.each(allKeys)('should have Japanese translation for key: %s', (key) => {
      renderWithProvider(<TestComponent keyName={key} />);
      const text = screen.getByTestId('translation').textContent;
      expect(text).toBeDefined();
      expect(text!.length).toBeGreaterThan(0);
    });
  });

  describe('English translations', () => {
    beforeEach(async () => {
      localStorage.setItem('lyriclytic_language', 'en');
    });

    it.each(allKeys)('should have English translation for key: %s', async (key) => {
      renderWithProvider(<TestComponent keyName={key} />);
      const text = screen.getByTestId('translation').textContent;
      expect(text).toBeDefined();
      expect(text!.length).toBeGreaterThan(0);
    });
  });
});

// Tests for language detection and initialization
describe('Language detection and initialization', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  function LanguageDisplay() {
    const { language } = useLanguage();
    return <span data-testid="lang">{language}</span>;
  }

  function renderWithProvider(ui: ReactNode) {
    return render(<LanguageProvider>{ui}</LanguageProvider>);
  }

  it('should detect Japanese from localStorage', () => {
    localStorage.setItem('lyriclytic_language', 'ja');
    renderWithProvider(<LanguageDisplay />);
    expect(screen.getByTestId('lang').textContent).toBe('ja');
  });

  it('should detect English from localStorage', () => {
    localStorage.setItem('lyriclytic_language', 'en');
    renderWithProvider(<LanguageDisplay />);
    expect(screen.getByTestId('lang').textContent).toBe('en');
  });

  it('should default to Japanese for empty localStorage', () => {
    renderWithProvider(<LanguageDisplay />);
    expect(screen.getByTestId('lang').textContent).toBe('ja');
  });

  it('should default to Japanese for invalid localStorage value', () => {
    localStorage.setItem('lyriclytic_language', 'fr');
    renderWithProvider(<LanguageDisplay />);
    expect(screen.getByTestId('lang').textContent).toBe('ja');
  });

  it('should default to Japanese for undefined localStorage value', () => {
    localStorage.setItem('lyriclytic_language', 'undefined');
    renderWithProvider(<LanguageDisplay />);
    expect(screen.getByTestId('lang').textContent).toBe('ja');
  });

  it('should handle corrupted localStorage gracefully', () => {
    localStorage.setItem('lyriclytic_language', '{"json":"value"}');
    renderWithProvider(<LanguageDisplay />);
    expect(screen.getByTestId('lang').textContent).toBe('ja');
  });
});

// Tests for concurrent state updates
describe('Concurrent state updates', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  function CounterComponent() {
    const { language, setLanguage, t } = useLanguage();
    return (
      <div>
        <span data-testid="lang">{language}</span>
        <span data-testid="text">{t('projects')}</span>
        <button onClick={() => setLanguage('ja')} data-testid="btn-ja">JA</button>
        <button onClick={() => setLanguage('en')} data-testid="btn-en">EN</button>
      </div>
    );
  }

  function renderWithProvider() {
    return render(
      <LanguageProvider>
        <CounterComponent />
      </LanguageProvider>
    );
  }

  it('should handle rapid language switches correctly', async () => {
    renderWithProvider();

    // Rapid switching
    for (let i = 0; i < 10; i++) {
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-en'));
        fireEvent.click(screen.getByTestId('btn-ja'));
      });
    }

    expect(screen.getByTestId('lang').textContent).toBe('ja');
  });

  it('should maintain translation consistency during rapid switches', async () => {
    renderWithProvider();

    for (let i = 0; i < 5; i++) {
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-en'));
      });
      expect(screen.getByTestId('text').textContent).toBe('Projects');

      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-ja'));
      });
      expect(screen.getByTestId('text').textContent).toBe('プロジェクト');
    }
  });
});

// Tests for provider nesting
describe('Provider nesting', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  function InnerComponent() {
    const { language } = useLanguage();
    return <span data-testid="inner">{language}</span>;
  }

  function OuterComponent() {
    const { language, setLanguage } = useLanguage();
    return (
      <div>
        <span data-testid="outer">{language}</span>
        <button onClick={() => setLanguage('en')} data-testid="switch">Switch</button>
        <LanguageProvider>
          <InnerComponent />
        </LanguageProvider>
      </div>
    );
  }

  it('should create isolated contexts for nested providers', async () => {
    render(
      <LanguageProvider>
        <OuterComponent />
      </LanguageProvider>
    );

    // Both should start as ja
    expect(screen.getByTestId('outer').textContent).toBe('ja');
    expect(screen.getByTestId('inner').textContent).toBe('ja');

    // Switch outer context
    await act(async () => {
      fireEvent.click(screen.getByTestId('switch'));
    });

    // Outer should be en, inner should still be ja (isolated)
    expect(screen.getByTestId('outer').textContent).toBe('en');
    expect(screen.getByTestId('inner').textContent).toBe('ja');
  });
});

// Tests for memory and performance
describe('Performance and memory', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  function ManyTranslationsComponent() {
    const { t } = useLanguage();
    return (
      <div>
        {Array.from({ length: 100 }, (_, i) => (
          <span key={i} data-testid={`text-${i}`}>{t('projects')}</span>
        ))}
      </div>
    );
  }

  it('should handle many translation calls efficiently', () => {
    const start = performance.now();
    render(
      <LanguageProvider>
        <ManyTranslationsComponent />
      </LanguageProvider>
    );
    const end = performance.now();

    // Should render in reasonable time (< 100ms)
    expect(end - start).toBeLessThan(100);

    // All translations should be the same
    const texts = screen.getAllByTestId(/text-\d+/);
    texts.forEach(el => {
      expect(el.textContent).toBe('プロジェクト');
    });
  });

  it('should not cause memory leaks on unmount', () => {
    const { unmount } = render(
      <LanguageProvider>
        <div>Test</div>
      </LanguageProvider>
    );

    // Should unmount without errors
    expect(() => unmount()).not.toThrow();
  });
});

// Tests for special characters and Unicode
describe('Unicode and special characters', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  function UnicodeComponent() {
    const { t } = useLanguage();
    return (
      <div>
        <span data-testid="footer">{t('footerText')}</span>
        <span data-testid="more">{t('more')}</span>
      </div>
    );
  }

  it('should handle Unicode characters correctly in Japanese', () => {
    render(
      <LanguageProvider>
        <UnicodeComponent />
      </LanguageProvider>
    );

    expect(screen.getByTestId('footer').textContent).toContain('•');
    expect(screen.getByTestId('more').textContent).toBe('その他');
  });

  it('should handle Unicode characters correctly in English', async () => {
    localStorage.setItem('lyriclytic_language', 'en');
    render(
      <LanguageProvider>
        <UnicodeComponent />
      </LanguageProvider>
    );

    expect(screen.getByTestId('footer').textContent).toContain('•');
    expect(screen.getByTestId('more').textContent).toBe('More');
  });
});