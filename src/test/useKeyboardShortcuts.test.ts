import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts, createEditorShortcuts, KeyboardShortcut } from '../lib/hooks/useKeyboardShortcuts';

describe('useKeyboardShortcuts', () => {
  let addEventListenerSpy: vi.SpyInstance;
  let removeEventListenerSpy: vi.SpyInstance;

  beforeEach(() => {
    addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('hook registration', () => {
    it('should register keydown listener on mount', () => {
      renderHook(() => useKeyboardShortcuts({ shortcuts: [] }));

      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    it('should remove keydown listener on unmount', () => {
      const { unmount } = renderHook(() => useKeyboardShortcuts({ shortcuts: [] }));

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    it('should use the same handler for add and remove', () => {
      const { unmount } = renderHook(() => useKeyboardShortcuts({ shortcuts: [] }));

      const addedHandler = addEventListenerSpy.mock.calls[0][1];
      unmount();
      const removedHandler = removeEventListenerSpy.mock.calls[0][1];

      expect(addedHandler).toBe(removedHandler);
    });
  });

  describe('shortcut triggering', () => {
    it('should trigger action when shortcut matches', () => {
      const action = vi.fn();
      const shortcuts: KeyboardShortcut[] = [
        { key: 's', ctrl: true, action },
      ];

      renderHook(() => useKeyboardShortcuts({ shortcuts }));

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      expect(action).toHaveBeenCalled();
    });

    it('should not trigger action when key does not match', () => {
      const action = vi.fn();
      const shortcuts: KeyboardShortcut[] = [
        { key: 's', ctrl: true, action },
      ];

      renderHook(() => useKeyboardShortcuts({ shortcuts }));

      const event = new KeyboardEvent('keydown', {
        key: 'x',
        ctrlKey: true,
      });
      window.dispatchEvent(event);

      expect(action).not.toHaveBeenCalled();
    });

    it('should not trigger action when Ctrl is not pressed', () => {
      const action = vi.fn();
      const shortcuts: KeyboardShortcut[] = [
        { key: 's', ctrl: true, action },
      ];

      renderHook(() => useKeyboardShortcuts({ shortcuts }));

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: false,
      });
      window.dispatchEvent(event);

      expect(action).not.toHaveBeenCalled();
    });

    it('should support both Ctrl and Cmd (metaKey)', () => {
      const action = vi.fn();
      const shortcuts: KeyboardShortcut[] = [
        { key: 's', ctrl: true, action },
      ];

      renderHook(() => useKeyboardShortcuts({ shortcuts }));

      const event = new KeyboardEvent('keydown', {
        key: 's',
        metaKey: true,
      });
      window.dispatchEvent(event);

      expect(action).toHaveBeenCalled();
    });

    it('should prevent default on matched shortcut', () => {
      const action = vi.fn();
      const shortcuts: KeyboardShortcut[] = [
        { key: 's', ctrl: true, action },
      ];

      renderHook(() => useKeyboardShortcuts({ shortcuts }));

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
      });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
      window.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('shift key handling', () => {
    it('should trigger with shift modifier', () => {
      const action = vi.fn();
      const shortcuts: KeyboardShortcut[] = [
        { key: 'C', ctrl: true, shift: true, action },
      ];

      renderHook(() => useKeyboardShortcuts({ shortcuts }));

      const event = new KeyboardEvent('keydown', {
        key: 'C',
        ctrlKey: true,
        shiftKey: true,
      });
      window.dispatchEvent(event);

      expect(action).toHaveBeenCalled();
    });

    it('should not trigger when shift is required but not pressed', () => {
      const action = vi.fn();
      const shortcuts: KeyboardShortcut[] = [
        { key: 'C', ctrl: true, shift: true, action },
      ];

      renderHook(() => useKeyboardShortcuts({ shortcuts }));

      const event = new KeyboardEvent('keydown', {
        key: 'C',
        ctrlKey: true,
        shiftKey: false,
      });
      window.dispatchEvent(event);

      expect(action).not.toHaveBeenCalled();
    });

    it('should not trigger when shift is not required but pressed', () => {
      const action = vi.fn();
      const shortcuts: KeyboardShortcut[] = [
        { key: 's', ctrl: true, action },
      ];

      renderHook(() => useKeyboardShortcuts({ shortcuts }));

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        shiftKey: true,
      });
      window.dispatchEvent(event);

      expect(action).not.toHaveBeenCalled();
    });
  });

  describe('alt key handling', () => {
    it('should trigger with alt modifier', () => {
      const action = vi.fn();
      const shortcuts: KeyboardShortcut[] = [
        { key: 'a', ctrl: true, alt: true, action },
      ];

      renderHook(() => useKeyboardShortcuts({ shortcuts }));

      const event = new KeyboardEvent('keydown', {
        key: 'a',
        ctrlKey: true,
        altKey: true,
      });
      window.dispatchEvent(event);

      expect(action).toHaveBeenCalled();
    });

    it('should not trigger when alt is required but not pressed', () => {
      const action = vi.fn();
      const shortcuts: KeyboardShortcut[] = [
        { key: 'a', ctrl: true, alt: true, action },
      ];

      renderHook(() => useKeyboardShortcuts({ shortcuts }));

      const event = new KeyboardEvent('keydown', {
        key: 'a',
        ctrlKey: true,
        altKey: false,
      });
      window.dispatchEvent(event);

      expect(action).not.toHaveBeenCalled();
    });
  });

  describe('input exclusion', () => {
    it('should not trigger when focused on input element', () => {
      const action = vi.fn();
      const shortcuts: KeyboardShortcut[] = [
        { key: 's', ctrl: true, action },
      ];

      renderHook(() => useKeyboardShortcuts({ shortcuts }));

      const input = document.createElement('input');
      document.body.appendChild(input);

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        bubbles: true,
      });

      Object.defineProperty(event, 'target', { value: input, enumerable: true });
      window.dispatchEvent(event);

      expect(action).not.toHaveBeenCalled();

      document.body.removeChild(input);
    });

    it('should not trigger when focused on textarea element', () => {
      const action = vi.fn();
      const shortcuts: KeyboardShortcut[] = [
        { key: 's', ctrl: true, action },
      ];

      renderHook(() => useKeyboardShortcuts({ shortcuts }));

      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        bubbles: true,
      });

      Object.defineProperty(event, 'target', { value: textarea, enumerable: true });
      window.dispatchEvent(event);

      expect(action).not.toHaveBeenCalled();

      document.body.removeChild(textarea);
    });

    it('should trigger when focused on non-input element', () => {
      const action = vi.fn();
      const shortcuts: KeyboardShortcut[] = [
        { key: 's', ctrl: true, action },
      ];

      renderHook(() => useKeyboardShortcuts({ shortcuts }));

      const div = document.createElement('div');
      document.body.appendChild(div);

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        bubbles: true,
      });

      Object.defineProperty(event, 'target', { value: div, enumerable: true });
      window.dispatchEvent(event);

      expect(action).toHaveBeenCalled();

      document.body.removeChild(div);
    });
  });

  describe('enabled option', () => {
    it('should not trigger when disabled', () => {
      const action = vi.fn();
      const shortcuts: KeyboardShortcut[] = [
        { key: 's', ctrl: true, action },
      ];

      renderHook(() => useKeyboardShortcuts({ shortcuts, enabled: false }));

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
      });
      window.dispatchEvent(event);

      expect(action).not.toHaveBeenCalled();
    });

    it('should trigger when enabled is true', () => {
      const action = vi.fn();
      const shortcuts: KeyboardShortcut[] = [
        { key: 's', ctrl: true, action },
      ];

      renderHook(() => useKeyboardShortcuts({ shortcuts, enabled: true }));

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
      });
      window.dispatchEvent(event);

      expect(action).toHaveBeenCalled();
    });

    it('should default to enabled', () => {
      const action = vi.fn();
      const shortcuts: KeyboardShortcut[] = [
        { key: 's', ctrl: true, action },
      ];

      renderHook(() => useKeyboardShortcuts({ shortcuts }));

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
      });
      window.dispatchEvent(event);

      expect(action).toHaveBeenCalled();
    });
  });

  describe('multiple shortcuts', () => {
    it('should trigger only the first matching shortcut', () => {
      const action1 = vi.fn();
      const action2 = vi.fn();
      const shortcuts: KeyboardShortcut[] = [
        { key: 's', ctrl: true, action: action1 },
        { key: 's', ctrl: true, action: action2 },
      ];

      renderHook(() => useKeyboardShortcuts({ shortcuts }));

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
      });
      window.dispatchEvent(event);

      expect(action1).toHaveBeenCalled();
      expect(action2).not.toHaveBeenCalled();
    });

    it('should trigger different shortcuts for different keys', () => {
      const saveAction = vi.fn();
      const diffAction = vi.fn();
      const shortcuts: KeyboardShortcut[] = [
        { key: 's', ctrl: true, action: saveAction },
        { key: 'd', ctrl: true, action: diffAction },
      ];

      renderHook(() => useKeyboardShortcuts({ shortcuts }));

      const saveEvent = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
      });
      window.dispatchEvent(saveEvent);

      expect(saveAction).toHaveBeenCalled();
      expect(diffAction).not.toHaveBeenCalled();

      const diffEvent = new KeyboardEvent('keydown', {
        key: 'd',
        ctrlKey: true,
      });
      window.dispatchEvent(diffEvent);

      expect(diffAction).toHaveBeenCalled();
    });
  });

  describe('case insensitive matching', () => {
    it('should match lowercase key regardless of case', () => {
      const action = vi.fn();
      const shortcuts: KeyboardShortcut[] = [
        { key: 'S', ctrl: true, action },
      ];

      renderHook(() => useKeyboardShortcuts({ shortcuts }));

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
      });
      window.dispatchEvent(event);

      expect(action).toHaveBeenCalled();
    });

    it('should match uppercase key regardless of case', () => {
      const action = vi.fn();
      const shortcuts: KeyboardShortcut[] = [
        { key: 's', ctrl: true, action },
      ];

      renderHook(() => useKeyboardShortcuts({ shortcuts }));

      const event = new KeyboardEvent('keydown', {
        key: 'S',
        ctrlKey: true,
      });
      window.dispatchEvent(event);

      expect(action).toHaveBeenCalled();
    });
  });
});

