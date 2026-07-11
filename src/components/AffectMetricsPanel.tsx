import { useMemo } from 'react';
import {
  analyzeLyricAffectInsight,
  AffectProductionAlert,
  EmotionName,
} from '../lib/affect/lyricsAffectMetrics';
import { useLanguage } from '../lib/LanguageContext';
import { Section, sectionsToBody } from '../lib/section';

interface AffectMetricsPanelProps {
  text: string;
  sections?: Section[];
}

const EMOTION_LABELS: Record<'ja' | 'en', Record<EmotionName, string>> = {
  ja: {
    joy: '喜び',
    calm: '静けさ',
    curiosity: '探求',
    surprise: '驚き',
    tension: '緊張',
    sadness: '悲しみ',
    anger: '怒り',
    fear: '恐れ',
  },
  en: {
    joy: 'Joy',
    calm: 'Calm',
    curiosity: 'Curiosity',
    surprise: 'Surprise',
    tension: 'Tension',
    sadness: 'Sadness',
    anger: 'Anger',
    fear: 'Fear',
  },
};

function AffectMetricsPanel({ text, sections = [] }: AffectMetricsPanelProps) {
  const { language, t } = useLanguage();
  const fullText = useMemo(() => (
    sections.length > 0 ? sectionsToBody(sections) : text
  ), [sections, text]);
  const sectionInputs = useMemo(() => sections.map((section) => ({
    id: section.id,
    type: section.type,
    displayName: section.displayName,
    sortOrder: section.sortOrder,
    bodyText: section.bodyText,
  })), [sections]);
  const insight = useMemo(() => analyzeLyricAffectInsight({
    fullText,
    sections: sectionInputs,
  }), [fullText, sectionInputs]);
  const metrics = insight.overall;
  const labels = EMOTION_LABELS[language];

  const metricItems = [
    { key: 'valence', label: t('affectValence'), value: metrics.trend.valence, signed: true },
    { key: 'arousal', label: t('affectArousal'), value: metrics.trend.arousal },
    { key: 'density', label: t('affectDensity'), value: metrics.waveParameter.density },
    { key: 'tension', label: t('affectTension'), value: metrics.derived.tension },
  ];

  return (
    <section className="affect-panel" aria-label={t('affectMetricsTitle')}>
      <div className="llm-section-header affect-panel-header">
        <h3>{t('affectMetricsTitle')}</h3>
        <span className="affect-density-badge">
          {t('affectDensity')} {formatScore(metrics.waveParameter.density)}
        </span>
      </div>

      <div className="affect-emotion-list">
        {metrics.topEmotions.map((emotion) => (
          <div key={emotion.name} className="affect-emotion-row">
            <div className="affect-emotion-meta">
              <span>{labels[emotion.name]}</span>
              <strong>{formatScore(emotion.score)}</strong>
            </div>
            <div className="affect-meter-track" aria-hidden="true">
              <span style={{ width: `${Math.round(emotion.score * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="affect-metric-grid">
        {metricItems.map((item) => (
          <div key={item.key} className="affect-metric-cell">
            <span>{item.label}</span>
            <strong>{item.signed ? formatSigned(item.value) : formatScore(item.value)}</strong>
          </div>
        ))}
      </div>

      {insight.sections.length > 0 && (
        <div className="affect-subpanel">
          <div className="affect-subpanel-header">
            <span>{t('affectSectionMetrics')}</span>
          </div>
          <div className="affect-section-list">
            {insight.sections.map((section) => (
              <div key={section.id} className="affect-section-row">
                <div className="affect-section-main">
                  <strong>{section.displayName}</strong>
                  <span>{labels[section.metrics.topEmotions[0]?.name ?? 'calm']}</span>
                </div>
                <div className="affect-section-values">
                  <span>{t('affectValence')} {formatSigned(section.metrics.trend.valence)}</span>
                  <span>{t('affectDensity')} {formatScore(section.metrics.waveParameter.density)}</span>
                  <span>{t('affectTension')} {formatScore(section.metrics.derived.tension)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {insight.wave.length > 0 && (
        <div className="affect-subpanel">
          <div className="affect-subpanel-header">
            <span>{t('affectWaveView')}</span>
          </div>
          <div className="affect-wave-list">
            {insight.wave.slice(0, 8).map((point) => (
              <div key={point.id} className="affect-wave-row">
                <span className="affect-wave-label">{point.label}</span>
                <MetricBar label={t('affectValence')} value={normalizeValence(point.valence)} signedValue={point.valence} />
                <MetricBar label={t('affectArousal')} value={point.arousal} />
                <MetricBar label={t('affectDensity')} value={point.density} />
                <MetricBar label={t('affectTension')} value={point.tension} />
              </div>
            ))}
          </div>
        </div>
      )}

      {metrics.evidence.length > 0 && (
        <div className="affect-subpanel">
          <div className="affect-subpanel-header">
            <span>{t('affectEvidence')}</span>
          </div>
          <div className="affect-evidence-list">
            {metrics.evidence.slice(0, 5).map((item) => (
              <div key={`${item.lineNumber}-${item.emotion}-${item.marker}`} className="affect-evidence-row">
                <span className="affect-evidence-marker">{item.marker}</span>
                <span>{labels[item.emotion]} / L{item.lineNumber}</span>
                <small>{item.lineText}</small>
              </div>
            ))}
          </div>
        </div>
      )}

      {insight.alerts.length > 0 && (
        <div className="affect-subpanel">
          <div className="affect-subpanel-header">
            <span>{t('affectProductionAlerts')}</span>
          </div>
          <div className="affect-alert-list">
            {insight.alerts.map((alert) => (
              <div key={`${alert.kind}-${alert.sectionName ?? 'all'}`} className={`affect-alert-row ${alert.severity}`}>
                {formatAlert(alert, language)}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="affect-stat-row">
        <span>{t('affectLyricLines')}: {metrics.textStats.lyricLineCount}</span>
        <span>{t('chars')}: {metrics.textStats.characterCount}</span>
        <span>{t('affectLexicalVariety')}: {formatScore(metrics.textStats.lexicalVariety)}</span>
      </div>

      <p className="affect-panel-note">{t('affectMetricsNote')}</p>
    </section>
  );
}

function MetricBar({
  label,
  value,
  signedValue,
}: {
  label: string;
  value: number;
  signedValue?: number;
}) {
  return (
    <div className="affect-wave-metric">
      <span>{label}</span>
      <div className="affect-wave-track" aria-hidden="true">
        <span style={{ width: `${Math.round(value * 100)}%` }} />
      </div>
      <strong>{typeof signedValue === 'number' ? formatSigned(signedValue) : formatScore(value)}</strong>
    </div>
  );
}

function formatScore(value: number): string {
  return value.toFixed(2);
}

function formatSigned(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}`;
}

function normalizeValence(value: number): number {
  return (value + 1) / 2;
}

function formatAlert(alert: AffectProductionAlert, language: 'ja' | 'en'): string {
  const sectionName = alert.sectionName ? `${alert.sectionName}: ` : '';
  const delta = typeof alert.detail.delta === 'number' ? ` (${formatSigned(alert.detail.delta)})` : '';

  if (language === 'en') {
    switch (alert.kind) {
      case 'chorus_density_below_verse':
        return `${sectionName}Chorus density is below Verse${delta}.`;
      case 'flat_late_wave':
        return 'The emotional wave is relatively flat across the song.';
      case 'mixed_language_low_confidence':
        return 'Japanese and Latin text are mixed, so density estimates may be softer.';
      case 'sustained_tension':
        return `${sectionName}High-tension sections continue in sequence.`;
      default:
        return 'Review this affect signal.';
    }
  }

  switch (alert.kind) {
    case 'chorus_density_below_verse':
      return `${sectionName}Chorus の密度が Verse より低めです${delta}。`;
    case 'flat_late_wave':
      return '曲中の感情波形が比較的平坦です。';
    case 'mixed_language_low_confidence':
      return '英日混在のため、密度推定が弱く出る可能性があります。';
    case 'sustained_tension':
      return `${sectionName}高緊張のセクションが続いています。`;
    default:
      return '感情メトリクスを確認してください。';
  }
}

export default AffectMetricsPanel;
