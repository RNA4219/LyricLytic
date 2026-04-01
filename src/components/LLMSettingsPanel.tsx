import { useEffect, useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { readDir } from '@tauri-apps/plugin-fs';
import { join } from '@tauri-apps/api/path';
import {
  detectLlamaCppExecutable,
  getLlamaCppRuntimeStatus,
  LlamaCppStatus,
  startLlamaCppRuntime,
} from '../lib/api';
import { LLMSettings, fetchLLMModels, isManagedLlamaCppRuntime } from '../lib/llm';
import { useLanguage } from '../lib/LanguageContext';
import { LLM_DEFAULTS } from '../lib/config';

interface LLMSettingsPanelProps {
  settings: LLMSettings;
  onSettingsChange: (settings: LLMSettings) => void;
}

type ConnectionStatus = 'unknown' | 'testing' | 'connected' | 'error';
type RuntimeActionStatus = 'idle' | 'running' | 'stopped' | 'starting' | 'error';
type DirEntry = { name: string; isDirectory: boolean; isFile: boolean };

const MODEL_FILE_PATTERN = /\.(gguf|ggml|safetensors)$/i;

const DEFAULT_SETTINGS: LLMSettings = {
  runtime: 'openai_compatible',
  baseUrl: LLM_DEFAULTS.BASE_URL_OPENAI,
  model: LLM_DEFAULTS.MODEL_OPENAI,
  executablePath: LLM_DEFAULTS.EXECUTABLE_PATH,
  modelPath: '',
  enabled: false,
  timeoutMs: LLM_DEFAULTS.TIMEOUT_MS,
  maxTokens: LLM_DEFAULTS.MAX_TOKENS,
  temperature: LLM_DEFAULTS.TEMPERATURE,
};

function LLMSettingsPanel({ settings: externalSettings, onSettingsChange }: LLMSettingsPanelProps) {
  const { t } = useLanguage();
  const [settings, setSettings] = useState<LLMSettings>(externalSettings ?? DEFAULT_SETTINGS);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('unknown');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [runtimeStatus, setRuntimeStatus] = useState<LlamaCppStatus | null>(null);
  const [runtimeActionStatus, setRuntimeActionStatus] = useState<RuntimeActionStatus>('idle');
  const [runtimeActionError, setRuntimeActionError] = useState<string | null>(null);

  const isAuxiliaryModelFile = (name: string) => {
    const lower = name.toLowerCase();
    return lower.includes('mmproj') || lower.includes('clip') || lower.includes('vision') || lower.includes('projector');
  };

  const isLikelyModelFile = (value: string) => MODEL_FILE_PATTERN.test(value.trim());

  useEffect(() => {
    setSettings(externalSettings ?? DEFAULT_SETTINGS);
  }, [externalSettings]);

  const scanLocalModelCandidates = async (rootPath: string): Promise<string[]> => {
    if (!rootPath.trim()) return [];

    const trimmedPath = rootPath.trim();
    const lowerPath = trimmedPath.toLowerCase();
    if (
      lowerPath.endsWith('.gguf') ||
      lowerPath.endsWith('.ggml') ||
      lowerPath.endsWith('.safetensors')
    ) {
      const fileName = trimmedPath.split(/[\\/]/).filter(Boolean).pop() || trimmedPath;
      return [fileName.replace(/\.(gguf|ggml|safetensors)$/i, '')];
    }

    const results = new Set<string>();

    const walk = async (currentPath: string, depth: number) => {
      if (depth > 4) return;
      const entries = await readDir(currentPath);

      for (const entry of entries as DirEntry[]) {
        const entryPath = await join(currentPath, entry.name);

        if (entry.isDirectory) {
          await walk(entryPath, depth + 1);
          continue;
        }

        if (!entry.isFile) continue;

        const lowerName = entry.name.toLowerCase();
        if (lowerName.endsWith('.gguf') || lowerName.endsWith('.ggml')) {
          if (isAuxiliaryModelFile(entry.name)) {
            continue;
          }
          results.add(entry.name.replace(/\.(gguf|ggml)$/i, ''));
          continue;
        }

        if (lowerName.endsWith('.safetensors') || lowerName === 'config.json') {
          const parts = currentPath.split(/[\\/]/).filter(Boolean);
          const folderName = parts[parts.length - 1];
          if (folderName) {
            results.add(folderName);
          }
        }
      }
    };

    await walk(trimmedPath, 0);
    return Array.from(results).sort((a, b) => a.localeCompare(b));
  };

  const syncRuntimeStatus = async () => {
    if (!isManagedLlamaCppRuntime(settings.runtime)) {
      setRuntimeStatus(null);
      setRuntimeActionStatus('idle');
      setRuntimeActionError(null);
      return;
    }

    try {
      const status = await getLlamaCppRuntimeStatus();
      setRuntimeStatus(status);
      setRuntimeActionStatus(status.running ? 'running' : 'stopped');
      setRuntimeActionError(null);
    } catch (e) {
      setRuntimeActionStatus('error');
      setRuntimeActionError(e instanceof Error ? e.message : t('runtimeActionFailed'));
    }
  };

  useEffect(() => {
    if (!isManagedLlamaCppRuntime(settings.runtime)) return;
    syncRuntimeStatus();
  }, [settings.runtime]);

  const updateSettings = (nextSettings: LLMSettings) => {
    setSettings(nextSettings);
    onSettingsChange(nextSettings);
  };

  useEffect(() => {
    if (!isManagedLlamaCppRuntime(settings.runtime)) return;
    if (settings.executablePath.trim()) return;

    let cancelled = false;

    const detectExecutable = async () => {
      try {
        const detectedPath = await detectLlamaCppExecutable();
        if (!cancelled && detectedPath) {
          updateSettings({ ...settings, executablePath: detectedPath });
        }
      } catch {
        // Quietly ignore auto-detect failures and let manual selection handle it
      }
    };

    detectExecutable();

    return () => {
      cancelled = true;
    };
  }, [settings.runtime, settings.executablePath]);

  useEffect(() => {
    if (!settings.executablePath.trim()) return;
    if (!isLikelyModelFile(settings.executablePath)) return;

    const correctedModelPath = settings.modelPath.trim() || settings.executablePath.trim();
    updateSettings({
      ...settings,
      executablePath: '',
      modelPath: correctedModelPath,
    });
    setRuntimeActionError(t('runtimeExecutableLooksLikeModel'));
  }, [settings.executablePath, settings.modelPath]);

  const handleBaseUrlChange = (baseUrl: string) => {
    updateSettings({ ...settings, baseUrl });
    setConnectionStatus('unknown');
  };

  const handleExecutablePathChange = (executablePath: string) => {
    updateSettings({ ...settings, executablePath });
  };

  const handleModelPathChange = (modelPath: string) => {
    updateSettings({ ...settings, modelPath });
  };

  const handleSelectExecutable = async () => {
    try {
      const selected = await open({
        directory: false,
        multiple: false,
        defaultPath: settings.executablePath || undefined,
        filters: [{ name: 'Executable Files', extensions: ['exe'] }],
      });

      if (typeof selected === 'string') {
        handleExecutablePathChange(selected);
      }
    } catch (e) {
      setRuntimeActionError(e instanceof Error ? e.message : t('runtimeActionFailed'));
    }
  };

  const handleSelectModelFile = async () => {
    try {
      const selected = await open({
        directory: false,
        multiple: false,
        defaultPath: settings.modelPath || undefined,
        filters: [{ name: 'Model Files', extensions: ['gguf', 'ggml', 'safetensors'] }],
      });

      if (typeof selected === 'string') {
        handleModelPathChange(selected);
      }
    } catch {
      // ファイル選択失敗は UI 変更なしで無視
    }
  };

  const handleEnabledChange = (enabled: boolean) => {
    updateSettings({ ...settings, enabled });
  };

  const handleTimeoutChange = (timeoutMs: number) => {
    updateSettings({ ...settings, timeoutMs });
  };

  const handleMaxTokensChange = (maxTokens: number) => {
    updateSettings({ ...settings, maxTokens });
  };

  const handleTemperatureChange = (temperature: number) => {
    updateSettings({ ...settings, temperature });
  };

  const testConnection = async () => {
    setConnectionStatus('testing');
    setConnectionError(null);

    setModelsLoading(true);
      const result = await fetchLLMModels('openai_compatible', settings.baseUrl);
    let localModels: string[] = [];

    if (settings.modelPath.trim()) {
      try {
        localModels = await scanLocalModelCandidates(settings.modelPath);
      } catch {
        // モデル候補取得失敗は接続確認の結果を優先
      }
    }

    setModelsLoading(false);

    const mergedModels = Array.from(new Set([...(result.models ?? []), ...localModels]));

    if (result.success) {
      setConnectionStatus('connected');
      if (mergedModels.length > 0 && !mergedModels.includes(settings.model)) {
        updateSettings({ ...settings, model: mergedModels[0] });
      }
      return;
    }

    if (mergedModels.length > 0) {
      if (!mergedModels.includes(settings.model)) {
        updateSettings({ ...settings, model: mergedModels[0] });
      }
    }

    setConnectionStatus('error');
    setConnectionError(result.error ?? t('connectionFailed'));
  };

  const handleStartManagedRuntime = async () => {
    if (!settings.executablePath.trim()) {
      setRuntimeActionError(t('runtimeLaunchRequiresExecutable'));
      return;
    }

    if (isLikelyModelFile(settings.executablePath)) {
      setRuntimeActionError(t('runtimeExecutableLooksLikeModel'));
      return;
    }

    if (!settings.modelPath.trim()) {
      setRuntimeActionError(t('runtimeLaunchRequiresModelPath'));
      return;
    }

    setRuntimeActionStatus('starting');
    setRuntimeActionError(null);

    try {
      const status = await startLlamaCppRuntime({
        executable_path: settings.executablePath,
        model_path: settings.modelPath,
        base_url: settings.baseUrl,
        max_tokens: settings.maxTokens,
      });
      setRuntimeStatus(status);
      setRuntimeActionStatus(status.running ? 'running' : 'stopped');
      if (status.effective_max_tokens && status.effective_max_tokens < settings.maxTokens) {
        updateSettings({ ...settings, maxTokens: status.effective_max_tokens });
      }
      if (status.running) {
        await testConnection();
      }
    } catch (e) {
      setRuntimeActionStatus('error');
      setRuntimeActionError(e instanceof Error ? e.message : t('runtimeActionFailed'));
    }
  };

  useEffect(() => {
    const loadLocalModels = async () => {
      if (!settings.modelPath.trim()) {
        return;
      }

      setModelsLoading(true);
      try {
        const localModels = await scanLocalModelCandidates(settings.modelPath);
        if (localModels.length > 0 && !localModels.includes(settings.model)) {
          updateSettings({ ...settings, model: localModels[0] });
        }
      } catch {
        // 候補取得失敗は UI を壊さず、手動入力のまま扱う
      } finally {
        setModelsLoading(false);
      }
    };

    loadLocalModels();
  }, [settings.modelPath]);

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case 'testing':
        return <span className="status-badge testing">⏳ {t('testing')}</span>;
      case 'connected':
        return <span className="status-badge connected">✅ {t('connected')}</span>;
      case 'error':
        return <span className="status-badge error">❌ {t('connectionFailed')}</span>;
      default:
        return <span className="status-badge unknown">⚪ {t('notTested')}</span>;
    }
  };

  const getRuntimeBadge = () => {
    switch (runtimeActionStatus) {
      case 'starting':
        return <span className="status-badge testing">⏳ {t('runtimeStarting')}</span>;
      case 'running':
        return <span className="status-badge connected">✅ {t('runtimeRunning')}</span>;
      case 'error':
        return <span className="status-badge error">❌ {t('runtimeActionFailed')}</span>;
      default:
        return <span className="status-badge unknown">⚪ {t('runtimeStopped')}</span>;
    }
  };

  return (
    <div className="llm-settings-panel">
      <div className="llm-header">
        <h4>🤖 {t('llmConfiguration')}</h4>
      </div>

      <div className="llm-content">
        <label className="llm-toggle">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => handleEnabledChange(e.target.checked)}
          />
          {t('enableLlmAssistance')}
        </label>

        <div className="llm-overview-grid">
          <div className="llm-overview-card">
            <span className="llm-overview-label">{t('llmSummaryStatus')}</span>
            <div className="llm-overview-badge">{getRuntimeBadge()}</div>
          </div>
        </div>

        <div className="llm-field">
          <label>{t('runtimeLauncherTitle')}</label>
          <div className="llm-managed-runtime-card">
            <div className="llm-managed-runtime-header">
              <div>
                <strong>{t('runtimeLauncherTitle')}</strong>
                <p>{t('llamaCppManagedHelp')}</p>
              </div>
            </div>

            <div className="llm-field">
              <label>{t('executablePath')}</label>
              <div className="llm-path-row">
                <input
                  type="text"
                  value={settings.executablePath}
                  onChange={(e) => handleExecutablePathChange(e.target.value)}
                  placeholder="C:\\path\\to\\llama-server.exe"
                  disabled={!settings.enabled}
                />
                <button
                  type="button"
                  className="llm-path-btn"
                  onClick={handleSelectExecutable}
                  disabled={!settings.enabled}
                >
                  {t('selectExecutable')}
                </button>
              </div>
              <small className="llm-help">{t('executablePathHelp')}</small>
            </div>

            <div className="llm-field">
              <label>{t('modelFilePath')}</label>
              <div className="llm-path-row llm-path-row-multi">
                <input
                  type="text"
                  value={settings.modelPath}
                  onChange={(e) => handleModelPathChange(e.target.value)}
                  placeholder="C:\\path\\to\\model.gguf"
                  disabled={!settings.enabled}
                />
                <button
                  type="button"
                  className="llm-path-btn"
                  onClick={handleSelectModelFile}
                  disabled={!settings.enabled}
                >
                  {t('selectModelFile')}
                </button>
                {settings.modelPath.trim() && (
                  <button
                    type="button"
                    className="llm-path-btn secondary"
                    onClick={() => handleModelPathChange('')}
                    disabled={!settings.enabled}
                  >
                    {t('clearPath')}
                  </button>
                )}
              </div>
              <small className="llm-help">
                {t('modelFileHelpManaged')}
              </small>
            </div>

            <div className="llm-managed-runtime-actions">
              <button
                type="button"
                className="llm-runtime-btn"
                onClick={handleStartManagedRuntime}
                disabled={!settings.enabled || runtimeActionStatus === 'starting'}
              >
                ▶ {t('startRuntime')}
              </button>
            </div>

            {runtimeStatus?.resolved_model_path && (
              <small className="llm-help">
                {runtimeStatus.resolved_model_path}
              </small>
            )}
            {runtimeActionStatus === 'idle' && !runtimeStatus?.running && (
              <small className="llm-help">
                {t('runtimeManagedConnectedHint')}
              </small>
            )}
            {runtimeActionError && (
              <small className="llm-error-text">{runtimeActionError}</small>
            )}
          </div>
        </div>

        <div className="llm-connection-test">
          <button
            onClick={testConnection}
            disabled={!settings.enabled || connectionStatus === 'testing' || modelsLoading}
            className="test-connection-btn"
          >
            🔌 {t('testConnection')}
          </button>
          {getStatusBadge()}
        </div>

        {connectionError && (
          <div className="llm-error">
            {connectionError}
          </div>
        )}

        <details className="llm-advanced-section">
          <summary>{t('llmAdvancedSettings')}</summary>

          <div className="llm-advanced-grid">
            <div className="llm-field">
              <label>{t('baseUrl')}</label>
              <input
                type="text"
                value={settings.baseUrl}
                onChange={(e) => handleBaseUrlChange(e.target.value)}
                placeholder={LLM_DEFAULTS.BASE_URL_OPENAI}
                disabled={!settings.enabled}
              />
            </div>

            <div className="llm-field">
              <label>{t('timeoutMsLabel')}</label>
              <input
                type="number"
                value={settings.timeoutMs}
                onChange={(e) => handleTimeoutChange(parseInt(e.target.value, 10) || 30000)}
                placeholder="30000"
                disabled={!settings.enabled}
                min={1000}
                max={300000}
              />
              <small className="llm-help">{t('timeoutHelpPlain')}</small>
            </div>

            <div className="llm-field">
              <label>{t('maxOutputTokens')}</label>
              <input
                type="number"
                value={settings.maxTokens}
                onChange={(e) => handleMaxTokensChange(parseInt(e.target.value, 10) || 1024)}
                placeholder="1024"
                disabled={!settings.enabled}
                min={1}
                max={262144}
              />
              <small className="llm-help">{t('maxTokensHelpPlain')}</small>
            </div>

            <div className="llm-field">
              <label>{t('temperature')}</label>
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
              <small className="llm-help">{t('temperatureHelpPlain')}</small>
            </div>
          </div>
        </details>

        <div className="llm-warning">
          ⚠️ {t('llmLocalLlamaCppOnlyWarning')}
        </div>
      </div>
    </div>
  );
}

export default LLMSettingsPanel;
