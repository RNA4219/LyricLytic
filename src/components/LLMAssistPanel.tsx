import { useState } from 'react';

interface LLMAssistPanelProps {
  runtime: 'openai_compatible' | 'ollama';
  baseUrl: string;
  model: string;
  modelPath: string;
  enabled: boolean;
  onInsert: (text: string) => void;
}

function LLMAssistPanel({ runtime, baseUrl, model, modelPath, enabled, onInsert }: LLMAssistPanelProps) {
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedText, setGeneratedText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isAllowedLocalBaseUrl = (value: string) => {
    try {
      const parsed = new URL(value);
      return parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost';
    } catch {
      return false;
    }
  };

  const handleGenerate = async () => {
    if (!enabled) {
      setError('LLM is not configured');
      return;
    }
    if (!isAllowedLocalBaseUrl(baseUrl)) {
      setError('LLM base URL must point to localhost or 127.0.0.1');
      return;
    }

    setGenerating(true);
    setError(null);
    setGeneratedText('');

    try {
      const normalizedBaseUrl = baseUrl.replace(/\/$/, '');
      const promptText = `Generate lyrics based on this prompt. Output only the lyrics, no explanations:\n\n${prompt}`;
      const requestUrl = runtime === 'ollama'
        ? `${normalizedBaseUrl}/api/chat`
        : normalizedBaseUrl.endsWith('/v1')
          ? `${normalizedBaseUrl}/chat/completions`
          : `${normalizedBaseUrl}/v1/chat/completions`;
      const requestBody = runtime === 'ollama'
        ? {
            model,
            stream: false,
            messages: [
              {
                role: 'user',
                content: promptText,
              }
            ]
          }
        : {
            model,
            max_tokens: 1024,
            messages: [
              {
                role: 'user',
                content: promptText,
              }
            ]
          };

      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const text = runtime === 'ollama'
        ? data.message?.content || ''
        : data.choices?.[0]?.message?.content || '';

      setGeneratedText(text);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleInsert = () => {
    if (generatedText) {
      onInsert(generatedText);
      setGeneratedText('');
      setPrompt('');
    }
  };

  if (!enabled) {
    return null;
  }

  return (
    <div className="llm-assist-panel">
      <div className="panel-header">
        <h4>✨ AI Assist</h4>
      </div>

      {runtime === 'openai_compatible' && modelPath.trim() && (
        <p className="llm-runtime-note">
          Model root: {modelPath}
        </p>
      )}

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder={runtime === 'ollama'
          ? 'Describe what you want to send to Ollama...'
          : 'Describe what lyrics you want for the llama.cpp runtime...'}
        className="llm-prompt-input"
        disabled={generating}
      />

      <button
        onClick={handleGenerate}
        className="generate-btn"
        disabled={generating || !prompt.trim()}
      >
        {generating ? 'Generating...' : 'Generate'}
      </button>

      {error && (
        <p className="llm-error">{error}</p>
      )}

      {generatedText && (
        <div className="llm-result">
          <div className="llm-result-text">{generatedText}</div>
          <div className="llm-result-actions">
            <button onClick={handleInsert} className="insert-btn">
              Insert to Editor
            </button>
            <button onClick={() => setGeneratedText('')} className="discard-btn">
              Discard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default LLMAssistPanel;
