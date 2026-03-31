import DiffViewer from '../../components/DiffViewer';
import ExportPanel from '../../components/ExportPanel';
import ImportDialog from '../../components/ImportDialog';
import RevisionNotePanel from '../../components/RevisionNotePanel';
import { LyricVersion, Project } from '../../lib/api';

interface EditorOverlaysProps {
  projectId: string;
  project: Project;
  versions: LyricVersion[];
  selectedVersionForNotes: LyricVersion | null;
  showSaveDialog: boolean;
  showDeleteDialog: boolean;
  showDiffViewer: boolean;
  showExportPanel: boolean;
  showImportDialog: boolean;
  snapshotName: string;
  snapshotNote: string;
  bodyText: string;
  onSnapshotNameChange: (value: string) => void;
  onSnapshotNoteChange: (value: string) => void;
  onCloseSaveDialog: () => void;
  onSaveSnapshot: () => void;
  onCloseDeleteDialog: () => void;
  onDeleteProject: () => void;
  onCloseDiffViewer: () => void;
  onCloseExportPanel: () => void;
  onImportAsFragment: (text: string, source: string) => void;
  onImportAsBody: (text: string) => void;
  onCloseImportDialog: () => void;
  onCloseRevisionNotes: () => void;
}

function EditorOverlays({
  projectId,
  project,
  versions,
  selectedVersionForNotes,
  showSaveDialog,
  showDeleteDialog,
  showDiffViewer,
  showExportPanel,
  showImportDialog,
  snapshotName,
  snapshotNote,
  bodyText,
  onSnapshotNameChange,
  onSnapshotNoteChange,
  onCloseSaveDialog,
  onSaveSnapshot,
  onCloseDeleteDialog,
  onDeleteProject,
  onCloseDiffViewer,
  onCloseExportPanel,
  onImportAsFragment,
  onImportAsBody,
  onCloseImportDialog,
  onCloseRevisionNotes,
}: EditorOverlaysProps) {
  return (
    <>
      {showSaveDialog && (
        <div className="dialog-overlay">
          <div className="dialog">
            <h3>Save Snapshot</h3>
            <input
              type="text"
              placeholder="Snapshot name"
              value={snapshotName}
              onChange={(event) => onSnapshotNameChange(event.target.value)}
            />
            <textarea
              placeholder="Note (optional)"
              value={snapshotNote}
              onChange={(event) => onSnapshotNoteChange(event.target.value)}
            />
            <div className="dialog-buttons">
              <button onClick={onCloseSaveDialog}>Cancel</button>
              <button onClick={onSaveSnapshot} className="primary">Save</button>
            </div>
          </div>
        </div>
      )}

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
          <DiffViewer versions={versions} onClose={onCloseDiffViewer} />
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

      {selectedVersionForNotes && (
        <div className="dialog-overlay">
          <div className="dialog">
            <RevisionNotePanel
              lyricVersionId={selectedVersionForNotes.lyric_version_id}
              versionName={selectedVersionForNotes.snapshot_name}
            />
            <div className="dialog-buttons">
              <button onClick={onCloseRevisionNotes}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default EditorOverlays;
