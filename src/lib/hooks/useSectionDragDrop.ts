import { useState, useRef, useCallback, useEffect } from 'react';
import type { Section } from '../section';

export interface UseSectionDragDropOptions {
  onReorder?: (sections: Section[]) => void;
  dragThreshold?: number;
}

export interface UseSectionDragDropReturn {
  draggedSectionId: string | null;
  dragOverSectionId: string | null;
  dragPointerPosition: { x: number; y: number } | null;
  handlePointerDown: (sectionId: string, x: number, y: number) => void;
  setDragOverSectionId: (id: string | null) => void;
  handleDragEnd: () => void;
  commitReorder: () => void;
}

export function useSectionDragDrop(
  sections: Section[],
  options: UseSectionDragDropOptions = {}
): UseSectionDragDropReturn {
  const { onReorder, dragThreshold = 6 } = options;

  const [draggedSectionId, setDraggedSectionId] = useState<string | null>(null);
  const [dragOverSectionId, setDragOverSectionId] = useState<string | null>(null);
  const [dragPointerPosition, setDragPointerPosition] = useState<{ x: number; y: number } | null>(null);

  const pointerDragStartRef = useRef<{ sectionId: string; x: number; y: number } | null>(null);
  const activePointerDragRef = useRef<string | null>(null);

  const handlePointerDown = useCallback((sectionId: string, x: number, y: number) => {
    pointerDragStartRef.current = { sectionId, x, y };
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedSectionId(null);
    setDragOverSectionId(null);
    setDragPointerPosition(null);
    pointerDragStartRef.current = null;
    activePointerDragRef.current = null;
  }, []);

  const commitReorder = useCallback(() => {
    const sourceId = activePointerDragRef.current;
    const targetId = dragOverSectionId;

    if (!sourceId || !targetId || sourceId === targetId) {
      return;
    }

    const sourceIndex = sections.findIndex(s => s.id === sourceId);
    const targetIndex = sections.findIndex(s => s.id === targetId);

    if (sourceIndex === -1 || targetIndex === -1) {
      return;
    }

    const newSections = [...sections];
    const [removed] = newSections.splice(sourceIndex, 1);
    newSections.splice(targetIndex, 0, removed);

    const reorderedSections = newSections.map((s, idx) => ({ ...s, sortOrder: idx }));
    onReorder?.(reorderedSections);

    handleDragEnd();
  }, [sections, dragOverSectionId, onReorder, handleDragEnd]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!pointerDragStartRef.current) return;

      const { sectionId, x, y } = pointerDragStartRef.current;
      const movedEnough =
        Math.abs(event.clientX - x) > dragThreshold ||
        Math.abs(event.clientY - y) > dragThreshold;

      if (!activePointerDragRef.current && movedEnough) {
        activePointerDragRef.current = sectionId;
        setDraggedSectionId(sectionId);
        setDragPointerPosition({ x: event.clientX, y: event.clientY });
        return;
      }

      if (!activePointerDragRef.current) return;
      setDragPointerPosition({ x: event.clientX, y: event.clientY });
    };

    const handlePointerUp = () => {
      if (activePointerDragRef.current && dragOverSectionId) {
        // Will be handled by commitReorder
      }
      handleDragEnd();
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [dragThreshold, dragOverSectionId, handleDragEnd]);

  return {
    draggedSectionId,
    dragOverSectionId,
    dragPointerPosition,
    handlePointerDown,
    setDragOverSectionId,
    handleDragEnd,
    commitReorder,
  };
}