import { useState } from 'react';
import { getDeletedProjects, restoreProject, Project } from '../lib/api';
import { useLanguage } from '../lib/LanguageContext';

interface TrashPanelProps {
  onRestore: () => void;
}

function TrashPanel({ onRestore }: TrashPanelProps) {
  const { t } = useLanguage();
  const [deletedProjects, setDeletedProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  const loadDeletedProjects = async () => {
    try {
      setLoading(true);
      const data = await getDeletedProjects();
      setDeletedProjects(data);
    } catch (e) {
      console.error('Failed to load deleted projects:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setShow(true);
    loadDeletedProjects();
  };

  const handleClose = () => {
    setShow(false);
    setDeletedProjects([]);
  };

  const handleRestore = async (project: Project) => {
    if (!project.deleted_batch_id) return;

    try {
      await restoreProject(project.project_id, project.deleted_batch_id);
      setDeletedProjects(deletedProjects.filter(p => p.project_id !== project.project_id));
      onRestore();
    } catch (e) {
      console.error('Failed to restore project:', e);
    }
  };

  if (!show) {
    return (
      <button onClick={handleOpen} className="trash-toggle-btn">
        🗑️ {t('trash')} ({deletedProjects.length > 0 ? '...' : '0'})
      </button>
    );
  }

  return (
    <div className="trash-panel">
      <div className="trash-header">
        <h3>🗑️ {t('deletedProjects')}</h3>
        <button onClick={handleClose} className="close-btn">×</button>
      </div>

      {loading ? (
        <p className="loading-text">{t('loading')}</p>
      ) : deletedProjects.length === 0 ? (
        <p className="empty-text">{t('noDeleted')}</p>
      ) : (
        <ul className="deleted-list">
          {deletedProjects.map(p => (
            <li key={p.project_id} className="deleted-item">
              <div className="deleted-info">
                <span className="deleted-title">{p.title}</span>
                <span className="deleted-date">
                  {t('deletedLabel')} {p.deleted_at ? new Date(p.deleted_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <button onClick={() => handleRestore(p)} className="restore-btn">
                {t('restore')}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default TrashPanel;