import { useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { readFile } from '@tauri-apps/plugin-fs';

const ENCODINGS = [
  { value: 'utf-8', label: 'UTF-8' },
  { value: 'shift_jis', label: 'Shift-JIS (Japanese)' },
  { value: 'euc-jp', label: 'EUC-JP' },
  { value: 'iso-2022-jp', label: 'ISO-2022-JP' },
  { value: 'windows-1252', label: 'Windows-1252' },
] as const;

interface ImportDialogProps {
  projectId: string;
  onImportAsFragment: (text: string, source: string) => void;
  onImportAsBody: (text: string) => void;
  onClose: () => void;
}

function ImportDialog({ onImportAsFragment, onImportAsBody, onClose }: ImportDialogProps) {
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [filePath, setFilePath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<'fragment' | 'body'>('fragment');
  const [encoding, setEncoding] = useState<string>('utf-8');
  const [showEncodingSelect, setShowEncodingSelect] = useState(false);

  const decodeBuffer = (buffer: Uint8Array, encodingName: string): string => {
    const decoder = new TextDecoder(encodingName);
    return decoder.decode(buffer);
  };

  const handleSelectFile = async () => {
    try {
      setError(null);
      const selected = await open({
        multiple: false,
        filters: [{ name: 'Text', extensions: ['txt'] }],
      });

      if (selected) {
        const path = typeof selected === 'string' ? selected : null;
        if (path) {
          setFilePath(path);
          setFileName(path.split(/[/\\]/).pop() || 'unknown.txt');
          await readFileWithEncoding(path, encoding);
        }
      }
    } catch (e) {
      setError('Failed to read file. Please try another file or encoding.');
      setShowEncodingSelect(true);
      console.error(e);
    }
  };

  const readFileWithEncoding = async (path: string, enc: string) => {
    try {
      const buffer = await readFile(path);
      const text = decodeBuffer(buffer, enc);

      // Check for replacement characters which indicate encoding issues
      const hasReplacementChars = text.includes('\uFFFD');
      if (hasReplacementChars && enc === 'utf-8') {
        setError('File may not be UTF-8 encoded. Try selecting a different encoding.');
        setShowEncodingSelect(true);
      } else {
        setFileContent(text);
        setError(null);
      }
    } catch (e) {
      setError('Failed to read file with selected encoding.');
      setShowEncodingSelect(true);
      console.error(e);
    }
  };

  const handleRetryEncoding = async () => {
    if (!filePath) return;
    setError(null);
    await readFileWithEncoding(filePath, encoding);
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

  const handleReset = () => {
    setFileContent(null);
    setFileName('');
    setFilePath(null);
    setError(null);
    setShowEncodingSelect(false);
  };

  return (
    <div className="dialog-overlay">
      <div className="dialog import-dialog">
        <h3>Import Text File</h3>

        {!fileContent ? (
          <div className="import-file-select">
            <p>Select a .txt file to import:</p>

            <div className="encoding-select">
              <label>Encoding:</label>
              <select value={encoding} onChange={(e) => setEncoding(e.target.value)}>
                {ENCODINGS.map(enc => (
                  <option key={enc.value} value={enc.value}>{enc.label}</option>
                ))}
              </select>
            </div>

            <button onClick={handleSelectFile} className="select-file-btn">
              📁 Select File
            </button>

            {error && (
              <div className="error-section">
                <p className="error">{error}</p>
                {showEncodingSelect && (
                  <div className="retry-section">
                    <select value={encoding} onChange={(e) => setEncoding(e.target.value)}>
                      {ENCODINGS.map(enc => (
                        <option key={enc.value} value={enc.value}>{enc.label}</option>
                      ))}
                    </select>
                    <button onClick={handleRetryEncoding} className="retry-btn">
                      🔄 Retry with this encoding
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="import-preview">
              <p className="file-name">📄 {fileName}</p>
              <p className="encoding-info">Encoding: {ENCODINGS.find(e => e.value === encoding)?.label || encoding}</p>
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
              <button onClick={handleReset}>
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