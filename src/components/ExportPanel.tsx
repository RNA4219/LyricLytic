import { useState } from 'react';
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile, readFile } from '@tauri-apps/plugin-fs';
import { Project, LyricVersion, exportProject } from '../lib/api';

interface ExportPanelProps {
  project: Project;
  versions: LyricVersion[];
  bodyText: string;
  onClose: () => void;
}

function ExportPanel({ project, versions, bodyText, onClose }: ExportPanelProps) {
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successPath, setSuccessPath] = useState<string | null>(null);

  const handleFullExport = async () => {
    setExporting(true);
    setError(null);
    setSuccessPath(null);

    try {
      // Generate the zip in temp directory
      const tempPath = await exportProject({
        project_id: project.project_id,
        include_deleted: includeDeleted,
      });

      // Extract filename from temp path
      const filename = tempPath.split(/[/\\]/).pop() || 'export.zip';

      // Show save dialog
      const savePath = await save({
        defaultPath: filename,
        filters: [{ name: 'LyricLytic Export', extensions: ['lyrlytic.zip'] }],
      });

      if (savePath) {
        // Read the temp file and write to selected location
        const fileData = await readFile(tempPath);
        await writeFile(savePath, fileData);
        setSuccessPath(savePath);
      }
    } catch (e) {
      console.error('Export failed:', e);
      setError(e instanceof Error ? e.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  // Quick export functions (unchanged from original)
  const exportAsText = () => {
    const content = `[${project.title}]\n\n${bodyText}`;
    downloadFile(content, `${project.title}.txt`, 'text/plain');
  };

  const exportAsMarkdown = () => {
    let content = `# ${project.title}\n\n`;
    if (project.theme) content += `**Theme:** ${project.theme}\n\n`;
    if (project.memo) content += `**Memo:** ${project.memo}\n\n`;
    content += `---\n\n## Working Draft\n\n${bodyText}\n\n`;

    if (versions.length > 0) {
      content += `---\n\n## Version History\n\n`;
      versions.forEach(v => {
        content += `### ${v.snapshot_name}\n`;
        content += `*Created: ${new Date(v.created_at).toLocaleDateString()}*\n\n`;
        if (v.note) content += `*Note: ${v.note}*\n\n`;
        content += `${v.body_text}\n\n`;
      });
    }

    downloadFile(content, `${project.title}.md`, 'text/markdown');
  };

  const exportAsJson = () => {
    const data = {
      project: {
        id: project.project_id,
        title: project.title,
        theme: project.theme,
        memo: project.memo,
        created_at: project.created_at,
        updated_at: project.updated_at,
      },
      working_draft: bodyText,
      versions: versions.map(v => ({
        id: v.lyric_version_id,
        name: v.snapshot_name,
        body: v.body_text,
        note: v.note,
        created_at: v.created_at,
      })),
    };
    downloadFile(JSON.stringify(data, null, 2), `${project.title}.json`, 'application/json');
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="dialog-overlay">
      <div className="dialog export-dialog">
        <h3>Export Project</h3>
        <p className="export-info">
          "{project.title}" - {versions.length} versions saved
        </p>

        {/* Full Export Section */}
        <div className="export-section">
          <h4>📦 Full Backup (.lyrlytic.zip)</h4>
          <p className="export-desc">
            Complete project backup with all data: versions, fragments, style profile, song links, and revision notes.
          </p>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={includeDeleted}
              onChange={(e) => setIncludeDeleted(e.target.checked)}
            />
            Include deleted items
          </label>

          <button
            onClick={handleFullExport}
            disabled={exporting}
            className="primary-btn export-full-btn"
          >
            {exporting ? '⏳ Creating...' : '💾 Save Backup...'}
          </button>

          {error && <p className="error">{error}</p>}
          {successPath && (
            <p className="success">✅ Exported to: {successPath}</p>
          )}
        </div>

        {/* Quick Export Section */}
        <div className="export-section">
          <h4>📄 Quick Export</h4>
          <p className="export-hint">Simple text exports for quick sharing</p>

          <div className="export-options">
            <button onClick={exportAsText} className="export-btn">
              Text (.txt)
              <span className="export-desc">Working draft only</span>
            </button>

            <button onClick={exportAsMarkdown} className="export-btn">
              Markdown (.md)
              <span className="export-desc">With version history</span>
            </button>

            <button onClick={exportAsJson} className="export-btn">
              JSON (.json)
              <span className="export-desc">Structured data</span>
            </button>
          </div>
        </div>

        <div className="dialog-buttons">
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default ExportPanel;
