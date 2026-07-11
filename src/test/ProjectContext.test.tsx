import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { ProjectProvider, useProject } from '../lib/ProjectContext';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ProjectProvider>{children}</ProjectProvider>
);

describe('ProjectContext', () => {
  it('returns true when no leave handler is registered', async () => {
    const { result } = renderHook(() => useProject(), { wrapper });
    await expect(result.current.runBeforeLeave()).resolves.toBe(true);
  });

  it('returns the registered handler result and can clear it', async () => {
    const { result } = renderHook(() => useProject(), { wrapper });
    act(() => {
      result.current.setProjectTitle('Draft');
      result.current.setBeforeLeave(async () => false);
    });
    expect(result.current.projectTitle).toBe('Draft');
    await expect(result.current.runBeforeLeave()).resolves.toBe(false);
    act(() => result.current.setBeforeLeave(null));
    await expect(result.current.runBeforeLeave()).resolves.toBe(true);
  });

  it('throws when useProject is outside the provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      expect(() => renderHook(() => useProject())).toThrow('useProject must be used within ProjectProvider');
    } finally {
      consoleError.mockRestore();
    }
  });
});
