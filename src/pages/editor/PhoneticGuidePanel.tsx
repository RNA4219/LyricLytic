import type { ReactNode } from 'react';
import type { TranslationKey } from '../../lib/LanguageContext';
import type { RhymeGuideRow } from '../../lib/rhyme/analysis';

interface PhoneticGuidePanelProps {
  height: number;
  rows: RhymeGuideRow[];
  sourceLabel: string;
  onResizeStart: () => void;
  renderGuideValue: (value: string, previousValue?: string) => ReactNode;
  t: (key: TranslationKey) => string;
}

function PhoneticGuidePanel({
  height,
  rows,
  sourceLabel,
  onResizeStart,
  renderGuideValue,
  t,
}: PhoneticGuidePanelProps) {
  return (
    <>
      <div
        className="editor-horizontal-resize-handle"
        onMouseDown={onResizeStart}
        role="separator"
        aria-orientation="horizontal"
        aria-label="歌詞入力欄と韻ガイドの高さ調整"
      />
      <div className="phonetic-guide-panel" style={{ height: `${height}px` }}>
        <div className="phonetic-guide-header">
          <h4>{t('rhymeGuide')}</h4>
          <span className="phonetic-guide-source">
            {t('analysisSource')}: {sourceLabel}
          </span>
        </div>
        {rows.length === 0 ? (
          <p className="phonetic-guide-empty">{t('noPhoneticGuide')}</p>
        ) : (
          <div className="phonetic-guide-list">
            {rows.map((row, index) => (
              <div key={`${index}-${row.line}`} className="phonetic-guide-row">
                <div className="phonetic-line-text">{row.line}</div>
                <div className="phonetic-spellings">
                  <div className="phonetic-chip">
                    <span className="phonetic-chip-label">{t('romanizedSpelling')}</span>
                    {renderGuideValue(row.romanizedText, rows[index - 1]?.romanizedText)}
                  </div>
                  <div className="phonetic-chip">
                    <span className="phonetic-chip-label">{t('vowelSpelling')}</span>
                    {renderGuideValue(row.vowelText, rows[index - 1]?.vowelText)}
                  </div>
                  <div className="phonetic-chip">
                    <span className="phonetic-chip-label">{t('consonantSpelling')}</span>
                    {renderGuideValue(row.consonantText, rows[index - 1]?.consonantText)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default PhoneticGuidePanel;
