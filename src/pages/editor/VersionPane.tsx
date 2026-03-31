import { LyricVersion } from '../../lib/api';

interface VersionPaneProps {
  projectTitle: string;
  versions: LyricVersion[];
  saving: boolean;
  lastSaved: Date | null;
  onOpenNotes: (version: LyricVersion) => void;
  onRestoreVersion: (version: LyricVersion) => void;
  onDeleteVersion: (version: LyricVersion) => void;
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
  onDeleteVersion,
  onShowDiff,
  onShowDelete,
}: VersionPaneProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <aside className="left-pane">
      <div className="pane-header">
        <h3>📚 バージョン</h3>
        {saving && <span className="saving-badge">保存中...</span>}
        {lastSaved && (
          <span className="saved-badge">
            保存済み {lastSaved.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      <div className="project-info">
        <span className="project-title">{projectTitle}</span>
      </div>

      <div className="version-tree">
        <div className="version-item active">
          <span className="version-name">Working Draft</span>
          <span className="version-label">(編集中)</span>
        </div>
        {versions.map((version) => (
          <div key={version.lyric_version_id} className="version-item">
            <div className="version-info">
              <span className="version-name">{version.snapshot_name}</span>
              <span className="version-date">{formatDate(version.created_at)}</span>
            </div>
            <div className="version-actions">
              <button
                className="notes-btn"
                onClick={() => onOpenNotes(version)}
                title="メモ"
              >
                📝
              </button>
              <button
                className="restore-btn"
                onClick={() => onRestoreVersion(version)}
                title="この版から再開"
              >
                復元
              </button>
              <button
                className="delete-version-btn"
                onClick={() => onDeleteVersion(version)}
                title="削除"
              >
                🗑
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="pane-actions">
        <button onClick={onShowDiff} className="secondary-btn">
          📊 バージョン比較
        </button>
        <button onClick={onShowDelete} className="danger-btn">
          プロジェクト削除
        </button>
      </div>
    </aside>
  );
}

export default VersionPane;