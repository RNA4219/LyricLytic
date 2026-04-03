import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSectionDragDrop } from '../lib/hooks/useSectionDragDrop';
import type { Section } from '../lib/section';

describe('useSectionDragDrop', () => {
  const mockSections: Section[] = [
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

    it('should start drag when pointer moves beyond threshold', () => {
      const { result } = renderHook(() => useSectionDragDrop(mockSections, { dragThreshold: 5 }));

      act(() => {
        result.current.handlePointerDown('1', 100, 200);
      });

      // Simulate pointer move beyond threshold
      act(() => {
        window.dispatchEvent(new PointerEvent('pointermove', { clientX: 120, clientY: 200 }));
      });

      expect(result.current.draggedSectionId).toBe('1');
      expect(result.current.dragPointerPosition).toEqual({ x: 120, y: 200 });
    });

    it('should not start drag when pointer moves within threshold', () => {
      const { result } = renderHook(() => useSectionDragDrop(mockSections, { dragThreshold: 10 }));

      act(() => {
        result.current.handlePointerDown('1', 100, 200);
      });

      // Simulate pointer move within threshold
      act(() => {
        window.dispatchEvent(new PointerEvent('pointermove', { clientX: 105, clientY: 203 }));
      });

      expect(result.current.draggedSectionId).toBe(null);
    });

    it('should update pointer position during drag', () => {
      const { result } = renderHook(() => useSectionDragDrop(mockSections, { dragThreshold: 5 }));

      act(() => {
        result.current.handlePointerDown('1', 100, 200);
      });

      act(() => {
        window.dispatchEvent(new PointerEvent('pointermove', { clientX: 120, clientY: 220 }));
      });

      expect(result.current.dragPointerPosition).toEqual({ x: 120, y: 220 });
    });

    it('should end drag on pointer up', () => {
      const { result } = renderHook(() => useSectionDragDrop(mockSections, { dragThreshold: 5 }));

      act(() => {
        result.current.handlePointerDown('1', 100, 200);
      });

      act(() => {
        window.dispatchEvent(new PointerEvent('pointermove', { clientX: 120, clientY: 200 }));
      });

      expect(result.current.draggedSectionId).toBe('1');

      act(() => {
        window.dispatchEvent(new PointerEvent('pointerup'));
      });

      expect(result.current.draggedSectionId).toBe(null);
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

    it('should not reorder when source equals target', () => {
      const onReorder = vi.fn();
      const { result } = renderHook(() => useSectionDragDrop(mockSections, { onReorder }));

      act(() => {
        result.current.setDragOverSectionId('1');
      });

      act(() => {
        result.current.commitReorder();
      });

      expect(onReorder).not.toHaveBeenCalled();
    });

    it('should reorder sections when commitReorder is called with valid drag', () => {
      const onReorder = vi.fn();
      const { result } = renderHook(() => useSectionDragDrop(mockSections, { onReorder, dragThreshold: 5 }));

      // Start drag
      act(() => {
        result.current.handlePointerDown('1', 100, 200);
      });

      // Activate drag by moving beyond threshold
      act(() => {
        window.dispatchEvent(new PointerEvent('pointermove', { clientX: 120, clientY: 200 }));
      });

      // Set target
      act(() => {
        result.current.setDragOverSectionId('3');
      });

      // Commit reorder
      act(() => {
        result.current.commitReorder();
      });

      expect(onReorder).toHaveBeenCalledTimes(1);
      const reordered = onReorder.mock.calls[0][0];
      expect(reordered[0].id).toBe('2');
      expect(reordered[1].id).toBe('3');
      expect(reordered[2].id).toBe('1');
    });

    it('should update sortOrder after reorder', () => {
      const onReorder = vi.fn();
      const { result } = renderHook(() => useSectionDragDrop(mockSections, { onReorder, dragThreshold: 5 }));

      act(() => {
        result.current.handlePointerDown('1', 100, 200);
      });

      act(() => {
        window.dispatchEvent(new PointerEvent('pointermove', { clientX: 120, clientY: 200 }));
      });

      act(() => {
        result.current.setDragOverSectionId('2');
      });

      act(() => {
        result.current.commitReorder();
      });

      const reordered = onReorder.mock.calls[0][0];
      expect(reordered[0].sortOrder).toBe(0);
      expect(reordered[1].sortOrder).toBe(1);
      expect(reordered[2].sortOrder).toBe(2);
    });

    it('should clear all state after commitReorder', () => {
      const onReorder = vi.fn();
      const { result } = renderHook(() => useSectionDragDrop(mockSections, { onReorder, dragThreshold: 5 }));

      act(() => {
        result.current.handlePointerDown('1', 100, 200);
      });

      act(() => {
        window.dispatchEvent(new PointerEvent('pointermove', { clientX: 120, clientY: 200 }));
      });

      act(() => {
        result.current.setDragOverSectionId('2');
      });

      act(() => {
        result.current.commitReorder();
      });

      expect(result.current.draggedSectionId).toBe(null);
      expect(result.current.dragOverSectionId).toBe(null);
      expect(result.current.dragPointerPosition).toBe(null);
    });

    it('should not reorder when section id not found', () => {
      const onReorder = vi.fn();
      const { result } = renderHook(() => useSectionDragDrop(mockSections, { onReorder }));

      // Manually set state to simulate invalid section
      act(() => {
        result.current.setDragOverSectionId('non-existent');
      });

      act(() => {
        result.current.commitReorder();
      });

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

  describe('cleanup', () => {
    it('should remove event listeners on unmount', () => {
      const addSpy = vi.spyOn(window, 'addEventListener');
      const removeSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => useSectionDragDrop(mockSections));

      expect(addSpy).toHaveBeenCalledWith('pointermove', expect.any(Function));
      expect(addSpy).toHaveBeenCalledWith('pointerup', expect.any(Function));

      unmount();

      expect(removeSpy).toHaveBeenCalledWith('pointermove', expect.any(Function));
      expect(removeSpy).toHaveBeenCalledWith('pointerup', expect.any(Function));

      addSpy.mockRestore();
      removeSpy.mockRestore();
    });
  });
});