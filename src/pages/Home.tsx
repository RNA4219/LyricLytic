import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getProjects,
  createProject,
  deleteProject,
  updateProject,
  getStyleProfile,
  getWorkingDraft,
  getDraftSections,
  Project,
  StyleProfile,
  DraftSection,
} from '../lib/api';
import { useLanguage } from '../lib/LanguageContext';
import TrashPanel from '../components/TrashPanel';

const LAST_PROJECT_KEY = 'lyriclytic_last_project';
const PROJECT_ORDER_KEY = 'lyriclytic_project_order';
const PREVIEW_SECTION_PRIORITY = ['intro', 'chorus', 'verse', 'pre-chorus', 'bridge', 'outro'];

function readProjectOrder() {
  try {
    const raw = localStorage.getItem(PROJECT_ORDER_KEY);
    if (!raw) return [] as string[];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : [];
  } catch {
    return [] as string[];
  }
}

function writeProjectOrder(order: string[]) {
  localStorage.setItem(PROJECT_ORDER_KEY, JSON.stringify(order));
}

function touchProjectOrder(projectId: string) {
  const nextOrder = [projectId, ...readProjectOrder().filter((id) => id !== projectId)];
  writeProjectOrder(nextOrder);
  return nextOrder;
}

function removeProjectFromOrder(projectId: string) {
  const nextOrder = readProjectOrder().filter((id) => id !== projectId);
  writeProjectOrder(nextOrder);
  return nextOrder;
}

function normalizeSectionName(name?: string) {
  return (name ?? '').trim().toLowerCase();
}

function extractSectionPreview(section: DraftSection | undefined, language: 'ja' | 'en') {
  if (!section) return null;
  const firstNonEmptyLine = section.body_text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length > 0);

  if (!firstNonEmptyLine) return null;

  const label = section.display_name?.trim() || (language === 'ja' ? '歌詞' : 'Lyrics');
  return `${label}: ${firstNonEmptyLine}`;
}

function buildProjectPreview(
  sections: DraftSection[],
  bodyText: string,
  language: 'ja' | 'en',
) {
  const nonEmptySections = [...sections]
    .sort((a, b) => a.sort_order - b.sort_order)
    .filter((section) => section.body_text.trim().length > 0);

  for (const key of PREVIEW_SECTION_PRIORITY) {
    const match = nonEmptySections.find((section) => {
      const type = normalizeSectionName(section.section_type);
      const displayName = normalizeSectionName(section.display_name);
      return type === key || displayName === key;
    });
    const preview = extractSectionPreview(match, language);
    if (preview) return preview;
  }

  const firstSectionPreview = extractSectionPreview(nonEmptySections[0], language);
  if (firstSectionPreview) return firstSectionPreview;

  const firstBodyLine = bodyText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length > 0 && !/^\[[^\]]+\]$/.test(line));

  return firstBodyLine ?? null;
}

