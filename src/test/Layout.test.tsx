import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Layout from '../components/Layout';
import { LanguageProvider } from '../lib/LanguageContext';

function renderLayout() {
  return render(
    <BrowserRouter>
      <LanguageProvider>
        <Layout />
      </LanguageProvider>
    </BrowserRouter>
  );
}

describe('Layout component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('language switch buttons', () => {
    it('should render JA and EN buttons', () => {
      renderLayout();
      expect(screen.getByText('JA')).toBeDefined();
      expect(screen.getByText('EN')).toBeDefined();
    });

    it('should have JA button active by default', () => {
      renderLayout();
      const jaBtn = screen.getByText('JA');
      expect(jaBtn.classList.contains('active')).toBe(true);
    });

    it('should switch to EN when EN button is clicked', async () => {
      renderLayout();

      await act(async () => {
        fireEvent.click(screen.getByText('EN'));
      });

      await waitFor(() => {
        const enBtn = screen.getByText('EN');
        const jaBtn = screen.getByText('JA');
        expect(enBtn.classList.contains('active')).toBe(true);
        expect(jaBtn.classList.contains('active')).toBe(false);
      });
    });

    it('should switch back to JA when JA button is clicked', async () => {
      renderLayout();

      await act(async () => {
        fireEvent.click(screen.getByText('EN'));
      });

      await act(async () => {
        fireEvent.click(screen.getByText('JA'));
      });

      await waitFor(() => {
        const jaBtn = screen.getByText('JA');
        const enBtn = screen.getByText('EN');
        expect(jaBtn.classList.contains('active')).toBe(true);
        expect(enBtn.classList.contains('active')).toBe(false);
      });
    });
  });

  describe('header title', () => {
    it('should display app title', () => {
      renderLayout();
      expect(screen.getByText('LyricLytic')).toBeDefined();
    });

    it('should always show LyricLytic regardless of language', async () => {
      renderLayout();

      expect(screen.getByText('LyricLytic')).toBeDefined();

      await act(async () => {
        fireEvent.click(screen.getByText('EN'));
      });

      expect(screen.getByText('LyricLytic')).toBeDefined();
    });
  });

  describe('language persistence', () => {
    it('should load saved language preference', () => {
      localStorage.setItem('lyriclytic_language', 'en');
      renderLayout();

      const enBtn = screen.getByText('EN');
      const jaBtn = screen.getByText('JA');
      expect(enBtn.classList.contains('active')).toBe(true);
      expect(jaBtn.classList.contains('active')).toBe(false);
    });

    it('should save language preference when switched', async () => {
      renderLayout();

      await act(async () => {
        fireEvent.click(screen.getByText('EN'));
      });

      await waitFor(() => {
        expect(localStorage.getItem('lyriclytic_language')).toBe('en');
      });
    });
  });

  describe('button styling', () => {
    it('should have lang-btn class on both buttons', () => {
      renderLayout();
      const jaBtn = screen.getByText('JA');
      const enBtn = screen.getByText('EN');

      expect(jaBtn.classList.contains('lang-btn')).toBe(true);
      expect(enBtn.classList.contains('lang-btn')).toBe(true);
    });

    it('should have language-switch container', () => {
      renderLayout();
      const switchContainer = screen.getByText('JA').closest('.language-switch');
      expect(switchContainer).toBeDefined();
    });
  });

  describe('DOM structure', () => {
    it('should have header element', () => {
      renderLayout();
      expect(screen.getByRole('banner')).toBeDefined();
    });

    it('should have main element', () => {
      renderLayout();
      expect(screen.getByRole('main')).toBeDefined();
    });

    it('should have layout container', () => {
      const { container } = renderLayout();
      expect(container.querySelector('.layout')).toBeDefined();
    });
  });
});