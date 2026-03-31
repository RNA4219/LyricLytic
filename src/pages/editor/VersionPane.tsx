import Editor from '@monaco-editor/react';
import { LyricVersion } from '../../lib/api';
import { useLanguage } from '../../lib/LanguageContext';

interface VersionPaneProps {
  projectTitle: string;
  versions: LyricVersion[];
  saving: boolean;
  lastSaved: Date | null;
  width: number;
  styleText: string;
  vocalText: string;
  onStyleTextChange: (text: string) => void;
  onVocalTextChange: (text: string) => void;
  onToggleVisibility: () => void;
  onOpenNotes: (version: LyricVersion) => void;
  onRestoreVersion: (version: LyricVersion) => void;
  onShowDiff: () => void;
}

function VersionPane({
  projectTitle,
  versions,
  saving,
  lastSaved,
  width,
  styleText,
  vocalText,
  onStyleTextChange,
  onVocalTextChange,
  onToggleVisibility,
  onOpenNotes,
  onRestoreVersion,
  onShowDiff,
}: VersionPaneProps) {
  const { language, t } = useLanguage();

  // Character count function
  const countChars = (text: string) => {
    return text.replace(/\s/g, '').length;
  };

  // Total character count for warning
  const totalChars = countChars(styleText) + countChars(vocalText);
  const isOverLimit = totalChars >= 1000;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(language === 'ja' ? 'ja-JP' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <aside className="left-pane structure-nav" style={{ width: `${width}px`, minWidth: `${width}px` }}>
      {/* Project Header */}
      <div className="nav-header">
        <div className="nav-header-main">
          <button
            type="button"
            className="left-pane-edge-toggle"
            onClick={onToggleVisibility}
            aria-label="左ペインを隠す"
            title="左ペインを隠す"
          >
            <span className="left-pane-toggle-bars" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </button>
          <div className="project-brand">
            <span className="brand-name">LyricLytic</span>
            <h1 className="project-title-display">{projectTitle}</h1>
          </div>
        </div>
        {(saving || lastSaved) && (
          <div className="save-status">
            {saving && <span className="saving-indicator">{t('loading')}</span>}
            {lastSaved && !saving && (
              <span className="saved-indicator">
                {t('autosaved')} {lastSaved.toLocaleTimeString(language === 'ja' ? 'ja-JP' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Style Input Section */}
      <div className="nav-section style-section">
        <div className="nav-section-header">
          <span className="nav-section-title">Style</span>
          <span className={`char-count ${isOverLimit ? 'char-count-warning' : ''}`}>{countChars(styleText)} {t('chars')}</span>
        </div>
        <div className="mini-editor-container">
          <Editor
            height={120}
            defaultLanguage="plaintext"
            value={styleText}
            onChange={(value) => onStyleTextChange(value || '')}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              lineNumbers: 'off',
              glyphMargin: false,
              folding: false,
              lineDecorationsWidth: 0,
              lineNumbersMinChars: 0,
              renderLineHighlight: 'none',
              scrollBeyondLastLine: false,
              readOnly: false,
              fontSize: 13,
              fontFamily: "'Inter', 'Noto Sans JP', sans-serif",
              wordWrap: 'on',
              padding: { top: 8, bottom: 8 },
              scrollbar: {
                vertical: 'auto',
                horizontal: 'hidden',
              },
              overviewRulerLanes: 0,
              hideCursorInOverviewRuler: true,
              overviewRulerBorder: false,
            }}
          />
        </div>
      </div>

      {/* Vocal Input Section */}
      <div className="nav-section vocal-section">
        <div className="nav-section-header">
          <span className="nav-section-title">Vocal</span>
          <span className={`char-count ${isOverLimit ? 'char-count-warning' : ''}`}>{countChars(vocalText)} {t('chars')}</span>
        </div>
        <div className="mini-editor-container">
          <Editor
            height={120}
            defaultLanguage="plaintext"
            value={vocalText}
            onChange={(value) => onVocalTextChange(value || '')}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              lineNumbers: 'off',
              glyphMargin: false,
              folding: false,
              lineDecorationsWidth: 0,
              lineNumbersMinChars: 0,
              renderLineHighlight: 'none',
              scrollBeyondLastLine: false,
              readOnly: false,
              fontSize: 13,
              fontFamily: "'Inter', 'Noto Sans JP', sans-serif",
              wordWrap: 'on',
              padding: { top: 8, bottom: 8 },
              scrollbar: {
                vertical: 'auto',
                horizontal: 'hidden',
              },
              overviewRulerLanes: 0,
              hideCursorInOverviewRuler: true,
              overviewRulerBorder: false,
            }}
          />
        </div>
      </div>

      {/* Version Timeline */}
      {versions.length > 0 && (
        <div className="nav-section">
          <div className="nav-section-header">
            <span className="nav-section-title">{t('history')}</span>
            <span className="nav-section-count">{versions.length}</span>
          </div>
          <div className="version-timeline-nav">
            {versions.slice(0, 5).map((version, index) => (
              <button
                key={version.lyric_version_id}
                className="version-timeline-item"
                onClick={() => onRestoreVersion(version)}
              >
                <div className={`timeline-dot ${index === 0 ? 'latest' : ''}`} />
                <div className="timeline-content">
                  <span className="timeline-name">{version.snapshot_name}</span>
                  <span className="timeline-date">{formatDate(version.created_at)}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="nav-quick-actions">
        <span className="quick-actions-label">{t('quickPanels')}</span>
        <button className="quick-action-btn" onClick={onShowDiff}>
          <span className="quick-action-main">
            <span className="quick-action-icon">⇄</span>
            <span className="quick-action-text">{t('compareVersions')}</span>
          </span>
          <span className="quick-action-meta">{t('open')}</span>
        </button>
        {versions.length > 0 && versions.slice(0, 1).map((version) => (
          <button
            key={version.lyric_version_id}
            className="quick-action-btn"
            onClick={() => onOpenNotes(version)}
          >
            <span className="quick-action-main">
              <span className="quick-action-icon">📝</span>
              <span className="quick-action-text">{t('revisionNotes')}</span>
            </span>
            <span className="quick-action-meta">{t('open')}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}

export default VersionPane;