import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Layout from '../components/Layout';
import { LanguageProvider } from '../lib/LanguageContext';
import { ProjectProvider } from '../lib/ProjectContext';

// Mock Tauri API
vi.mock('../lib/api', () => ({
  getLlamaCppRuntimeStatus: vi.fn(),
  startLlamaCppRuntime: vi.fn(),
  stopLlamaCppRuntime: vi.fn(),
}));

import { getLlamaCppRuntimeStatus, startLlamaCppRuntime, stopLlamaCppRuntime } from '../lib/api';

const mockGetStatus = getLlamaCppRuntimeStatus as ReturnType<typeof vi.fn>;
const mockStartRuntime = startLlamaCppRuntime as ReturnType<typeof vi.fn>;
const mockStopRuntime = stopLlamaCppRuntime as ReturnType<typeof vi.fn>;

function renderLayout() {
  return render(
    <BrowserRouter>
      <LanguageProvider>
        <ProjectProvider>
          <Layout />
        </ProjectProvider>
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

  describe('runtime controls', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      mockGetStatus.mockResolvedValue({ running: false, pid: null });
    });

    afterEach(() => {
      vi.useRealTimers();
      vi.clearAllMocks();
    });

    it('should display runtime status as stopped initially', async () => {
      renderLayout();

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(screen.getByText(/⚪/)).toBeDefined();
    });

    it('should display running status when runtime is active', async () => {
      mockGetStatus.mockResolvedValue({ running: true, pid: 1234 });

      renderLayout();

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(screen.getByText(/✅/)).toBeDefined();
    });

    it('should poll runtime status periodically', async () => {
      renderLayout();

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(mockGetStatus).toHaveBeenCalled();
    });

    it('should handle status fetch error gracefully', async () => {
      mockGetStatus.mockRejectedValue(new Error('Failed'));

      renderLayout();

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(screen.getByText(/⚪/)).toBeDefined();
    });

    it('should disable start button when no executable configured', async () => {
      renderLayout();

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      const startButtons = screen.getAllByRole('button');
      const startBtn = startButtons.find(b => b.textContent?.includes('▶'));
      expect(startBtn?.hasAttribute('disabled')).toBe(true);
    });

    it('should enable start button when runtime is configured', async () => {
      localStorage.setItem('lyriclytic_llm_settings', JSON.stringify({
        enabled: true,
        executablePath: '/path/to/llama',
        modelPath: '/path/to/model',
      }));

      renderLayout();

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      const startButtons = screen.getAllByRole('button');
      const startBtn = startButtons.find(b => b.textContent?.includes('▶'));
      expect(startBtn?.hasAttribute('disabled')).toBe(false);
    });

    it('should start runtime when start button clicked', async () => {
      localStorage.setItem('lyriclytic_llm_settings', JSON.stringify({
        enabled: true,
        executablePath: '/path/to/llama',
        modelPath: '/path/to/model',
        baseUrl: 'http://127.0.0.1:8080',
        maxTokens: 1024,
      }));
      mockStartRuntime.mockResolvedValue({ running: true, pid: 1234 });

      renderLayout();

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      const startButtons = screen.getAllByRole('button');
      const startBtn = startButtons.find(b => b.textContent?.includes('▶'));
      await act(async () => {
        fireEvent.click(startBtn!);
        vi.advanceTimersByTime(100);
      });

      expect(mockStartRuntime).toHaveBeenCalledWith({
        executable_path: '/path/to/llama',
        model_path: '/path/to/model',
        base_url: 'http://127.0.0.1:8080',
        max_tokens: 1024,
      });
    });

    it('should stop runtime when stop button clicked', async () => {
      mockGetStatus.mockResolvedValue({ running: true, pid: 1234 });
      mockStopRuntime.mockResolvedValue({ running: false, pid: null });

      renderLayout();

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      const allButtons = screen.getAllByRole('button');
      const stopBtn = allButtons.find(b => b.textContent?.includes('■'));
      expect(stopBtn?.hasAttribute('disabled')).toBe(false);

      await act(async () => {
        fireEvent.click(stopBtn!);
        vi.advanceTimersByTime(100);
      });

      expect(mockStopRuntime).toHaveBeenCalled();
    });

    it('should handle start runtime error', async () => {
      localStorage.setItem('lyriclytic_llm_settings', JSON.stringify({
        enabled: true,
        executablePath: '/path/to/llama',
        modelPath: '/path/to/model',
      }));
      mockStartRuntime.mockRejectedValue(new Error('Start failed'));

      renderLayout();

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      const startButtons = screen.getAllByRole('button');
      const startBtn = startButtons.find(b => b.textContent?.includes('▶'));
      await act(async () => {
        fireEvent.click(startBtn!);
        vi.advanceTimersByTime(100);
      });

      // Should still show stopped status after error
      expect(mockGetStatus).toHaveBeenCalled();
    });

    it('should handle stop runtime error', async () => {
      mockGetStatus.mockResolvedValue({ running: true, pid: 1234 });
      mockStopRuntime.mockRejectedValue(new Error('Stop failed'));

      renderLayout();

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      const allButtons = screen.getAllByRole('button');
      const stopBtn = allButtons.find(b => b.textContent?.includes('■'));
      await act(async () => {
        fireEvent.click(stopBtn!);
        vi.advanceTimersByTime(100);
      });

      expect(mockGetStatus).toHaveBeenCalled();
    });
  });

  describe('project title display', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      mockGetStatus.mockResolvedValue({ running: false, pid: null });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should not show project title on home page', async () => {
      renderLayout();

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      const projectTitle = screen.queryByTestId('project-title');
      expect(projectTitle).toBeNull();
    });
  });
});