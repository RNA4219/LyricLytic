import { useState } from 'react';
import { DiffEditor } from '@monaco-editor/react';
import { LyricVersion } from '../lib/api';

interface DiffViewerProps {
  versions: LyricVersion[];
  onClose: () => void;
}

function DiffViewer({ versions, onClose }: DiffViewerProps) {
  const [leftVersionId, setLeftVersionId] = useState<string | null>(
    versions.length > 1 ? versions[1].lyric_version_id : null
  );
  const [rightVersionId, setRightVersionId] = useState<string | null>(
    versions.length > 0 ? versions[0].lyric_version_id : null
  );

  const leftVersion = versions.find(v => v.lyric_version_id === leftVersionId);
  const rightVersion = versions.find(v => v.lyric_version_id === rightVersionId);

  return (
    <div className="diff-viewer">
      <div className="diff-header">
        <h3>Compare Versions</h3>
        <button onClick={onClose} className="close-btn">×</button>
      </div>

      <div className="diff-selectors">
        <div className="selector">
          <label>Original (Left):</label>
          <select
            value={leftVersionId || ''}
            onChange={(e) => setLeftVersionId(e.target.value || null)}
          >
            <option value="">Select version...</option>
            {versions.map(v => (
              <option key={v.lyric_version_id} value={v.lyric_version_id}>
                {v.snapshot_name}
              </option>
            ))}
          </select>
        </div>

        <div className="selector">
          <label>Modified (Right):</label>
          <select
            value={rightVersionId || ''}
            onChange={(e) => setRightVersionId(e.target.value || null)}
          >
            <option value="">Select version...</option>
            {versions.map(v => (
              <option key={v.lyric_version_id} value={v.lyric_version_id}>
                {v.snapshot_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="diff-content">
        {leftVersion && rightVersion ? (
          <DiffEditor
            height="100%"
            language="plaintext"
            original={leftVersion.body_text}
            modified={rightVersion.body_text}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              wordWrap: 'on',
              scrollBeyondLastLine: false,
              readOnly: true,
            }}
          />
        ) : (
          <div className="diff-placeholder">
            <p>Select two versions to compare</p>
          </div>
        )}
      </div>

      <div className="diff-info">
        {leftVersion && (
          <div className="version-info">
            <strong>Left:</strong> {leftVersion.snapshot_name}
            {leftVersion.note && <span className="note"> - {leftVersion.note}</span>}
          </div>
        )}
        {rightVersion && (
          <div className="version-info">
            <strong>Right:</strong> {rightVersion.snapshot_name}
            {rightVersion.note && <span className="note"> - {rightVersion.note}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

export default DiffViewer;