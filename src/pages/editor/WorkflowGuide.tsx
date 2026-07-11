import { useState } from 'react';
import { useLanguage } from '../../lib/LanguageContext';

const FEEDBACK_URL = 'https://github.com/RNA4219/LyricLytic/issues/new?template=first-session-feedback.yml&title=%5BFeedback%5D+First+session';

interface WorkflowGuideProps {
  hasLyrics: boolean;
  canUseSample: boolean;
  onUseSample: () => void;
  onFocusEditor: () => void;
  onRevealAnalysis: () => void;
  onExport: () => void;
}

function WorkflowGuide({
  hasLyrics,
  canUseSample,
  onUseSample,
  onFocusEditor,
  onRevealAnalysis,
  onExport,
}: WorkflowGuideProps) {
  const { t } = useLanguage();
  const [dismissed, setDismissed] = useState(false);
  const [analysisViewed, setAnalysisViewed] = useState(false);
  const [exportOpened, setExportOpened] = useState(false);

  if (dismissed) return null;

  const revealAnalysis = () => {
    setAnalysisViewed(true);
    onRevealAnalysis();
  };

  const openExport = () => {
    setExportOpened(true);
    onExport();
  };

  return (
    <section className="workflow-guide" aria-labelledby="workflow-guide-title">
      <div className="workflow-guide-heading">
        <div>
          <span className="workflow-guide-kicker">{t('workflowKicker')}</span>
          <h2 id="workflow-guide-title">{t('workflowTitle')}</h2>
          <p>{t('workflowDescription')}</p>
        </div>
        <button
          type="button"
          className="workflow-guide-dismiss"
          onClick={() => setDismissed(true)}
          aria-label={t('dismissWorkflowGuide')}
          title={t('dismissWorkflowGuide')}
        >
          ×
        </button>
      </div>

      <ol className="workflow-steps">
        <li className={hasLyrics ? 'is-complete' : ''}>
          <span className="workflow-step-number">1</span>
          <div>
            <strong>{t('workflowWriteTitle')}</strong>
            <p>{t('workflowWriteDescription')}</p>
            {!hasLyrics && (
              <div className="workflow-step-actions">
                {canUseSample && (
                  <button type="button" className="workflow-primary-action" onClick={onUseSample}>
                    {t('workflowUseSample')}
                  </button>
                )}
                <button type="button" className="workflow-secondary-action" onClick={onFocusEditor}>
                  {t('workflowStartWriting')}
                </button>
              </div>
            )}
          </div>
        </li>
        <li className={analysisViewed ? 'is-complete' : ''}>
          <span className="workflow-step-number">2</span>
          <div>
            <strong>{t('workflowAnalyzeTitle')}</strong>
            <p>{t('workflowAnalyzeDescription')}</p>
            <button type="button" className="workflow-secondary-action" onClick={revealAnalysis} disabled={!hasLyrics}>
              {t('workflowRevealAnalysis')}
            </button>
          </div>
        </li>
        <li className={exportOpened ? 'is-complete' : ''}>
          <span className="workflow-step-number">3</span>
          <div>
            <strong>{t('workflowExportTitle')}</strong>
            <p>{t('workflowExportDescription')}</p>
            <button type="button" className="workflow-secondary-action" onClick={openExport} disabled={!hasLyrics}>
              {t('workflowOpenExport')}
            </button>
          </div>
        </li>
      </ol>

      <a className="workflow-feedback-link" href={FEEDBACK_URL} target="_blank" rel="noreferrer">
        {t('workflowFeedbackLink')}
      </a>
    </section>
  );
}

export default WorkflowGuide;