describe('createEditorShortcuts', () => {
  it('should create 7 standard editor shortcuts', () => {
    const actions = {
      onSave: vi.fn(),
      onSearch: vi.fn(),
      onCopyAll: vi.fn(),
      onDiff: vi.fn(),
      onImport: vi.fn(),
      onExport: vi.fn(),
    };
    const shortcuts = createEditorShortcuts(actions);
    expect(shortcuts.length).toBe(7);
  });

  it('should include Ctrl+S for save', () => {
    const actions = {
      onSave: vi.fn(),
      onSearch: vi.fn(),
      onCopyAll: vi.fn(),
      onDiff: vi.fn(),
      onImport: vi.fn(),
      onExport: vi.fn(),
    };
    const shortcuts = createEditorShortcuts(actions);
    const saveShortcut = shortcuts.find(s => s.key === 's' && s.ctrl);

    expect(saveShortcut).toBeDefined();
    expect(saveShortcut?.description).toBe('Save snapshot');
  });

  it('should include Ctrl+Shift+C for copy all', () => {
    const actions = {
      onSave: vi.fn(),
      onSearch: vi.fn(),
      onCopyAll: vi.fn(),
      onDiff: vi.fn(),
      onImport: vi.fn(),
      onExport: vi.fn(),
    };
    const shortcuts = createEditorShortcuts(actions);
    const copyShortcut = shortcuts.find(s => s.key === 'C' && s.ctrl && s.shift);

    expect(copyShortcut).toBeDefined();
    expect(copyShortcut?.description).toBe('Copy all');
  });

  it('should include Ctrl+D for diff', () => {
    const actions = {
      onSave: vi.fn(),
      onSearch: vi.fn(),
      onCopyAll: vi.fn(),
      onDiff: vi.fn(),
      onImport: vi.fn(),
      onExport: vi.fn(),
    };
    const shortcuts = createEditorShortcuts(actions);
    const diffShortcut = shortcuts.find(s => s.key === 'd' && s.ctrl);

    expect(diffShortcut).toBeDefined();
    expect(diffShortcut?.description).toBe('Show diff viewer');
  });

  it('should include Ctrl+I for import', () => {
    const actions = {
      onSave: vi.fn(),
      onSearch: vi.fn(),
      onCopyAll: vi.fn(),
      onDiff: vi.fn(),
      onImport: vi.fn(),
      onExport: vi.fn(),
    };
    const shortcuts = createEditorShortcuts(actions);
    const importShortcut = shortcuts.find(s => s.key === 'i' && s.ctrl);

    expect(importShortcut).toBeDefined();
    expect(importShortcut?.description).toBe('Import');
  });

  it('should include Ctrl+E for export', () => {
    const actions = {
      onSave: vi.fn(),
      onSearch: vi.fn(),
      onCopyAll: vi.fn(),
      onDiff: vi.fn(),
      onImport: vi.fn(),
      onExport: vi.fn(),
    };
    const shortcuts = createEditorShortcuts(actions);
    const exportShortcut = shortcuts.find(s => s.key === 'e' && s.ctrl);

    expect(exportShortcut).toBeDefined();
    expect(exportShortcut?.description).toBe('Export');
  });

  it('should have all shortcuts with descriptions', () => {
    const actions = {
      onSave: vi.fn(),
      onSearch: vi.fn(),
      onCopyAll: vi.fn(),
      onDiff: vi.fn(),
      onImport: vi.fn(),
      onExport: vi.fn(),
    };
    const shortcuts = createEditorShortcuts(actions);

    const allHaveDescriptions = shortcuts.every(s =>
      typeof s.description === 'string' && s.description.length > 0
    );
    expect(allHaveDescriptions).toBe(true);
  });
});