import { useState } from 'react';
import { save } from '@tauri-apps/plugin-dialog';
import { Project, LyricVersion, exportProject, exportQuick } from '../lib/api';
import Modal from './Modal';
import { useLanguage } from '../lib/LanguageContext';

interface ExportPanelProps {
  project: Project;
  versions: LyricVersion[];
  onClose: () => void;
}

function ExportPanel({ project, versions, onClose }: ExportPanelProps) {
  const { t } = useLanguage();
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successPath, setSuccessPath] = useState<string | null>(null);

  const handleFullExport = async () => {
    setExporting(true);
    setError(null);
    setSuccessPath(null);

    try {
      const safeTitle = project.title.replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'project';
      const filename = `${safeTitle}.lyrlytic.zip`;
      // Show save dialog
      const savePath = await save({
        defaultPath: filename,
        filters: [{ name: 'LyricLytic Export', extensions: ['lyrlytic.zip'] }],
      });

      if (savePath) {
        const exportedPath = await exportProject({
          project_id: project.project_id,
          include_deleted: includeDeleted,
          destination_path: savePath,
        });
        setSuccessPath(exportedPath);
      }
    } catch (e) {
      console.error('Export failed:', e);
      setError(e instanceof Error ? e.message : t('exportFailed'));
    } finally {
      setExporting(false);
    }
  };

  const handleQuickExport = async (format: 'txt' | 'markdown' | 'json') => {
    const extension = format === 'markdown' ? 'md' : format;
    const safeTitle = project.title.replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'project';
    const destinationPath = await save({
      defaultPath: `${safeTitle}.${extension}`,
      filters: [{ name: format.toUpperCase(), extensions: [extension] }],
    });
    if (!destinationPath) return;

    setError(null);
    try {
      const exportedPath = await exportQuick({
        project_id: project.project_id,
        format,
        destination_path: destinationPath,
      });
      setSuccessPath(exportedPath);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('exportFailed'));
    }
  };

  return (
    <Modal title={t('exportProjectTitle')} onClose={onClose} className="export-dialog">
        <p className="export-info">
          "{project.title}" - {versions.length} {t('versionsSaved')}
        </p>

        {/* Full Export Section */}
        <div className="export-section">
          <h4>📦 {t('fullBackup')}</h4>
          <p className="export-desc">
            {t('fullBackupDescription')}
          </p>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={includeDeleted}
              onChange={(e) => setIncludeDeleted(e.target.checked)}
            />
            {t('includeDeletedItems')}
          </label>

          <button
            onClick={handleFullExport}
            disabled={exporting}
            className="primary-btn export-full-btn"
          >
            {exporting ? `⏳ ${t('creatingExport')}` : `💾 ${t('saveBackup')}`}
          </button>

          {error && <p className="error">{error}</p>}
          {successPath && (
            <p className="success">✅ {t('exportedTo')} {successPath}</p>
          )}
        </div>

        {/* Quick Export Section */}
        <div className="export-section">
          <h4>📄 {t('quickExport')}</h4>
          <p className="export-hint">{t('quickExportHint')}</p>

          <div className="export-options">
            <button onClick={() => void handleQuickExport('txt')} className="export-btn">
              Text (.txt)
              <span className="export-desc">{t('workingDraftOnly')}</span>
            </button>

            <button onClick={() => void handleQuickExport('markdown')} className="export-btn">
              Markdown (.md)
              <span className="export-desc">{t('withVersionHistory')}</span>
            </button>

            <button onClick={() => void handleQuickExport('json')} className="export-btn">
              JSON (.json)
              <span className="export-desc">{t('structuredData')}</span>
            </button>
          </div>
        </div>

        <div className="dialog-buttons">
          <button onClick={onClose}>{t('close')}</button>
        </div>
    </Modal>
  );
}

export default ExportPanel;
