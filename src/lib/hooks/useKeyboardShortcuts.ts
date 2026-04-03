import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description?: string;
}

export interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

/**
 * Hook for managing keyboard shortcuts
 * Automatically handles Ctrl/Cmd for cross-platform support
 */
export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions): void {
  const { shortcuts, enabled = true } = options;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;

    // Don't trigger shortcuts when typing in inputs
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable ||
      (typeof target.closest === 'function' && !!target.closest('.monaco-editor'))
    ) {
      return;
    }

    for (const shortcut of shortcuts) {
      const ctrlMatch = shortcut.ctrl
        ? (e.ctrlKey || e.metaKey) // Support both Ctrl and Cmd
        : true;
      const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
      const altMatch = shortcut.alt ? e.altKey : !e.altKey;
      const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();

      if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
        e.preventDefault();
        shortcut.action();
        return;
      }
    }
  }, [shortcuts, enabled]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

/**
 * Preset shortcuts for the editor
 */
export function createEditorShortcuts(actions: {
  onSave: () => void;
  onSearch: () => void;
  onCopyAll: () => void;
  onDiff: () => void;
  onImport: () => void;
  onExport: () => void;
  onUndoHide: () => void;
}): KeyboardShortcut[] {
  return [
    { key: 's', ctrl: true, action: actions.onSave, description: 'Save snapshot' },
    { key: 'z', ctrl: true, action: actions.onUndoHide, description: 'Undo hidden version' },
    { key: 'f', ctrl: true, action: actions.onSearch, description: 'Toggle search' },
    { key: 'C', ctrl: true, shift: true, action: actions.onCopyAll, description: 'Copy all' },
    { key: 'd', ctrl: true, action: actions.onDiff, description: 'Show diff viewer' },
    { key: 'i', ctrl: true, action: actions.onImport, description: 'Import' },
    { key: 'e', ctrl: true, action: actions.onExport, description: 'Export' },
  ];
}
