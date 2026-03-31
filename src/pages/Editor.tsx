import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { getProject, getWorkingDraft, getDraftSections, saveDraft, getVersions, createVersion, deleteProject, Project, LyricVersion, DraftSectionInput, DraftSection } from '../lib/api';
import DiffViewer from '../components/DiffViewer';
import FragmentPanel from '../components/FragmentPanel';
import SongArtifactPanel from '../components/SongArtifactPanel';
import ExportPanel from '../components/ExportPanel';
import LLMSettingsPanel, { LLMSettings } from '../components/LLMSettingsPanel';
import LLMAssistPanel from '../components/LLMAssistPanel';

interface Section {
  id: string;
  type: string;
  displayName: string;
  sortOrder: number;
  bodyText: string;
}

const SECTION_PRESETS = ['Intro', 'Verse', 'Pre-Chorus', 'Chorus', 'Bridge', 'Outro'];

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
  const [llmSettings, setLLMSettings] = useState<LLMSettings>({
    runtime: 'openai_compatible',
    baseUrl: 'http://127.0.0.1:8080',
    model: 'local-model',
    enabled: false,
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
      const [projectData, draftData, versionData] = await Promise.all([
        getProject(pid),
        getWorkingDraft(pid),
        getVersions(pid),
      ]);
      setProject(projectData);
      setVersions(versionData);

      if (draftData) {
        const draftSections = await getDraftSections(draftData.working_draft_id);
        const loadedSections = draftSections.length > 0
          ? mapDraftSections(draftSections)
          : parseBodyToSections(draftData.latest_body_text);

        setSections(loadedSections);
        setActiveSection(loadedSections[0]?.id ?? null);
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

  const parseBodyToSections = (body: string): Section[] => {
    const lines = body.split('\n');
    const result: Section[] = [];
    let currentSection: Section | null = null;
    let currentLines: string[] = [];
    let order = 0;

    for (const line of lines) {
      const headerMatch = line.match(/^\[([^\]]+)\]$/);
      if (headerMatch) {
        if (currentSection) {
          currentSection.bodyText = currentLines.join('\n');
          result.push(currentSection);
        }
        currentSection = {
          id: crypto.randomUUID(),
          type: headerMatch[1],
          displayName: headerMatch[1],
          sortOrder: order++,
          bodyText: '',
        };
        currentLines = [];
      } else {
        currentLines.push(line);
      }
    }

    if (currentSection) {
      currentSection.bodyText = currentLines.join('\n');
      result.push(currentSection);
    }

    return result.length > 0 ? result : [{
      id: crypto.randomUUID(),
      type: 'Verse',
      displayName: 'Verse',
      sortOrder: 0,
      bodyText: body,
    }];
  };

  const sectionsToBody = (secs: Section[]): string => {
    return secs.map(s => `[${s.displayName}]\n${s.bodyText}`).join('\n\n');
  };

  const mapDraftSections = (draftSections: DraftSection[]): Section[] => {
    return draftSections.map((section) => ({
      id: section.draft_section_id,
      type: section.section_type ?? section.display_name,
      displayName: section.display_name,
      sortOrder: section.sort_order,
      bodyText: section.body_text,
    }));
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
    const newSection: Section = {
      id: crypto.randomUUID(),
      type,
      displayName: type,
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
      const version = await createVersion({
        project_id: projectId,
        snapshot_name: snapshotName || new Date().toLocaleString('ja-JP'),
        body_text: body,
        note: snapshotNote || undefined,
        parent_lyric_version_id: versions[0]?.lyric_version_id,
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
      setActiveSection(parsed[0].id);
    }
    await handleAutoSave(parsed);
  };

  const copyToClipboard = (format: 'full' | 'section') => {
    let text = '';
    if (format === 'full') {
      text = sectionsToBody(sections);
    } else {
      const section = sections.find(s => s.id === activeSection);
      text = section?.bodyText || '';
    }
    navigator.clipboard.writeText(text);
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

  if (loading) {
    return <div className="editor-workspace"><p className="loading">Loading...</p></div>;
  }

  if (!project) {
    return <div className="editor-workspace"><p className="error">Project not found</p></div>;
  }

  const activeSectionData = sections.find(s => s.id === activeSection);

  return (
    <div className="editor-workspace">
      {/* Left Pane - Version Tree */}
      <aside className="left-pane">
        <div className="pane-header">
          <h3>Versions</h3>
          {saving && <span className="saving-badge">Saving...</span>}
          {lastSaved && <span className="saved-badge">Saved {lastSaved.toLocaleTimeString()}</span>}
        </div>

        <div className="project-info">
          <span className="project-title">{project.title}</span>
        </div>

        <div className="version-tree">
          <div className="version-item active">
            <span className="version-name">Working Draft</span>
            <span className="version-label">(editing)</span>
          </div>
          {versions.map((v) => (
            <div key={v.lyric_version_id} className="version-item">
              <span className="version-name">{v.snapshot_name}</span>
              <button className="restore-btn" onClick={() => restoreVersion(v)}>Restore</button>
            </div>
          ))}
        </div>

        <div className="pane-actions">
          <button onClick={() => setShowDiffViewer(true)} className="secondary-btn">
            📊 Compare Versions
          </button>
          <button onClick={() => setShowDeleteDialog(true)} className="danger-btn">Delete Project</button>
        </div>
      </aside>

      {/* Center Pane - Editor */}
      <main className="center-pane">
        {/* Section Tabs */}
        <div className="section-tabs">
          {sections.map((s) => (
            <div
              key={s.id}
              className={`section-tab ${s.id === activeSection ? 'active' : ''}`}
              onClick={() => setActiveSection(s.id)}
            >
              <input
                value={s.displayName}
                onChange={(e) => renameSection(s.id, e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="section-name-input"
              />
              <div className="section-tab-actions">
                <button onClick={(e) => { e.stopPropagation(); moveSection(s.id, 'up'); }}>↑</button>
                <button onClick={(e) => { e.stopPropagation(); moveSection(s.id, 'down'); }}>↓</button>
                <button onClick={(e) => { e.stopPropagation(); deleteSection(s.id); }}>×</button>
              </div>
            </div>
          ))}
          <div className="section-add">
            {SECTION_PRESETS.map((preset) => (
              <button key={preset} onClick={() => addSection(preset)} className="add-section-btn">
                +{preset}
              </button>
            ))}
            <button onClick={() => addSection('Custom')} className="add-section-btn">+Custom</button>
          </div>
        </div>

        {/* Monaco Editor */}
        <div className="editor-container">
          <Editor
            height="100%"
            defaultLanguage="plaintext"
            value={activeSectionData?.bodyText || ''}
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
            }}
          />
        </div>
      </main>

      {/* Right Pane - Actions */}
      <aside className="right-pane">
        <h3>Actions</h3>

        <button onClick={() => setShowSaveDialog(true)} className="primary-btn">
          💾 Save Snapshot
        </button>

        <div className="copy-actions">
          <button onClick={() => copyToClipboard('full')}>Copy All</button>
          <button onClick={() => copyToClipboard('section')}>Copy Section</button>
        </div>

        <button onClick={() => setShowExportPanel(true)} className="secondary-btn">
          📤 Quick Export
        </button>

        <button
          onClick={() => setShowFragmentPanel(!showFragmentPanel)}
          className={showFragmentPanel ? 'active-toggle' : ''}
        >
          📝 Fragments {showFragmentPanel ? '▼' : '▶'}
        </button>

        {showFragmentPanel && projectId && (
          <FragmentPanel projectId={projectId} onInsert={insertFragment} />
        )}

        <button
          onClick={() => setShowSongPanel(!showSongPanel)}
          className={showSongPanel ? 'active-toggle' : ''}
        >
          🎵 Song Links {showSongPanel ? '▼' : '▶'}
        </button>

        {showSongPanel && projectId && (
          <SongArtifactPanel projectId={projectId} versions={versions} />
        )}

        <LLMSettingsPanel onSettingsChange={setLLMSettings} />

        <LLMAssistPanel
          runtime={llmSettings.runtime}
          baseUrl={llmSettings.baseUrl}
          model={llmSettings.model}
          enabled={llmSettings.enabled}
          onInsert={insertFragment}
        />

        <div className="project-settings">
          <h4>Project Settings</h4>
          <label>
            Title:
            <input
              value={project.title}
              onChange={() => {/* TODO: update project */}}
              readOnly
            />
          </label>
        </div>

        {error && <p className="error">{error}</p>}
      </aside>

      {/* Save Snapshot Dialog */}
      {showSaveDialog && (
        <div className="dialog-overlay">
          <div className="dialog">
            <h3>Save Snapshot</h3>
            <input
              type="text"
              placeholder="Snapshot name"
              value={snapshotName}
              onChange={(e) => setSnapshotName(e.target.value)}
            />
            <textarea
              placeholder="Note (optional)"
              value={snapshotNote}
              onChange={(e) => setSnapshotNote(e.target.value)}
            />
            <div className="dialog-buttons">
              <button onClick={() => setShowSaveDialog(false)}>Cancel</button>
              <button onClick={handleSaveSnapshot} className="primary">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      {showDeleteDialog && (
        <div className="dialog-overlay">
          <div className="dialog">
            <h3>Delete Project?</h3>
            <p>Are you sure you want to delete "{project.title}"?</p>
            <p className="warning">This action can be undone from the deleted items.</p>
            <div className="dialog-buttons">
              <button onClick={() => setShowDeleteDialog(false)}>Cancel</button>
              <button onClick={handleDeleteProject} className="danger">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Diff Viewer Modal */}
      {showDiffViewer && (
        <div className="modal-overlay">
          <DiffViewer
            versions={versions}
            onClose={() => setShowDiffViewer(false)}
          />
        </div>
      )}

      {/* Export Panel */}
      {showExportPanel && project && (
        <ExportPanel
          project={project}
          versions={versions}
          bodyText={sectionsToBody(sections)}
          onClose={() => setShowExportPanel(false)}
        />
      )}
    </div>
  );
}

export default EditorPage;
