import { useState } from 'react';
import { isAllowedLocalBaseUrl, callLLMAPI, parseLLMJsonResponse } from '../lib/llm/utils';
import { useLanguage } from '../lib/LanguageContext';
import { useLLMPanel } from '../lib/hooks';
import { buildLanguageInstruction } from '../lib/llm/promptBuilder';
import { buildSunoPromptReferenceBlock } from '../lib/llm/sunoPromptCatalog';
import type { LLMPanelBaseProps } from '../lib/llm/types';

interface LyricCandidate {
  id: number;
  title: string;
  text: string;
}

type AssistTarget = 'lyrics' | 'style' | 'vocal';
type AssistMode = 'generate' | 'continue' | 'paraphrase';
type EmotionTone = 'neutral' | 'happy' | 'sad' | 'angry' | 'romantic' | 'melancholic' | 'energetic' | 'calm' | 'dark' | 'hopeful';

interface LLMAssistPanelProps extends LLMPanelBaseProps {
  currentLyrics: string;
  currentStyle: string;
  currentVocal: string;
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
  currentLyrics,
  currentStyle,
  currentVocal,
}: LLMAssistPanelProps) {
  const { t, language } = useLanguage();
  const { error, setError, copyMessage, copyToClipboard: copyToClipboardBase } = useLLMPanel();
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [candidates, setCandidates] = useState<LyricCandidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<LyricCandidate | null>(null);
  const [rawResponse, setRawResponse] = useState<string | null>(null);
  const [target, setTarget] = useState<AssistTarget>('lyrics');
  const [candidateCount, setCandidateCount] = useState(3);
  const [candidateCountMode, setCandidateCountMode] = useState<'preset' | 'custom'>('preset');
  const [candidateCountInput, setCandidateCountInput] = useState('3');
  const [lyricLineCount, setLyricLineCount] = useState(4);
  const [lyricLineCountMode, setLyricLineCountMode] = useState<'preset' | 'custom'>('preset');
  const [lyricLineCountInput, setLyricLineCountInput] = useState('4');
  const [assistMode, setAssistMode] = useState<AssistMode>('generate');
  const [emotionTone, setEmotionTone] = useState<EmotionTone>('neutral');

  const emotionToneOptions: { value: EmotionTone; labelKey: string; promptHint: string }[] = [
    { value: 'neutral', labelKey: 'emotionNeutral', promptHint: '' },
    { value: 'happy', labelKey: 'emotionHappy', promptHint: 'bright, joyful, uplifting tone' },
    { value: 'sad', labelKey: 'emotionSad', promptHint: 'sad, melancholic, heartbreaking tone' },
    { value: 'angry', labelKey: 'emotionAngry', promptHint: 'intense, aggressive, powerful tone' },
    { value: 'romantic', labelKey: 'emotionRomantic', promptHint: 'romantic, sweet, loving tone' },
    { value: 'melancholic', labelKey: 'emotionMelancholic', promptHint: 'melancholic, fleeting, ephemeral tone' },
    { value: 'energetic', labelKey: 'emotionEnergetic', promptHint: 'energetic, dynamic, lively tone' },
    { value: 'calm', labelKey: 'emotionCalm', promptHint: 'calm, peaceful, serene tone' },
    { value: 'dark', labelKey: 'emotionDark', promptHint: 'dark, ominous, mysterious tone' },
    { value: 'hopeful', labelKey: 'emotionHopeful', promptHint: 'hopeful, optimistic, forward-looking tone' },
  ];

  const normalizedCandidateCount = Math.max(3, Math.min(99, candidateCount));
  const normalizedLyricLineCount = Math.max(2, Math.min(16, lyricLineCount));

  const getRecommendedMaxTokens = () => {
    const perCandidateBudget = target === 'lyrics'
      ? 90 + normalizedLyricLineCount * 22
      : 96;
    const baseBudget = target === 'lyrics' ? 640 : 384;
    return Math.min(32768, baseBudget + normalizedCandidateCount * perCandidateBudget);
  };

  const copyGeneratedText = async (text: string) => {
    await copyToClipboardBase(text, t('copiedToClipboard'));
  };

  const getLastLyricsLines = (lyrics: string, lineCount: number): string => {
    const lines = lyrics.trim().split('\n').filter(l => l.trim());
    return lines.slice(-lineCount).join('\n');
  };

  const buildJsonPrompt = async (userPrompt: string): Promise<string> => {
    const forceEnglishOutput = target === 'style' || target === 'vocal';
    const languageInstruction = buildLanguageInstruction({ language, forceEnglish: forceEnglishOutput });
    const emotionHint = emotionToneOptions.find(e => e.value === emotionTone)?.promptHint || '';
    const trimmedUserPrompt = userPrompt.trim();
    const paraphraseLineCount = Math.max(
      1,
      trimmedUserPrompt
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .length,
    );
    const emotionPriorityInstruction = (() => {
      if (!emotionHint) {
        return '';
      }

      if (target === 'style') {
        return `Emotion/Tone priority: ${emotionHint}. Make this mood unmistakable in genre cues, arrangement choices, production texture, and sonic imagery.`;
      }

      if (target === 'vocal') {
        return `Emotion/Tone priority: ${emotionHint}. Make this mood unmistakable in delivery, phrasing, dynamics, articulation, layering, and performance character.`;
      }

      return `Emotion/Tone priority: ${emotionHint}. Make this mood unmistakable in imagery, word choice, rhythm, momentum, and line endings.`;
    })();
    const emotionRule = emotionHint
      ? `- Every candidate must clearly reflect this emotion/tone: ${emotionHint}. It should be obvious even if the user prompt is short.`
      : '';
    const sunoReferenceBlock = (target === 'style' || target === 'vocal')
      ? await buildSunoPromptReferenceBlock({
          target,
          userPrompt: trimmedUserPrompt,
          currentLyrics,
          currentStyle,
          currentVocal,
          emotionHint,
        })
      : '';

    const targetInstruction = target === 'style'
      ? 'Generate concise Suno-ready style direction notes for a song. Focus on genre, mood, arrangement hints, production texture, sonic imagery, and prompt vocabulary that works well in a Styles field. Do not generate lyrics.'
      : target === 'vocal'
        ? 'Generate concise Suno-ready vocal direction notes for a song. Focus on delivery, tone, phrasing, dynamics, layering, performance character, and prompt vocabulary that works well in a Styles field. Do not generate lyrics.'
        : 'Generate concise lyric variations for a song request. Focus on actual singable lyrics.';

    const targetLabel = target === 'style'
      ? 'style direction'
      : target === 'vocal'
        ? 'vocal direction'
        : 'lyrics';

    const modeInstruction = assistMode === 'continue'
      ? `Continue writing from the existing lyrics. Extend the song naturally, maintaining the same style and flow. Generate what comes NEXT after the provided context.`
      : assistMode === 'paraphrase'
        ? `Paraphrase or rephrase the input text. Keep the meaning but change the expression. Offer alternative ways to say the same thing.`
        : `Generate new ${targetLabel} candidates based on the existing references.`;

    const references = (() => {
      if (target === 'lyrics') {
        if (assistMode === 'continue') {
          const contextLines = getLastLyricsLines(currentLyrics, 6);
          return {
            recentLyrics: contextLines || 'none',
            style: currentStyle.trim() || 'none',
          };
        }
        return {
          lyrics: currentLyrics.trim() || 'none',
          style: currentStyle.trim() || 'none',
        };
      }

      if (target === 'style') {
        return {
          lyrics: currentLyrics.trim() || 'none',
          vocal: currentVocal.trim() || 'none',
        };
      }

      return {
        lyrics: currentLyrics.trim() || 'none',
        style: currentStyle.trim() || 'none',
      };
    })();

    const requestText = (() => {
      if (assistMode === 'continue') {
        return language === 'ja'
          ? '現在の歌詞から続きを書いてください。'
          : 'Continue writing from the current lyrics.';
      }
      if (assistMode === 'paraphrase') {
        const inputText = trimmedUserPrompt;
        if (!inputText) {
          return language === 'ja'
            ? '言い換えるテキストを入力してください。'
            : 'Please provide text to paraphrase.';
        }
        return language === 'ja'
          ? `以下のテキストを言い換えてください：\n${inputText}`
          : `Paraphrase the following text:\n${inputText}`;
      }
      return userPrompt.trim() || (
        forceEnglishOutput
          ? `Generate new ${targetLabel} candidates based on the existing references.`
          : language === 'ja'
            ? `既存の参照情報をもとに、新しい${targetLabel}候補を生成してください。`
            : `Generate new ${targetLabel} candidates based on the existing references.`
      );
    })();

    return `${targetInstruction}
${languageInstruction}
${emotionPriorityInstruction}
${modeInstruction}

Respond ONLY with valid JSON in this exact format:
{
  "candidates": [
    {
      "id": 1,
      "title": "Short descriptive title for variation 1",
      "text": "The actual ${targetLabel} for variation 1"
    },
    {
      "id": 2,
      "title": "Short descriptive title for variation 2",
      "text": "The actual ${targetLabel} for variation 2"
    }
  ]
}

Request: ${requestText}
${Object.entries(references)
  .map(([key, value]) => `Reference ${key}:\n${value}`)
  .join('\n\n')}
${sunoReferenceBlock ? `\n\n${sunoReferenceBlock}` : ''}

Important rules:
- Output ONLY the JSON object. No markdown, no explanations, no prose outside JSON.
- Use exactly ${normalizedCandidateCount} candidates.
- Keep each title under 8 words.
- Keep each text concise so the whole response stays short.
- ${target === 'lyrics'
    ? 'Do not give generic lines. Make each candidate feel emotionally specific and evocative.'
    : 'Do not give generic notes. Make each candidate feel emotionally specific and production/performance-ready.'}
- ${assistMode === 'paraphrase'
    ? paraphraseLineCount === 1
      ? 'For paraphrase: keep each candidate as a single short line that preserves the original meaning and singability.'
      : `For paraphrase: keep each candidate to exactly ${paraphraseLineCount} short lines, preserving the original meaning and line structure where possible.`
    : `For lyrics: use exactly ${normalizedLyricLineCount} short lines per candidate, and write line breaks as \\n inside the JSON string.`}
- For style/vocal: 3 short sentences maximum per candidate.
${emotionRule}
- Escape quotes correctly and keep the JSON parseable.`;
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
    if (assistMode === 'paraphrase' && !prompt.trim()) {
      setError(t('paraphrasePromptRequired'));
      return;
    }

    setGenerating(true);
    setError(null);
    setCandidates([]);
    setSelectedCandidate(null);
    setRawResponse(null);

    const jsonPrompt = await buildJsonPrompt(prompt);
    const result = await callLLMAPI(
      {
        runtime,
        baseUrl,
        model,
        timeoutMs,
        maxTokens: Math.max(maxTokens, getRecommendedMaxTokens()),
        temperature,
      },
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

  const handleCandidateCountChange = (value: string) => {
    const normalized = value.replace(/[^\d]/g, '');
    setCandidateCountInput(normalized);

    if (!normalized) {
      setCandidateCount(3);
      return;
    }

    const parsed = parseInt(normalized, 10);
    if (Number.isNaN(parsed)) {
      setCandidateCount(3);
      return;
    }

    setCandidateCount(Math.max(3, Math.min(99, parsed)));
  };

  const handleCandidateCountModeChange = (value: string) => {
    if (value === 'custom') {
      setCandidateCountMode('custom');
      return;
    }

    const parsed = parseInt(value, 10);
    if (Number.isNaN(parsed)) return;

    setCandidateCountMode('preset');
    setCandidateCount(parsed);
    setCandidateCountInput(String(parsed));
  };

  const handleLyricLineCountChange = (value: string) => {
    const normalized = value.replace(/[^\d]/g, '');
    setLyricLineCountInput(normalized);

    if (!normalized) {
      setLyricLineCount(4);
      return;
    }

    const parsed = parseInt(normalized, 10);
    if (Number.isNaN(parsed)) {
      setLyricLineCount(4);
      return;
    }

    setLyricLineCount(Math.max(2, Math.min(16, parsed)));
  };

  const handleLyricLineCountModeChange = (value: string) => {
    if (value === 'custom') {
      setLyricLineCountMode('custom');
      return;
    }

    const parsed = parseInt(value, 10);
    if (Number.isNaN(parsed)) return;

    setLyricLineCountMode('preset');
    setLyricLineCount(parsed);
    setLyricLineCountInput(String(parsed));
  };

  const handleCopyAll = async () => {
    if (candidates.length > 0) {
      const combinedText = candidates.map(c => `【${c.title}】\n${c.text}`).join('\n\n---\n\n');
      await copyGeneratedText(combinedText);
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

      <div className="llm-target-tabs" role="tablist" aria-label={t('aiAssistTarget')}>
        {(['lyrics', 'style', 'vocal'] as AssistTarget[]).map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={target === item}
            className={`llm-target-tab ${target === item ? 'active' : ''}`}
            onClick={() => setTarget(item)}
          >
            {item === 'lyrics' ? t('aiTargetLyrics') : item === 'style' ? t('aiTargetStyle') : t('aiTargetVocal')}
          </button>
        ))}
      </div>

      {target === 'lyrics' && (
        <div className="llm-mode-tabs" role="tablist" aria-label="Assist mode">
          {(['generate', 'continue', 'paraphrase'] as AssistMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              role="tab"
              aria-selected={assistMode === mode}
              className={`llm-mode-tab ${assistMode === mode ? 'active' : ''}`}
              onClick={() => setAssistMode(mode)}
              disabled={generating}
            >
              {mode === 'generate' ? t('generate') : mode === 'continue' ? t('continueWriting') : t('paraphrase')}
            </button>
          ))}
        </div>
      )}

      <div className="llm-emotion-row">
        <label htmlFor="llm-emotion">{t('emotionTone')}</label>
        <select
          id="llm-emotion"
          value={emotionTone}
          onChange={(e) => setEmotionTone(e.target.value as EmotionTone)}
          className="llm-emotion-select"
          disabled={generating}
        >
          {emotionToneOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {t(opt.labelKey as keyof typeof import('../lib/i18n/ja').ja)}
            </option>
          ))}
        </select>
      </div>

      <div className="llm-config-row">
        <div className="llm-candidate-count-row">
          <label htmlFor="llm-candidate-count">{t('candidateCount')}</label>
          <select
            id="llm-candidate-count"
            value={candidateCountMode === 'custom' ? 'custom' : String(candidateCount)}
            onChange={(e) => handleCandidateCountModeChange(e.target.value)}
            className="llm-candidate-count-select"
            disabled={generating}
          >
            {[3, 4, 5, 6, 7, 8, 9, 10].map((count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
            <option value="custom">{t('custom')}</option>
          </select>
          {candidateCountMode === 'custom' && (
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={candidateCountInput}
              onChange={(e) => handleCandidateCountChange(e.target.value)}
              onBlur={() => setCandidateCountInput(String(candidateCount))}
              className="llm-candidate-count-input"
              disabled={generating}
            />
          )}
        </div>

        {target === 'lyrics' && (
          <div className="llm-candidate-count-row">
            <label htmlFor="llm-line-count">{t('lyricLineCount')}</label>
            <select
              id="llm-line-count"
              value={lyricLineCountMode === 'custom' ? 'custom' : String(lyricLineCount)}
              onChange={(e) => handleLyricLineCountModeChange(e.target.value)}
              className="llm-candidate-count-select"
              disabled={generating}
            >
              {[2, 3, 4, 5, 6, 7, 8].map((count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ))}
              <option value="custom">{t('custom')}</option>
            </select>
            {lyricLineCountMode === 'custom' && (
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={lyricLineCountInput}
                onChange={(e) => handleLyricLineCountChange(e.target.value)}
                onBlur={() => setLyricLineCountInput(String(lyricLineCount))}
                className="llm-candidate-count-input"
                disabled={generating}
              />
            )}
          </div>
        )}
      </div>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder={assistMode === 'continue'
          ? t('continuePromptPlaceholder')
          : assistMode === 'paraphrase'
            ? t('paraphrasePromptPlaceholder')
            : target === 'style'
              ? t('llmPromptPlaceholderStyle')
              : target === 'vocal'
                ? t('llmPromptPlaceholderVocal')
                : t('llmPromptPlaceholderLlama')}
        className="llm-prompt-input"
        disabled={generating}
      />

      <button
        onClick={handleGenerate}
        className="generate-btn"
        disabled={generating}
      >
        {generating ? t('generating') : t('generate')}
      </button>

      {error && (
        <p className="llm-error">{error}</p>
      )}

      {copyMessage && (
        <p className="llm-copy-message">{copyMessage}</p>
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
                  <button
                    type="button"
                    className="copy-mini-btn"
                    title={t('copySelected')}
                    onClick={(event) => {
                      event.stopPropagation();
                      copyGeneratedText(candidate.text);
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                  </button>
                </div>
                <pre className="candidate-preview">{candidate.text.slice(0, 200)}{candidate.text.length > 200 ? '...' : ''}</pre>
              </div>
            ))}
          </div>
          <div className="candidates-actions">
            <button
              onClick={handleCopyAll}
              className="insert-btn"
              disabled={candidates.length === 0}
            >
              {t('copyAllCandidates')}
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
            <button onClick={() => copyGeneratedText(rawResponse)} className="insert-btn">
              {t('copyAsText')}
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
