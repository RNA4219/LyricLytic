import { useState } from 'react';
import CopyOptionsPanel from '../../components/CopyOptionsPanel';
import FragmentPanel from '../../components/FragmentPanel';
import LLMAssistPanel from '../../components/LLMAssistPanel';
import LLMReviewPanel from '../../components/LLMReviewPanel';
import LLMSettingsPanel from '../../components/LLMSettingsPanel';
import SearchPanel from '../../components/SearchPanel';
import SongArtifactPanel from '../../components/SongArtifactPanel';
import { LyricVersion, Project } from '../../lib/api';
import { LLMSettings } from '../../lib/llm';
import { useLanguage } from '../../lib/LanguageContext';
import { Section, sectionsToBody } from './sectionUtils';

interface FragmentSummary {
  collected_fragment_id: string;
  text: string;
  source?: string;
  status: string;
  tags?: string[];
}

type InspectorTab = 'search' | 'fragments' | 'song' | 'history' | 'llm';

interface ActionPaneProps {
  project: Project;
  projectId: string;
  sections: Section[];
  activeSectionId: string | null;
  versions: LyricVersion[];
  fragments: FragmentSummary[];
  llmSettings: LLMSettings;
  onSetShowSaveDialog: (value: boolean) => void;
  onJumpToVersion: (versionId: string) => void;
  onInsertFragment: (text: string) => void;
  onLLMSettingsChange: (settings: LLMSettings) => void;
}

function ActionPane({
  projectId,
  sections,
  activeSectionId,
  versions,
  fragments,
  llmSettings,
  onSetShowSaveDialog,
  onJumpToVersion,
  onInsertFragment,
  onLLMSettingsChange,
}: ActionPaneProps) {
  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<InspectorTab>('llm');

  const tabs: { id: InspectorTab; label: string }[] = [
    { id: 'llm', label: t('aiAssist') },
    { id: 'search', label: t('search') },
    { id: 'fragments', label: t('fragments') },
    { id: 'song', label: t('song') },
    { id: 'history', label: t('history') },
  ];

  return (
    <div className="inspector-pane">
      {/* Action Buttons */}
      <div className="inspector-actions">
        <CopyOptionsPanel
          sections={sections}
          activeSectionId={activeSectionId}
          onCopy={() => {}}
        />
      </div>

      {/* Tab Bar */}
      <div className="inspector-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`inspector-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="inspector-content">
        {activeTab === 'search' && (
          <div className="inspector-section">
            <SearchPanel
              projectId={projectId}
              draftText={sectionsToBody(sections)}
              versions={versions}
              fragments={fragments}
              onJumpToVersion={onJumpToVersion}
            />
          </div>
        )}

        {activeTab === 'fragments' && (
          <div className="inspector-section">
            <div className="inspector-section-header">
              <h3>{t('suggestedFragments')}</h3>
            </div>
            <FragmentPanel projectId={projectId} onInsert={onInsertFragment} />
          </div>
        )}

        {activeTab === 'song' && (
          <div className="inspector-section">
            <div className="inspector-section-header">
              <h3>{t('linkedArtifact')}</h3>
            </div>
            <SongArtifactPanel
              projectId={projectId}
              versions={versions}
              onShowSaveDialog={() => onSetShowSaveDialog(true)}
            />
          </div>
        )}

        {activeTab === 'history' && (
          <div className="inspector-section">
            <div className="inspector-section-header">
              <h3>{t('lyricVersions')}</h3>
            </div>
            <div className="version-timeline">
              {versions.length === 0 ? (
                <div className="empty-state">
                  <p>{t('noSavedVersions')}</p>
                  <button
                    onClick={() => onSetShowSaveDialog(true)}
                    className="primary-btn"
                  >
                    {t('saveSnapshot')}
                  </button>
                </div>
              ) : (
                versions.map((version) => (
                  <div key={version.lyric_version_id} className="version-timeline-item">
                    <div className="version-timeline-dot" />
                    <div className="version-timeline-content">
                      <div className="version-timeline-name">{version.snapshot_name}</div>
                      <div className="version-timeline-date">
                        {new Date(version.created_at).toLocaleString(language === 'ja' ? 'ja-JP' : 'en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'llm' && (
          <div className="inspector-section inspector-section-llm">
            <div className="llm-section-header">
              <h3>{t('aiAssist')}</h3>
            </div>
            <LLMAssistPanel
              runtime={llmSettings.runtime}
              baseUrl={llmSettings.baseUrl}
              model={llmSettings.model}
              modelPath={llmSettings.modelPath}
              enabled={llmSettings.enabled}
              timeoutMs={llmSettings.timeoutMs}
              maxTokens={llmSettings.maxTokens}
              temperature={llmSettings.temperature}
              onInsert={onInsertFragment}
            />
            <LLMReviewPanel
              runtime={llmSettings.runtime}
              baseUrl={llmSettings.baseUrl}
              model={llmSettings.model}
              modelPath={llmSettings.modelPath}
              enabled={llmSettings.enabled}
              timeoutMs={llmSettings.timeoutMs}
              maxTokens={llmSettings.maxTokens}
              temperature={llmSettings.temperature}
              sectionText={sections.find(s => s.id === activeSectionId)?.bodyText || ''}
              onInsert={onInsertFragment}
            />
            <LLMSettingsPanel
              settings={llmSettings}
              onSettingsChange={onLLMSettingsChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default ActionPane;
