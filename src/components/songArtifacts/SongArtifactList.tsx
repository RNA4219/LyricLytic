import { SongArtifact } from '../../lib/api';

interface SongArtifactListProps {
  artifacts: SongArtifact[];
  loading: boolean;
  onOpenUrl: (url: string) => void;
  onDelete: (artifactId: string) => void;
  getVersionName: (versionId: string) => string;
}

function SongArtifactList({
  artifacts,
  loading,
  onOpenUrl,
  onDelete,
  getVersionName,
}: SongArtifactListProps) {
  if (loading) {
    return <p className="loading-text">Loading...</p>;
  }

  if (artifacts.length === 0) {
    return <p className="empty-text">No song links yet</p>;
  }

  return (
    <>
      {artifacts.map((artifact) => (
        <div key={artifact.song_artifact_id} className="artifact-item">
          <div className="artifact-header">
            <span className="service-badge">{artifact.service_name}</span>
            <span className="version-badge">{getVersionName(artifact.lyric_version_id)}</span>
          </div>

          {artifact.song_title && <div className="artifact-title">{artifact.song_title}</div>}

          <div className="artifact-links">
            {artifact.source_url && (
              <button
                onClick={() => onOpenUrl(artifact.source_url!)}
                className="link-btn"
              >
                🔗 Open URL
              </button>
            )}
            {artifact.source_file_path && (
              <span className="file-path">📁 {artifact.source_file_path}</span>
            )}
          </div>

          {artifact.evaluation_memo && (
            <div className="artifact-memo">
              <strong>Evaluation:</strong> {artifact.evaluation_memo}
            </div>
          )}

          <div className="artifact-actions">
            <button onClick={() => onDelete(artifact.song_artifact_id)} className="delete-btn">
              Delete
            </button>
          </div>
        </div>
      ))}
    </>
  );
}

export default SongArtifactList;
