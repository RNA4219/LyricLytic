import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSectionActions } from '../lib/hooks/useSectionActions';
import type { Section } from '../lib/section';

describe('useSectionActions', () => {
  const createSection = (id: string, displayName: string, sortOrder: number): Section => ({
    id,
    type: displayName,
    displayName,
    sortOrder,
    bodyText: '',
  });

  describe('addSection', () => {
    it('should add a new section', () => {
      const onReorder = vi.fn();
      const { result } = renderHook(() => useSectionActions({
        sections: [],
        onReorder,
      }));

      let newSection: Section | null = null;
      act(() => {
        newSection = result.current.addSection('verse');
      });

      expect(newSection).not.toBeNull();
      expect(newSection?.type).toBe('verse');
      expect(newSection?.displayName).toBe('verse');
    });

    it('should call onReorder when adding section', () => {
      const onReorder = vi.fn();
      const { result } = renderHook(() => useSectionActions({
        sections: [],
        onReorder,
      }));

      act(() => {
        result.current.addSection('chorus');
      });

      expect(onReorder).toHaveBeenCalled();
    });
  });

  describe('renameSection', () => {
    it('should rename a section', () => {
      const sections = [createSection('1', 'verse', 0)];
      const onReorder = vi.fn();
      const { result } = renderHook(() => useSectionActions({
        sections,
        onReorder,
      }));

      act(() => {
        result.current.renameSection('1', 'chorus');
      });

      expect(onReorder).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: '1', displayName: 'chorus' }),
        ])
      );
    });
  });

  describe('deleteSection', () => {
    it('should delete a section', () => {
      const sections = [createSection('1', 'verse', 0), createSection('2', 'chorus', 1)];
      const onReorder = vi.fn();
      const onActiveChange = vi.fn();
      const { result } = renderHook(() => useSectionActions({
        sections,
        onReorder,
        activeSectionId: '1',
        onActiveChange,
      }));

      act(() => {
        result.current.deleteSection('1');
      });

      expect(onReorder).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: '2' }),
        ])
      );
    });

    it('should switch to next section when active section is deleted', () => {
      const sections = [createSection('1', 'verse', 0), createSection('2', 'chorus', 1)];
      const onReorder = vi.fn();
      const onActiveChange = vi.fn();
      const { result } = renderHook(() => useSectionActions({
        sections,
        onReorder,
        activeSectionId: '1',
        onActiveChange,
      }));

      act(() => {
        result.current.deleteSection('1');
      });

      expect(onActiveChange).toHaveBeenCalledWith('2');
    });

    it('should set active to null when last section is deleted', () => {
      const sections = [createSection('1', 'verse', 0)];
      const onReorder = vi.fn();
      const onActiveChange = vi.fn();
      const { result } = renderHook(() => useSectionActions({
        sections,
        onReorder,
        activeSectionId: '1',
        onActiveChange,
      }));

      act(() => {
        result.current.deleteSection('1');
      });

      expect(onActiveChange).toHaveBeenCalledWith(null);
    });
  });
});