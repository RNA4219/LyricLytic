import { LyricVersion } from '../../lib/api';

interface VersionPaneProps {
  projectTitle: string;
  versions: LyricVersion[];
  saving: boolean;
  lastSaved: Date | null;
  onOpenNotes: (version: LyricVersion) => void;
  onRestoreVersion: (version: LyricVersion) => void;
  onShowDiff: () => void;
  onShowDelete: () => void;
}

function VersionPane({
  projectTitle,
  versions,
  saving,
  lastSaved,
  onOpenNotes,
  onRestoreVersion,
  onShowDiff,
  onShowDelete,
}: VersionPaneProps) {
  return (
    <aside className="left-pane">
      <div className="pane-header">
        <h3>Versions</h3>
        {saving && <span className="saving-badge">Saving...</span>}
        {lastSaved && <span className="saved-badge">Saved {lastSaved.toLocaleTimeString()}</span>}
      </div>

      <div className="project-info">
        <span className="project-title">{projectTitle}</span>
      </div>

      <div className="version-tree">
        <div className="version-item active">
          <span className="version-name">Working Draft</span>
          <span className="version-label">(editing)</span>
        </div>
        {versions.map((version) => (
          <div key={version.lyric_version_id} className="version-item">
            <span className="version-name">{version.snapshot_name}</span>
            <div className="version-actions">
              <button className="notes-btn" onClick={() => onOpenNotes(version)}>📝</button>
              <button className="restore-btn" onClick={() => onRestoreVersion(version)}>Restore</button>
            </div>
          </div>
        ))}
      </div>

      <div className="pane-actions">
        <button onClick={onShowDiff} className="secondary-btn">
          📊 Compare Versions
        </button>
        <button onClick={onShowDelete} className="danger-btn">Delete Project</button>
      </div>
    </aside>
  );
}

export default VersionPane;
