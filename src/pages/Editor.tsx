import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { getProject, getWorkingDraft, getDraftSections, saveDraft, getVersions, createVersion, deleteProject, getFragments, createFragment, Project, LyricVersion, DraftSectionInput, VersionSectionInput } from '../lib/api';
import { useLLMSettings } from '../lib/llm';
import { useLanguage } from '../lib/LanguageContext';
import { useProject } from '../lib/ProjectContext';
import { usePaneResize, useKeyboardShortcuts, createEditorShortcuts } from '../lib/hooks';
import { EDITOR, SECTION_PRESETS } from '../lib/config';
import ActionPane from './editor/ActionPane';
import EditorOverlays from './editor/EditorOverlays';
import { Section, mapDraftSections, parseBodyToSections, sectionsToBody, generateUniqueSectionName } from './editor/sectionUtils';
import VersionPane from './editor/VersionPane';

const BPM_PRESETS = [172, 144, 132, 128, 124, 122, 121, 120, 92, 90];

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
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDiffViewer, setShowDiffViewer] = useState(false);
  const [showExportPanel, setShowExportPanel] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [selectedVersionForNotes, setSelectedVersionForNotes] = useState<LyricVersion | null>(null);
  const [fragments, setFragments] = useState<Array<{ collected_fragment_id: string; text: string; source?: string; status: string }>>([]);
  const { settings: llmSettings, updateSettings: setLLMSettings } = useLLMSettings();
  const [snapshotName, setSnapshotName] = useState('');
  const [snapshotNote, setSnapshotNote] = useState('');
  const [styleText, setStyleText] = useState('');
  const [vocalText, setVocalText] = useState('');
  const [allViewText, setAllViewText] = useState('');
  const [editorScrollTop, setEditorScrollTop] = useState(0);
  const [bpmMode, setBpmMode] = useState<'preset' | 'custom'>('preset');
  const [bpmValue, setBpmValue] = useState(120);
  const [draggedSectionId, setDraggedSectionId] = useState<string | null>(null);
  const [dragOverSectionId, setDragOverSectionId] = useState<string | null>(null);
  const [dragPointerPosition, setDragPointerPosition] = useState<{ x: number; y: number } | null>(null);
  const [phoneticGuideHeight, setPhoneticGuideHeight] = useState(220);
  const pointerDragStartRef = useRef<{ sectionId: string; x: number; y: number } | null>(null);
  const activePointerDragRef = useRef<string | null>(null);
  const editorContainerRef = useRef<HTMLDivElement | null>(null);
  const isResizingPhoneticGuideRef = useRef(false);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editorInstanceRef = useRef<{
    onDidScrollChange: (callback: (event: { scrollTop: number }) => void) => { dispose: () => void };
  } | null>(null);
  const editorScrollDisposeRef = useRef<{ dispose: () => void } | null>(null);

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
      onSave: () => setShowSaveDialog(true),
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
      } else {
        setSections([]);
        setAllViewText('');
        setActiveSection(null);
        setStyleText('');
        setVocalText('');
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
  }, [projectId, saving, styleText, vocalText]);

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

  const finishSectionReorder = useCallback((sourceId: string, targetId: string | null) => {
    if (!targetId || sourceId === targetId) {
      setDraggedSectionId(null);
      setDragOverSectionId(null);
      activePointerDragRef.current = null;
      return;
    }

    const draggedIdx = sections.findIndex((s) => s.id === sourceId);
    const targetIdx = sections.findIndex((s) => s.id === targetId);
    if (draggedIdx < 0 || targetIdx < 0) {
      setDraggedSectionId(null);
      setDragOverSectionId(null);
      activePointerDragRef.current = null;
      return;
    }

    updateSections((currentSections) => {
      const nextSections = [...currentSections];
      const [draggedSection] = nextSections.splice(draggedIdx, 1);
      nextSections.splice(targetIdx, 0, draggedSection);
      return nextSections.map((section, order) => ({ ...section, sortOrder: order }));
    });

    setDraggedSectionId(null);
    setDragOverSectionId(null);
    activePointerDragRef.current = null;
  }, [sections, updateSections]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!pointerDragStartRef.current) return;

      const { sectionId, x, y } = pointerDragStartRef.current;
      const movedEnough = Math.abs(event.clientX - x) > 6 || Math.abs(event.clientY - y) > 6;

      if (!activePointerDragRef.current && movedEnough) {
        activePointerDragRef.current = sectionId;
        setDraggedSectionId(sectionId);
        setDragPointerPosition({ x: event.clientX, y: event.clientY });
        document.body.classList.add('section-reorder-active');
      }

      if (!activePointerDragRef.current) return;
      setDragPointerPosition({ x: event.clientX, y: event.clientY });

      const element = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null;
      const sectionTab = element?.closest('[data-section-id]') as HTMLElement | null;
      const targetId = sectionTab?.dataset.sectionId ?? null;
      setDragOverSectionId(targetId);
    };

    const handlePointerUp = () => {
      const sourceId = activePointerDragRef.current;
      const targetId = dragOverSectionId;

      pointerDragStartRef.current = null;
      document.body.classList.remove('section-reorder-active');

      if (!sourceId) {
        setDraggedSectionId(null);
        setDragOverSectionId(null);
        setDragPointerPosition(null);
        return;
      }

      finishSectionReorder(sourceId, targetId);
    };

    const handlePointerCancel = () => {
      pointerDragStartRef.current = null;
      activePointerDragRef.current = null;
      setDraggedSectionId(null);
      setDragOverSectionId(null);
      setDragPointerPosition(null);
      document.body.classList.remove('section-reorder-active');
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerCancel);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerCancel);
      document.body.classList.remove('section-reorder-active');
    };
  }, [dragOverSectionId, finishSectionReorder]);

  const handleSectionPointerDown = (e: React.PointerEvent, sectionId: string) => {
    if (e.button !== 0) return;

    const target = e.target as HTMLElement;
    if (target.closest('.section-tab-actions button')) {
      return;
    }

    pointerDragStartRef.current = {
      sectionId,
      x: e.clientX,
      y: e.clientY,
    };
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
        snapshot_name: snapshotName || new Date().toLocaleString('ja-JP'),
        body_text: body,
        style_text: styleText || undefined,
        vocal_text: vocalText || undefined,
        note: snapshotNote || undefined,
        parent_lyric_version_id: versions[0]?.lyric_version_id,
        sections: sectionInputs,
      });
      setVersions([version, ...versions]);
      setShowSaveDialog(false);
      setSnapshotName('');
      setSnapshotNote('');
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

  const restoreVersion = async (version: LyricVersion) => {
    const parsed = parseBodyToSections(version.body_text);
    const nextStyleText = version.style_text || '';
    const nextVocalText = version.vocal_text || '';
    setSections(parsed);
    setAllViewText(version.body_text);
    setStyleText(nextStyleText);
    setVocalText(nextVocalText);
    if (parsed.length > 0) {
      setActiveSection(EDITOR.ALL_SECTIONS_ID);
    }
    await handleAutoSave(parsed, { styleText: nextStyleText, vocalText: nextVocalText });
  };

  const insertFragment = (text: string) => {
    updateSections((currentSections) => {
      const updatedSections = [...currentSections];
      const activeIdx = updatedSections.findIndex(s => s.id === activeSection);
      if (activeIdx >= 0) {
        const current = updatedSections[activeIdx];
        updatedSections[activeIdx] = {
          ...current,
          bodyText: current.bodyText + (current.bodyText ? '\n' : '') + text,
        };
      }
      return updatedSections;
    });
  };

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
    return lines.map((line) => {
      if (/^\[[^\]]+\]$/.test(line.trim())) {
        return null;
      }
      return [...line].length;
    });
  }, [editorValue]);

  const phoneticGuideRows = useMemo(() => {
    const latinVowels = new Set(['a', 'e', 'i', 'o', 'u', 'y']);

    const kanaRomajiMap: Record<string, string> = {
      あ: 'a', い: 'i', う: 'u', え: 'e', お: 'o',
      か: 'ka', き: 'ki', く: 'ku', け: 'ke', こ: 'ko',
      さ: 'sa', し: 'shi', す: 'su', せ: 'se', そ: 'so',
      た: 'ta', ち: 'chi', つ: 'tsu', て: 'te', と: 'to',
      な: 'na', に: 'ni', ぬ: 'nu', ね: 'ne', の: 'no',
      は: 'ha', ひ: 'hi', ふ: 'fu', へ: 'he', ほ: 'ho',
      ま: 'ma', み: 'mi', む: 'mu', め: 'me', も: 'mo',
      や: 'ya', ゆ: 'yu', よ: 'yo',
      ら: 'ra', り: 'ri', る: 'ru', れ: 're', ろ: 'ro',
      わ: 'wa', を: 'o', ん: 'n',
      が: 'ga', ぎ: 'gi', ぐ: 'gu', げ: 'ge', ご: 'go',
      ざ: 'za', じ: 'ji', ず: 'zu', ぜ: 'ze', ぞ: 'zo',
      だ: 'da', ぢ: 'ji', づ: 'zu', で: 'de', ど: 'do',
      ば: 'ba', び: 'bi', ぶ: 'bu', べ: 'be', ぼ: 'bo',
      ぱ: 'pa', ぴ: 'pi', ぷ: 'pu', ぺ: 'pe', ぽ: 'po',
      ぁ: 'a', ぃ: 'i', ぅ: 'u', ぇ: 'e', ぉ: 'o',
      ゔ: 'vu',
    };

    const digraphMap: Record<string, string> = {
      きゃ: 'kya', きゅ: 'kyu', きょ: 'kyo',
      しゃ: 'sha', しゅ: 'shu', しょ: 'sho',
      ちゃ: 'cha', ちゅ: 'chu', ちょ: 'cho',
      にゃ: 'nya', にゅ: 'nyu', にょ: 'nyo',
      ひゃ: 'hya', ひゅ: 'hyu', ひょ: 'hyo',
      みゃ: 'mya', みゅ: 'myu', みょ: 'myo',
      りゃ: 'rya', りゅ: 'ryu', りょ: 'ryo',
      ぎゃ: 'gya', ぎゅ: 'gyu', ぎょ: 'gyo',
      じゃ: 'ja', じゅ: 'ju', じょ: 'jo',
      ぢゃ: 'ja', ぢゅ: 'ju', ぢょ: 'jo',
      びゃ: 'bya', びゅ: 'byu', びょ: 'byo',
      ぴゃ: 'pya', ぴゅ: 'pyu', ぴょ: 'pyo',
      うぁ: 'wa', うぃ: 'wi', うぇ: 'we', うぉ: 'wo',
      ふぁ: 'fa', ふぃ: 'fi', ふぇ: 'fe', ふぉ: 'fo',
      てぃ: 'ti', でぃ: 'di',
      とぅ: 'tu', どぅ: 'du',
      ゔぁ: 'va', ゔぃ: 'vi', ゔぇ: 've', ゔぉ: 'vo',
    };

    const katakanaToHiragana = (value: string) =>
      value.replace(/[\u30a1-\u30f6]/g, (char) =>
        String.fromCharCode(char.charCodeAt(0) - 0x60),
      );

    const splitRomanized = (romaji: string) => {
      const letters = romaji.toLowerCase().replace(/[^a-z]/g, '');
      if (!letters) {
        return null;
      }

      let vowelPart = '';
      let consonantPart = '';

      for (const char of letters) {
        if (latinVowels.has(char)) {
          vowelPart += char;
        } else {
          consonantPart += char;
        }
      }

      return {
        romanized: letters,
        vowels: vowelPart || '—',
        consonants: consonantPart || '—',
      };
    };

    const toRomanizedTokens = (line: string) => {
      const normalizedLine = katakanaToHiragana(line.toLowerCase());
      const tokens: string[] = [];
      let index = 0;

      while (index < normalizedLine.length) {
        const current = normalizedLine[index];
        const next = normalizedLine[index + 1] ?? '';
        const pair = `${current}${next}`;

        if (/\s/.test(current)) {
          if (tokens[tokens.length - 1] !== '|') {
            tokens.push('|');
          }
          index += 1;
          continue;
        }

        if (current === 'っ') {
          const lookaheadPair = `${next}${normalizedLine[index + 2] ?? ''}`;
          const nextRomaji = digraphMap[lookaheadPair] || kanaRomajiMap[next] || '';
          if (nextRomaji) {
            tokens.push(nextRomaji[0]);
          }
          index += 1;
          continue;
        }

        if (current === 'ー') {
          const prev = tokens[tokens.length - 1] ?? '';
          const prevVowelMatch = prev.match(/[aeiou]$/);
          if (prevVowelMatch) {
            tokens.push(prevVowelMatch[0]);
          }
          index += 1;
          continue;
        }

        if (digraphMap[pair]) {
          tokens.push(digraphMap[pair]);
          index += 2;
          continue;
        }

        if (kanaRomajiMap[current]) {
          tokens.push(kanaRomajiMap[current]);
          index += 1;
          continue;
        }

        if (/[a-z]/.test(current)) {
          let latinWord = current;
          let j = index + 1;
          while (j < normalizedLine.length && /[a-z]/.test(normalizedLine[j])) {
            latinWord += normalizedLine[j];
            j += 1;
          }
          tokens.push(latinWord);
          index = j;
          continue;
        }

        index += 1;
      }

      return tokens;
    };

    const toGuide = (line: string) => {
      const rawTokens = toRomanizedTokens(line);
      const guideTokens = rawTokens
        .map((token) => {
          if (token === '|') {
            return { romanized: '|', vowels: '|', consonants: '|' };
          }
          return splitRomanized(token);
        })
        .filter((token): token is { romanized: string; vowels: string; consonants: string } => Boolean(token));

      if (guideTokens.length === 0) {
        return null;
      }

      const normalizePipeSpacing = (value: string) =>
        value.replace(/\s*\|\s*/g, ' | ').trim().replace(/^\|\s*|\s*\|$/g, '');

      const romanizedText = normalizePipeSpacing(guideTokens.map((token) => token.romanized).join(' '));
      const vowelText = normalizePipeSpacing(guideTokens.map((token) => token.vowels).join(' '));
      const consonantText = normalizePipeSpacing(guideTokens.map((token) => token.consonants).join(' '));

      return {
        line,
        romanizedText: romanizedText || '—',
        vowelText: vowelText || '—',
        consonantText: consonantText || '—',
      };
    };

    return editorValue
      .split('\n')
      .filter((line) => line.trim().length > 0 && !/^\[[^\]]+\]$/.test(line.trim()))
      .map(toGuide)
      .filter((row): row is NonNullable<typeof row> => Boolean(row));
  }, [editorValue]);

  const totalLyricChars = useMemo(() => {
    const lines = editorValue.split('\n');
    return lines.reduce((sum, line) => {
      if (/^\[[^\]]+\]$/.test(line.trim())) {
        return sum;
      }
      return sum + [...line].length;
    }, 0);
  }, [editorValue]);

  const estimatedSeconds = useMemo(() => {
    if (bpmValue <= 0) return 0;
    return Math.max(0, Math.round((totalLyricChars * 60) / bpmValue));
  }, [bpmValue, totalLyricChars]);

  const handleEditorMount = useCallback((editorInstance: {
    onDidScrollChange: (callback: (event: { scrollTop: number }) => void) => { dispose: () => void };
  }) => {
    editorScrollDisposeRef.current?.dispose();
    editorInstanceRef.current = editorInstance;
    editorScrollDisposeRef.current = editorInstance.onDidScrollChange((event) => {
      setEditorScrollTop(event.scrollTop);
    });
  }, []);

  if (loading) {
    return <div className="editor-workspace"><p className="loading">{t('loadingProject')}</p></div>;
  }

  if (!project) {
    return <div className="editor-workspace"><p className="error">{t('projectNotFound')}</p></div>;
  }

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
            onOpenNotes={setSelectedVersionForNotes}
            onRestoreVersion={restoreVersion}
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
                    onChange={(e) => {
                      if (e.target.value === 'custom') {
                        setBpmMode('custom');
                        return;
                      }
                      setBpmMode('preset');
                      setBpmValue(Number(e.target.value));
                    }}
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
                      onChange={(e) => setBpmValue(Math.max(40, Number(e.target.value) || 120))}
                      className="editor-bpm-input"
                    />
                  )}
                </div>
                <div className="editor-duration-pill">
                  <span className="editor-metric-label">{t('estimatedDuration')}</span>
                  <strong>{estimatedSeconds}{t('sec')}</strong>
                </div>
                <button
                  className="editor-save-btn"
                  onClick={() => setShowSaveDialog(true)}
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
                          <span className="phonetic-chip-value">{row.romanizedText}</span>
                        </div>
                        <div className="phonetic-chip">
                          <span className="phonetic-chip-label">{t('vowelSpelling')}</span>
                          <span className="phonetic-chip-value">{row.vowelText}</span>
                        </div>
                        <div className="phonetic-chip">
                          <span className="phonetic-chip-label">{t('consonantSpelling')}</span>
                          <span className="phonetic-chip-value">{row.consonantText}</span>
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
                  onPointerDown={(e) => handleSectionPointerDown(e, s.id)}
                >
                  <div className="section-tab-row">
                    <div className="section-tab-meta">
                      <span className="section-drag-handle">⋮⋮</span>
                      <span className="section-order">{index + 1}</span>
                      <input
                        value={s.displayName}
                        onChange={(e) => renameSection(s.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onPointerDown={(e) => handleSectionPointerDown(e, s.id)}
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
            project={project}
            projectId={currentProjectId}
            sections={sections}
            activeSectionId={activeSection}
            versions={versions}
            fragments={fragments}
            llmSettings={llmSettings}
            onSetShowSaveDialog={setShowSaveDialog}
            onJumpToVersion={(versionId) => {
              const version = versions.find((entry) => entry.lyric_version_id === versionId);
              if (version) {
                restoreVersion(version);
              }
            }}
            onInsertFragment={insertFragment}
            onLLMSettingsChange={setLLMSettings}
          />
        </div>
      </aside>

      <EditorOverlays
        projectId={currentProjectId}
        project={project}
        versions={versions}
        selectedVersionForNotes={selectedVersionForNotes}
        showSaveDialog={showSaveDialog}
        showDeleteDialog={showDeleteDialog}
        showDiffViewer={showDiffViewer}
        showExportPanel={showExportPanel}
        showImportDialog={showImportDialog}
        snapshotName={snapshotName}
        snapshotNote={snapshotNote}
        bodyText={sectionsToBody(sections)}
        onSnapshotNameChange={setSnapshotName}
        onSnapshotNoteChange={setSnapshotNote}
        onCloseSaveDialog={() => setShowSaveDialog(false)}
        onSaveSnapshot={handleSaveSnapshot}
        onCloseDeleteDialog={() => setShowDeleteDialog(false)}
        onDeleteProject={handleDeleteProject}
        onCloseDiffViewer={() => setShowDiffViewer(false)}
        onRestoreVersion={restoreVersion}
        onCloseExportPanel={() => setShowExportPanel(false)}
        onImportAsFragment={handleImportAsFragment}
        onImportAsBody={handleImportAsBody}
        onCloseImportDialog={() => setShowImportDialog(false)}
        onCloseRevisionNotes={() => setSelectedVersionForNotes(null)}
      />
    </div>
  );
}

export default EditorPage;
