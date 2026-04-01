import DiffViewer from '../../components/DiffViewer';
import ExportPanel from '../../components/ExportPanel';
import ImportDialog from '../../components/ImportDialog';
import { LyricVersion, Project } from '../../lib/api';

interface EditorOverlaysProps {
  projectId: string;
  project: Project;
  versions: LyricVersion[];
  showDeleteDialog: boolean;
  showDiffViewer: boolean;
  showExportPanel: boolean;
  showImportDialog: boolean;
  bodyText: string;
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
  bodyText,
  onCloseDeleteDialog,
  onDeleteProject,
  onCloseDiffViewer,
  onRestoreVersion,
  onCloseExportPanel,
  onImportAsFragment,
  onImportAsBody,
  onCloseImportDialog,
}: EditorOverlaysProps) {
  return (
    <>
      {showDeleteDialog && (
        <div className="dialog-overlay">
          <div className="dialog">
            <h3>Delete Project?</h3>
            <p>Are you sure you want to delete "{project.title}"?</p>
            <p className="warning">This action can be undone from the deleted items.</p>
            <div className="dialog-buttons">
              <button onClick={onCloseDeleteDialog}>Cancel</button>
              <button onClick={onDeleteProject} className="danger">Delete</button>
            </div>
          </div>
        </div>
      )}

      {showDiffViewer && (
        <div className="modal-overlay">
          <DiffViewer versions={versions} onClose={onCloseDiffViewer} onRestore={onRestoreVersion} />
        </div>
      )}

      {showExportPanel && (
        <ExportPanel
          project={project}
          versions={versions}
          bodyText={bodyText}
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
