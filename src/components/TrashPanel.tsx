import { useState, useEffect } from 'react';
import {
  getDeletedItems,
  restoreProject,
  restoreVersion,
  restoreFragment,
  restoreSongArtifact,
  restoreStyleProfile,
  permanentlyDeleteProject,
  permanentlyDeleteVersion,
  permanentlyDeleteFragment,
  permanentlyDeleteSongArtifact,
  permanentlyDeleteStyleProfile,
  DeletedItem,
} from '../lib/api';
import { useLanguage } from '../lib/LanguageContext';

interface TrashPanelProps {
  onRestore: () => void;
  onClose?: () => void;
}

function TrashPanel({ onRestore, onClose }: TrashPanelProps) {
  const { t } = useLanguage();
  const [deletedItems, setDeletedItems] = useState<DeletedItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDeletedItems();
  }, []);

  const loadDeletedItems = async () => {
    try {
      setLoading(true);
      const data = await getDeletedItems();
      setDeletedItems(data);
    } catch (e) {
      console.error('Failed to load deleted items:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (item: DeletedItem) => {
    if (!item.deleted_batch_id) return;

    try {
      switch (item.type) {
        case 'Project':
          await restoreProject(item.project_id, item.deleted_batch_id);
          break;
        case 'LyricVersion':
          await restoreVersion(item.lyric_version_id, item.deleted_batch_id);
          break;
        case 'CollectedFragment':
          await restoreFragment(item.collected_fragment_id, item.deleted_batch_id);
          break;
        case 'SongArtifact':
          await restoreSongArtifact(item.song_artifact_id, item.deleted_batch_id);
          break;
        case 'StyleProfile':
          await restoreStyleProfile(item.style_profile_id, item.deleted_batch_id);
          break;
      }
      setDeletedItems(deletedItems.filter(i => !isSameItem(i, item)));
      onRestore();
    } catch (e) {
      console.error('Failed to restore item:', e);
    }
  };

  const handlePermanentDelete = async (item: DeletedItem) => {
    if (!item.deleted_batch_id) return;

    try {
      switch (item.type) {
        case 'Project':
          await permanentlyDeleteProject(item.project_id, item.deleted_batch_id);
          break;
        case 'LyricVersion':
          await permanentlyDeleteVersion(item.lyric_version_id, item.deleted_batch_id);
          break;
        case 'CollectedFragment':
          await permanentlyDeleteFragment(item.collected_fragment_id, item.deleted_batch_id);
          break;
        case 'SongArtifact':
          await permanentlyDeleteSongArtifact(item.song_artifact_id, item.deleted_batch_id);
          break;
        case 'StyleProfile':
          await permanentlyDeleteStyleProfile(item.style_profile_id, item.deleted_batch_id);
          break;
      }
      setDeletedItems(deletedItems.filter(i => !isSameItem(i, item)));
      onRestore();
    } catch (e) {
      console.error('Failed to permanently delete item:', e);
    }
  };

  const isSameItem = (a: DeletedItem, b: DeletedItem): boolean => {
    if (a.type !== b.type) return false;
    switch (a.type) {
      case 'Project':
        return a.project_id === (b as any).project_id;
      case 'LyricVersion':
        return a.lyric_version_id === (b as any).lyric_version_id;
      case 'CollectedFragment':
        return a.collected_fragment_id === (b as any).collected_fragment_id;
      case 'SongArtifact':
        return a.song_artifact_id === (b as any).song_artifact_id;
      case 'StyleProfile':
        return a.style_profile_id === (b as any).style_profile_id;
      default:
        return false;
    }
  };

  const getItemTitle = (item: DeletedItem): string => {
    switch (item.type) {
      case 'Project':
        return item.title;
      case 'LyricVersion':
        return item.snapshot_name;
      case 'CollectedFragment':
        return item.text_preview;
      case 'SongArtifact':
        return item.song_title || item.service_name;
      case 'StyleProfile':
        return 'Style Profile';
      default:
        return 'Unknown';
    }
  };

  const getTypeLabel = (item: DeletedItem): string => {
    switch (item.type) {
      case 'Project':
        return '📁 Project';
      case 'LyricVersion':
        return '📄 Version';
      case 'CollectedFragment':
        return '📝 Fragment';
      case 'SongArtifact':
        return '🎵 Song Link';
      case 'StyleProfile':
        return '🎨 Style Profile';
      default:
        return '❓ Unknown';
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="dialog-overlay">
      <div className="dialog trash-panel-dialog">
        <div className="trash-header">
          <h3>🗑️ {t('deletedItems')}</h3>
          <button onClick={handleClose} className="close-btn">×</button>
        </div>

        {loading ? (
          <p className="loading-text">{t('loading')}</p>
        ) : deletedItems.length === 0 ? (
          <p className="empty-text">{t('noDeletedItems')}</p>
        ) : (
          <ul className="deleted-list">
            {deletedItems.map((item, idx) => (
              <li key={`${item.type}-${idx}`} className="deleted-item">
                <div className="deleted-info">
                  <span className="deleted-type">{getTypeLabel(item)}</span>
                  <span className="deleted-title">{getItemTitle(item)}</span>
                  <span className="deleted-date">
                    {t('deletedLabel')} {item.deleted_at ? new Date(item.deleted_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="deleted-actions">
                  <button onClick={() => handleRestore(item)} className="restore-btn">
                    {t('restore')}
                  </button>
                  <button onClick={() => handlePermanentDelete(item)} className="permanent-delete-btn">
                    {t('delete')}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="dialog-buttons">
          <button onClick={handleClose}>{t('close')}</button>
        </div>
      </div>
    </div>
  );
}

export default TrashPanel;
