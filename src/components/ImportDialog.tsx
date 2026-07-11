import { useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { readTextFile, type TextEncoding } from '../lib/api';
import Modal from './Modal';
import { useLanguage } from '../lib/LanguageContext';

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
  const { t } = useLanguage();
  const [encoding, setEncoding] = useState<string>('utf-8');
  const [showEncodingSelect, setShowEncodingSelect] = useState(false);

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
      setError(t('readFileFailed'));
      setShowEncodingSelect(true);
      console.error(e);
    }
  };

  const readFileWithEncoding = async (path: string, enc: string) => {
    try {
      const result = await readTextFile(path, enc as TextEncoding);
      const text = result.text;

      // Check for replacement characters which indicate encoding issues
      const hasReplacementChars = result.had_replacements;
      if (hasReplacementChars && enc === 'utf-8') {
        setError(t('possibleEncodingMismatch'));
        setShowEncodingSelect(true);
      } else {
        setFileContent(text);
        setError(null);
      }
    } catch (e) {
      setError(t('readEncodingFailed'));
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
      setError(t('importFailed'));
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
    <Modal title={t('importTextFile')} onClose={onClose} className="import-dialog">

        {!fileContent ? (
          <div className="import-file-select">
            <p>{t('selectTxtFile')}</p>

            <div className="encoding-select">
              <label>{t('encodingLabel')}</label>
              <select value={encoding} onChange={(e) => setEncoding(e.target.value)}>
                {ENCODINGS.map(enc => (
                  <option key={enc.value} value={enc.value}>{enc.label}</option>
                ))}
              </select>
            </div>

            <button onClick={handleSelectFile} className="select-file-btn">
              📁 {t('selectFile')}
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
                      🔄 {t('retryWithEncoding')}
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
                {t('importAsFragment')}
              </label>
              <label>
                <input
                  type="radio"
                  name="importMode"
                  checked={importMode === 'body'}
                  onChange={() => setImportMode('body')}
                />
                {t('importAsBody')}
              </label>
            </div>

            {error && <p className="error">{error}</p>}

            <div className="dialog-buttons">
              <button onClick={handleReset}>
                {t('reselect')}
              </button>
              <button onClick={handleImport} className="primary">
                {t('importAction')}
              </button>
            </div>
          </>
        )}

        <button onClick={onClose} className="close-dialog-btn">
          {t('cancel')}
        </button>
    </Modal>
  );
}

export default ImportDialog;