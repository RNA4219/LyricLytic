import { Project, LyricVersion } from '../lib/api';

interface ExportPanelProps {
  project: Project;
  versions: LyricVersion[];
  bodyText: string;
  onClose: () => void;
}

function ExportPanel({ project, versions, bodyText, onClose }: ExportPanelProps) {
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
          Export "{project.title}" with {versions.length} saved versions.
        </p>

        <div className="export-options">
          <button onClick={exportAsText} className="export-btn">
            📄 Text (.txt)
            <span className="export-desc">Plain lyrics text only</span>
          </button>

          <button onClick={exportAsMarkdown} className="export-btn">
            📝 Markdown (.md)
            <span className="export-desc">Full project with versions</span>
          </button>

          <button onClick={exportAsJson} className="export-btn">
            🔧 JSON (.json)
            <span className="export-desc">Machine-readable format</span>
          </button>
        </div>

        <div className="dialog-buttons">
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default ExportPanel;