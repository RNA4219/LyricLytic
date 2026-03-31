import { LyricVersion } from '../../lib/api';
import { useLanguage } from '../../lib/LanguageContext';

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
  const { t } = useLanguage();

  return (
    <div className="add-artifact-form">
      <select
        value={selectedVersionId}
        onChange={(event) => onSelectedVersionIdChange(event.target.value)}
      >
        <option value="">{t('selectVersion')}</option>
        {versions.map((version) => (
          <option key={version.lyric_version_id} value={version.lyric_version_id}>
            {version.snapshot_name}
          </option>
        ))}
      </select>

      <input
        type="text"
        placeholder={t('serviceNamePlaceholder')}
        value={serviceName}
        onChange={(event) => onServiceNameChange(event.target.value)}
      />

      <input
        type="text"
        placeholder={t('songTitlePlaceholder')}
        value={songTitle}
        onChange={(event) => onSongTitleChange(event.target.value)}
      />

      <input
        type="text"
        placeholder={t('sourceUrlPlaceholder')}
        value={sourceUrl}
        onChange={(event) => onSourceUrlChange(event.target.value)}
      />
      <p className="form-hint">{t('urlOrFileRequired')}</p>

      <input
        type="text"
        placeholder={t('localFilePathPlaceholder')}
        value={sourceFilePath}
        onChange={(event) => onSourceFilePathChange(event.target.value)}
      />

      <textarea
        placeholder={t('promptMemoPlaceholder')}
        value={promptMemo}
        onChange={(event) => onPromptMemoChange(event.target.value)}
      />

      <textarea
        placeholder={t('styleMemoPlaceholder')}
        value={styleMemo}
        onChange={(event) => onStyleMemoChange(event.target.value)}
      />

      <textarea
        placeholder={t('evaluationMemoPlaceholder')}
        value={evaluationMemo}
        onChange={(event) => onEvaluationMemoChange(event.target.value)}
      />

      <div className="form-buttons">
        <button onClick={onCancel} className="cancel-btn">{t('cancel')}</button>
        <button
          onClick={onSubmit}
          className="save-btn"
          disabled={!selectedVersionId || !serviceName || (!sourceUrl && !sourceFilePath)}
        >
          {t('add')}
        </button>
      </div>
    </div>
  );
}

export default SongArtifactForm;
