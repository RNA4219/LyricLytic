import type { RefObject } from 'react';
import { DndProvider } from 'react-dnd';
import { TouchBackend } from 'react-dnd-touch-backend';
import { EDITOR, SECTION_PRESETS } from '../../lib/config';
import type { TranslationKey } from '../../lib/LanguageContext';
import type { LLMSettings } from '../../lib/llm';
import type { Section } from '../../lib/section';
import ActionPane from './ActionPane';
import SectionListCard, { SectionDragPreview, type SectionDragPreviewState } from './SectionListCard';

interface RightStackPaneProps {
  paneRef: RefObject<HTMLElement>;
  width: number;
  sectionPaneHeight: number;
  sections: Section[];
  activeSectionId: string | null;
  currentLyrics: string;
  currentStyle: string;
  currentVocal: string;
  llmSettings: LLMSettings;
  sectionDragPreview: SectionDragPreviewState | null;
  onSectionPaneResizeStart: () => void;
  onAddSection: (type: string) => void;
  onActivateSection: (sectionId: string) => void;
  onRenameSection: (sectionId: string, nextName: string) => void;
  onDeleteSection: (sectionId: string) => void;
  onMoveSection: (dragIndex: number, hoverIndex: number) => void;
  onDragPreviewChange: (preview: SectionDragPreviewState | null) => void;
  onLLMSettingsChange: (settings: LLMSettings) => void;
  t: (key: TranslationKey) => string;
}

function RightStackPane({
  paneRef,
  width,
  sectionPaneHeight,
  sections,
  activeSectionId,
  currentLyrics,
  currentStyle,
  currentVocal,
  llmSettings,
  sectionDragPreview,
  onSectionPaneResizeStart,
  onAddSection,
  onActivateSection,
  onRenameSection,
  onDeleteSection,
  onMoveSection,
  onDragPreviewChange,
  onLLMSettingsChange,
  t,
}: RightStackPaneProps) {
  return (
    <aside
      ref={paneRef}
      className="right-stack-pane"
      style={{ width: `${width}px`, minWidth: `${width}px` }}
    >
      <section className="section-list-pane" style={{ flexBasis: `${sectionPaneHeight}%` }}>
        <div className="section-list-header">
          <h3>{t('sections')}</h3>
          <span className="section-count">{sections.length}</span>
        </div>

        <div className="section-add">
          <div className="section-add-expand">
            {SECTION_PRESETS.map((preset) => (
              <button key={preset} onClick={() => onAddSection(preset)} className="add-section-btn">
                {preset}
              </button>
            ))}
            <button onClick={() => onAddSection('Custom')} className="add-section-btn">Custom</button>
          </div>
        </div>

        <DndProvider
          backend={TouchBackend}
          options={{
            enableMouseEvents: true,
            delayTouchStart: 0,
            delayMouseStart: 0,
            touchSlop: 0,
          }}
        >
          <div className="section-list">
            <div
              className={`section-tab section-tab-all ${activeSectionId === EDITOR.ALL_SECTIONS_ID ? 'active' : ''}`}
              onClick={() => onActivateSection(EDITOR.ALL_SECTIONS_ID)}
            >
              <div className="section-tab-meta">
                <span className="section-order">ALL</span>
                <span className="section-all-label">ALL</span>
              </div>
            </div>

            {sections.map((section, index) => (
              <SectionListCard
                key={section.id}
                section={section}
                index={index}
                isActive={section.id === activeSectionId}
                onActivate={onActivateSection}
                onRename={onRenameSection}
                onDelete={onDeleteSection}
                onMove={onMoveSection}
                onDragPreviewChange={onDragPreviewChange}
              />
            ))}
          </div>
          <SectionDragPreview preview={sectionDragPreview} />
        </DndProvider>
      </section>

      <div
        className="horizontal-resize-handle"
        onMouseDown={onSectionPaneResizeStart}
        role="separator"
        aria-orientation="horizontal"
        aria-label="セクションとアクションの高さ調整"
      />

      <div className="action-pane-wrapper" style={{ flexBasis: `${100 - sectionPaneHeight}%` }}>
        <ActionPane
          sections={sections}
          activeSectionId={activeSectionId}
          currentLyrics={currentLyrics}
          currentStyle={currentStyle}
          currentVocal={currentVocal}
          llmSettings={llmSettings}
          onLLMSettingsChange={onLLMSettingsChange}
        />
      </div>
    </aside>
  );
}

export default RightStackPane;
