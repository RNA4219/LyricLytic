import { useState, useEffect } from 'react';
import { open } from '@tauri-apps/plugin-shell';
import { getSongArtifacts, createSongArtifact, deleteSongArtifact, SongArtifact, LyricVersion } from '../lib/api';
import { useLanguage } from '../lib/LanguageContext';
import SongArtifactForm from './songArtifacts/SongArtifactForm';
import SongArtifactList from './songArtifacts/SongArtifactList';

interface SongArtifactPanelProps {
  projectId: string;
  versions: LyricVersion[];
  onShowSaveDialog?: () => void;
}

function SongArtifactPanel({ projectId, versions, onShowSaveDialog }: SongArtifactPanelProps) {
  const { t } = useLanguage();
  const [artifacts, setArtifacts] = useState<SongArtifact[]>([]);
  const [loading, setLoading] = useState(true);
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
    if (!confirm(t('deleteSongLinkConfirm'))) return;

    try {
      await deleteSongArtifact(id);
      setArtifacts(artifacts.filter(a => a.song_artifact_id !== id));
    } catch (e) {
      console.error('Failed to delete artifact:', e);
    }
  };

  const resetForm = () => {
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
    if (confirm(`${t('openExternalLink')}\n${url}`)) {
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
        <h4>🎵 {t('songLinks')}</h4>
      </div>

      {versions.length === 0 && (
        <div className="no-versions-warning">
          <p className="warning-text">⚠️ {t('noSavedVersionsWarning')}</p>
          <p className="hint-text">
            {t('noVersionsHint')}
          </p>
          {onShowSaveDialog && (
            <button onClick={onShowSaveDialog} className="save-version-btn">
              💾 {t('saveSnapshot')}
            </button>
          )}
        </div>
      )}

      {versions.length > 0 && (
        <SongArtifactForm
          versions={versions}
          selectedVersionId={selectedVersionId}
          serviceName={serviceName}
          songTitle={songTitle}
          sourceUrl={sourceUrl}
          sourceFilePath={sourceFilePath}
          promptMemo={promptMemo}
          styleMemo={styleMemo}
          evaluationMemo={evaluationMemo}
          onSelectedVersionIdChange={setSelectedVersionId}
          onServiceNameChange={setServiceName}
          onSongTitleChange={setSongTitle}
          onSourceUrlChange={setSourceUrl}
          onSourceFilePathChange={setSourceFilePath}
          onPromptMemoChange={setPromptMemo}
          onStyleMemoChange={setStyleMemo}
          onEvaluationMemoChange={setEvaluationMemo}
          onCancel={resetForm}
          onSubmit={handleAddArtifact}
        />
      )}

      <div className="artifact-list">
        <SongArtifactList
          artifacts={artifacts}
          loading={loading}
          onOpenUrl={openExternalUrl}
          onDelete={handleDelete}
          getVersionName={getVersionName}
        />
      </div>
    </div>
  );
}

export default SongArtifactPanel;
