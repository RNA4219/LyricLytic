import CopyOptionsPanel from '../../components/CopyOptionsPanel';
import LLMAssistPanel from '../../components/LLMAssistPanel';
import LLMReviewPanel from '../../components/LLMReviewPanel';
import LLMSettingsPanel from '../../components/LLMSettingsPanel';
import { LLMSettings } from '../../lib/llm';
import { Section } from './sectionUtils';

interface ActionPaneProps {
  sections: Section[];
  activeSectionId: string | null;
  currentLyrics: string;
  currentStyle: string;
  currentVocal: string;
  llmSettings: LLMSettings;
  onLLMSettingsChange: (settings: LLMSettings) => void;
}

function ActionPane({
  sections,
  activeSectionId,
  currentLyrics,
  currentStyle,
  currentVocal,
  llmSettings,
  onLLMSettingsChange,
}: ActionPaneProps) {
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

      {/* Content Area */}
      <div className="inspector-content">
        <div className="inspector-section inspector-section-llm">
          <LLMAssistPanel
            runtime={llmSettings.runtime}
            baseUrl={llmSettings.baseUrl}
            model={llmSettings.model}
            modelPath={llmSettings.modelPath}
            enabled={llmSettings.enabled}
            timeoutMs={llmSettings.timeoutMs}
            maxTokens={llmSettings.maxTokens}
            temperature={llmSettings.temperature}
            currentLyrics={currentLyrics}
            currentStyle={currentStyle}
            currentVocal={currentVocal}
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
            sectionText={currentLyrics}
          />
          <LLMSettingsPanel
            settings={llmSettings}
            onSettingsChange={onLLMSettingsChange}
          />
        </div>
      </div>
    </div>
  );
}

export default ActionPane;
