import { useState, useRef, useEffect, useCallback } from 'react';
import { LAYOUT } from '../config';

export interface UsePaneResizeOptions {
  onResizeStart?: () => void;
  onResizeEnd?: () => void;
}

export interface UsePaneResizeReturn {
  leftPaneWidth: number;
  rightPaneWidth: number;
  sectionPaneHeight: number;
  isLeftPaneVisible: boolean;
  rightPaneRef: React.RefObject<HTMLElement | null>;
  setLeftPaneWidth: (width: number) => void;
  setRightPaneWidth: (width: number) => void;
  setSectionPaneHeight: (height: number) => void;
  toggleLeftPane: () => void;
  showLeftPane: () => void;
  hideLeftPane: () => void;
  handleLeftPaneResizeStart: () => void;
  handleRightPaneResizeStart: () => void;
  handleSectionPaneResizeStart: () => void;
}

/**
 * Hook for managing pane resizing in the editor
 */
export function usePaneResize(options: UsePaneResizeOptions = {}): UsePaneResizeReturn {
  const { onResizeStart, onResizeEnd } = options;

  const [leftPaneWidth, setLeftPaneWidth] = useState<number>(LAYOUT.LEFT_PANE.DEFAULT_WIDTH);
  const [rightPaneWidth, setRightPaneWidth] = useState<number>(LAYOUT.RIGHT_PANE.DEFAULT_WIDTH);
  const [sectionPaneHeight, setSectionPaneHeight] = useState<number>(LAYOUT.SECTION_PANE.DEFAULT_HEIGHT_PERCENT);
  const [isLeftPaneVisible, setIsLeftPaneVisible] = useState(true);

  const isResizingLeftPaneRef = useRef(false);
  const isResizingRightPaneRef = useRef(false);
  const isResizingSectionPaneRef = useRef(false);
  const rightPaneRef = useRef<HTMLElement | null>(null);

  // Main resize handler
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (isResizingLeftPaneRef.current) {
        const nextWidth = Math.min(
          LAYOUT.LEFT_PANE.MAX_WIDTH,
          Math.max(LAYOUT.LEFT_PANE.MIN_WIDTH, event.clientX)
        );
        setLeftPaneWidth(nextWidth);
        return;
      }

      if (isResizingRightPaneRef.current) {
        const nextWidth = Math.min(
          LAYOUT.RIGHT_PANE.MAX_WIDTH,
          Math.max(LAYOUT.RIGHT_PANE.MIN_WIDTH, window.innerWidth - event.clientX)
        );
        setRightPaneWidth(nextWidth);
        return;
      }

      if (isResizingSectionPaneRef.current && rightPaneRef.current) {
        const paneRect = rightPaneRef.current.getBoundingClientRect();
        const relativeY = event.clientY - paneRect.top;
        const percentage = (relativeY / paneRect.height) * 100;
        const nextHeight = Math.min(
          LAYOUT.SECTION_PANE.MAX_HEIGHT_PERCENT,
          Math.max(LAYOUT.SECTION_PANE.MIN_HEIGHT_PERCENT, percentage)
        );
        setSectionPaneHeight(nextHeight);
      }
    };

    const stopResizing = () => {
      const wasResizing =
        isResizingLeftPaneRef.current ||
        isResizingRightPaneRef.current ||
        isResizingSectionPaneRef.current;

      isResizingLeftPaneRef.current = false;
      isResizingRightPaneRef.current = false;
      isResizingSectionPaneRef.current = false;
      document.body.classList.remove('is-resizing-pane');

      if (wasResizing) {
        onResizeEnd?.();
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopResizing);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopResizing);
      document.body.classList.remove('is-resizing-pane');
    };
  }, [onResizeEnd]);

  const toggleLeftPane = useCallback(() => {
    setIsLeftPaneVisible(prev => !prev);
  }, []);

  const showLeftPane = useCallback(() => {
    setIsLeftPaneVisible(true);
  }, []);

  const hideLeftPane = useCallback(() => {
    setIsLeftPaneVisible(false);
  }, []);

  const handleLeftPaneResizeStart = useCallback(() => {
    isResizingLeftPaneRef.current = true;
    document.body.classList.add('is-resizing-pane');
    onResizeStart?.();
  }, [onResizeStart]);

  const handleRightPaneResizeStart = useCallback(() => {
    isResizingRightPaneRef.current = true;
    document.body.classList.add('is-resizing-pane');
    onResizeStart?.();
  }, [onResizeStart]);

  const handleSectionPaneResizeStart = useCallback(() => {
    isResizingSectionPaneRef.current = true;
    document.body.classList.add('is-resizing-pane');
    onResizeStart?.();
  }, [onResizeStart]);

  return {
    leftPaneWidth,
    rightPaneWidth,
    sectionPaneHeight,
    isLeftPaneVisible,
    rightPaneRef,
    setLeftPaneWidth,
    setRightPaneWidth,
    setSectionPaneHeight,
    toggleLeftPane,
    showLeftPane,
    hideLeftPane,
    handleLeftPaneResizeStart,
    handleRightPaneResizeStart,
    handleSectionPaneResizeStart,
  };
}
