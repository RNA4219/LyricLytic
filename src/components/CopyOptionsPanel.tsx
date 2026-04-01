import { useState, useEffect } from 'react';
import { COPY_OPTIONS } from '../lib/config';
import { useLanguage } from '../lib/LanguageContext';

interface CopyOptions {
  includeHeadings: boolean;
  preserveBlankLines: boolean;
}

const DEFAULT_OPTIONS: CopyOptions = {
  includeHeadings: COPY_OPTIONS.DEFAULT_INCLUDE_HEADINGS,
  preserveBlankLines: COPY_OPTIONS.DEFAULT_PRESERVE_BLANK_LINES,
};

function loadOptions(): CopyOptions {
  try {
    const saved = localStorage.getItem(COPY_OPTIONS.STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_OPTIONS, ...JSON.parse(saved) };
    }
  } catch {
    // Ignore parse errors
  }
  return DEFAULT_OPTIONS;
}

function saveOptions(options: CopyOptions): void {
  try {
    localStorage.setItem(COPY_OPTIONS.STORAGE_KEY, JSON.stringify(options));
  } catch {
    // Ignore storage errors
  }
}

interface CopyOptionsPanelProps {
  sections: Array<{
    id: string;
    displayName: string;
    bodyText: string;
  }>;
  activeSectionId: string | null;
  onCopy: (text: string) => void;
}

function CopyOptionsPanel({ sections, activeSectionId, onCopy }: CopyOptionsPanelProps) {
  const { t } = useLanguage();
  const [showOptions, setShowOptions] = useState(false);
  const [options, setOptions] = useState<CopyOptions>(loadOptions);

  // Persist options when they change
  useEffect(() => {
    saveOptions(options);
  }, [options]);

  const formatText = (
    secs: Array<{ displayName: string; bodyText: string }>,
    opts: CopyOptions
  ): string => {
    return secs
      .map(s => {
        let text = s.bodyText;
        if (!opts.preserveBlankLines) {
          text = text.split('\n').filter(line => line.trim() !== '').join('\n');
        }
        if (opts.includeHeadings) {
          return `[${s.displayName}]\n${text}`;
        }
        return text;
      })
      .join('\n\n');
  };

  const handleCopyAll = () => {
    const text = formatText(sections, options);
    navigator.clipboard.writeText(text);
    onCopy(text);
  };

  const handleCopySection = () => {
    const section = sections.find(s => s.id === activeSectionId);
    if (!section) return;

    let text = section.bodyText;
    if (!options.preserveBlankLines) {
      text = text.split('\n').filter(line => line.trim() !== '').join('\n');
    }
    if (options.includeHeadings) {
      text = `[${section.displayName}]\n${text}`;
    }
    navigator.clipboard.writeText(text);
    onCopy(text);
  };

  return (
    <div className="copy-options-panel">
      <div className="copy-main-actions">
        <button onClick={handleCopyAll} className="copy-btn">
          📋 {t('copyAll')}
        </button>
        <button onClick={handleCopySection} className="copy-btn" disabled={!activeSectionId}>
          📄 {t('copySection')}
        </button>
        <button
          onClick={() => setShowOptions(!showOptions)}
          className={`options-toggle ${showOptions ? 'active' : ''}`}
        >
          ⚙️
        </button>
      </div>

      {showOptions && (
        <div className="copy-options">
          <label className="option-row">
            <input
              type="checkbox"
              checked={options.includeHeadings}
              onChange={(e) => setOptions({ ...options, includeHeadings: e.target.checked })}
            />
            {t('includeSectionHeadings')}
          </label>
          <label className="option-row">
            <input
              type="checkbox"
              checked={options.preserveBlankLines}
              onChange={(e) => setOptions({ ...options, preserveBlankLines: e.target.checked })}
            />
            {t('preserveBlankLines')}
          </label>
        </div>
      )}
    </div>
  );
}

export default CopyOptionsPanel;
