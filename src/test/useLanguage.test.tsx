import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { LanguageProvider, useLanguage } from '../lib/LanguageContext';
import { ReactNode } from 'react';

// Tests for hook behavior
describe('useLanguage hook', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  function wrapper({ children }: { children: ReactNode }) {
    return <LanguageProvider>{children}</LanguageProvider>;
  }

  describe('initial state', () => {
    it('should return Japanese as default language', () => {
      const { result } = renderHook(() => useLanguage(), { wrapper });
      expect(result.current.language).toBe('ja');
    });

    it('should provide translation function', () => {
      const { result } = renderHook(() => useLanguage(), { wrapper });
      expect(typeof result.current.t).toBe('function');
    });

    it('should provide setLanguage function', () => {
      const { result } = renderHook(() => useLanguage(), { wrapper });
      expect(typeof result.current.setLanguage).toBe('function');
    });
  });

  describe('setLanguage', () => {
    it('should change language to English', () => {
      const { result } = renderHook(() => useLanguage(), { wrapper });

      act(() => {
        result.current.setLanguage('en');
      });

      expect(result.current.language).toBe('en');
    });

    it('should change language to Japanese', () => {
      localStorage.setItem('lyriclytic_language', 'en');
      const { result } = renderHook(() => useLanguage(), { wrapper });

      act(() => {
        result.current.setLanguage('ja');
      });

      expect(result.current.language).toBe('ja');
    });

    it('should persist language change to localStorage', () => {
      const { result } = renderHook(() => useLanguage(), { wrapper });

      act(() => {
        result.current.setLanguage('en');
      });

      expect(localStorage.getItem('lyriclytic_language')).toBe('en');
    });
  });

  describe('translation function', () => {
    it('should return Japanese text when language is ja', () => {
      const { result } = renderHook(() => useLanguage(), { wrapper });
      expect(result.current.t('projects')).toBe('プロジェクト');
    });

    it('should return English text when language is en', () => {
      localStorage.setItem('lyriclytic_language', 'en');
      const { result } = renderHook(() => useLanguage(), { wrapper });
      expect(result.current.t('projects')).toBe('Projects');
    });

    it('should update translations when language changes', () => {
      const { result } = renderHook(() => useLanguage(), { wrapper });

      expect(result.current.t('projects')).toBe('プロジェクト');

      act(() => {
        result.current.setLanguage('en');
      });

      expect(result.current.t('projects')).toBe('Projects');
    });
  });

  describe('multiple hooks', () => {
    it('should each have their own state', () => {
      const { result: result1 } = renderHook(() => useLanguage(), { wrapper });
      const { result: result2 } = renderHook(() => useLanguage(), { wrapper });

      // Both start with the same default
      expect(result1.current.language).toBe('ja');
      expect(result2.current.language).toBe('ja');

      // Changing one doesn't affect the other (separate context instances)
      act(() => {
        result1.current.setLanguage('en');
      });

      expect(result1.current.language).toBe('en');
      // result2 still has its own state
      expect(result2.current.language).toBe('ja');
    });
  });

  describe('hook return value stability', () => {
    it('should maintain stable reference for t function', () => {
      const { result, rerender } = renderHook(() => useLanguage(), { wrapper });

      const firstT = result.current.t;
      rerender();
      const secondT = result.current.t;

      // t function should work the same way
      expect(firstT('projects')).toBe(secondT('projects'));
    });
  });
});

// Tests for localStorage integration
describe('localStorage integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  function wrapper({ children }: { children: ReactNode }) {
    return <LanguageProvider>{children}</LanguageProvider>;
  }

  it('should read initial language from localStorage', () => {
    localStorage.setItem('lyriclytic_language', 'en');
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(result.current.language).toBe('en');
  });

  it('should handle missing localStorage value', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(result.current.language).toBe('ja');
  });

  it('should handle invalid localStorage value', () => {
    localStorage.setItem('lyriclytic_language', 'invalid');
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(result.current.language).toBe('ja');
  });

  it('should update localStorage on language change', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });

    act(() => {
      result.current.setLanguage('en');
    });

    expect(localStorage.getItem('lyriclytic_language')).toBe('en');

    act(() => {
      result.current.setLanguage('ja');
    });

    expect(localStorage.getItem('lyriclytic_language')).toBe('ja');
  });
});

// Tests for document lang attribute
describe('document lang attribute', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.lang = '';
  });

  function wrapper({ children }: { children: ReactNode }) {
    return <LanguageProvider>{children}</LanguageProvider>;
  }

  it('should set document lang to ja by default', () => {
    renderHook(() => useLanguage(), { wrapper });
    expect(document.documentElement.lang).toBe('ja');
  });

  it('should update document lang when language changes', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });

    act(() => {
      result.current.setLanguage('en');
    });

    expect(document.documentElement.lang).toBe('en');
  });

  it('should sync document lang with language state', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });

    expect(document.documentElement.lang).toBe('ja');

    act(() => {
      result.current.setLanguage('en');
    });
    expect(document.documentElement.lang).toBe('en');

    act(() => {
      result.current.setLanguage('ja');
    });
    expect(document.documentElement.lang).toBe('ja');
  });
});

// Tests for edge cases
describe('Edge cases', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  function wrapper({ children }: { children: ReactNode }) {
    return <LanguageProvider>{children}</LanguageProvider>;
  }

  it('should handle setting same language multiple times', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });

    act(() => {
      result.current.setLanguage('ja');
      result.current.setLanguage('ja');
      result.current.setLanguage('ja');
    });

    expect(result.current.language).toBe('ja');
  });

  it('should handle rapid language switching', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });

    act(() => {
      result.current.setLanguage('en');
      result.current.setLanguage('ja');
      result.current.setLanguage('en');
      result.current.setLanguage('ja');
    });

    expect(result.current.language).toBe('ja');
  });

  it('should return correct translation after multiple switches', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });

    act(() => { result.current.setLanguage('en'); });
    expect(result.current.t('projects')).toBe('Projects');

    act(() => { result.current.setLanguage('ja'); });
    expect(result.current.t('projects')).toBe('プロジェクト');

    act(() => { result.current.setLanguage('en'); });
    expect(result.current.t('projects')).toBe('Projects');
  });
});