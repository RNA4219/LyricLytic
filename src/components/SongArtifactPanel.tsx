import { useState, useEffect } from 'react';
import { open } from '@tauri-apps/plugin-shell';
import { getSongArtifacts, createSongArtifact, deleteSongArtifact, SongArtifact, LyricVersion } from '../lib/api';

interface SongArtifactPanelProps {
  projectId: string;
  versions: LyricVersion[];
}

function SongArtifactPanel({ projectId, versions }: SongArtifactPanelProps) {
  const [artifacts, setArtifacts] = useState<SongArtifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedVersionId, setSelectedVersionId] = useState<string>('');
  const [serviceName, setServiceName] = useState('');
  const [songTitle, setSongTitle] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [sourceFilePath, setSourceFilePath] = useState('');
  const [promptMemo, setPromptMemo] = useState('');
  const [styleMemo, setStyleMemo] = useState('');
  const [evaluationMemo, setEvaluationMemo] = useState('');

  useEffect(() => {
    loadArtifacts();
  }, [projectId]);

  const loadArtifacts = async () => {
    try {
      setLoading(true);
      const data = await getSongArtifacts(projectId);
      setArtifacts(data);
    } catch (e) {
      console.error('Failed to load artifacts:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddArtifact = async () => {
    if (!selectedVersionId || !serviceName) return;
    if (!sourceUrl && !sourceFilePath) return;

    try {
      const artifact = await createSongArtifact({
        project_id: projectId,
        lyric_version_id: selectedVersionId,
        service_name: serviceName,
        song_title: songTitle || undefined,
        source_url: sourceUrl || undefined,
        source_file_path: sourceFilePath || undefined,
        prompt_memo: promptMemo || undefined,
        style_memo: styleMemo || undefined,
        evaluation_memo: evaluationMemo || undefined,
      });
      setArtifacts([artifact, ...artifacts]);
      resetForm();
    } catch (e) {
      console.error('Failed to create artifact:', e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this song link?')) return;

    try {
      await deleteSongArtifact(id);
      setArtifacts(artifacts.filter(a => a.song_artifact_id !== id));
    } catch (e) {
      console.error('Failed to delete artifact:', e);
    }
  };

  const resetForm = () => {
    setShowAddForm(false);
    setSelectedVersionId('');
    setServiceName('');
    setSongTitle('');
    setSourceUrl('');
    setSourceFilePath('');
    setPromptMemo('');
    setStyleMemo('');
    setEvaluationMemo('');
  };

  const getVersionName = (versionId: string) => {
    const version = versions.find(v => v.lyric_version_id === versionId);
    return version?.snapshot_name || 'Unknown';
  };

  const openExternalUrl = async (url: string) => {
    if (confirm(`Open external link?\n${url}`)) {
      try {
        await open(url);
      } catch (e) {
        console.error('Failed to open external URL:', e);
      }
    }
  };

  return (
    <div className="song-artifact-panel">
      <div className="panel-header">
        <h4>Song Links</h4>
        <button onClick={() => setShowAddForm(!showAddForm)} className="add-btn">
          {showAddForm ? '×' : '+'}
        </button>
      </div>

      {showAddForm && (
        <div className="add-artifact-form">
          <select
            value={selectedVersionId}
            onChange={(e) => setSelectedVersionId(e.target.value)}
          >
            <option value="">Select version...</option>
            {versions.map(v => (
              <option key={v.lyric_version_id} value={v.lyric_version_id}>
                {v.snapshot_name}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Service name (e.g., Suno, Udio)"
            value={serviceName}
            onChange={(e) => setServiceName(e.target.value)}
          />

          <input
            type="text"
            placeholder="Song title"
            value={songTitle}
            onChange={(e) => setSongTitle(e.target.value)}
          />

          <input
            type="text"
            placeholder="Source URL"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
          />
          <p className="form-hint">URL or File path required</p>

          <input
            type="text"
            placeholder="Or local file path"
            value={sourceFilePath}
            onChange={(e) => setSourceFilePath(e.target.value)}
          />

          <textarea
            placeholder="Prompt memo"
            value={promptMemo}
            onChange={(e) => setPromptMemo(e.target.value)}
          />

          <textarea
            placeholder="Style memo"
            value={styleMemo}
            onChange={(e) => setStyleMemo(e.target.value)}
          />

          <textarea
            placeholder="Evaluation memo"
            value={evaluationMemo}
            onChange={(e) => setEvaluationMemo(e.target.value)}
          />

          <div className="form-buttons">
            <button onClick={resetForm} className="cancel-btn">Cancel</button>
            <button
              onClick={handleAddArtifact}
              className="save-btn"
              disabled={!selectedVersionId || !serviceName || (!sourceUrl && !sourceFilePath)}
            >
              Add
            </button>
          </div>
        </div>
      )}

      <div className="artifact-list">
        {loading ? (
          <p className="loading-text">Loading...</p>
        ) : artifacts.length === 0 ? (
          <p className="empty-text">No song links yet</p>
        ) : (
          artifacts.map(a => (
            <div key={a.song_artifact_id} className="artifact-item">
              <div className="artifact-header">
                <span className="service-badge">{a.service_name}</span>
                <span className="version-badge">{getVersionName(a.lyric_version_id)}</span>
              </div>

              {a.song_title && (
                <div className="artifact-title">{a.song_title}</div>
              )}

              <div className="artifact-links">
                {a.source_url && (
                  <button
                    onClick={() => openExternalUrl(a.source_url!)}
                    className="link-btn"
                  >
                    🔗 Open URL
                  </button>
                )}
                {a.source_file_path && (
                  <span className="file-path">📁 {a.source_file_path}</span>
                )}
              </div>

              {a.evaluation_memo && (
                <div className="artifact-memo">
                  <strong>Evaluation:</strong> {a.evaluation_memo}
                </div>
              )}

              <div className="artifact-actions">
                <button onClick={() => handleDelete(a.song_artifact_id)} className="delete-btn">
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default SongArtifactPanel;
