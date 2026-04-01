import { useState } from 'react';
import { LyricVersion } from '../../lib/api';
import { useLanguage } from '../../lib/LanguageContext';

interface VersionPaneProps {
  versions: LyricVersion[];
  width: number;
  styleText: string;
  vocalText: string;
  onStyleTextChange: (text: string) => void;
  onVocalTextChange: (text: string) => void;
  onRestoreVersion: (version: LyricVersion) => void;
  onHideVersion: (version: LyricVersion) => void;
  onShowDiff: () => void;
}

function VersionPane({
  versions,
  width,
  styleText,
  vocalText,
  onStyleTextChange,
  onVocalTextChange,
  onRestoreVersion,
  onHideVersion,
  onShowDiff,
}: VersionPaneProps) {
  const { language, t } = useLanguage();
  const [styleCopied, setStyleCopied] = useState(false);
  const [vocalCopied, setVocalCopied] = useState(false);

  const countChars = (text: string) => {
    return text.replace(/\s/g, '').length;
  };

  const copyToClipboard = async (text: string, setCopied: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.error('Failed to copy:', e);
    }
  };

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
      {/* Style Input Section */}
      <div className="nav-section style-section">
        <div className="nav-section-header">
          <span className="nav-section-title">Style</span>
          <div className="nav-section-header-right">
            <span className={`char-count ${isOverLimit ? 'char-count-warning' : ''}`}>{countChars(styleText)} {t('chars')}</span>
            <button
              className="copy-mini-btn"
              onClick={() => copyToClipboard(styleText, setStyleCopied)}
              disabled={!styleText.trim()}
              title="コピー"
            >
              {styleCopied ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              )}
            </button>
          </div>
        </div>
        <div className="mini-editor-wrapper">
          <textarea
            className="mini-editor-textarea"
            value={styleText}
            onChange={(event) => onStyleTextChange(event.target.value)}
            spellCheck={false}
          />
        </div>
      </div>

      {/* Vocal Input Section */}
      <div className="nav-section vocal-section">
        <div className="nav-section-header">
          <span className="nav-section-title">Vocal</span>
          <div className="nav-section-header-right">
            <span className={`char-count ${isOverLimit ? 'char-count-warning' : ''}`}>{countChars(vocalText)} {t('chars')}</span>
            <button
              className="copy-mini-btn"
              onClick={() => copyToClipboard(vocalText, setVocalCopied)}
              disabled={!vocalText.trim()}
              title="コピー"
            >
              {vocalCopied ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              )}
            </button>
          </div>
        </div>
        <div className="mini-editor-wrapper">
          <textarea
            className="mini-editor-textarea"
            value={vocalText}
            onChange={(event) => onVocalTextChange(event.target.value)}
            spellCheck={false}
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
              <div
                key={version.lyric_version_id}
                className="version-timeline-item"
              >
                <button
                  className="version-timeline-main"
                  onClick={() => onRestoreVersion(version)}
                >
                  <div className={`timeline-dot ${index === 0 ? 'latest' : ''}`} />
                  <div className="timeline-content">
                    <span className="timeline-name">{version.snapshot_name}</span>
                    <span className="timeline-date">{formatDate(version.created_at)}</span>
                  </div>
                </button>
                <button
                  className="version-hide-btn"
                  onClick={(event) => {
                    event.stopPropagation();
                    onHideVersion(version);
                  }}
                  title={t('hideVersion')}
                >
                  {t('hide')}
                </button>
              </div>
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
      </div>
    </aside>
  );
}

export default VersionPane;
