import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { getProject, getWorkingDraft, getDraftSections, saveDraft, getVersions, createVersion, deleteVersion, deleteProject, getFragments, createFragment, Project, LyricVersion, DraftSectionInput, VersionSectionInput } from '../lib/api';
import { LLMSettings } from '../components/LLMSettingsPanel';
import ActionPane from './editor/ActionPane';
import EditorOverlays from './editor/EditorOverlays';
import { Section, SECTION_PRESETS, mapDraftSections, parseBodyToSections, sectionsToBody, generateUniqueSectionName } from './editor/sectionUtils';
import VersionPane from './editor/VersionPane';

const ALL_SECTIONS_ID = '__all__';

function EditorPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [versions, setVersions] = useState<LyricVersion[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDiffViewer, setShowDiffViewer] = useState(false);
  const [showFragmentPanel, setShowFragmentPanel] = useState(false);
  const [showSongPanel, setShowSongPanel] = useState(false);
  const [showExportPanel, setShowExportPanel] = useState(false);
  const [showSearchPanel, setShowSearchPanel] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [selectedVersionForNotes, setSelectedVersionForNotes] = useState<LyricVersion | null>(null);
  const [fragments, setFragments] = useState<Array<{ collected_fragment_id: string; text: string; source?: string; status: string }>>([]);
  const [llmSettings, setLLMSettings] = useState<LLMSettings>({
    runtime: 'openai_compatible',
    baseUrl: 'http://127.0.0.1:8080',
    model: 'local-model',
    modelPath: 'C:\\Users\\ryo-n\\LLM model\\unsloth\\Qwen3.5-27B-GGUF',
    enabled: false,
    timeoutMs: 60000,
    maxTokens: 1024,
    temperature: 0.7,
  });
  const [snapshotName, setSnapshotName] = useState('');
  const [snapshotNote, setSnapshotNote] = useState('');

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    };
  }, []);

  const loadData = async (pid: string) => {
    try {
      setLoading(true);
      const [projectData, draftData, versionData, fragmentData] = await Promise.all([
        getProject(pid),
        getWorkingDraft(pid),
        getVersions(pid),
        getFragments(pid),
      ]);
      setProject(projectData);
      setVersions(versionData);
      setFragments(fragmentData);

      if (draftData) {
        const draftSections = await getDraftSections(draftData.working_draft_id);
        const loadedSections = draftSections.length > 0
          ? mapDraftSections(draftSections)
          : parseBodyToSections(draftData.latest_body_text);

        setSections(loadedSections);
        setActiveSection(loadedSections.length > 0 ? ALL_SECTIONS_ID : null);
      } else {
        setSections([]);
        setActiveSection(null);
      }

      setError(null);
    } catch (e) {
      setError('Failed to load project');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoSave = useCallback(async (secs: Section[]) => {
    if (!projectId || saving) return;

    try {
      setSaving(true);
      const body = sectionsToBody(secs);
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
      });
      setLastSaved(new Date());
      setError(null);
    } catch (e) {
      setError('Auto-save failed');
      console.error(e);
    } finally {
      setSaving(false);
    }
  }, [projectId, saving]);

  const queueAutoSave = useCallback((secs: Section[]) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      handleAutoSave(secs);
    }, 1000);
  }, [handleAutoSave]);

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

  const moveSection = (id: string, direction: 'up' | 'down') => {
    const idx = sections.findIndex(s => s.id === id);
    if (idx < 0) return;

    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= sections.length) return;

    updateSections((currentSections) => {
      const nextSections = [...currentSections];
      [nextSections[idx], nextSections[newIdx]] = [nextSections[newIdx], nextSections[idx]];
      return nextSections.map((section, order) => ({ ...section, sortOrder: order }));
    });
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
    setSections(parsed);
    if (parsed.length > 0) {
      setActiveSection(ALL_SECTIONS_ID);
    }
    await handleAutoSave(parsed);
  };

  const handleDeleteVersion = async (version: LyricVersion) => {
    if (!confirm(`Delete version "${version.snapshot_name}"? It can be restored from deleted items.`)) return;

    try {
      await deleteVersion(version.lyric_version_id);
      setVersions(versions.filter(v => v.lyric_version_id !== version.lyric_version_id));
    } catch (e) {
      setError('Failed to delete version');
      console.error(e);
    }
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
    if (parsed.length > 0) {
      setActiveSection(ALL_SECTIONS_ID);
    }
  };

  const handleCopyNotify = () => {
    // Optional: show notification
  };

  if (loading) {
    return <div className="editor-workspace"><p className="loading">Loading...</p></div>;
  }

  if (!project) {
    return <div className="editor-workspace"><p className="error">Project not found</p></div>;
  }

  const currentProjectId = projectId ?? '';
  const activeSectionData = sections.find(s => s.id === activeSection);
  const isAllView = activeSection === ALL_SECTIONS_ID;
  const editorValue = isAllView ? sectionsToBody(sections) : (activeSectionData?.bodyText || '');

  return (
    <div className="editor-workspace">
      <VersionPane
        projectTitle={project.title}
        versions={versions}
        saving={saving}
        lastSaved={lastSaved}
        onOpenNotes={setSelectedVersionForNotes}
        onRestoreVersion={restoreVersion}
        onDeleteVersion={handleDeleteVersion}
        onShowDiff={() => setShowDiffViewer(true)}
        onShowDelete={() => setShowDeleteDialog(true)}
      />

      {/* Center Pane - Editor */}
      <main className="center-pane">
        <div className="editor-pane">
          <div className="editor-pane-header">
            <div>
              <p className="editor-pane-label">Working Draft</p>
              <h2>{isAllView ? 'All Lyrics' : (activeSectionData?.displayName || 'No section selected')}</h2>
            </div>
            <span className="editor-pane-hint">
              {isAllView
                ? '全文をまとめて確認できます。個別編集は右上のセクション一覧から行います。'
                : '中央で本文を編集しながら、右上でセクションを一覧できます。'}
            </span>
          </div>

          <div className="editor-container">
            <Editor
              height="100%"
              defaultLanguage="plaintext"
              value={editorValue}
              onChange={handleEditorChange}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'off',
                wordWrap: 'on',
                scrollBeyondLastLine: false,
                renderLineHighlight: 'line',
                cursorBlinking: 'smooth',
                readOnly: isAllView,
                scrollbar: {
                  verticalScrollbarSize: 8,
                  horizontalScrollbarSize: 8,
                  useShadows: false,
                  alwaysConsumeMouseWheel: false,
                },
              }}
            />
          </div>
        </div>
      </main>

      <aside className="right-stack-pane">
        <section className="section-list-pane">
          <div className="section-list-header">
            <h3>Sections</h3>
            <span className="section-count">{sections.length}</span>
          </div>

          <div className="section-add section-add-inline">
            {SECTION_PRESETS.map((preset) => (
              <button key={preset} onClick={() => addSection(preset)} className="add-section-btn">
                +{preset}
              </button>
            ))}
            <button onClick={() => addSection('Custom')} className="add-section-btn">+Custom</button>
          </div>

          <div className="section-list">
            <div
              className={`section-tab section-tab-all ${isAllView ? 'active' : ''}`}
              onClick={() => setActiveSection(ALL_SECTIONS_ID)}
            >
              <div className="section-tab-meta">
                <span className="section-order">All</span>
                <span className="section-all-label">全文プレビュー</span>
              </div>
            </div>

            {sections.map((s, index) => (
              <div
                key={s.id}
                className={`section-tab ${s.id === activeSection ? 'active' : ''}`}
                onClick={() => setActiveSection(s.id)}
              >
                <div className="section-tab-meta">
                  <span className="section-order">{index + 1}</span>
                  <input
                    value={s.displayName}
                    onChange={(e) => renameSection(s.id, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="section-name-input"
                  />
                </div>
                <div className="section-tab-actions">
                  <button onClick={(e) => { e.stopPropagation(); moveSection(s.id, 'up'); }}>↑</button>
                  <button onClick={(e) => { e.stopPropagation(); moveSection(s.id, 'down'); }}>↓</button>
                  <button onClick={(e) => { e.stopPropagation(); deleteSection(s.id); }}>×</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <ActionPane
          project={project}
          projectId={currentProjectId}
          sections={sections}
          activeSectionId={activeSection}
          versions={versions}
          fragments={fragments}
          llmSettings={llmSettings}
          showSearchPanel={showSearchPanel}
          showFragmentPanel={showFragmentPanel}
          showSongPanel={showSongPanel}
          error={error}
          onSetShowSaveDialog={setShowSaveDialog}
          onCopyNotify={handleCopyNotify}
          onSetShowExportPanel={setShowExportPanel}
          onSetShowImportDialog={setShowImportDialog}
          onToggleSearchPanel={() => setShowSearchPanel(!showSearchPanel)}
          onToggleFragmentPanel={() => setShowFragmentPanel(!showFragmentPanel)}
          onToggleSongPanel={() => setShowSongPanel(!showSongPanel)}
          onJumpToVersion={(versionId) => {
            const version = versions.find((entry) => entry.lyric_version_id === versionId);
            if (version) {
              restoreVersion(version);
            }
          }}
          onInsertFragment={insertFragment}
          onLLMSettingsChange={setLLMSettings}
        />
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
