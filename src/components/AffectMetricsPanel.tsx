import { useMemo } from 'react';
import { analyzeLyricAffect, EmotionName } from '../lib/affect/lyricsAffectMetrics';
import { useLanguage } from '../lib/LanguageContext';

interface AffectMetricsPanelProps {
  text: string;
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

function AffectMetricsPanel({ text }: AffectMetricsPanelProps) {
  const { language, t } = useLanguage();
  const metrics = useMemo(() => analyzeLyricAffect(text), [text]);
  const labels = EMOTION_LABELS[language];

  const metricItems = [
    { key: 'valence', label: t('affectValence'), value: metrics.trend.valence, signed: true },
    { key: 'arousal', label: t('affectArousal'), value: metrics.trend.arousal },
    { key: 'stability', label: t('affectStability'), value: metrics.trend.stability },
    { key: 'density', label: t('affectDensity'), value: metrics.waveParameter.density },
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

      <div className="affect-stat-row">
        <span>{t('affectLyricLines')}: {metrics.textStats.lyricLineCount}</span>
        <span>{t('chars')}: {metrics.textStats.characterCount}</span>
        <span>{t('affectLexicalVariety')}: {formatScore(metrics.textStats.lexicalVariety)}</span>
      </div>

      <p className="affect-panel-note">{t('affectMetricsNote')}</p>
    </section>
  );
}

function formatScore(value: number): string {
  return value.toFixed(2);
}

function formatSigned(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}`;
}

export default AffectMetricsPanel;
