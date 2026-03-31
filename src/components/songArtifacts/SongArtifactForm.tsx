import { LyricVersion } from '../../lib/api';

interface SongArtifactFormProps {
  versions: LyricVersion[];
  selectedVersionId: string;
  serviceName: string;
  songTitle: string;
  sourceUrl: string;
  sourceFilePath: string;
  promptMemo: string;
  styleMemo: string;
  evaluationMemo: string;
  onSelectedVersionIdChange: (value: string) => void;
  onServiceNameChange: (value: string) => void;
  onSongTitleChange: (value: string) => void;
  onSourceUrlChange: (value: string) => void;
  onSourceFilePathChange: (value: string) => void;
  onPromptMemoChange: (value: string) => void;
  onStyleMemoChange: (value: string) => void;
  onEvaluationMemoChange: (value: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
}

function SongArtifactForm({
  versions,
  selectedVersionId,
  serviceName,
  songTitle,
  sourceUrl,
  sourceFilePath,
  promptMemo,
  styleMemo,
  evaluationMemo,
  onSelectedVersionIdChange,
  onServiceNameChange,
  onSongTitleChange,
  onSourceUrlChange,
  onSourceFilePathChange,
  onPromptMemoChange,
  onStyleMemoChange,
  onEvaluationMemoChange,
  onCancel,
  onSubmit,
}: SongArtifactFormProps) {
  return (
    <div className="add-artifact-form">
      <select
        value={selectedVersionId}
        onChange={(event) => onSelectedVersionIdChange(event.target.value)}
      >
        <option value="">Select version...</option>
        {versions.map((version) => (
          <option key={version.lyric_version_id} value={version.lyric_version_id}>
            {version.snapshot_name}
          </option>
        ))}
      </select>

      <input
        type="text"
        placeholder="Service name (e.g., Suno, Udio)"
        value={serviceName}
        onChange={(event) => onServiceNameChange(event.target.value)}
      />

      <input
        type="text"
        placeholder="Song title"
        value={songTitle}
        onChange={(event) => onSongTitleChange(event.target.value)}
      />

      <input
        type="text"
        placeholder="Source URL"
        value={sourceUrl}
        onChange={(event) => onSourceUrlChange(event.target.value)}
      />
      <p className="form-hint">URL or File path required</p>

      <input
        type="text"
        placeholder="Or local file path"
        value={sourceFilePath}
        onChange={(event) => onSourceFilePathChange(event.target.value)}
      />

      <textarea
        placeholder="Prompt memo"
        value={promptMemo}
        onChange={(event) => onPromptMemoChange(event.target.value)}
      />

      <textarea
        placeholder="Style memo"
        value={styleMemo}
        onChange={(event) => onStyleMemoChange(event.target.value)}
      />

      <textarea
        placeholder="Evaluation memo"
        value={evaluationMemo}
        onChange={(event) => onEvaluationMemoChange(event.target.value)}
      />

      <div className="form-buttons">
        <button onClick={onCancel} className="cancel-btn">Cancel</button>
        <button
          onClick={onSubmit}
          className="save-btn"
          disabled={!selectedVersionId || !serviceName || (!sourceUrl && !sourceFilePath)}
        >
          Add
        </button>
      </div>
    </div>
  );
}

export default SongArtifactForm;
