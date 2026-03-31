import { useState } from 'react';
import { isAllowedLocalBaseUrl, callLLMAPI, parseLLMJsonResponse, LLMRuntime } from '../lib/llm/utils';
import { useLanguage } from '../lib/LanguageContext';

interface ExpressionMatch {
  text: string;
  occurrence_ratio: number;
  reason: string;
}

interface LowFreqCandidate {
  text: string;
  rationale: string;
}

interface LLMReviewPanelProps {
  runtime: LLMRuntime;
  baseUrl: string;
  model: string;
  modelPath: string;
  enabled: boolean;
  timeoutMs?: number;
  maxTokens?: number;
  temperature?: number;
  sectionText: string;
  onInsert: (text: string) => void;
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
  onInsert,
}: LLMReviewPanelProps) {
  const { t } = useLanguage();
  const [sampleCount, setSampleCount] = useState(3);
  const [threshold, setThreshold] = useState(0.5);
  const [analyzing, setAnalyzing] = useState(false);
  const [expressions, setExpressions] = useState<ExpressionMatch[]>([]);
  const [candidates, setCandidates] = useState<LowFreqCandidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<LowFreqCandidate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCandidatePanel, setShowCandidatePanel] = useState(false);

  const buildFrequencyCheckPrompt = (text: string, samples: number): string => {
    return `Analyze the following lyrics section and identify expressions that would frequently appear if this style were used multiple times.

Respond ONLY with valid JSON in this exact format:
{
  "expressions": [
    {
      "text": "expression or phrase that appears frequently",
      "occurrence_ratio": 0.75,
      "reason": "Why this expression tends to appear frequently"
    }
  ]
}

Generate ${samples} variations internally and count how many times each expression appears across those variations. The occurrence_ratio should be (times appeared / ${samples}).

Lyrics to analyze:
${text}

Important: Output ONLY the JSON object, no other text, no explanations, no markdown formatting.`;
  };

  const buildCandidatePrompt = (text: string, highFreqExpressions: ExpressionMatch[]): string => {
    const avoidList = highFreqExpressions.map(e => e.text).join(', ');
    return `Given these lyrics and expressions to avoid (they appear too frequently), suggest alternative expressions that would provide fresh, varied content.

Respond ONLY with valid JSON in this exact format:
{
  "candidates": [
    {
      "text": "Alternative expression or phrase",
      "rationale": "Why this is a good alternative that avoids common patterns"
    }
  ]
}

Expressions to avoid: ${avoidList}

Original lyrics:
${text}

Important: Output ONLY the JSON object, no other text, no explanations, no markdown formatting.`;
  };

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

    setAnalyzing(true);
    setError(null);
    setExpressions([]);
    setCandidates([]);
    setSelectedCandidate(null);
    setShowCandidatePanel(false);

    const prompt = buildFrequencyCheckPrompt(sectionText, sampleCount);
    const result = await callLLMAPI(
      { runtime, baseUrl, model, timeoutMs, maxTokens, temperature },
      prompt
    );

    if (result.success) {
      const parsed = parseLLMJsonResponse<ExpressionMatch>(result.content, 'expressions');

      if (parsed.length === 0) {
        setExpressions([{ text: result.content.slice(0, 100), occurrence_ratio: 1, reason: 'Raw response' }]);
      } else {
        const filtered = parsed.filter(e => e.occurrence_ratio >= threshold);
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
    setSelectedCandidate(null);

    const prompt = buildCandidatePrompt(sectionText, expressions);
    const result = await callLLMAPI(
      { runtime, baseUrl, model, timeoutMs, maxTokens, temperature },
      prompt
    );

    if (result.success) {
      const parsed = parseLLMJsonResponse<LowFreqCandidate>(result.content, 'candidates');

      if (parsed.length === 0) {
        setCandidates([{ text: result.content.slice(0, 100), rationale: 'Raw response' }]);
      } else {
        setCandidates(parsed);
      }
      setShowCandidatePanel(true);
    } else {
      setError(result.error);
    }

    setAnalyzing(false);
  };

  const handleInsertCandidate = () => {
    if (selectedCandidate) {
      onInsert(selectedCandidate.text);
      setCandidates([]);
      setSelectedCandidate(null);
      setShowCandidatePanel(false);
    }
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

      <div className="review-settings">
        <div className="review-field">
          <label>{t('sampleCount')}</label>
          <input
            type="number"
            min={2}
            max={10}
            value={sampleCount}
            onChange={(e) => setSampleCount(parseInt(e.target.value) || 3)}
            disabled={analyzing}
          />
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

      {expressions.length > 0 && (
        <div className="expressions-result">
          <div className="expressions-header">
            <h5>{t('highFrequencyExpressions')} ({expressions.length})</h5>
          </div>
          <div className="expressions-list">
            {expressions.map((expr, idx) => (
              <div key={idx} className="expression-item">
                <div className="expression-meta">
                  <span className="expression-ratio">{(expr.occurrence_ratio * 100).toFixed(0)}%</span>
                  <span className="expression-text">{expr.text}</span>
                </div>
                <p className="expression-reason">{expr.reason}</p>
              </div>
            ))}
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
            <h5>{t('alternativeCandidates')} ({candidates.length})</h5>
          </div>
          <div className="candidates-list">
            {candidates.map((candidate, idx) => (
              <div
                key={idx}
                className={`candidate-item ${selectedCandidate?.text === candidate.text ? 'selected' : ''}`}
                onClick={() => setSelectedCandidate(candidate)}
              >
                <div className="candidate-header">
                  <span className="candidate-title">{candidate.text.slice(0, 50)}{candidate.text.length > 50 ? '...' : ''}</span>
                </div>
                <p className="candidate-rationale">{candidate.rationale}</p>
              </div>
            ))}
          </div>
          <div className="candidates-actions">
            <button
              onClick={handleInsertCandidate}
              className="insert-btn"
              disabled={!selectedCandidate}
            >
              {t('insertSelected')}
            </button>
            <button
              onClick={() => { setCandidates([]); setSelectedCandidate(null); setShowCandidatePanel(false); }}
              className="discard-btn"
            >
              {t('discard')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default LLMReviewPanel;
