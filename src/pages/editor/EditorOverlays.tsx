import DiffViewer from '../../components/DiffViewer';
import ExportPanel from '../../components/ExportPanel';
import ImportDialog from '../../components/ImportDialog';
import { LyricVersion, Project } from '../../lib/api';
import Modal from '../../components/Modal';
import { useLanguage } from '../../lib/LanguageContext';

interface EditorOverlaysProps {
  projectId: string;
  project: Project;
  versions: LyricVersion[];
  showDeleteDialog: boolean;
  showDiffViewer: boolean;
  showExportPanel: boolean;
  showImportDialog: boolean;
  onCloseDeleteDialog: () => void;
  onDeleteProject: () => void;
  onCloseDiffViewer: () => void;
  onRestoreVersion: (version: LyricVersion) => void;
  onCloseExportPanel: () => void;
  onImportAsFragment: (text: string, source: string) => void;
  onImportAsBody: (text: string) => void;
  onCloseImportDialog: () => void;
}

function EditorOverlays({
  projectId,
  project,
  versions,
  showDeleteDialog,
  showDiffViewer,
  showExportPanel,
  showImportDialog,
  onCloseDeleteDialog,
  onDeleteProject,
  onCloseDiffViewer,
  onRestoreVersion,
  onCloseExportPanel,
  onImportAsFragment,
  onImportAsBody,
  onCloseImportDialog,
}: EditorOverlaysProps) {
  const { t } = useLanguage();
  return (
    <>
      {showDeleteDialog && (
        <Modal title={t('deleteProject')} onClose={onCloseDeleteDialog}>
            <p>{t('deleteConfirm')}</p>
            <p className="warning">{t('deleteWarning')}</p>
            <div className="dialog-buttons">
              <button onClick={onCloseDeleteDialog}>{t('cancel')}</button>
              <button onClick={onDeleteProject} className="danger">{t('delete')}</button>
            </div>
        </Modal>
      )}

      {showDiffViewer && (
        <Modal title={t('diffTitle')} onClose={onCloseDiffViewer} overlayClassName="modal-overlay">
          <DiffViewer versions={versions} onClose={onCloseDiffViewer} onRestore={onRestoreVersion} />
        </Modal>
      )}

      {showExportPanel && (
        <ExportPanel
          project={project}
          versions={versions}
          onClose={onCloseExportPanel}
        />
      )}

      {showImportDialog && (
        <ImportDialog
          projectId={projectId}
          onImportAsFragment={onImportAsFragment}
          onImportAsBody={onImportAsBody}
          onClose={onCloseImportDialog}
        />
      )}
    </>
  );
}

export default EditorOverlays;
