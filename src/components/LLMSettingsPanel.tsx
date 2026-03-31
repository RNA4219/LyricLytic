import { useState } from 'react';

interface LLMSettingsPanelProps {
  onSettingsChange: (settings: LLMSettings) => void;
}

export interface LLMSettings {
  runtime: 'openai_compatible' | 'ollama';
  baseUrl: string;
  model: string;
  modelPath: string;
  enabled: boolean;
  timeoutMs: number;
  maxTokens: number;
  temperature: number;
}

type ConnectionStatus = 'unknown' | 'testing' | 'connected' | 'error';

const DEFAULT_SETTINGS: LLMSettings = {
  runtime: 'openai_compatible',
  baseUrl: 'http://127.0.0.1:8080',
  model: 'local-model',
  modelPath: 'C:\\Users\\ryo-n\\LLM model\\unsloth\\Qwen3.5-27B-GGUF',
  enabled: false,
  timeoutMs: 30000,
  maxTokens: 1024,
  temperature: 0.7,
};

const RUNTIME_DEFAULTS: Record<LLMSettings['runtime'], Pick<LLMSettings, 'baseUrl' | 'model'>> = {
  openai_compatible: {
    baseUrl: 'http://127.0.0.1:8080',
    model: 'local-model',
  },
  ollama: {
    baseUrl: 'http://127.0.0.1:11434',
    model: 'llama3.2',
  },
};

function LLMSettingsPanel({ onSettingsChange }: LLMSettingsPanelProps) {
  const [settings, setSettings] = useState<LLMSettings>(DEFAULT_SETTINGS);
  const [show, setShow] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('unknown');
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const handleRuntimeChange = (runtime: LLMSettings['runtime']) => {
    const defaults = RUNTIME_DEFAULTS[runtime];
    const newSettings = {
      ...settings,
      runtime,
      baseUrl: defaults.baseUrl,
      model: defaults.model,
    };
    setSettings(newSettings);
    onSettingsChange(newSettings);
    setConnectionStatus('unknown');
  };

  const handleBaseUrlChange = (baseUrl: string) => {
    const newSettings = { ...settings, baseUrl };
    setSettings(newSettings);
    onSettingsChange(newSettings);
    setConnectionStatus('unknown');
  };

  const handleModelChange = (model: string) => {
    const newSettings = { ...settings, model };
    setSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const handleModelPathChange = (modelPath: string) => {
    const newSettings = { ...settings, modelPath };
    setSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const handleEnabledChange = (enabled: boolean) => {
    const newSettings = { ...settings, enabled };
    setSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const handleTimeoutChange = (timeoutMs: number) => {
    const newSettings = { ...settings, timeoutMs };
    setSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const handleMaxTokensChange = (maxTokens: number) => {
    const newSettings = { ...settings, maxTokens };
    setSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const handleTemperatureChange = (temperature: number) => {
    const newSettings = { ...settings, temperature };
    setSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const testConnection = async () => {
    setConnectionStatus('testing');
    setConnectionError(null);

    try {
      const endpoint = settings.runtime === 'ollama'
        ? `${settings.baseUrl}/api/tags`
        : `${settings.baseUrl}/v1/models`;

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('error');
        setConnectionError(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (e) {
      setConnectionStatus('error');
      setConnectionError(e instanceof Error ? e.message : 'Connection failed');
    }
  };

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case 'testing':
        return <span className="status-badge testing">⏳ Testing...</span>;
      case 'connected':
        return <span className="status-badge connected">✅ Connected</span>;
      case 'error':
        return <span className="status-badge error">❌ Error</span>;
      default:
        return <span className="status-badge unknown">⚪ Not tested</span>;
    }
  };

  if (!show) {
    return (
      <button onClick={() => setShow(true)} className="llm-toggle-btn">
        🤖 LLM Settings {settings.enabled ? '✓' : ''}
      </button>
    );
  }

  return (
    <div className="llm-settings-panel">
      <div className="llm-header">
        <h4>🤖 LLM Configuration</h4>
        <button onClick={() => setShow(false)} className="close-btn">×</button>
      </div>

      <div className="llm-content">
        <label className="llm-toggle">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => handleEnabledChange(e.target.checked)}
          />
          Enable LLM assistance
        </label>

        <div className="llm-field">
          <label>Runtime</label>
          <select
            value={settings.runtime}
            onChange={(e) => handleRuntimeChange(e.target.value as LLMSettings['runtime'])}
            disabled={!settings.enabled}
          >
            <option value="openai_compatible">llama.cpp / OpenAI-compatible</option>
            <option value="ollama">Ollama</option>
          </select>
        </div>

        <div className="llm-field">
          <label>Base URL</label>
          <input
            type="text"
            value={settings.baseUrl}
            onChange={(e) => handleBaseUrlChange(e.target.value)}
            placeholder={settings.runtime === 'ollama' ? 'http://127.0.0.1:11434' : 'http://127.0.0.1:8080'}
            disabled={!settings.enabled}
          />
        </div>

        <div className="llm-field">
          <label>Model Name</label>
          <input
            type="text"
            value={settings.model}
            onChange={(e) => handleModelChange(e.target.value)}
            placeholder="local-model"
            disabled={!settings.enabled}
          />
        </div>

        {settings.runtime === 'openai_compatible' && (
          <div className="llm-field">
            <label>Model Root Path</label>
            <input
              type="text"
              value={settings.modelPath}
              onChange={(e) => handleModelPathChange(e.target.value)}
              placeholder="C:\\Users\\ryo-n\\LLM model\\unsloth\\Qwen3.5-27B-GGUF"
              disabled={!settings.enabled}
            />
            <small className="llm-help">
              `llama.cpp` 系ランタイムで参照するモデル配置ルートです。必要ならこの配下の GGUF まで含めたパスへ変更できます。接続先 API 自体は localhost 上で動作している必要があります。
            </small>
          </div>
        )}

        <div className="llm-field">
          <label>Timeout (ms)</label>
          <input
            type="number"
            value={settings.timeoutMs}
            onChange={(e) => handleTimeoutChange(parseInt(e.target.value) || 30000)}
            placeholder="30000"
            disabled={!settings.enabled}
            min={1000}
            max={300000}
          />
        </div>

        <div className="llm-field">
          <label>Max Output Tokens</label>
          <input
            type="number"
            value={settings.maxTokens}
            onChange={(e) => handleMaxTokensChange(parseInt(e.target.value) || 1024)}
            placeholder="1024"
            disabled={!settings.enabled}
            min={1}
            max={32768}
          />
        </div>

        <div className="llm-field">
          <label>Temperature</label>
          <input
            type="number"
            value={settings.temperature}
            onChange={(e) => handleTemperatureChange(parseFloat(e.target.value) || 0.7)}
            placeholder="0.7"
            disabled={!settings.enabled}
            min={0}
            max={2}
            step={0.1}
          />
        </div>

        <div className="llm-connection-test">
          <button
            onClick={testConnection}
            disabled={!settings.enabled || connectionStatus === 'testing'}
            className="test-connection-btn"
          >
            🔌 Test Connection
          </button>
          {getStatusBadge()}
        </div>

        {connectionError && (
          <div className="llm-error">
            {connectionError}
          </div>
        )}

        <div className="llm-warning">
          ⚠️ PoC では localhost / 127.0.0.1 上の `llama.cpp` または `Ollama` のみを想定します。
        </div>
      </div>
    </div>
  );
}

export default LLMSettingsPanel;
