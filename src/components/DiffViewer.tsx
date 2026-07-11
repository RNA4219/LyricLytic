import { useState, useMemo } from 'react';
import { DiffEditor } from '@monaco-editor/react';
import { LyricVersion } from '../lib/api';
import { useLanguage } from '../lib/LanguageContext';
import {
  compareLyricAffectVersions,
  AffectComparisonNote,
  LyricAffectComparison,
} from '../lib/affect/lyricsAffectMetrics';

interface DiffStats {
  linesAdded: number;
  linesRemoved: number;
  linesModified: number;
  totalChanges: number;
}

function computeDiffStats(original: string, modified: string): DiffStats {
  const originalLines = original.split('\n');
  const modifiedLines = modified.split('\n');
  const dp = Array.from({ length: originalLines.length + 1 }, () =>
    new Array<number>(modifiedLines.length + 1).fill(0)
  );

  for (let i = originalLines.length - 1; i >= 0; i -= 1) {
    for (let j = modifiedLines.length - 1; j >= 0; j -= 1) {
      if (originalLines[i] === modifiedLines[j]) {
        dp[i][j] = dp[i + 1][j + 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  let linesAdded = 0;
  let linesRemoved = 0;
  let linesModified = 0;
  let pendingAdded = 0;
  let pendingRemoved = 0;
  let i = 0;
  let j = 0;

  const flushPending = () => {
    if (pendingAdded === 0 && pendingRemoved === 0) return;
    const modifiedCount = Math.min(pendingAdded, pendingRemoved);
    linesModified += modifiedCount;
    linesAdded += Math.max(0, pendingAdded - modifiedCount);
    linesRemoved += Math.max(0, pendingRemoved - modifiedCount);
    pendingAdded = 0;
    pendingRemoved = 0;
  };

  while (i < originalLines.length && j < modifiedLines.length) {
    if (originalLines[i] === modifiedLines[j]) {
      flushPending();
      i += 1;
      j += 1;
      continue;
    }

    if (dp[i + 1][j] >= dp[i][j + 1]) {
      pendingRemoved += 1;
      i += 1;
    } else {
      pendingAdded += 1;
      j += 1;
    }
  }

  pendingRemoved += originalLines.length - i;
  pendingAdded += modifiedLines.length - j;
  flushPending();

  const totalChanges = linesAdded + linesRemoved + linesModified;

  return {
    linesAdded,
    linesRemoved,
    linesModified,
    totalChanges,
  };
}

interface DiffViewerProps {
  versions: LyricVersion[];
  onClose: () => void;
  onRestore?: (version: LyricVersion) => void;
}

type CompareField = 'lyrics' | 'style' | 'vocal';

function DiffViewer({ versions, onClose, onRestore }: DiffViewerProps) {
  const { language, t } = useLanguage();
  const [leftVersionId, setLeftVersionId] = useState<string | null>(
    versions.length > 1 ? versions[1].lyric_version_id : null
  );
  const [rightVersionId, setRightVersionId] = useState<string | null>(
    versions.length > 0 ? versions[0].lyric_version_id : null
  );
  const [compareField, setCompareField] = useState<CompareField>('lyrics');

  const leftVersion = versions.find(v => v.lyric_version_id === leftVersionId);
  const rightVersion = versions.find(v => v.lyric_version_id === rightVersionId);

  const getFieldValue = (version: LyricVersion | undefined, field: CompareField) => {
    if (!version) return '';
    switch (field) {
      case 'style':
        return version.style_text || '';
      case 'vocal':
        return version.vocal_text || '';
      case 'lyrics':
      default:
        return version.body_text;
    }
  };

  const compareText = useMemo(() => ({
    left: getFieldValue(leftVersion, compareField),
    right: getFieldValue(rightVersion, compareField),
  }), [leftVersion, rightVersion, compareField]);

  const diffStats = useMemo(() => {
    if (!leftVersion || !rightVersion) return null;
    return computeDiffStats(compareText.left, compareText.right);
  }, [leftVersion, rightVersion, compareText]);

  const affectComparison = useMemo(() => {
    if (!leftVersion || !rightVersion || compareField !== 'lyrics') return null;
    return compareLyricAffectVersions(compareText.left, compareText.right);
  }, [leftVersion, rightVersion, compareField, compareText]);

  const handleRestoreLeft = () => {
    if (leftVersion && onRestore) {
      onRestore(leftVersion);
      onClose();
    }
  };

  const handleRestoreRight = () => {
    if (rightVersion && onRestore) {
      onRestore(rightVersion);
      onClose();
    }
  };

  const swapVersions = () => {
    setLeftVersionId(rightVersionId);
    setRightVersionId(leftVersionId);
  };

  return (
    <div className="diff-viewer">
      <div className="diff-header">
        <div>
          <h3>{t('diffTitle')}</h3>
          <p className="diff-subtitle">{t('diffSubtitle')}</p>
        </div>
        <button onClick={onClose} className="close-btn">×</button>
      </div>

      <div className="diff-toolbar">
        <div className="selector-card">
          <div className="selector-card-header">
            <label>{t('diffOriginal')}</label>
            {leftVersion && onRestore && (
              <button className="restore-chip" onClick={handleRestoreLeft}>
                {t('restoreFromLeft')}
              </button>
            )}
          </div>
          <select
            value={leftVersionId || ''}
            onChange={(e) => setLeftVersionId(e.target.value || null)}
          >
            <option value="">{t('diffSelectVersion')}</option>
            {versions.map(v => (
              <option key={v.lyric_version_id} value={v.lyric_version_id}>
                {v.snapshot_name}
              </option>
            ))}
          </select>
          {leftVersion && (
            <div className="selector-meta">
              <span>{new Date(leftVersion.created_at).toLocaleString('ja-JP')}</span>
              {leftVersion.note && <span className="selector-note">{leftVersion.note}</span>}
            </div>
          )}
        </div>

        <button className="swap-btn" onClick={swapVersions} title={t('swapSides')}>
          ⇄
        </button>

        <div className="selector-card">
          <div className="selector-card-header">
            <label>{t('diffModified')}</label>
            {rightVersion && onRestore && (
              <button className="restore-chip" onClick={handleRestoreRight}>
                {t('restoreFromRight')}
              </button>
            )}
          </div>
          <select
            value={rightVersionId || ''}
            onChange={(e) => setRightVersionId(e.target.value || null)}
          >
            <option value="">{t('diffSelectVersion')}</option>
            {versions.map(v => (
              <option key={v.lyric_version_id} value={v.lyric_version_id}>
                {v.snapshot_name}
              </option>
            ))}
          </select>
          {rightVersion && (
            <div className="selector-meta">
              <span>{new Date(rightVersion.created_at).toLocaleString('ja-JP')}</span>
              {rightVersion.note && <span className="selector-note">{rightVersion.note}</span>}
            </div>
          )}
        </div>
      </div>

      <div className="diff-field-tabs" role="tablist" aria-label={t('diffTarget')}>
        {(['lyrics', 'style', 'vocal'] as CompareField[]).map((field) => (
          <button
            key={field}
            type="button"
            role="tab"
            aria-selected={compareField === field}
            className={`diff-field-tab ${compareField === field ? 'active' : ''}`}
            onClick={() => setCompareField(field)}
          >
            {field === 'lyrics' ? t('diffFieldLyrics') : field === 'style' ? t('diffFieldStyle') : t('diffFieldVocal')}
          </button>
        ))}
      </div>

      {diffStats && (
        <div className="diff-summary">
          <div className="diff-stats">
            <span className="stat-added">+{diffStats.linesAdded} {t('linesAdded')}</span>
            <span className="stat-removed">-{diffStats.linesRemoved} {t('linesRemoved')}</span>
            <span className="stat-modified">~{diffStats.linesModified} {t('linesModified')}</span>
            <span className="stat-total">{diffStats.totalChanges} {t('totalChanges')}</span>
          </div>
        </div>
      )}

      {affectComparison && (
        <AffectDiffSummary
          comparison={affectComparison}
          language={language}
          labels={{
            title: t('affectComparisonTitle'),
            notes: t('affectComparisonNotes'),
            valence: t('affectValence'),
            arousal: t('affectArousal'),
            density: t('affectDensity'),
            tension: t('affectTension'),
          }}
        />
      )}

      <div className="diff-content">
        {leftVersion && rightVersion ? (
          <DiffEditor
            height="100%"
            language="plaintext"
            original={compareText.left}
            modified={compareText.right}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              wordWrap: 'on',
              scrollBeyondLastLine: false,
              readOnly: true,
              renderSideBySide: true,
              diffWordWrap: 'on',
              renderIndicators: true,
              originalEditable: false,
              stickyScroll: { enabled: false },
              glyphMargin: false,
            }}
          />
        ) : (
          <div className="diff-placeholder">
            <p>{t('selectTwoVersionsToCompare')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AffectDiffSummary({
  comparison,
  language,
  labels,
}: {
  comparison: LyricAffectComparison;
  language: 'ja' | 'en';
  labels: {
    title: string;
    notes: string;
    valence: string;
    arousal: string;
    density: string;
    tension: string;
  };
}) {
  const items = [
    { key: 'valence', label: labels.valence, value: comparison.delta.valence },
    { key: 'arousal', label: labels.arousal, value: comparison.delta.arousal },
    { key: 'density', label: labels.density, value: comparison.delta.density },
    { key: 'tension', label: labels.tension, value: comparison.delta.tension },
  ] as const;

  return (
    <div className="diff-affect-summary">
      <div className="diff-affect-header">
        <span>{labels.title}</span>
      </div>
      <div className="diff-affect-grid">
        {items.map((item) => (
          <div key={item.key} className="diff-affect-cell">
            <span>{item.label}</span>
            <strong className={item.value >= 0 ? 'positive' : 'negative'}>{formatSigned(item.value)}</strong>
          </div>
        ))}
      </div>
      {comparison.notes.length > 0 && (
        <div className="diff-affect-notes">
          <span>{labels.notes}</span>
          <ul>
            {comparison.notes.slice(0, 3).map((note) => (
              <li key={`${note.kind}-${note.sectionName ?? 'all'}`}>
                {formatComparisonNote(note, language)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function formatComparisonNote(note: AffectComparisonNote, language: 'ja' | 'en'): string {
  const sectionPrefix = note.sectionName ? `${note.sectionName}: ` : '';
  const delta = formatSigned(note.delta);

  if (language === 'en') {
    switch (note.kind) {
      case 'valence_up':
        return `Brightness increased ${delta}.`;
      case 'valence_down':
        return `Brightness decreased ${delta}.`;
      case 'density_up':
        return `Density increased ${delta}.`;
      case 'density_down':
        return `Density decreased ${delta}.`;
      case 'tension_up':
        return `Tension increased ${delta}.`;
      case 'tension_down':
        return `Tension decreased ${delta}.`;
      case 'section_density_up':
        return `${sectionPrefix}density increased ${delta}.`;
      case 'section_density_down':
        return `${sectionPrefix}density decreased ${delta}.`;
      case 'section_tension_up':
        return `${sectionPrefix}tension increased ${delta}.`;
      case 'section_tension_down':
        return `${sectionPrefix}tension decreased ${delta}.`;
      default:
        return `Affect changed ${delta}.`;
    }
  }

  switch (note.kind) {
    case 'valence_up':
      return `明るさが上がりました ${delta}。`;
    case 'valence_down':
      return `明るさが下がりました ${delta}。`;
    case 'density_up':
      return `密度が上がりました ${delta}。`;
    case 'density_down':
      return `密度が下がりました ${delta}。`;
    case 'tension_up':
      return `緊張度が上がりました ${delta}。`;
    case 'tension_down':
      return `緊張度が下がりました ${delta}。`;
    case 'section_density_up':
      return `${sectionPrefix}密度が上がりました ${delta}。`;
    case 'section_density_down':
      return `${sectionPrefix}密度が下がりました ${delta}。`;
    case 'section_tension_up':
      return `${sectionPrefix}緊張度が上がりました ${delta}。`;
    case 'section_tension_down':
      return `${sectionPrefix}緊張度が下がりました ${delta}。`;
    default:
      return `感情値が変化しました ${delta}。`;
  }
}

function formatSigned(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}`;
}

export default DiffViewer;
