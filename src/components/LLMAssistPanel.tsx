import { useState } from 'react';
import { isAllowedLocalBaseUrl, callLLMAPI, parseLLMJsonResponse, LLMRuntime } from '../lib/llm/utils';
import { useLanguage } from '../lib/LanguageContext';

interface LyricCandidate {
  id: number;
  title: string;
  text: string;
}

interface LLMAssistPanelProps {
  runtime: LLMRuntime;
  baseUrl: string;
  model: string;
  modelPath: string;
  enabled: boolean;
  timeoutMs?: number;
  maxTokens?: number;
  temperature?: number;
  onInsert: (text: string) => void;
}

function LLMAssistPanel({
  runtime,
  baseUrl,
  model,
  modelPath,
  enabled,
  timeoutMs = 60000,
  maxTokens = 1024,
  temperature = 0.7,
  onInsert,
}: LLMAssistPanelProps) {
  const { t } = useLanguage();
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [candidates, setCandidates] = useState<LyricCandidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<LyricCandidate | null>(null);
  const [rawResponse, setRawResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const buildJsonPrompt = (userPrompt: string): string => {
    return `Generate lyric variations based on this request. Respond ONLY with valid JSON in this exact format:
{
  "candidates": [
    {
      "id": 1,
      "title": "Short descriptive title for variation 1",
      "text": "The actual lyrics for variation 1"
    },
    {
      "id": 2,
      "title": "Short descriptive title for variation 2",
      "text": "The actual lyrics for variation 2"
    },
    {
      "id": 3,
      "title": "Short descriptive title for variation 3",
      "text": "The actual lyrics for variation 3"
    }
  ]
}

Request: ${userPrompt}

Important: Output ONLY the JSON object, no other text, no explanations, no markdown formatting.`;
  };

  const parseCandidates = (text: string): LyricCandidate[] => {
    const rawCandidates = parseLLMJsonResponse<{ id?: number; title?: string; text?: string }>(text, 'candidates');

    if (rawCandidates.length > 0) {
      return rawCandidates.map((c, idx) => ({
        id: c.id ?? idx + 1,
        title: c.title ?? `${t('generatedCandidates')} ${idx + 1}`,
        text: c.text ?? '',
      }));
    }

    // Fallback: treat entire response as single candidate
    return [{
      id: 1,
      title: t('generatedLyrics'),
      text: text.trim(),
    }];
  };

  const handleGenerate = async () => {
    if (!enabled) {
      setError(t('llmNotConfigured'));
      return;
    }
    if (!isAllowedLocalBaseUrl(baseUrl)) {
      setError(t('llmBaseUrlLocalOnly'));
      return;
    }

    setGenerating(true);
    setError(null);
    setCandidates([]);
    setSelectedCandidate(null);
    setRawResponse(null);

    const jsonPrompt = buildJsonPrompt(prompt);
    const result = await callLLMAPI(
      { runtime, baseUrl, model, timeoutMs, maxTokens, temperature },
      jsonPrompt
    );

    if (result.success) {
      setRawResponse(result.content);
      const parsedCandidates = parseCandidates(result.content);
      setCandidates(parsedCandidates);
    } else {
      setError(result.error);
    }

    setGenerating(false);
  };

  const handleInsert = () => {
    if (selectedCandidate) {
      onInsert(selectedCandidate.text);
      setCandidates([]);
      setSelectedCandidate(null);
      setPrompt('');
      setRawResponse(null);
    }
  };

  const handleInsertAll = () => {
    if (candidates.length > 0) {
      const combinedText = candidates.map(c => `【${c.title}】\n${c.text}`).join('\n\n---\n\n');
      onInsert(combinedText);
      setCandidates([]);
      setSelectedCandidate(null);
      setPrompt('');
      setRawResponse(null);
    }
  };

  if (!enabled) {
    return null;
  }

  return (
    <div className="llm-assist-panel">
      <div className="panel-header">
        <h4>✨ {t('aiAssistTitle')}</h4>
      </div>

      {runtime === 'openai_compatible' && modelPath.trim() && (
        <p className="llm-runtime-note">
          {modelPath.split(/[\\/]/).filter(Boolean).pop() || modelPath}
        </p>
      )}

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder={runtime === 'ollama'
          ? t('llmPromptPlaceholderOllama')
          : t('llmPromptPlaceholderLlama')}
        className="llm-prompt-input"
        disabled={generating}
      />

      <button
        onClick={handleGenerate}
        className="generate-btn"
        disabled={generating || !prompt.trim()}
      >
        {generating ? t('generating') : t('generate')}
      </button>

      {error && (
        <p className="llm-error">{error}</p>
      )}

      {candidates.length > 0 && (
        <div className="llm-candidates">
          <div className="candidates-header">
            <h5>{t('generatedCandidates')} ({candidates.length})</h5>
          </div>
          <div className="candidates-list">
            {candidates.map((candidate) => (
              <div
                key={candidate.id}
                className={`candidate-item ${selectedCandidate?.id === candidate.id ? 'selected' : ''}`}
                onClick={() => setSelectedCandidate(candidate)}
              >
                <div className="candidate-header">
                  <span className="candidate-title">{candidate.title}</span>
                </div>
                <pre className="candidate-preview">{candidate.text.slice(0, 200)}{candidate.text.length > 200 ? '...' : ''}</pre>
              </div>
            ))}
          </div>
          <div className="candidates-actions">
            <button
              onClick={handleInsert}
              className="insert-btn"
              disabled={!selectedCandidate}
            >
              {t('insertSelected')}
            </button>
            <button
              onClick={handleInsertAll}
              className="insert-all-btn"
              disabled={candidates.length === 0}
            >
              {t('insertAll')}
            </button>
            <button onClick={() => { setCandidates([]); setSelectedCandidate(null); setRawResponse(null); }} className="discard-btn">
              {t('discardAll')}
            </button>
          </div>
        </div>
      )}

      {rawResponse && candidates.length === 0 && !error && (
        <div className="llm-raw-response">
          <p className="raw-response-note">{t('responseNotParsed')}</p>
          <pre className="raw-response-text">{rawResponse}</pre>
          <div className="raw-response-actions">
            <button onClick={() => onInsert(rawResponse)} className="insert-btn">
              {t('insertAsText')}
            </button>
            <button onClick={() => setRawResponse(null)} className="discard-btn">
              {t('discard')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default LLMAssistPanel;
