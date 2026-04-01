import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { useProject } from '../lib/ProjectContext';
import { getLlamaCppRuntimeStatus, startLlamaCppRuntime, stopLlamaCppRuntime, type LlamaCppStatus } from '../lib/api';
import { LLM_DEFAULTS, STORAGE_KEYS } from '../lib/config';
import type { LLMSettings } from '../lib/llm/useLLMSettings';

const DEFAULT_LLM_SETTINGS: LLMSettings = {
  runtime: LLM_DEFAULTS.RUNTIME,
  baseUrl: LLM_DEFAULTS.BASE_URL_OPENAI,
  model: LLM_DEFAULTS.MODEL_OPENAI,
  executablePath: LLM_DEFAULTS.EXECUTABLE_PATH,
  modelPath: '',
  enabled: false,
  timeoutMs: LLM_DEFAULTS.TIMEOUT_MS,
  maxTokens: LLM_DEFAULTS.MAX_TOKENS,
  temperature: LLM_DEFAULTS.TEMPERATURE,
};

function loadStoredLlmSettings(): LLMSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LLM_SETTINGS);
    if (!raw) return DEFAULT_LLM_SETTINGS;
    return { ...DEFAULT_LLM_SETTINGS, ...JSON.parse(raw), runtime: 'openai_compatible' };
  } catch {
    return DEFAULT_LLM_SETTINGS;
  }
}

function Layout() {
  const { language, setLanguage, t } = useLanguage();
  const { projectTitle } = useProject();
  const navigate = useNavigate();
  const location = useLocation();
  const [runtimeStatus, setRuntimeStatus] = useState<LlamaCppStatus | null>(null);
  const [startingRuntime, setStartingRuntime] = useState(false);
  const [stoppingRuntime, setStoppingRuntime] = useState(false);

  // Reset project title when navigating away from editor
  const isEditorPage = location.pathname.startsWith('/project/');

  const syncRuntimeStatus = useCallback(async () => {
    try {
      const status = await getLlamaCppRuntimeStatus();
      setRuntimeStatus(status);
    } catch {
      setRuntimeStatus(null);
    }
  }, []);

  useEffect(() => {
    void syncRuntimeStatus();
    const timer = window.setInterval(() => {
      void syncRuntimeStatus();
    }, 4000);
    return () => window.clearInterval(timer);
  }, [syncRuntimeStatus]);

  const handleStartRuntime = useCallback(async () => {
    const settings = loadStoredLlmSettings();
    if (!settings.executablePath.trim() || !settings.modelPath.trim()) {
      return;
    }

    try {
      setStartingRuntime(true);
      const status = await startLlamaCppRuntime({
        executable_path: settings.executablePath,
        model_path: settings.modelPath,
        base_url: settings.baseUrl,
        max_tokens: settings.maxTokens,
      });
      setRuntimeStatus(status);
    } catch {
      await syncRuntimeStatus();
    } finally {
      setStartingRuntime(false);
    }
  }, [syncRuntimeStatus]);

  const handleStopRuntime = useCallback(async () => {
    try {
      setStoppingRuntime(true);
      const status = await stopLlamaCppRuntime();
      setRuntimeStatus(status);
    } catch {
      await syncRuntimeStatus();
    } finally {
      setStoppingRuntime(false);
    }
  }, [syncRuntimeStatus]);

  const storedLlmSettings = loadStoredLlmSettings();
  const canStartRuntime = Boolean(
    storedLlmSettings.enabled &&
    storedLlmSettings.executablePath.trim() &&
    storedLlmSettings.modelPath.trim(),
  );

  return (
    <div className="layout">
      <header className="header">
        <div className="header-title-group">
          <button
            type="button"
            className="header-title-btn"
            onClick={() => navigate('/')}
            title={t('appTitle')}
          >
            <h1>{t('appTitle')}</h1>
            {isEditorPage && projectTitle && (
              <span className="header-project-title">{projectTitle}</span>
            )}
          </button>
          <div className="header-runtime-controls" aria-label="LLM runtime controls">
            <span className={`status-badge ${runtimeStatus?.running ? 'connected' : 'unknown'}`}>
              {runtimeStatus?.running ? `✅ ${t('runtimeRunning')}` : `⚪ ${t('runtimeStopped')}`}
            </span>
            <button
              type="button"
              className="header-runtime-btn"
              onClick={() => { void handleStartRuntime(); }}
              disabled={!canStartRuntime || startingRuntime}
              title={t('startRuntime')}
            >
              ▶ {t('startRuntime')}
            </button>
            <button
              type="button"
              className="header-runtime-btn header-runtime-btn-secondary"
              onClick={() => { void handleStopRuntime(); }}
              disabled={!runtimeStatus?.running || stoppingRuntime}
              title={t('stopRuntime')}
            >
              ■ {t('stopRuntime')}
            </button>
          </div>
        </div>
        <div className="language-switch">
          <button
            className={`lang-btn ${language === 'ja' ? 'active' : ''}`}
            onClick={() => setLanguage('ja')}
            title={t('japanese')}
          >
            JA
          </button>
          <button
            className={`lang-btn ${language === 'en' ? 'active' : ''}`}
            onClick={() => setLanguage('en')}
            title={t('english')}
          >
            EN
          </button>
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
