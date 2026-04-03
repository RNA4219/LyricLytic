import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { getProject, getWorkingDraft, getDraftSections, saveDraft, getVersions, createVersion, deleteProject, deleteVersion, restoreVersion as restoreVersionApi, getFragments, createFragment, Project, LyricVersion, DraftSectionInput, VersionSectionInput } from '../lib/api';
import { useLLMSettings } from '../lib/llm';
import { useLanguage } from '../lib/LanguageContext';
import { useProject } from '../lib/ProjectContext';
import { usePaneResize, useKeyboardShortcuts, createEditorShortcuts, usePhoneticGuide, useSectionDragDrop, useUIState, useBpm, useStyleVocal, useClipboard, BPM_PRESETS } from '../lib/hooks';
import { EDITOR, SECTION_PRESETS } from '../lib/config';
import ActionPane from './editor/ActionPane';
import EditorOverlays from './editor/EditorOverlays';
import { Section, mapDraftSections, parseBodyToSections, sectionsToBody, generateUniqueSectionName, buildLyricsOnlyBody } from '../lib/section';
import VersionPane from './editor/VersionPane';
import { analyzeRhymeGuideRows, buildFallbackRhymeGuideRows, getGuideHighlightParts, countRomanizedGuideUnits } from '../lib/rhyme/analysis';

function EditorPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const { setProjectTitle } = useProject();
  const [project, setProject] = useState<Project | null>(null);
  const [versions, setVersions] = useState<LyricVersion[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [fragments, setFragments] = useState<Array<{ collected_fragment_id: string; text: string; source?: string; status: string }>>([]);
  const [lastHiddenVersion, setLastHiddenVersion] = useState<{ version: LyricVersion; batchId: string } | null>(null);
  const { settings: llmSettings, updateSettings: setLLMSettings } = useLLMSettings();
  const [allViewText, setAllViewText] = useState('');
  const [editorScrollTop, setEditorScrollTop] = useState(0);
  const editorContainerRef = useRef<HTMLDivElement | null>(null);
  const isResizingPhoneticGuideRef = useRef(false);

  // Style & Vocal hook
  const {
    styleText,
    vocalText,
    setStyleText,
    setVocalText,
  } = useStyleVocal();

  // BPM hook
  const {
    bpmValue,
    bpmMode,
    handleBpmPresetChange,
    handleCustomBpmChange,
    setBpmValue,
    calculateEstimatedSeconds,
  } = useBpm();

  // Phonetic guide hook
  const {
    height: phoneticGuideHeight,
    rows: phoneticGuideRows,
    setHeight: setPhoneticGuideHeight,
    setRows: setPhoneticGuideRows,
  } = usePhoneticGuide();

  // Section drag & drop hook
  const {
    draggedSectionId,
    dragOverSectionId,
    dragPointerPosition,
    handlePointerDown: handleSectionPointerDown,
  } = useSectionDragDrop(sections, { onReorder: setSections });

  // UI state hook (dialogs & toasts)
  const {
    showDeleteDialog,
    showDiffViewer,
    showExportPanel,
    showImportDialog,
    setShowDeleteDialog,
    setShowDiffViewer,
    setShowExportPanel,
    setShowImportDialog,
    saveToastVisible,
    hideToastVisible,
    allCopyFeedback,
    lyricsOnlyCopyFeedback,
    showSaveToast,
    showHideToast,
    showAllCopyFeedback,
    showLyricsOnlyCopyFeedback,
  } = useUIState();

  // Clipboard hook
  const { copy: clipboardCopy } = useClipboard({
    onError: () => setError(t('copyFailed')),
  });

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editorInstanceRef = useRef<{
    onDidScrollChange: (callback: (event: { scrollTop: number }) => void) => { dispose: () => void };
    onDidChangeCursorPosition?: (callback: (event: {
      position: { lineNumber: number; column: number };
    }) => void) => { dispose: () => void };
    getSelection?: () => {
      startLineNumber: number;
      startColumn: number;
      endLineNumber: number;
      endColumn: number;
    } | null;
    getModel?: () => {
      getLineMaxColumn: (lineNumber: number) => number;
    } | null;
    executeEdits?: (
      source: string,
      edits: Array<{
        range: {
          startLineNumber: number;
          startColumn: number;
          endLineNumber: number;
          endColumn: number;
        };
        text: string;
        forceMoveMarkers?: boolean;
      }>,
    ) => void;
    focus?: () => void;
  } | null>(null);
  const editorScrollDisposeRef = useRef<{ dispose: () => void } | null>(null);
  const editorCursorDisposeRef = useRef<{ dispose: () => void } | null>(null);
  const lastEditorSelectionRef = useRef<{
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  } | null>(null);

  // Pane resize hook
  const {
    leftPaneWidth,
    rightPaneWidth,
    sectionPaneHeight,
    isLeftPaneVisible,
    rightPaneRef,
    showLeftPane,
    handleLeftPaneResizeStart,
    handleRightPaneResizeStart,
    handleSectionPaneResizeStart,
  } = usePaneResize();

  useEffect(() => {
    if (projectId) {
      loadData(projectId);
    }
  }, [projectId]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      editorScrollDisposeRef.current?.dispose();
      editorCursorDisposeRef.current?.dispose();
    };
  }, []);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isResizingPhoneticGuideRef.current || !editorContainerRef.current) return;

      const rect = editorContainerRef.current.getBoundingClientRect();
      const nextHeight = rect.bottom - event.clientY;
      const maxHeight = Math.max(140, rect.height - 180);
      const clampedHeight = Math.min(maxHeight, Math.max(120, nextHeight));
      setPhoneticGuideHeight(clampedHeight);
    };

    const stopResizing = () => {
      if (!isResizingPhoneticGuideRef.current) return;
      isResizingPhoneticGuideRef.current = false;
      document.body.classList.remove('is-resizing-pane-horizontal');
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopResizing);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopResizing);
      document.body.classList.remove('is-resizing-pane-horizontal');
    };
  }, []);

  // Clear project title on unmount
  useEffect(() => {
    return () => {
      setProjectTitle(null);
    };
  }, [setProjectTitle]);

  useEffect(() => {
    if (activeSection !== EDITOR.ALL_SECTIONS_ID) {
      setAllViewText(sectionsToBody(sections));
    }
  }, [sections, activeSection]);

  // Keyboard shortcuts hook
  useKeyboardShortcuts({
    shortcuts: createEditorShortcuts({
      onSave: () => { handleSaveSnapshot(); },
      onUndoHide: () => { void handleUndoHideVersion(); },
      onSearch: () => { /* search not implemented */ },
      onCopyAll: () => {
        const text = sectionsToBody(sections);
        navigator.clipboard.writeText(text);
      },
      onDiff: () => setShowDiffViewer(true),
      onImport: () => setShowImportDialog(true),
      onExport: () => setShowExportPanel(true),
    }),
  });

  const loadData = async (pid: string) => {
    try {
      setLoading(true);
      setError(null);

      const projectData = await getProject(pid);
      setProject(projectData);
      setProjectTitle(projectData.title);

      const [draftResult, versionResult, fragmentResult] = await Promise.allSettled([
        getWorkingDraft(pid),
        getVersions(pid),
        getFragments(pid),
      ]);

      const draftData = draftResult.status === 'fulfilled' ? draftResult.value : null;
      const versionData = versionResult.status === 'fulfilled' ? versionResult.value : [];
      const fragmentData = fragmentResult.status === 'fulfilled' ? fragmentResult.value : [];

      setVersions(versionData);
      setFragments(fragmentData);

      if (draftData) {
        const draftSections = await getDraftSections(draftData.working_draft_id);
        const loadedSections = draftSections.length > 0
          ? mapDraftSections(draftSections)
          : parseBodyToSections(draftData.latest_body_text);

        setSections(loadedSections);
        setAllViewText(draftData.latest_body_text || sectionsToBody(loadedSections));
        setActiveSection(loadedSections.length > 0 ? EDITOR.ALL_SECTIONS_ID : null);
        setStyleText(draftData.style_text || '');
        setVocalText(draftData.vocal_text || '');
        const nextBpm = draftData.bpm ?? versionData[0]?.bpm ?? 120;
        setBpmValue(nextBpm);
      } else {
        setSections([]);
        setAllViewText('');
        setActiveSection(null);
        setStyleText('');
        setVocalText('');
        const nextBpm = versionData[0]?.bpm ?? 120;
        setBpmValue(nextBpm);
      }

      if (
        draftResult.status === 'rejected' ||
        versionResult.status === 'rejected' ||
        fragmentResult.status === 'rejected'
      ) {
        setError(t('loadFailed'));
      }
    } catch (e) {
      setProject(null);
      setError(t('loadFailed'));
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoSave = useCallback(async (
    secs: Section[],
    overrides?: { styleText?: string; vocalText?: string }
    ) => {
      if (!projectId || saving) return;

    try {
      setSaving(true);
      const body = sectionsToBody(secs);
      const nextStyleText = overrides?.styleText ?? styleText;
      const nextVocalText = overrides?.vocalText ?? vocalText;
      const sectionInputs: DraftSectionInput[] = secs.map(s => ({
        section_type: s.type,
        display_name: s.displayName,
        sort_order: s.sortOrder,
        body_text: s.bodyText,
      }));

        await saveDraft({
          project_id: projectId,
          body_text: body,
          sections: sectionInputs,
          bpm: bpmValue,
          style_text: nextStyleText,
          vocal_text: nextVocalText,
        });
      setLastSaved(new Date());
      setError(null);
    } catch (e) {
        setError('Auto-save failed');
        console.error(e);
      } finally {
        setSaving(false);
      }
    }, [projectId, saving, styleText, vocalText, bpmValue]);

  const queueAutoSave = useCallback((secs: Section[]) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      handleAutoSave(secs);
    }, 1000);
  }, [handleAutoSave]);

  const handleStyleTextChange = useCallback((text: string) => {
    setStyleText(text);
    queueAutoSave(sections);
  }, [sections, queueAutoSave]);

  const handleVocalTextChange = useCallback((text: string) => {
    setVocalText(text);
    queueAutoSave(sections);
  }, [sections, queueAutoSave]);

  const handleBpmPresetChangeWrapper = useCallback((value: string) => {
    handleBpmPresetChange(value);
    queueAutoSave(sections);
  }, [handleBpmPresetChange, queueAutoSave, sections]);

  const handleCustomBpmChangeWrapper = useCallback((value: string) => {
    handleCustomBpmChange(value);
    queueAutoSave(sections);
  }, [handleCustomBpmChange, queueAutoSave, sections]);

  const updateSections = useCallback((
    updater: (currentSections: Section[]) => Section[],
    nextActiveSectionId?: string | null,
  ) => {
    const nextSections = updater(sections);
    setSections(nextSections);
    if (nextActiveSectionId !== undefined) {
      setActiveSection(nextActiveSectionId);
    }
    queueAutoSave(nextSections);
  }, [sections, queueAutoSave]);

  const handleEditorChange = useCallback((value: string | undefined) => {
    if (value === undefined) return;

    if (activeSection === EDITOR.ALL_SECTIONS_ID) {
      setAllViewText(value);
      const parsedSections = parseBodyToSections(value).map((section, index) => ({
        ...section,
        sortOrder: index,
      }));
      setSections(parsedSections);
      queueAutoSave(parsedSections);
      return;
    }

    updateSections((currentSections) => {
      const updatedSections = [...currentSections];
      const activeIdx = updatedSections.findIndex(s => s.id === activeSection);
      if (activeIdx >= 0) {
        updatedSections[activeIdx] = { ...updatedSections[activeIdx], bodyText: value };
      }
      return updatedSections;
    });
  }, [activeSection, updateSections]);

  const addSection = (type: string) => {
    const uniqueName = generateUniqueSectionName(type, sections);
    const newSection: Section = {
      id: crypto.randomUUID(),
      type,
      displayName: uniqueName,
      sortOrder: sections.length,
      bodyText: '',
    };

    if (activeSection === EDITOR.ALL_SECTIONS_ID) {
      const tagText = `\n[${uniqueName}]`;
      if (appendTextToEditorSelection(tagText)) {
        return;
      }

      const nextSections = [...sections, newSection];
      const nextBody = sectionsToBody(nextSections);
      setSections(nextSections);
      setAllViewText(nextBody);
      setActiveSection(EDITOR.ALL_SECTIONS_ID);
      queueAutoSave(nextSections);
      return;
    }

    updateSections((currentSections) => [...currentSections, newSection], newSection.id);
  };

  const renameSection = (id: string, newName: string) => {
    updateSections((currentSections) => currentSections.map(s =>
      s.id === id ? { ...s, displayName: newName, type: newName } : s
    ));
  };

  const deleteSection = (id: string) => {
    const remainingSections = sections.filter(s => s.id !== id);
    const nextActiveSectionId = activeSection === id
      ? (remainingSections[0]?.id ?? null)
      : activeSection;

    updateSections(
      (currentSections) => currentSections.filter(s => s.id !== id),
      nextActiveSectionId,
    );
  };

  const handlePhoneticGuideResizeStart = () => {
    isResizingPhoneticGuideRef.current = true;
    document.body.classList.add('is-resizing-pane-horizontal');
  };

  const handleSaveSnapshot = async () => {
    if (!projectId) return;
  
    try {
      const body = sectionsToBody(sections);
      const sectionInputs: VersionSectionInput[] = sections.map(s => ({
        section_type: s.type,
        display_name: s.displayName,
        sort_order: s.sortOrder,
        body_text: s.bodyText,
      }));
      const version = await createVersion({
        project_id: projectId,
        snapshot_name: new Date().toLocaleString(language === 'ja' ? 'ja-JP' : 'en-US'),
        body_text: body,
        bpm: bpmValue,
        style_text: styleText || undefined,
        vocal_text: vocalText || undefined,
        parent_lyric_version_id: versions[0]?.lyric_version_id,
        sections: sectionInputs,
      });
      setVersions([version, ...versions]);
      showSaveToast();
    } catch (e) {
      setError('Failed to save snapshot');
      console.error(e);
    }
  };

  const handleDeleteProject = async () => {
    if (!projectId) return;

    try {
      await deleteProject(projectId);
      navigate('/');
    } catch (e) {
      setError('Failed to delete project');
      console.error(e);
    }
  };

  const handleHideVersion = async (version: LyricVersion) => {
    try {
      const batchId = await deleteVersion(version.lyric_version_id);
      setVersions((current) => current.filter((item) => item.lyric_version_id !== version.lyric_version_id));
      setLastHiddenVersion({ version, batchId });
      showHideToast();
    } catch (e) {
      setError(t('hideVersionFailed'));
      console.error(e);
    }
  };

  const handleUndoHideVersion = useCallback(async () => {
    if (!lastHiddenVersion) return;

    try {
      await restoreVersionApi(lastHiddenVersion.version.lyric_version_id, lastHiddenVersion.batchId);
      setVersions((current) => [lastHiddenVersion.version, ...current].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ));
      setLastHiddenVersion(null);
    } catch (e) {
      setError(t('restoreVersionFailed'));
      console.error(e);
    }
  }, [lastHiddenVersion, t]);

  const restoreVersion = async (version: LyricVersion) => {
    const parsed = parseBodyToSections(version.body_text);
    const nextStyleText = version.style_text || '';
    const nextVocalText = version.vocal_text || '';
    const nextBpm = version.bpm ?? 120;
    setSections(parsed);
    setAllViewText(version.body_text);
    setStyleText(nextStyleText);
    setVocalText(nextVocalText);
    setBpmValue(nextBpm);
    if (parsed.length > 0) {
      setActiveSection(EDITOR.ALL_SECTIONS_ID);
    }
    await handleAutoSave(parsed, { styleText: nextStyleText, vocalText: nextVocalText });
  };

  const appendTextToEditorSelection = useCallback((text: string) => {
    const editor = editorInstanceRef.current;
    const selection = editor?.getSelection?.() ?? lastEditorSelectionRef.current;
    
    if (editor?.executeEdits && selection) {
      editor.executeEdits('lyriclytic-append-selection', [{
        range: {
          startLineNumber: selection.endLineNumber,
          startColumn: selection.endColumn,
          endLineNumber: selection.endLineNumber,
          endColumn: selection.endColumn,
        },
        text,
        forceMoveMarkers: true,
      }]);
      editor.focus?.();
      return true;
    }

    return false;
  }, []);

  const handleImportAsFragment = async (text: string, source: string) => {
    if (!projectId) return;
    try {
      const fragment = await createFragment({
        project_id: projectId,
        text,
        source,
      });
      setFragments([fragment, ...fragments]);
    } catch (e) {
      console.error('Failed to import fragment:', e);
    }
  };

  const handleImportAsBody = (text: string) => {
    const parsed = parseBodyToSections(text);
    setSections(parsed);
    setAllViewText(text);
    if (parsed.length > 0) {
      setActiveSection(EDITOR.ALL_SECTIONS_ID);
    }
  };

  const currentProjectId = projectId ?? '';
  const activeSectionData = sections.find(s => s.id === activeSection);
  const draggedSectionData = sections.find((s) => s.id === draggedSectionId) ?? null;
  const isAllView = activeSection === EDITOR.ALL_SECTIONS_ID;
  const editorValue = isAllView ? allViewText : (activeSectionData?.bodyText || '');
  const lineCharacterCounts = useMemo(() => {
    const lines = editorValue.split('\n');
    let guideIndex = 0;

    return lines.map((line) => {
      const trimmedLine = line.trim();
      if (trimmedLine.length === 0 || /^\[[^\]]+\]$/.test(trimmedLine)) {
        return null;
      }
      const guideRow = phoneticGuideRows[guideIndex];
      guideIndex += 1;
      if (!guideRow) {
        return [...line].length;
      }
      return countRomanizedGuideUnits(guideRow.romanizedText);
    });
  }, [editorValue, phoneticGuideRows]);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const rows = await analyzeRhymeGuideRows(editorValue);
        if (!cancelled) {
          setPhoneticGuideRows(rows);
        }
      } catch (error) {
        if (!cancelled) {
          console.warn('Failed to load Sudachi rhyme guide. Falling back to local analysis.', error);
          setPhoneticGuideRows(buildFallbackRhymeGuideRows(editorValue));
        }
      }
    }, 120);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [editorValue]);

  const totalLyricChars = useMemo(() => {
    return lineCharacterCounts.reduce<number>((sum, count) => sum + (count ?? 0), 0);
  }, [lineCharacterCounts]);

  const estimatedSeconds = calculateEstimatedSeconds(totalLyricChars);

  const rhymeGuideSourceLabel = useMemo(() => {
    const source = phoneticGuideRows[0]?.source;
    if (source === 'sudachi_core') {
      return t('analysisSourceSudachi');
    }
    return t('analysisSourceFallback');
  }, [phoneticGuideRows, t]);

  const copyTextToClipboard = useCallback(async (
    text: string,
    showFeedback?: () => void,
  ) => {
    if (!text.trim()) return;
    await clipboardCopy(text);
    showFeedback?.();
  }, [clipboardCopy]);

  const handleCopyAllWithTags = useCallback(() => {
    void copyTextToClipboard(
      sectionsToBody(sections),
      showAllCopyFeedback,
    );
  }, [copyTextToClipboard, sections]);

  const handleCopyLyricsOnly = useCallback(() => {
    void copyTextToClipboard(
      buildLyricsOnlyBody(sections),
      showLyricsOnlyCopyFeedback,
    );
  }, [copyTextToClipboard, sections]);

  const handleEditorMount = useCallback((editorInstance: {
    onDidScrollChange: (callback: (event: { scrollTop: number }) => void) => { dispose: () => void };
    onDidChangeCursorPosition?: (callback: (event: {
      position: { lineNumber: number; column: number };
    }) => void) => { dispose: () => void };
    getSelection?: () => {
      startLineNumber: number;
      startColumn: number;
      endLineNumber: number;
      endColumn: number;
    } | null;
  }) => {
    editorScrollDisposeRef.current?.dispose();
    editorCursorDisposeRef.current?.dispose();
    editorInstanceRef.current = editorInstance;
    editorScrollDisposeRef.current = editorInstance.onDidScrollChange((event) => {
      setEditorScrollTop(event.scrollTop);
    });
    if (editorInstance.onDidChangeCursorPosition) {
      editorCursorDisposeRef.current = editorInstance.onDidChangeCursorPosition(() => {
        const selection = editorInstance.getSelection?.();
        if (selection) {
          lastEditorSelectionRef.current = selection;
        }
      });
    }
  }, []);

  if (loading) {
    return <div className="editor-workspace"><p className="loading">{t('loadingProject')}</p></div>;
  }

  if (!project) {
    return <div className="editor-workspace"><p className="error">{t('projectNotFound')}</p></div>;
  }

  const renderGuideValue = (value: string, previousValue?: string) => {
    const parts = getGuideHighlightParts(value, previousValue);
    if (!parts.match) {
      return <span className="phonetic-chip-value">{value}</span>;
    }
    return (
      <span className="phonetic-chip-value">
        {parts.prefix ? `${parts.prefix} ` : ''}
        <span className="phonetic-chip-match">{parts.match}</span>
      </span>
    );
  };

  return (
    <div className={`editor-workspace ${isLeftPaneVisible ? '' : 'left-pane-hidden'}`}>
      {isLeftPaneVisible && (
        <>
            <VersionPane
              versions={versions}
              width={leftPaneWidth}
              styleText={styleText}
              vocalText={vocalText}
              onStyleTextChange={handleStyleTextChange}
              onVocalTextChange={handleVocalTextChange}
              onRestoreVersion={restoreVersion}
              onHideVersion={handleHideVersion}
              onShowDiff={() => setShowDiffViewer(true)}
            />
          <div
            className="pane-resize-handle pane-resize-handle-left"
            onMouseDown={handleLeftPaneResizeStart}
            role="separator"
            aria-orientation="vertical"
            aria-label="左ペイン幅の調整"
          />
        </>
      )}

      {!isLeftPaneVisible && (
        <button
          type="button"
          className="left-pane-floating-toggle"
          onClick={() => showLeftPane()}
          aria-label="左ペインを表示"
          title="左ペインを表示"
        >
          <span className="left-pane-toggle-bars" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>
      )}

      {/* Center Pane - Editor */}
      <main className="center-pane">
        <div className="editor-pane">
          <div className="editor-pane-header">
            <div className="editor-header-main">
              <div className="editor-header-meta">
                <span className="draft-badge">{t('workingDraft')}</span>
                {lastSaved && (
                  <span className="autosave-info">
                    {t('autosaved')} {lastSaved.toLocaleTimeString(language === 'ja' ? 'ja-JP' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
              <div className="editor-metric-row">
                <div className="editor-bpm-control">
                  <span className="editor-metric-label">{t('bpm')}</span>
                    <select
                      value={bpmMode === 'preset' ? String(bpmValue) : 'custom'}
                      onChange={(e) => handleBpmPresetChangeWrapper(e.target.value)}
                      className="editor-bpm-select"
                    >
                    {BPM_PRESETS.map((preset) => (
                      <option key={preset} value={preset}>
                        {preset}
                      </option>
                    ))}
                    <option value="custom">{t('custom')}</option>
                  </select>
                  {bpmMode === 'custom' && (
                      <input
                        type="number"
                        min={40}
                        max={260}
                        step={1}
                        value={bpmValue}
                        onChange={(e) => handleCustomBpmChangeWrapper(e.target.value)}
                        className="editor-bpm-input"
                      />
                  )}
                </div>
                <div className="editor-duration-pill">
                  <span className="editor-metric-label">{t('estimatedDuration')}</span>
                  <strong>{estimatedSeconds}{t('sec')}</strong>
                </div>
                <div className="editor-copy-actions">
                  <button
                    className="copy-mini-btn"
                    onClick={handleCopyAllWithTags}
                    title={t('copyAllWithTags')}
                  >
                    {allCopyFeedback ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                    )}
                  </button>
                  <button
                    className="copy-mini-btn"
                    onClick={handleCopyLyricsOnly}
                    title={t('copyLyricsOnly')}
                  >
                    {lyricsOnlyCopyFeedback ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        <path d="M9 13h9"></path>
                      </svg>
                    )}
                  </button>
                </div>
                <button
                  className="editor-save-btn"
                  onClick={handleSaveSnapshot}
                  title={t('saveSnapshot')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                    <polyline points="7 3 7 8 15 8"></polyline>
                  </svg>
                  <span>{language === 'ja' ? '保存' : 'Save'}</span>
                </button>
              </div>
            </div>
          </div>

            {error && <div className="editor-error-banner">{error}</div>}
            {saveToastVisible && (
              <div className="save-toast" role="status" aria-live="polite">
                {t('snapshotSavedToast')}
              </div>
            )}
            {hideToastVisible && (
              <div className="save-toast save-toast-secondary" role="status" aria-live="polite">
                {t('versionHiddenToast')}
              </div>
            )}
  
            <div className="editor-container" ref={editorContainerRef}>
            <div className="editor-shell">
              <div className="editor-main">
                <Editor
                  height="100%"
                  defaultLanguage="plaintext"
                  value={editorValue}
                  onChange={handleEditorChange}
                  onMount={handleEditorMount}
                  theme="vs-dark"
                  options={{
                    automaticLayout: true,
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineHeight: 24,
                    lineNumbers: 'off',
                    wordWrap: 'on',
                    scrollBeyondLastLine: false,
                    renderLineHighlight: 'line',
                    cursorBlinking: 'smooth',
                    readOnly: false,
                    scrollbar: {
                      verticalScrollbarSize: 8,
                      horizontalScrollbarSize: 8,
                      useShadows: false,
                      alwaysConsumeMouseWheel: false,
                    },
                  }}
                />
              </div>
              <div className="line-count-pane" aria-hidden="true">
                <div
                  className="line-counts"
                  style={{ transform: `translateY(-${editorScrollTop}px)` }}
                >
                  {lineCharacterCounts.map((count, index) => (
                    <div key={`${index}-${count}`} className="line-count-row">
                      {count ?? ''}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div
              className="editor-horizontal-resize-handle"
              onMouseDown={handlePhoneticGuideResizeStart}
              role="separator"
              aria-orientation="horizontal"
              aria-label="歌詞入力欄と韻ガイドの高さ調整"
            />
            <div className="phonetic-guide-panel" style={{ height: `${phoneticGuideHeight}px` }}>
              <div className="phonetic-guide-header">
                <h4>{t('rhymeGuide')}</h4>
                <span className="phonetic-guide-source">
                  {t('analysisSource')}: {rhymeGuideSourceLabel}
                </span>
              </div>
              {phoneticGuideRows.length === 0 ? (
                <p className="phonetic-guide-empty">{t('noPhoneticGuide')}</p>
              ) : (
                <div className="phonetic-guide-list">
                  {phoneticGuideRows.map((row, index) => (
                    <div key={`${index}-${row.line}`} className="phonetic-guide-row">
                      <div className="phonetic-line-text">{row.line}</div>
                      <div className="phonetic-spellings">
                        <div className="phonetic-chip">
                          <span className="phonetic-chip-label">{t('romanizedSpelling')}</span>
                          {renderGuideValue(row.romanizedText, phoneticGuideRows[index - 1]?.romanizedText)}
                        </div>
                        <div className="phonetic-chip">
                          <span className="phonetic-chip-label">{t('vowelSpelling')}</span>
                          {renderGuideValue(row.vowelText, phoneticGuideRows[index - 1]?.vowelText)}
                        </div>
                        <div className="phonetic-chip">
                          <span className="phonetic-chip-label">{t('consonantSpelling')}</span>
                          {renderGuideValue(row.consonantText, phoneticGuideRows[index - 1]?.consonantText)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <div
        className="pane-resize-handle"
        onMouseDown={handleRightPaneResizeStart}
        role="separator"
        aria-orientation="vertical"
        aria-label="右ペイン幅の調整"
      />

      <aside ref={rightPaneRef as React.RefObject<HTMLElement>} className="right-stack-pane" style={{ width: `${rightPaneWidth}px`, minWidth: `${rightPaneWidth}px` }}>
        <section className="section-list-pane" style={{ flexBasis: `${sectionPaneHeight}%` }}>
          <div className="section-list-header">
            <h3>{t('sections')}</h3>
            <span className="section-count">{sections.length}</span>
          </div>

          <div className="section-add">
            <div className="section-add-expand">
              {SECTION_PRESETS.map((preset) => (
                <button key={preset} onClick={() => addSection(preset)} className="add-section-btn">
                  {preset}
                </button>
              ))}
              <button onClick={() => addSection('Custom')} className="add-section-btn">Custom</button>
            </div>
          </div>

          <div className="section-list">
            <div
              className={`section-tab section-tab-all ${isAllView ? 'active' : ''}`}
              onClick={() => setActiveSection(EDITOR.ALL_SECTIONS_ID)}
            >
              <div className="section-tab-meta">
                <span className="section-order">ALL</span>
                <span className="section-all-label">ALL</span>
              </div>
            </div>

            {sections.map((s, index) => (
              s.id === draggedSectionId ? (
                <div
                  key={s.id}
                  data-section-id={s.id}
                  className={`section-tab-placeholder ${s.id === dragOverSectionId ? 'drag-over' : ''}`}
                >
                  <span className="section-placeholder-label">Moving {s.displayName}</span>
                </div>
              ) : (
                <div
                  key={s.id}
                  data-section-id={s.id}
                  className={`section-tab ${s.id === activeSection ? 'active' : ''} ${s.id === dragOverSectionId ? 'drag-over' : ''} ${s.id === draggedSectionId ? 'dragging' : ''}`}
                  onClick={() => setActiveSection(s.id)}
                  onPointerDown={(e) => handleSectionPointerDown(s.id, e.clientX, e.clientY)}
                >
                  <div className="section-tab-row">
                    <div className="section-tab-meta">
                      <span className="section-drag-handle">⋮⋮</span>
                      <span className="section-order">{index + 1}</span>
                      <input
                        value={s.displayName}
                        onChange={(e) => renameSection(s.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onPointerDown={(e) => handleSectionPointerDown(s.id, e.clientX, e.clientY)}
                        className="section-name-input"
                      />
                    </div>
                    <div className="section-tab-actions">
                      <button onClick={(e) => { e.stopPropagation(); deleteSection(s.id); }} title="Delete">×</button>
                    </div>
                  </div>
                  {s.bodyText && (
                    <div className="section-preview">{s.bodyText.slice(0, 40)}...</div>
                  )}
                </div>
              )
            ))}
          </div>

          {draggedSectionData && dragPointerPosition && (
            <div
              className="section-drag-preview"
              style={{
                left: dragPointerPosition.x + 20,
                top: dragPointerPosition.y - 8,
              }}
            >
              <div className="section-drag-preview-badge">Moving</div>
              <div className="section-tab-row">
                <div className="section-tab-meta">
                  <span className="section-drag-handle">⋮⋮</span>
                  <span className="section-order">
                    {sections.findIndex((section) => section.id === draggedSectionData.id) + 1}
                  </span>
                  <span className="section-all-label">{draggedSectionData.displayName}</span>
                </div>
              </div>
              {draggedSectionData.bodyText && (
                <div className="section-preview">{draggedSectionData.bodyText.slice(0, 40)}...</div>
              )}
            </div>
          )}
        </section>

        <div
          className="horizontal-resize-handle"
          onMouseDown={handleSectionPaneResizeStart}
          role="separator"
          aria-orientation="horizontal"
          aria-label="セクションとアクションの高さ調整"
        />

        <div className="action-pane-wrapper" style={{ flexBasis: `${100 - sectionPaneHeight}%` }}>
          <ActionPane
            sections={sections}
            activeSectionId={activeSection}
            currentLyrics={editorValue}
            currentStyle={styleText}
            currentVocal={vocalText}
            llmSettings={llmSettings}
            onLLMSettingsChange={setLLMSettings}
          />
        </div>
      </aside>

      <EditorOverlays
        projectId={currentProjectId}
        project={project}
        versions={versions}
        showDeleteDialog={showDeleteDialog}
        showDiffViewer={showDiffViewer}
        showExportPanel={showExportPanel}
        showImportDialog={showImportDialog}
        bodyText={sectionsToBody(sections)}
        onCloseDeleteDialog={() => setShowDeleteDialog(false)}
        onDeleteProject={handleDeleteProject}
        onCloseDiffViewer={() => setShowDiffViewer(false)}
        onRestoreVersion={restoreVersion}
        onCloseExportPanel={() => setShowExportPanel(false)}
        onImportAsFragment={handleImportAsFragment}
        onImportAsBody={handleImportAsBody}
        onCloseImportDialog={() => setShowImportDialog(false)}
      />
    </div>
  );
}

export default EditorPage;
