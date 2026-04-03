import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePaneResize } from '../lib/hooks/usePaneResize';

// Mock config
vi.mock('../lib/config', () => ({
  LAYOUT: {
    LEFT_PANE: {
      MIN_WIDTH: 240,
      MAX_WIDTH: 420,
      DEFAULT_WIDTH: 296,
    },
    RIGHT_PANE: {
      MIN_WIDTH: 280,
      MAX_WIDTH: 520,
      DEFAULT_WIDTH: 320,
    },
    SECTION_PANE: {
      MIN_HEIGHT_PERCENT: 20,
      MAX_HEIGHT_PERCENT: 80,
      DEFAULT_HEIGHT_PERCENT: 50,
    },
  },
}));

describe('usePaneResize', () => {
  let addEventListenerSpy: vi.SpyInstance;
  let removeEventListenerSpy: vi.SpyInstance;

  beforeEach(() => {
    addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    // Mock getBoundingClientRect
    Element.prototype.getBoundingClientRect = vi.fn(() => ({
      top: 0,
      left: 0,
      width: 400,
      height: 600,
      right: 400,
      bottom: 600,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }));
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    document.body.classList.remove('is-resizing-pane');
  });

  describe('initial state', () => {
    it('should return default widths', () => {
      const { result } = renderHook(() => usePaneResize());

      expect(result.current.leftPaneWidth).toBe(296);
      expect(result.current.rightPaneWidth).toBe(320);
      expect(result.current.sectionPaneHeight).toBe(50);
    });

    it('should have left pane visible by default', () => {
      const { result } = renderHook(() => usePaneResize());

      expect(result.current.isLeftPaneVisible).toBe(true);
    });

    it('should provide a ref for right pane', () => {
      const { result } = renderHook(() => usePaneResize());

      expect(result.current.rightPaneRef).toBeDefined();
      expect(result.current.rightPaneRef.current).toBe(null);
    });
  });

  describe('toggle functions', () => {
    it('should toggle left pane visibility', () => {
      const { result } = renderHook(() => usePaneResize());

      expect(result.current.isLeftPaneVisible).toBe(true);

      act(() => {
        result.current.hideLeftPane();
      });

      expect(result.current.isLeftPaneVisible).toBe(false);

      act(() => {
        result.current.showLeftPane();
      });

      expect(result.current.isLeftPaneVisible).toBe(true);
    });

    it('should toggle left pane with toggleLeftPane', () => {
      const { result } = renderHook(() => usePaneResize());

      expect(result.current.isLeftPaneVisible).toBe(true);

      act(() => {
        result.current.toggleLeftPane();
      });

      expect(result.current.isLeftPaneVisible).toBe(false);

      act(() => {
        result.current.toggleLeftPane();
      });

      expect(result.current.isLeftPaneVisible).toBe(true);
    });
  });

  describe('setWidth functions', () => {
    it('should set left pane width', () => {
      const { result } = renderHook(() => usePaneResize());

      act(() => {
        result.current.setLeftPaneWidth(350);
      });

      expect(result.current.leftPaneWidth).toBe(350);
    });

    it('should set right pane width', () => {
      const { result } = renderHook(() => usePaneResize());

      act(() => {
        result.current.setRightPaneWidth(400);
      });

      expect(result.current.rightPaneWidth).toBe(400);
    });

    it('should set section pane height', () => {
      const { result } = renderHook(() => usePaneResize());

      act(() => {
        result.current.setSectionPaneHeight(70);
      });

      expect(result.current.sectionPaneHeight).toBe(70);
    });
  });

  describe('resize handlers', () => {
    it('should add is-resizing-pane class on resize start', () => {
      const { result } = renderHook(() => usePaneResize());

      act(() => {
        result.current.handleLeftPaneResizeStart();
      });

      expect(document.body.classList.contains('is-resizing-pane')).toBe(true);
    });

    it('should add class on right pane resize start', () => {
      const { result } = renderHook(() => usePaneResize());

      act(() => {
        result.current.handleRightPaneResizeStart();
      });

      expect(document.body.classList.contains('is-resizing-pane')).toBe(true);
    });

    it('should add class on section pane resize start', () => {
      const { result } = renderHook(() => usePaneResize());

      act(() => {
        result.current.handleSectionPaneResizeStart();
      });

      expect(document.body.classList.contains('is-resizing-pane')).toBe(true);
    });

    it('should call onResizeStart callback', () => {
      const onResizeStart = vi.fn();
      const { result } = renderHook(() => usePaneResize({ onResizeStart }));

      act(() => {
        result.current.handleLeftPaneResizeStart();
      });

      expect(onResizeStart).toHaveBeenCalled();
    });
  });

  describe('mouse event handling', () => {
    it('should register event listeners on mount', () => {
      renderHook(() => usePaneResize());

      expect(addEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('mouseup', expect.any(Function));
    });

    it('should remove event listeners on unmount', () => {
      const { unmount } = renderHook(() => usePaneResize());

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('mouseup', expect.any(Function));
    });

    it('should update left pane width on mouse move', () => {
      const { result } = renderHook(() => usePaneResize());

      // Start resize
      act(() => {
        result.current.handleLeftPaneResizeStart();
      });

      // Simulate mouse move
      const mouseMoveEvent = new MouseEvent('mousemove', {
        clientX: 300,
      });

      act(() => {
        window.dispatchEvent(mouseMoveEvent);
      });

      expect(result.current.leftPaneWidth).toBe(300);
    });

    it('should clamp left pane width to min', () => {
      const { result } = renderHook(() => usePaneResize());

      act(() => {
        result.current.handleLeftPaneResizeStart();
      });

      const mouseMoveEvent = new MouseEvent('mousemove', {
        clientX: 100, // Below min
      });

      act(() => {
        window.dispatchEvent(mouseMoveEvent);
      });

      expect(result.current.leftPaneWidth).toBe(240); // MIN_WIDTH
    });

    it('should clamp left pane width to max', () => {
      const { result } = renderHook(() => usePaneResize());

      act(() => {
        result.current.handleLeftPaneResizeStart();
      });

      const mouseMoveEvent = new MouseEvent('mousemove', {
        clientX: 500, // Above max
      });

      act(() => {
        window.dispatchEvent(mouseMoveEvent);
      });

      expect(result.current.leftPaneWidth).toBe(420); // MAX_WIDTH
    });

    it('should update right pane width on mouse move', () => {
      const { result } = renderHook(() => usePaneResize());

      act(() => {
        result.current.handleRightPaneResizeStart();
      });

      // Mock window.innerWidth
      Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });

      const mouseMoveEvent = new MouseEvent('mousemove', {
        clientX: 800, // 1200 - 800 = 400
      });

      act(() => {
        window.dispatchEvent(mouseMoveEvent);
      });

      expect(result.current.rightPaneWidth).toBe(400);
    });

    it('should stop resizing on mouseup', () => {
      const onResizeEnd = vi.fn();
      const { result } = renderHook(() => usePaneResize({ onResizeEnd }));

      act(() => {
        result.current.handleLeftPaneResizeStart();
      });

      expect(document.body.classList.contains('is-resizing-pane')).toBe(true);

      const mouseUpEvent = new MouseEvent('mouseup');

      act(() => {
        window.dispatchEvent(mouseUpEvent);
      });

      expect(document.body.classList.contains('is-resizing-pane')).toBe(false);
      expect(onResizeEnd).toHaveBeenCalled();
    });

    it('should update section pane height on mouse move', () => {
      const { result } = renderHook(() => usePaneResize());

      // Set up a mock element for rightPaneRef
      const mockElement = document.createElement('div');
      mockElement.getBoundingClientRect = vi.fn(() => ({
        top: 100,
        left: 0,
        width: 400,
        height: 600,
        right: 400,
        bottom: 700,
        x: 0,
        y: 100,
        toJSON: () => ({}),
      }));

      // Assign the ref
      result.current.rightPaneRef.current = mockElement;

      act(() => {
        result.current.handleSectionPaneResizeStart();
      });

      const mouseMoveEvent = new MouseEvent('mousemove', {
        clientY: 400, // 400 - 100 = 300, 300/600 = 50%
      });

      act(() => {
        window.dispatchEvent(mouseMoveEvent);
      });

      expect(result.current.sectionPaneHeight).toBe(50);
    });

    it('should clamp section pane height to min percentage', () => {
      const { result } = renderHook(() => usePaneResize());

      const mockElement = document.createElement('div');
      mockElement.getBoundingClientRect = vi.fn(() => ({
        top: 0,
        left: 0,
        width: 400,
        height: 600,
        right: 400,
        bottom: 600,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }));

      result.current.rightPaneRef.current = mockElement;

      act(() => {
        result.current.handleSectionPaneResizeStart();
      });

      const mouseMoveEvent = new MouseEvent('mousemove', {
        clientY: 50, // 50/600 = 8.3%, should clamp to 20%
      });

      act(() => {
        window.dispatchEvent(mouseMoveEvent);
      });

      expect(result.current.sectionPaneHeight).toBe(20); // MIN_HEIGHT_PERCENT
    });

    it('should clamp section pane height to max percentage', () => {
      const { result } = renderHook(() => usePaneResize());

      const mockElement = document.createElement('div');
      mockElement.getBoundingClientRect = vi.fn(() => ({
        top: 0,
        left: 0,
        width: 400,
        height: 600,
        right: 400,
        bottom: 600,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }));

      result.current.rightPaneRef.current = mockElement;

      act(() => {
        result.current.handleSectionPaneResizeStart();
      });

      const mouseMoveEvent = new MouseEvent('mousemove', {
        clientY: 580, // 580/600 = 96.7%, should clamp to 80%
      });

      act(() => {
        window.dispatchEvent(mouseMoveEvent);
      });

      expect(result.current.sectionPaneHeight).toBe(80); // MAX_HEIGHT_PERCENT
    });

    it('should not resize section pane when ref is null', () => {
      const { result } = renderHook(() => usePaneResize());

      // ref is null by default
      expect(result.current.rightPaneRef.current).toBe(null);

      act(() => {
        result.current.handleSectionPaneResizeStart();
      });

      const mouseMoveEvent = new MouseEvent('mousemove', {
        clientY: 400,
      });

      act(() => {
        window.dispatchEvent(mouseMoveEvent);
      });

      // Should remain at default since ref is null
      expect(result.current.sectionPaneHeight).toBe(50);
    });
  });

  describe('cleanup', () => {
    it('should remove class on unmount', () => {
      const { unmount } = renderHook(() => usePaneResize());

      act(() => {
        document.body.classList.add('is-resizing-pane');
      });

      unmount();

      expect(document.body.classList.contains('is-resizing-pane')).toBe(false);
    });
  });

  describe('stable callbacks', () => {
    it('should return stable function references', () => {
      const { result, rerender } = renderHook(() => usePaneResize());

      const firstToggleLeftPane = result.current.showLeftPane;
      const firstHideLeftPane = result.current.hideLeftPane;
      const firstHandleLeftResize = result.current.handleLeftPaneResizeStart;

      rerender();

      expect(result.current.showLeftPane).toBe(firstToggleLeftPane);
      expect(result.current.hideLeftPane).toBe(firstHideLeftPane);
      expect(result.current.handleLeftPaneResizeStart).toBe(firstHandleLeftResize);
    });
  });
});