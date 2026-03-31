import { useState } from 'react';

interface LLMSettingsPanelProps {
  onSettingsChange: (settings: LLMSettings) => void;
}

export interface LLMSettings {
  provider: 'openai' | 'anthropic' | 'custom';
  apiKey: string;
  endpoint: string;
  model: string;
  enabled: boolean;
}

const DEFAULT_SETTINGS: LLMSettings = {
  provider: 'openai',
  apiKey: '',
  endpoint: 'https://api.openai.com/v1',
  model: 'gpt-4',
  enabled: false,
};

const PROVIDER_CONFIGS = {
  openai: {
    endpoint: 'https://api.openai.com/v1',
    models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  },
  anthropic: {
    endpoint: 'https://api.anthropic.com/v1',
    models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
  },
  custom: {
    endpoint: '',
    models: [],
  },
};

function LLMSettingsPanel({ onSettingsChange }: LLMSettingsPanelProps) {
  const [settings, setSettings] = useState<LLMSettings>(DEFAULT_SETTINGS);
  const [show, setShow] = useState(false);

  const handleProviderChange = (provider: 'openai' | 'anthropic' | 'custom') => {
    const config = PROVIDER_CONFIGS[provider];
    const newSettings = {
      ...settings,
      provider,
      endpoint: config.endpoint,
      model: config.models[0] || '',
    };
    setSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const handleApiKeyChange = (apiKey: string) => {
    const newSettings = { ...settings, apiKey };
    setSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const handleEndpointChange = (endpoint: string) => {
    const newSettings = { ...settings, endpoint };
    setSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const handleModelChange = (model: string) => {
    const newSettings = { ...settings, model };
    setSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const handleEnabledChange = (enabled: boolean) => {
    const newSettings = { ...settings, enabled };
    setSettings(newSettings);
    onSettingsChange(newSettings);
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
          <label>Provider</label>
          <select
            value={settings.provider}
            onChange={(e) => handleProviderChange(e.target.value as 'openai' | 'anthropic' | 'custom')}
            disabled={!settings.enabled}
          >
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
            <option value="custom">Custom Endpoint</option>
          </select>
        </div>

        <div className="llm-field">
          <label>API Key</label>
          <input
            type="password"
            value={settings.apiKey}
            onChange={(e) => handleApiKeyChange(e.target.value)}
            placeholder="Enter API key..."
            disabled={!settings.enabled}
          />
        </div>

        {settings.provider === 'custom' && (
          <div className="llm-field">
            <label>Endpoint URL</label>
            <input
              type="text"
              value={settings.endpoint}
              onChange={(e) => handleEndpointChange(e.target.value)}
              placeholder="https://api.example.com/v1"
              disabled={!settings.enabled}
            />
          </div>
        )}

        {(settings.provider !== 'custom' || PROVIDER_CONFIGS[settings.provider].models.length > 0) && (
          <div className="llm-field">
            <label>Model</label>
            <select
              value={settings.model}
              onChange={(e) => handleModelChange(e.target.value)}
              disabled={!settings.enabled}
            >
              {PROVIDER_CONFIGS[settings.provider].models.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
              {settings.provider === 'custom' && (
                <option value="custom">Custom model name</option>
              )}
            </select>
          </div>
        )}

        {settings.provider === 'custom' && (
          <div className="llm-field">
            <label>Model Name</label>
            <input
              type="text"
              value={settings.model}
              onChange={(e) => handleModelChange(e.target.value)}
              placeholder="model-name"
              disabled={!settings.enabled}
            />
          </div>
        )}

        <div className="llm-warning">
          ⚠️ API key is stored locally and never sent to our servers.
        </div>
      </div>
    </div>
  );
}

export default LLMSettingsPanel;