function Home() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [projects, setProjects] = useState<Project[]>([]);
  const [styleProfiles, setStyleProfiles] = useState<Map<string, StyleProfile>>(new Map());
  const [projectPreviews, setProjectPreviews] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [showNewProjectInput, setShowNewProjectInput] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingProjectTitle, setEditingProjectTitle] = useState('');
  const [pendingDeleteProject, setPendingDeleteProject] = useState<Project | null>(null);
  const [showTrashPanel, setShowTrashPanel] = useState(false);
  const [lastOpenedProjectId, setLastOpenedProjectId] = useState<string | null>(() => (
    localStorage.getItem(LAST_PROJECT_KEY)
  ));
  const [projectOrder, setProjectOrder] = useState<string[]>(() => readProjectOrder());

  useEffect(() => {
    loadProjects();
  }, [language]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await getProjects();
      setProjects(data);
      setError(null);

      // Load style profiles for each project
      const profileMap = new Map<string, StyleProfile>();
      for (const project of data) {
        try {
          const profile = await getStyleProfile(project.project_id);
          if (profile) {
            profileMap.set(project.project_id, profile);
          }
        } catch {
          // Style profile may not exist, ignore
        }
      }
      setStyleProfiles(profileMap);

      const previewEntries = await Promise.all(
        data.map(async (project) => {
          try {
            const draft = await getWorkingDraft(project.project_id);
            if (!draft) return [project.project_id, ''] as const;

            const sections = await getDraftSections(draft.working_draft_id);
            const preview = buildProjectPreview(sections, draft.latest_body_text, language);
            return [project.project_id, preview ?? ''] as const;
          } catch {
            return [project.project_id, ''] as const;
          }
        }),
      );
      setProjectPreviews(new Map(previewEntries));
    } catch (e) {
      setError(t('loadFailed'));
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    try {
      const project = await createProject({
        title: newProjectTitle.trim() || t('newProject'),
      });
      localStorage.setItem(LAST_PROJECT_KEY, project.project_id);
      setLastOpenedProjectId(project.project_id);
      setProjectOrder(touchProjectOrder(project.project_id));
      navigate(`/project/${project.project_id}`);
    } catch (e) {
      setError(t('createFailed'));
      console.error(e);
    }
  };

  const openProject = (projectId: string) => {
    localStorage.setItem(LAST_PROJECT_KEY, projectId);
    setLastOpenedProjectId(projectId);
    setProjectOrder(touchProjectOrder(projectId));
    navigate(`/project/${projectId}`);
  };

  const requestDeleteProject = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setPendingDeleteProject(project);
  };

  const confirmDeleteProject = async () => {
    if (!pendingDeleteProject) return;
    const projectId = pendingDeleteProject.project_id;
    try {
      await deleteProject(projectId);
      setProjects((current) => current.filter((project) => project.project_id !== projectId));
      if (localStorage.getItem(LAST_PROJECT_KEY) === projectId) {
        localStorage.removeItem(LAST_PROJECT_KEY);
        setLastOpenedProjectId(null);
      }
      setProjectOrder(removeProjectFromOrder(projectId));
      setPendingDeleteProject(null);
    } catch (e) {
      setError(t('deleteFailed'));
      console.error(e);
    }
  };

  const cancelDeleteProject = () => {
    setPendingDeleteProject(null);
  };

  const startEditingProjectTitle = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setEditingProjectId(project.project_id);
    setEditingProjectTitle(project.title);
  };

  const handleSaveProjectTitle = async (projectId: string) => {
    const nextTitle = editingProjectTitle.trim();
    if (!nextTitle) {
      setEditingProjectId(null);
      setEditingProjectTitle('');
      return;
    }

    try {
      const updated = await updateProject(projectId, { title: nextTitle });
      setProjects((current) => current.map((project) => (
        project.project_id === projectId
          ? { ...project, title: updated.title, updated_at: updated.updated_at }
          : project
      )));
      setEditingProjectId(null);
      setEditingProjectTitle('');
    } catch (e) {
      setError(t('saveFailed'));
      console.error(e);
    }
  };

  const stopEditingProjectTitle = () => {
    setEditingProjectId(null);
    setEditingProjectTitle('');
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(language === 'ja' ? 'ja-JP' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const recentProject = useMemo(() => {
    if (projects.length === 0) return null;
    if (lastOpenedProjectId) {
      const lastOpenedProject = projects.find((project) => project.project_id === lastOpenedProjectId);
      if (lastOpenedProject) return lastOpenedProject;
    }
    return [...projects].sort((a, b) => (
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    ))[0];
  }, [lastOpenedProjectId, projects]);

  const sortedProjects = useMemo(() => (
    [...projects].sort((a, b) => {
      const aOrderIndex = projectOrder.indexOf(a.project_id);
      const bOrderIndex = projectOrder.indexOf(b.project_id);
      if (aOrderIndex !== -1 || bOrderIndex !== -1) {
        if (aOrderIndex === -1) return 1;
        if (bOrderIndex === -1) return -1;
        return aOrderIndex - bOrderIndex;
      }
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    })
  ), [projectOrder, projects]);

  const projectSummary = useMemo(() => {
    if (projects.length === 0) {
      return language === 'ja'
        ? '静かなワークスペースで、新しい歌詞プロジェクトを始めましょう。'
        : 'Start a new lyric project in a calm, focused workspace.';
    }

    return language === 'ja'
      ? `${projects.length} 件のプロジェクトを管理しています。最新の下書きからすぐ再開できます。`
      : `You have ${projects.length} projects ready to revisit. Jump back into your latest draft anytime.`;
  }, [language, projects.length]);

  return (
    <div className="home-shell home-shell-minimal">
      <main className="home-main home-main-minimal">
        <section className="home-create-section">
        {!showNewProjectInput ? (
          <button className="home-primary-cta" onClick={() => setShowNewProjectInput(true)}>
            <span>+</span>
            <span>{t('newProject')}</span>
          </button>
        ) : (
          <div className="home-create-card">
            <label htmlFor="project-title-input">{t('projectTitle')}</label>
            <input
              id="project-title-input"
              type="text"
              placeholder={t('projectTitle')}
              value={newProjectTitle}
              onChange={(e) => setNewProjectTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
              autoFocus
            />
            <div className="home-create-actions">
              <button className="home-create-submit" onClick={handleCreateProject}>
                {t('create')}
              </button>
              <button
                className="home-create-cancel"
                onClick={() => {
                  setShowNewProjectInput(false);
                  setNewProjectTitle('');
                }}
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        )}
        </section>

        {error && <div className="home-error-banner">{error}</div>}

        <section className="home-section">
          <div className="home-section-header home-section-header-minimal">
            <div>
              <h3>{t('projects')}</h3>
              <p>{projectSummary}</p>
            </div>
          </div>
          {loading ? (
            <div className="home-empty-state">
              <p>{t('loading')}</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="home-empty-state">
              <h4>{language === 'ja' ? 'まだプロジェクトがありません' : 'No projects yet'}</h4>
              <p>{t('noProjects')}</p>
            </div>
          ) : (
            <div className="home-project-grid">
              {sortedProjects.map((project) => {
                const isRecent = recentProject?.project_id === project.project_id;
                return (
                  <article
                    key={project.project_id}
                    className={`home-project-card ${isRecent ? 'is-recent' : ''}`}
                    onClick={() => openProject(project.project_id)}
                  >
                    <div className="home-project-card-top">
                      <span className="home-project-badge">
                        {isRecent
                          ? (language === 'ja' ? 'Current Draft' : 'Current Draft')
                          : (language === 'ja' ? 'Project' : 'Project')}
                      </span>
                      <button
                        className="home-project-delete"
                        onClick={(e) => requestDeleteProject(e, project)}
                        title={t('deleteProject')}
                      >
                        ×
                      </button>
                    </div>

                    <div className="home-project-title-row">
                      {editingProjectId === project.project_id ? (
                        <input
                          className="home-project-title-input"
                          type="text"
                          value={editingProjectTitle}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => setEditingProjectTitle(e.target.value)}
                          onBlur={() => handleSaveProjectTitle(project.project_id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              void handleSaveProjectTitle(project.project_id);
                            }
                            if (e.key === 'Escape') {
                              stopEditingProjectTitle();
                            }
                          }}
                          autoFocus
                        />
                      ) : (
                        <>
                          <h4>{project.title}</h4>
                          <button
                            className="home-project-edit"
                            onClick={(e) => startEditingProjectTitle(e, project)}
                            title={language === 'ja' ? 'タイトルを編集' : 'Edit title'}
                          >
                            ✎
                          </button>
                        </>
                      )}
                    </div>
                    <p className="home-project-desc">
                      {(() => {
                        const profile = styleProfiles.get(project.project_id);
                        const preview = projectPreviews.get(project.project_id);
                        if (preview) return preview;
                        if (profile?.memo) return profile.memo;
                        if (profile?.tone) return profile.tone;
                        if (profile?.vocabulary_bias) return profile.vocabulary_bias;
                        if (project.theme) return project.theme;
                        return language === 'ja'
                          ? '新しいフレーズ、構成、改稿のアイデアをここから育てる。'
                          : 'Develop new phrases, structures, and rewrites from here.';
                      })()}
                    </p>

                    <div className="home-project-meta">
                      <span className="home-project-chip">
                        {isRecent
                          ? (language === 'ja' ? 'Current Draft' : 'Current Draft')
                          : (language === 'ja' ? 'Saved Project' : 'Saved Project')}
                      </span>
                      <span>{formatDate(project.updated_at)}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="home-trash-entry">
          <button className="home-trash-link" onClick={() => setShowTrashPanel(true)}>
            {t('deletedItems')}
          </button>
        </section>
      </main>

      {pendingDeleteProject && (
        <div className="home-modal-backdrop" onClick={cancelDeleteProject}>
          <div className="home-modal-card" onClick={(e) => e.stopPropagation()}>
            <h4>{t('deleteProject')}</h4>
            <p>{t('deleteConfirm')}</p>
            <div className="home-modal-project-name">{pendingDeleteProject.title}</div>
            <div className="home-modal-actions">
              <button className="home-modal-cancel" onClick={cancelDeleteProject}>
                {t('cancel')}
              </button>
              <button className="home-modal-delete" onClick={confirmDeleteProject}>
                {t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showTrashPanel && (
        <TrashPanel
          onRestore={loadProjects}
          onClose={() => setShowTrashPanel(false)}
        />
      )}
    </div>
  );
}

export default Home;
