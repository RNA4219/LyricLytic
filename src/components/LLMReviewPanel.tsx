import { useEffect, useMemo, useState } from 'react';
import { isAllowedLocalBaseUrl, callLLMAPI, parseLLMJsonResponse } from '../lib/llm/utils';
import { useLanguage } from '../lib/LanguageContext';
import { analyzeRhymeGuideRows } from '../lib/rhyme/analysis';
import { useLLMPanel } from '../lib/hooks';
import type { LLMPanelBaseProps } from '../lib/llm/types';

interface ExpressionMatch {
  text: string;
  hit_count?: number;
  occurrence_ratio: number;
  reason: string;
}

interface LowFreqCandidate {
  text: string;
  rationale: string;
  hit_count?: number;
  occurrence_ratio?: number;
}

interface LLMReviewPanelProps extends LLMPanelBaseProps {
  sectionText: string;
}

type ReviewMode = 'common' | 'novel';

const SAMPLE_COUNT_PRESETS = [500, 1000, 2000, 5000, 10000] as const;

interface PhraseGuideMeta {
  romanizedText: string;
  vowelText: string;
  consonantText: string;
  vowelMatchCount: number;
  consonantMatchCount: number;
}

function LLMReviewPanel({
  runtime,
  baseUrl,
  model,
  enabled,
  timeoutMs = 60000,
  maxTokens = 1024,
  temperature = 0.7,
  sectionText,
}: LLMReviewPanelProps) {
  const { t } = useLanguage();
  const { error, setError, copyMessage, copyToClipboard: copyToClipboardBase } = useLLMPanel();
  const [reviewMode, setReviewMode] = useState<ReviewMode>('novel');
  const [sampleCountPreset, setSampleCountPreset] = useState<string>('1000');
  const [customSampleCount, setCustomSampleCount] = useState('1000');
  const [reviewPrompt, setReviewPrompt] = useState('');
  const [analyzedPrompt, setAnalyzedPrompt] = useState('');
  const [threshold, setThreshold] = useState(0.5);
  const [analyzing, setAnalyzing] = useState(false);
  const [expressions, setExpressions] = useState<ExpressionMatch[]>([]);
  const [candidates, setCandidates] = useState<LowFreqCandidate[]>([]);
  const [showCandidatePanel, setShowCandidatePanel] = useState(false);
  const [guideMetaMap, setGuideMetaMap] = useState<Record<string, PhraseGuideMeta>>({});

  const getThresholdForMode = () => {
    if (reviewMode === 'common') {
      return threshold;
    }

    return Math.max(0, Math.min(1, 1 - threshold));
  };

  const getEffectiveSampleCount = (): number => {
    if (sampleCountPreset !== 'custom') {
      return parseInt(sampleCountPreset, 10);
    }

    const digitsOnly = customSampleCount.replace(/[^0-9]/g, '');
    if (!digitsOnly) {
      return 100;
    }

    const parsed = parseInt(digitsOnly, 10);
    if (!Number.isFinite(parsed)) {
      return 100;
    }

    const clamped = Math.min(100000, Math.max(100, parsed));
    const rounded = Math.round(clamped / 100) * 100;
    return Math.min(100000, Math.max(100, rounded));
  };

  const buildFrequencyCheckPrompt = (lyrics: string, seedPhrase: string, samples: number, mode: ReviewMode): string => {
    return `You are reviewing a lyric draft and one input phrase.

Goal:
- Read the full lyrics context
- Use the input phrase as the main search seed
- Imagine generating ${samples} alternative phrases or nearby rewrites with this model
- ${mode === 'common'
    ? 'Identify phrases that this model is likely to overproduce or reuse in this context'
    : 'Identify phrases that this model is relatively less likely to produce and therefore feel less common or more unexpected in this context'}
- Return enough candidates so the application can filter by threshold
- Prefer phrase-level outputs, not single words unless the phrase is naturally one word
- Return at least 20 distinct phrase candidates when possible
- Sort the result by hit_count in descending order

Respond ONLY with valid JSON in this exact format:
{
  "expressions": [
    {
      "text": "phrase that appears frequently",
      "hit_count": 75,
      "occurrence_ratio": 0.75,
      "reason": "Short note"
    }
  ]
}

Input phrase:
${seedPhrase}

Full lyrics context:
${lyrics}

Generate ${samples} internal samples and calculate:
- hit_count = how many times the phrase appeared across ${samples} samples
- occurrence_ratio = hit_count / ${samples}

Important: Output ONLY the JSON object, no other text, no explanations, no markdown formatting.`;
  };

  const buildCandidatePrompt = (text: string, seedPhrase: string, sourceExpressions: ExpressionMatch[], mode: ReviewMode): string => {
    const sourceList = sourceExpressions.map(e => e.text).join(', ');
    return `Given these lyrics, the seed phrase, and the analyzed expression list, suggest alternative expressions.

Direction:
- ${mode === 'common'
    ? 'Return more familiar, accessible, and common-sounding alternatives'
    : 'Return more unusual, fresh, and less-predictable alternatives'}
- Keep them usable as lyric fragments
- Prefer alternatives that can rhyme or sit naturally near the original phrase when possible
- Return at least 20 distinct candidates when possible

Respond ONLY with valid JSON in this exact format:
{
  "candidates": [
    {
      "text": "Alternative expression or phrase",
      "hit_count": 25,
      "occurrence_ratio": 0.25,
      "rationale": "Short note"
    }
  ]
}

Seed phrase: ${seedPhrase}

Analyzed expressions:
${sourceList}

Original lyrics:
${text}

Important: Output ONLY the JSON object, no other text, no explanations, no markdown formatting.`;
  };

  const countTrailingTokenMatches = (base: string, target: string) => {
    const tokenizeTail = (value: string) => {
      const tokens = value
        .split(/\s+/)
        .map((token) => token.trim())
        .filter((token) => token.length > 0);
      const lastPipeIndex = tokens.lastIndexOf('|');
      const tailTokens = lastPipeIndex >= 0 ? tokens.slice(lastPipeIndex + 1) : tokens;
      return tailTokens.filter((token) => token !== '|').slice(-6);
    };

    const baseTokens = tokenizeTail(base);
    const targetTokens = tokenizeTail(target);

    let count = 0;
    while (count < baseTokens.length && count < targetTokens.length) {
      const baseToken = baseTokens[baseTokens.length - 1 - count];
      const targetToken = targetTokens[targetTokens.length - 1 - count];
      if (baseToken !== targetToken) {
        break;
      }
      count += 1;
    }
    return count;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await copyToClipboardBase(text, t('copiedToClipboard'));
    } catch {
      setError(t('copyFailed'));
    }
  };

  const guideTargets = useMemo(() => {
    const values = new Set<string>();
    if (reviewPrompt.trim()) {
      values.add(analyzedPrompt.trim());
    }
    expressions.forEach((expr) => {
      if (expr.text.trim()) {
        values.add(expr.text.trim());
      }
    });
    candidates.forEach((candidate) => {
      if (candidate.text.trim()) {
        values.add(candidate.text.trim());
      }
    });
    return Array.from(values);
  }, [analyzedPrompt, expressions, candidates]);

  useEffect(() => {
    let cancelled = false;

    const loadGuideMeta = async () => {
      if (guideTargets.length === 0) {
        setGuideMetaMap({});
        return;
      }

      const joined = guideTargets.join('\n');
      const rows = await analyzeRhymeGuideRows(joined);
      if (cancelled) {
        return;
      }

      const rowMap = new Map<string, { romanizedText: string; vowelText: string; consonantText: string }>();
      rows.forEach((row) => {
        rowMap.set(row.line.trim(), {
          romanizedText: row.romanizedText,
          vowelText: row.vowelText,
          consonantText: row.consonantText,
        });
      });

      const seedGuide = analyzedPrompt.trim() ? rowMap.get(analyzedPrompt.trim()) ?? null : null;
      const nextMap: Record<string, PhraseGuideMeta> = {};

      guideTargets.forEach((target) => {
        const base = rowMap.get(target.trim());
        if (!base) {
          return;
        }

        nextMap[target] = {
          romanizedText: base.romanizedText,
          vowelText: base.vowelText,
          consonantText: base.consonantText,
          vowelMatchCount: seedGuide ? countTrailingTokenMatches(seedGuide.vowelText, base.vowelText) : 0,
          consonantMatchCount: seedGuide ? countTrailingTokenMatches(seedGuide.consonantText, base.consonantText) : 0,
        };
      });

      setGuideMetaMap(nextMap);
    };

    void loadGuideMeta();

    return () => {
      cancelled = true;
    };
  }, [guideTargets, analyzedPrompt]);

  const handleFrequencyCheck = async () => {
    if (!enabled) {
      setError(t('llmNotConfigured'));
      return;
    }
    if (!isAllowedLocalBaseUrl(baseUrl)) {
      setError(t('llmBaseUrlLocalOnly'));
      return;
    }
    if (!sectionText.trim()) {
      setError(t('noSectionTextToAnalyze'));
      return;
    }
    if (!reviewPrompt.trim()) {
      setError(t('reviewPromptRequired'));
      return;
    }

    setAnalyzing(true);
    setError(null);
    setAnalyzedPrompt(reviewPrompt.trim());
    setExpressions([]);
    setCandidates([]);
    setShowCandidatePanel(false);

    const prompt = buildFrequencyCheckPrompt(sectionText, reviewPrompt.trim(), getEffectiveSampleCount(), reviewMode);
    const result = await callLLMAPI(
      {
        runtime,
        baseUrl,
        model,
        timeoutMs,
        maxTokens: Math.max(maxTokens, Math.min(12000, Math.round(getEffectiveSampleCount() * 0.8))),
        temperature,
      },
      prompt
    );

    if (result.success) {
      const parsed = parseLLMJsonResponse<ExpressionMatch>(result.content, 'expressions');

      if (parsed.length === 0) {
        setExpressions([{ text: result.content.slice(0, 100), hit_count: getEffectiveSampleCount(), occurrence_ratio: 1, reason: 'Raw response' }]);
      } else {
        const filtered = parsed
          .filter((e) =>
            reviewMode === 'common'
              ? e.occurrence_ratio >= getThresholdForMode()
              : e.occurrence_ratio <= getThresholdForMode(),
          )
          .sort((a, b) => (b.hit_count ?? 0) - (a.hit_count ?? 0));
        setExpressions(filtered);
      }
    } else {
      setError(result.error);
    }

    setAnalyzing(false);
  };

  const handleGetCandidates = async () => {
    if (!enabled) {
      setError(t('llmNotConfigured'));
      return;
    }
    if (expressions.length === 0) {
      setError(t('runFrequencyCheckFirst'));
      return;
    }

    setAnalyzing(true);
    setError(null);
    setCandidates([]);

    const prompt = buildCandidatePrompt(sectionText, analyzedPrompt.trim(), expressions, reviewMode);
    const result = await callLLMAPI(
      {
        runtime,
        baseUrl,
        model,
        timeoutMs,
        maxTokens: Math.max(maxTokens, Math.min(10000, Math.round(getEffectiveSampleCount() * 0.7))),
        temperature,
      },
      prompt
    );

    if (result.success) {
      const parsed = parseLLMJsonResponse<LowFreqCandidate>(result.content, 'candidates');

      if (parsed.length === 0) {
        setCandidates([{ text: result.content.slice(0, 100), rationale: 'Raw response', hit_count: 0, occurrence_ratio: 0 }]);
      } else {
        setCandidates(parsed.sort((a, b) => (b.hit_count ?? 0) - (a.hit_count ?? 0)));
      }
      setShowCandidatePanel(true);
    } else {
      setError(result.error);
    }

    setAnalyzing(false);
  };

  const handleSampleCountPresetChange = (value: string) => {
    setSampleCountPreset(value);
    if (value !== 'custom') {
      setCustomSampleCount(value);
    }
  };

  const handleCustomSampleCountChange = (value: string) => {
    setCustomSampleCount(value.replace(/[^0-9]/g, ''));
  };

  const handleCustomSampleCountBlur = () => {
    setCustomSampleCount(String(getEffectiveSampleCount()));
  };

  if (!enabled) {
    return null;
  }

  return (
    <div className="llm-review-panel">
      <div className="panel-header">
        <h4>📊 {t('aiReviewAssistTitle')}</h4>
      </div>

      <p className="review-description">
        {t('reviewDescription')}
      </p>

      <div className="review-mode-tabs">
        <button
          type="button"
          className={`review-mode-tab ${reviewMode === 'common' ? 'active' : ''}`}
          onClick={() => setReviewMode('common')}
          disabled={analyzing}
        >
          {t('reviewModeCommon')}
        </button>
        <button
          type="button"
          className={`review-mode-tab ${reviewMode === 'novel' ? 'active' : ''}`}
          onClick={() => setReviewMode('novel')}
          disabled={analyzing}
        >
          {t('reviewModeNovel')}
        </button>
      </div>

      <textarea
        className="review-prompt-input"
        placeholder={t('reviewPromptPlaceholder')}
        value={reviewPrompt}
        onChange={(e) => setReviewPrompt(e.target.value)}
        disabled={analyzing}
      />

      <div className="review-settings">
        <div className="review-field">
          <label>{t('sampleCount')}</label>
          <div className="review-sample-row">
            <select
              className="review-sample-select"
              value={sampleCountPreset}
              onChange={(e) => handleSampleCountPresetChange(e.target.value)}
              disabled={analyzing}
            >
              {SAMPLE_COUNT_PRESETS.map((preset) => (
                <option key={preset} value={String(preset)}>
                  {preset}
                </option>
              ))}
              <option value="custom">{t('custom')}</option>
            </select>
            {sampleCountPreset === 'custom' && (
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className="review-sample-input"
                value={customSampleCount}
                onChange={(e) => handleCustomSampleCountChange(e.target.value)}
                onBlur={handleCustomSampleCountBlur}
                disabled={analyzing}
              />
            )}
          </div>
        </div>
        <div className="review-field">
          <label>{t('threshold')}</label>
          <input
            type="number"
            min={0}
            max={1}
            step={0.1}
            value={threshold}
            onChange={(e) => setThreshold(parseFloat(e.target.value) || 0.5)}
            disabled={analyzing}
          />
        </div>
      </div>

      <button
        onClick={handleFrequencyCheck}
        className="analyze-btn"
        disabled={analyzing || !sectionText.trim()}
      >
        {analyzing && !showCandidatePanel ? t('analyzing') : `🔍 ${t('analyzeFrequency')}`}
      </button>

      {error && <p className="llm-error">{error}</p>}
      {copyMessage && <p className="llm-copy-message">{copyMessage}</p>}

      {expressions.length > 0 && (
        <div className="expressions-result">
          <div className="expressions-header">
            <h5>{reviewMode === 'common' ? t('highFrequencyExpressions') : t('lowFrequencyExpressions')} ({expressions.length})</h5>
          </div>
          <div className="expressions-list">
            {expressions.map((expr, idx) => {
              const guideMeta = guideMetaMap[expr.text.trim()];
              return (
              <div key={idx} className="expression-item">
                <div className="expression-meta">
                  <span className="expression-ratio">
                    {typeof expr.hit_count === 'number' ? `${expr.hit_count}` : `${(expr.occurrence_ratio * 100).toFixed(0)}%`}
                  </span>
                  <span className="expression-text">{expr.text}</span>
                  <button
                    type="button"
                    className="copy-mini-btn"
                    title={t('copySelected')}
                    onClick={() => void copyToClipboard(expr.text)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                  </button>
                </div>
                {guideMeta && (
                  <div className="expression-rhyme-meta">
                    <span>{t('romanizedSpelling')}: {guideMeta.romanizedText}</span>
                    <span>{t('vowelSpelling')}: {guideMeta.vowelText}</span>
                    <span>{t('consonantSpelling')}: {guideMeta.consonantText}</span>
                    <span>{t('rhymeCloseness')}: {`${t('vowelSpelling')} ${guideMeta.vowelMatchCount} / ${t('consonantSpelling')} ${guideMeta.consonantMatchCount}`}</span>
                  </div>
                )}
              </div>
            )})}
          </div>
          <button
            onClick={handleGetCandidates}
            className="get-candidates-btn"
            disabled={analyzing}
          >
            {analyzing ? t('generating') : `💡 ${t('getAlternatives')}`}
          </button>
        </div>
      )}

      {showCandidatePanel && candidates.length > 0 && (
        <div className="candidates-result">
          <div className="candidates-header">
            <h5>{reviewMode === 'common' ? t('commonAlternatives') : t('alternativeCandidates')} ({candidates.length})</h5>
          </div>
          <div className="candidates-list">
            {candidates.map((candidate, idx) => {
              const guideMeta = guideMetaMap[candidate.text.trim()];
              return (
              <div
                key={idx}
                className="candidate-item"
              >
                <div className="candidate-header">
                  <span className="candidate-title">{candidate.text.slice(0, 50)}{candidate.text.length > 50 ? '...' : ''}</span>
                  <button
                    type="button"
                    className="copy-mini-btn"
                    title={t('copySelected')}
                    onClick={() => void copyToClipboard(candidate.text)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                  </button>
                </div>
                {guideMeta && (
                  <div className="candidate-rhyme-meta">
                    <span>{t('romanizedSpelling')}: {guideMeta.romanizedText}</span>
                    <span>{t('vowelSpelling')}: {guideMeta.vowelText}</span>
                    <span>{t('consonantSpelling')}: {guideMeta.consonantText}</span>
                    <span>{t('rhymeCloseness')}: {`${t('vowelSpelling')} ${guideMeta.vowelMatchCount} / ${t('consonantSpelling')} ${guideMeta.consonantMatchCount}`}</span>
                  </div>
                )}
              </div>
            )})}
          </div>
          <div className="candidates-actions">
            <button
              onClick={() => void copyToClipboard(candidates.map((candidate) => candidate.text).join('\n\n'))}
              className="insert-btn"
            >
              {t('copyAllCandidates')}
            </button>
            <button
              onClick={() => { setShowCandidatePanel(false); }}
              className="discard-btn"
            >
              {t('close')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default LLMReviewPanel;
