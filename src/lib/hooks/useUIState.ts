import { useState, useCallback, useRef, useEffect } from 'react';

export interface UseUIStateReturn {
  // Dialogs
  showDeleteDialog: boolean;
  showDiffViewer: boolean;
  showExportPanel: boolean;
  showImportDialog: boolean;
  setShowDeleteDialog: (show: boolean) => void;
  setShowDiffViewer: (show: boolean) => void;
  setShowExportPanel: (show: boolean) => void;
  setShowImportDialog: (show: boolean) => void;

  // Toasts
  saveToastVisible: boolean;
  hideToastVisible: boolean;
  allCopyFeedback: boolean;
  lyricsOnlyCopyFeedback: boolean;
  showSaveToast: () => void;
  showHideToast: () => void;
  showAllCopyFeedback: () => void;
  showLyricsOnlyCopyFeedback: () => void;
}

const TOAST_DURATION_MS = 2000;
const COPY_FEEDBACK_DURATION_MS = 1500;

export function useUIState(): UseUIStateReturn {
  // Dialogs
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDiffViewer, setShowDiffViewer] = useState(false);
  const [showExportPanel, setShowExportPanel] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);

  // Toasts
  const [saveToastVisible, setSaveToastVisible] = useState(false);
  const [hideToastVisible, setHideToastVisible] = useState(false);
  const [allCopyFeedback, setAllCopyFeedback] = useState(false);
  const [lyricsOnlyCopyFeedback, setLyricsOnlyCopyFeedback] = useState(false);

  // Timeout refs for cleanup
  const saveToastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideToastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const allCopyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lyricsOnlyCopyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveToastTimeoutRef.current) clearTimeout(saveToastTimeoutRef.current);
      if (hideToastTimeoutRef.current) clearTimeout(hideToastTimeoutRef.current);
      if (allCopyTimeoutRef.current) clearTimeout(allCopyTimeoutRef.current);
      if (lyricsOnlyCopyTimeoutRef.current) clearTimeout(lyricsOnlyCopyTimeoutRef.current);
    };
  }, []);

  const showSaveToast = useCallback(() => {
    setSaveToastVisible(true);
    if (saveToastTimeoutRef.current) clearTimeout(saveToastTimeoutRef.current);
    saveToastTimeoutRef.current = setTimeout(() => {
      setSaveToastVisible(false);
    }, TOAST_DURATION_MS);
  }, []);

  const showHideToast = useCallback(() => {
    setHideToastVisible(true);
    if (hideToastTimeoutRef.current) clearTimeout(hideToastTimeoutRef.current);
    hideToastTimeoutRef.current = setTimeout(() => {
      setHideToastVisible(false);
    }, TOAST_DURATION_MS);
  }, []);

  const showAllCopyFeedback = useCallback(() => {
    setAllCopyFeedback(true);
    if (allCopyTimeoutRef.current) clearTimeout(allCopyTimeoutRef.current);
    allCopyTimeoutRef.current = setTimeout(() => {
      setAllCopyFeedback(false);
    }, COPY_FEEDBACK_DURATION_MS);
  }, []);

  const showLyricsOnlyCopyFeedback = useCallback(() => {
    setLyricsOnlyCopyFeedback(true);
    if (lyricsOnlyCopyTimeoutRef.current) clearTimeout(lyricsOnlyCopyTimeoutRef.current);
    lyricsOnlyCopyTimeoutRef.current = setTimeout(() => {
      setLyricsOnlyCopyFeedback(false);
    }, COPY_FEEDBACK_DURATION_MS);
  }, []);

  return {
    // Dialogs
    showDeleteDialog,
    showDiffViewer,
    showExportPanel,
    showImportDialog,
    setShowDeleteDialog,
    setShowDiffViewer,
    setShowExportPanel,
    setShowImportDialog,

    // Toasts
    saveToastVisible,
    hideToastVisible,
    allCopyFeedback,
    lyricsOnlyCopyFeedback,
    showSaveToast,
    showHideToast,
    showAllCopyFeedback,
    showLyricsOnlyCopyFeedback,
  };
}