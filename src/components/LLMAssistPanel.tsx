import { useState } from 'react';

interface LLMAssistPanelProps {
  apiKey: string;
  endpoint: string;
  model: string;
  enabled: boolean;
  onInsert: (text: string) => void;
}

function LLMAssistPanel({ apiKey, endpoint, model, enabled, onInsert }: LLMAssistPanelProps) {
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedText, setGeneratedText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!enabled || !apiKey) {
      setError('LLM is not configured');
      return;
    }

    setGenerating(true);
    setError(null);
    setGeneratedText('');

    try {
      // Build request based on provider
      const isAnthropic = endpoint.includes('anthropic');
      const requestBody = isAnthropic ? {
        model: model,
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `Generate lyrics based on this prompt. Output only the lyrics, no explanations:\n\n${prompt}`
          }
        ]
      } : {
        model: model,
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `Generate lyrics based on this prompt. Output only the lyrics, no explanations:\n\n${prompt}`
          }
        ]
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (isAnthropic) {
        headers['x-api-key'] = apiKey;
        headers['anthropic-version'] = '2023-06-01';
      } else {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const response = await fetch(`${endpoint}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const text = isAnthropic
        ? data.content?.[0]?.text || ''
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

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe what lyrics you want..."
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