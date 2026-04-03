import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { XYCoord } from 'react-dnd';
import { useDrag, useDrop } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import type { Section } from '../../lib/section';

const SECTION_CARD_TYPE = 'section-card';

interface DragItem {
  type: typeof SECTION_CARD_TYPE;
  id: string;
  index: number;
  section: Section;
}

interface SectionListCardProps {
  section: Section;
  index: number;
  isActive: boolean;
  onActivate: (sectionId: string) => void;
  onRename: (sectionId: string, nextName: string) => void;
  onDelete: (sectionId: string) => void;
  onMove: (dragIndex: number, hoverIndex: number) => void;
  onDragPreviewChange: (preview: SectionDragPreviewState | null) => void;
}

export interface SectionDragPreviewState {
  section: Section;
  index: number;
  x: number;
  y: number;
  offsetX: number;
  offsetY: number;
}

function SectionListCard({
  section,
  index,
  isActive,
  onActivate,
  onRename,
  onDelete,
  onMove,
  onDragPreviewChange,
}: SectionListCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const pointerPositionRef = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);

  const [{ isDragging }, drag, preview] = useDrag<DragItem, void, { isDragging: boolean }>(() => ({
    type: SECTION_CARD_TYPE,
    item: {
      type: SECTION_CARD_TYPE,
      id: section.id,
      index,
      section,
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [index, section]);

  const [{ isOver, dropPosition }, drop] = useDrop<
    DragItem,
    void,
    { isOver: boolean; dropPosition: 'before' | 'after' | null }
  >(() => ({
    accept: SECTION_CARD_TYPE,
    drop: (item) => {
      if (item.id === section.id || item.index === index) {
        return;
      }

      onMove(item.index, index);
      item.index = index;
    },
    hover: (item, monitor) => {
      if (!cardRef.current || item.id === section.id) {
        return;
      }

      const hoverRect = cardRef.current.getBoundingClientRect();
      const hoverMiddleY = (hoverRect.bottom - hoverRect.top) / 2;
      const clientOffset = monitor.getClientOffset();

      if (!clientOffset) {
        return;
      }

      const hoverClientY = clientOffset.y - hoverRect.top;
      if (item.index < index && hoverClientY < hoverMiddleY) {
        return;
      }

      if (item.index > index && hoverClientY > hoverMiddleY) {
        return;
      }
    },
    collect: (monitor) => {
      const clientOffset = monitor.getClientOffset();
      let nextPosition: 'before' | 'after' | null = null;

      if (clientOffset && cardRef.current && monitor.isOver({ shallow: true })) {
        const hoverRect = cardRef.current.getBoundingClientRect();
        const hoverClientY = clientOffset.y - hoverRect.top;
        nextPosition = hoverClientY < (hoverRect.height / 2) ? 'before' : 'after';
      }

      return {
        isOver: monitor.isOver({ shallow: true }) && monitor.getItem<DragItem>()?.id !== section.id,
        dropPosition: nextPosition,
      };
    },
  }), [index, onMove, section.id]);

  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true });
  }, [preview]);

  useEffect(() => {
    if (!isDragging) {
      onDragPreviewChange(null);
      return;
    }

    const emitPreview = (x: number, y: number) => {
      const pointerState = pointerPositionRef.current;
      onDragPreviewChange({
        section,
        index,
        x,
        y,
        offsetX: pointerState?.offsetX ?? 20,
        offsetY: pointerState?.offsetY ?? 20,
      });
    };

    const handlePointerMove = (event: PointerEvent) => {
      const previous = pointerPositionRef.current;
      pointerPositionRef.current = {
        x: event.clientX,
        y: event.clientY,
        offsetX: previous?.offsetX ?? 20,
        offsetY: previous?.offsetY ?? 20,
      };
      emitPreview(event.clientX, event.clientY);
    };

    const handleMouseMove = (event: MouseEvent) => {
      const previous = pointerPositionRef.current;
      pointerPositionRef.current = {
        x: event.clientX,
        y: event.clientY,
        offsetX: previous?.offsetX ?? 20,
        offsetY: previous?.offsetY ?? 20,
      };
      emitPreview(event.clientX, event.clientY);
    };

    const handleDragOver = (event: DragEvent) => {
      if (typeof event.clientX !== 'number' || typeof event.clientY !== 'number') {
        return;
      }
      const previous = pointerPositionRef.current;
      pointerPositionRef.current = {
        x: event.clientX,
        y: event.clientY,
        offsetX: previous?.offsetX ?? 20,
        offsetY: previous?.offsetY ?? 20,
      };
      emitPreview(event.clientX, event.clientY);
    };

    const currentPointer = pointerPositionRef.current;
    if (currentPointer) {
      emitPreview(currentPointer.x, currentPointer.y);
    }

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('dragover', handleDragOver);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('dragover', handleDragOver);
      onDragPreviewChange(null);
    };
  }, [index, isDragging, onDragPreviewChange, section]);

  drag(drop(cardRef));

  return (
    <div
      ref={cardRef}
      data-section-id={section.id}
      className={[
        'section-tab',
        isActive ? 'active' : '',
        isDragging ? 'dragging' : '',
        isOver ? 'drag-over' : '',
        isOver && dropPosition === 'before' ? 'drop-before' : '',
        isOver && dropPosition === 'after' ? 'drop-after' : '',
      ].filter(Boolean).join(' ')}
      onClick={() => onActivate(section.id)}
      onPointerDownCapture={(event) => {
        const rect = cardRef.current?.getBoundingClientRect();
        pointerPositionRef.current = {
          x: event.clientX,
          y: event.clientY,
          offsetX: rect ? event.clientX - rect.left : 20,
          offsetY: rect ? event.clientY - rect.top : 20,
        };
      }}
    >
      <div className="section-tab-row">
        <div className="section-tab-meta">
          <span className="section-drag-handle" aria-label={`${section.displayName} を並び替え`}>
            ⋮⋮
          </span>
          <span className="section-order">{index + 1}</span>
          <input
            value={section.displayName}
            onChange={(e) => onRename(section.id, e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="section-name-input"
          />
        </div>
        <div className="section-tab-actions">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(section.id);
            }}
            title="Delete"
          >
            ×
          </button>
        </div>
      </div>
      {section.bodyText && (
        <div className="section-preview">{section.bodyText.slice(0, 40)}...</div>
      )}
    </div>
  );
}

function SectionDragPreview({ preview }: { preview: SectionDragPreviewState | null }) {
  if (!preview || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div
      className="section-drag-preview"
      style={buildPreviewStyle(preview)}
    >
      <div className="section-drag-preview-badge">Reorder</div>
      <div className="section-tab-row">
        <div className="section-tab-meta">
          <span className="section-drag-handle">⋮⋮</span>
          <span className="section-order">{preview.index + 1}</span>
          <span className="section-all-label">{preview.section.displayName}</span>
        </div>
      </div>
      {preview.section.bodyText && (
        <div className="section-preview">{preview.section.bodyText.slice(0, 40)}...</div>
      )}
    </div>,
    document.body,
  );
}

function buildPreviewStyle(currentOffset: XYCoord & { offsetX: number; offsetY: number }) {
  return {
    left: currentOffset.x - currentOffset.offsetX,
    top: currentOffset.y - currentOffset.offsetY,
    transform: 'translate3d(0, 0, 0) rotate(0deg) scale(1)',
  } as const;
}

export default SectionListCard;
export { SectionDragPreview };
