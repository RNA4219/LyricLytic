import { useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';

interface ImportDialogProps {
  projectId: string;
  onImportAsFragment: (text: string, source: string) => void;
  onImportAsBody: (text: string) => void;
  onClose: () => void;
}

function ImportDialog({ onImportAsFragment, onImportAsBody, onClose }: ImportDialogProps) {
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<'fragment' | 'body'>('fragment');

  const handleSelectFile = async () => {
    try {
      setError(null);
      const selected = await open({
        multiple: false,
        filters: [{ name: 'Text', extensions: ['txt'] }],
      });

      if (selected) {
        const filePath = typeof selected === 'string' ? selected : null;
        if (filePath) {
          // Read file content using fetch
          const response = await fetch(`file://${filePath}`);
          const text = await response.text();
          setFileContent(text);
          setFileName(filePath.split(/[/\\]/).pop() || 'unknown.txt');
        }
      }
    } catch (e) {
      setError('Failed to read file. Please try another file.');
      console.error(e);
    }
  };

  const handleImport = async () => {
    if (!fileContent) return;

    try {
      if (importMode === 'fragment') {
        onImportAsFragment(fileContent, fileName);
      } else {
        onImportAsBody(fileContent);
      }
      onClose();
    } catch (e) {
      setError('Import failed');
      console.error(e);
    }
  };

  return (
    <div className="dialog-overlay">
      <div className="dialog import-dialog">
        <h3>Import Text File</h3>

        {!fileContent ? (
          <div className="import-file-select">
            <p>Select a .txt file to import:</p>
            <button onClick={handleSelectFile} className="select-file-btn">
              📁 Select File
            </button>
            {error && <p className="error">{error}</p>}
          </div>
        ) : (
          <>
            <div className="import-preview">
              <p className="file-name">📄 {fileName}</p>
              <pre className="preview-content">{fileContent.substring(0, 500)}{fileContent.length > 500 ? '...' : ''}</pre>
            </div>

            <div className="import-mode">
              <label>
                <input
                  type="radio"
                  name="importMode"
                  checked={importMode === 'fragment'}
                  onChange={() => setImportMode('fragment')}
                />
                Import as Fragment
              </label>
              <label>
                <input
                  type="radio"
                  name="importMode"
                  checked={importMode === 'body'}
                  onChange={() => setImportMode('body')}
                />
                Import as Body Text
              </label>
            </div>

            {error && <p className="error">{error}</p>}

            <div className="dialog-buttons">
              <button onClick={() => { setFileContent(null); setFileName(''); }}>
                Reselect
              </button>
              <button onClick={handleImport} className="primary">
                Import
              </button>
            </div>
          </>
        )}

        <button onClick={onClose} className="close-dialog-btn">
          Cancel
        </button>
      </div>
    </div>
  );
}

export default ImportDialog;