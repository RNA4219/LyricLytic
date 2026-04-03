import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSectionDragDrop } from '../lib/hooks/useSectionDragDrop';

describe('useSectionDragDrop', () => {
  const mockSections = [
    { id: '1', type: 'Verse', displayName: 'Verse', sortOrder: 0, bodyText: '' },
    { id: '2', type: 'Chorus', displayName: 'Chorus', sortOrder: 1, bodyText: '' },
    { id: '3', type: 'Bridge', displayName: 'Bridge', sortOrder: 2, bodyText: '' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have null dragged section initially', () => {
      const { result } = renderHook(() => useSectionDragDrop(mockSections));
      expect(result.current.draggedSectionId).toBe(null);
    });

    it('should have null drag over section initially', () => {
      const { result } = renderHook(() => useSectionDragDrop(mockSections));
      expect(result.current.dragOverSectionId).toBe(null);
    });

    it('should have null pointer position initially', () => {
      const { result } = renderHook(() => useSectionDragDrop(mockSections));
      expect(result.current.dragPointerPosition).toBe(null);
    });
  });

  describe('drag operations', () => {
    it('should start drag on pointer down', () => {
      const { result } = renderHook(() => useSectionDragDrop(mockSections));

      act(() => {
        result.current.handlePointerDown('1', 100, 200);
      });

      // Drag should not start immediately (needs to move enough)
      expect(result.current.draggedSectionId).toBe(null);
    });

    it('should clear drag state on drag end', () => {
      const { result } = renderHook(() => useSectionDragDrop(mockSections));

      act(() => {
        result.current.handlePointerDown('1', 100, 200);
      });

      act(() => {
        result.current.handleDragEnd();
      });

      expect(result.current.draggedSectionId).toBe(null);
      expect(result.current.dragOverSectionId).toBe(null);
      expect(result.current.dragPointerPosition).toBe(null);
    });

    it('should set drag over section', () => {
      const { result } = renderHook(() => useSectionDragDrop(mockSections));

      act(() => {
        result.current.setDragOverSectionId('2');
      });

      expect(result.current.dragOverSectionId).toBe('2');
    });
  });

  describe('reorder', () => {
    it('should not reorder when drag not activated', () => {
      const onReorder = vi.fn();
      const { result } = renderHook(() => useSectionDragDrop(mockSections, { onReorder }));

      // Without actual pointer movement, drag is not activated
      act(() => {
        result.current.handlePointerDown('1', 100, 200);
        result.current.setDragOverSectionId('3');
        result.current.commitReorder();
      });

      // Should not reorder because drag was never activated via pointermove
      expect(onReorder).not.toHaveBeenCalled();
    });

    it('should clear all state on drag end', () => {
      const { result } = renderHook(() => useSectionDragDrop(mockSections));

      act(() => {
        result.current.handlePointerDown('1', 100, 200);
        result.current.setDragOverSectionId('2');
        result.current.handleDragEnd();
      });

      expect(result.current.draggedSectionId).toBe(null);
      expect(result.current.dragOverSectionId).toBe(null);
      expect(result.current.dragPointerPosition).toBe(null);
    });
  });
});