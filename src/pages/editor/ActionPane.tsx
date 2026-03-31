import CopyOptionsPanel from '../../components/CopyOptionsPanel';
import FragmentPanel from '../../components/FragmentPanel';
import LLMAssistPanel from '../../components/LLMAssistPanel';
import LLMSettingsPanel, { LLMSettings } from '../../components/LLMSettingsPanel';
import SearchPanel from '../../components/SearchPanel';
import SongArtifactPanel from '../../components/SongArtifactPanel';
import StyleProfilePanel from '../../components/StyleProfilePanel';
import { LyricVersion, Project } from '../../lib/api';
import { Section, sectionsToBody } from './sectionUtils';

interface FragmentSummary {
  collected_fragment_id: string;
  text: string;
  source?: string;
  status: string;
}

interface ActionPaneProps {
  project: Project;
  projectId: string;
  sections: Section[];
  activeSectionId: string | null;
  versions: LyricVersion[];
  fragments: FragmentSummary[];
  llmSettings: LLMSettings;
  showSearchPanel: boolean;
  showFragmentPanel: boolean;
  showSongPanel: boolean;
  error: string | null;
  onSetShowSaveDialog: (value: boolean) => void;
  onCopyNotify: () => void;
  onSetShowExportPanel: (value: boolean) => void;
  onSetShowImportDialog: (value: boolean) => void;
  onToggleSearchPanel: () => void;
  onToggleFragmentPanel: () => void;
  onToggleSongPanel: () => void;
  onJumpToVersion: (versionId: string) => void;
  onInsertFragment: (text: string) => void;
  onLLMSettingsChange: (settings: LLMSettings) => void;
}

function ActionPane({
  project,
  projectId,
  sections,
  activeSectionId,
  versions,
  fragments,
  llmSettings,
  showSearchPanel,
  showFragmentPanel,
  showSongPanel,
  error,
  onSetShowSaveDialog,
  onCopyNotify,
  onSetShowExportPanel,
  onSetShowImportDialog,
  onToggleSearchPanel,
  onToggleFragmentPanel,
  onToggleSongPanel,
  onJumpToVersion,
  onInsertFragment,
  onLLMSettingsChange,
}: ActionPaneProps) {
  return (
    <aside className="right-pane">
      <h3>Actions</h3>

      <button onClick={() => onSetShowSaveDialog(true)} className="primary-btn">
        💾 Save Snapshot
      </button>

      <CopyOptionsPanel
        sections={sections}
        activeSectionId={activeSectionId}
        onCopy={onCopyNotify}
      />

      <button onClick={() => onSetShowExportPanel(true)} className="secondary-btn">
        📤 Quick Export
      </button>

      <button onClick={() => onSetShowImportDialog(true)} className="secondary-btn">
        📥 Import .txt
      </button>

      <button
        onClick={onToggleSearchPanel}
        className={showSearchPanel ? 'active-toggle' : ''}
      >
        🔍 Search {showSearchPanel ? '▼' : '▶'}
      </button>

      {showSearchPanel && (
        <SearchPanel
          projectId={projectId}
          draftText={sectionsToBody(sections)}
          versions={versions}
          fragments={fragments}
          onJumpToVersion={onJumpToVersion}
        />
      )}

      <button
        onClick={onToggleFragmentPanel}
        className={showFragmentPanel ? 'active-toggle' : ''}
      >
        📝 Fragments {showFragmentPanel ? '▼' : '▶'}
      </button>

      {showFragmentPanel && (
        <FragmentPanel projectId={projectId} onInsert={onInsertFragment} />
      )}

      <button
        onClick={onToggleSongPanel}
        className={showSongPanel ? 'active-toggle' : ''}
      >
        🎵 Song Links {showSongPanel ? '▼' : '▶'}
      </button>

      {showSongPanel && (
        <SongArtifactPanel projectId={projectId} versions={versions} />
      )}

      <LLMSettingsPanel onSettingsChange={onLLMSettingsChange} />

      <LLMAssistPanel
        runtime={llmSettings.runtime}
        baseUrl={llmSettings.baseUrl}
        model={llmSettings.model}
        modelPath={llmSettings.modelPath}
        enabled={llmSettings.enabled}
        onInsert={onInsertFragment}
      />

      <StyleProfilePanel projectId={projectId} />

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
  );
}

export default ActionPane;
