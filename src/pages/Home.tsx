import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProjects, createProject, deleteProject, Project } from '../lib/api';
import { useLanguage } from '../lib/LanguageContext';
import TrashPanel from '../components/TrashPanel';

const LAST_PROJECT_KEY = 'lyriclytic_last_project';

function Home() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [showNewProjectInput, setShowNewProjectInput] = useState(false);
  const [showTrashPanel, setShowTrashPanel] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await getProjects();
      setProjects(data);
      setError(null);
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
      navigate(`/project/${project.project_id}`);
    } catch (e) {
      setError(t('createFailed'));
      console.error(e);
    }
  };

  const openProject = (projectId: string) => {
    localStorage.setItem(LAST_PROJECT_KEY, projectId);
    navigate(`/project/${projectId}`);
  };

  const handleDeleteProject = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    if (!confirm(t('deleteConfirm'))) return;

    try {
      await deleteProject(projectId);
      setProjects((current) => current.filter((project) => project.project_id !== projectId));
      if (localStorage.getItem(LAST_PROJECT_KEY) === projectId) {
        localStorage.removeItem(LAST_PROJECT_KEY);
      }
    } catch (e) {
      setError(t('deleteFailed'));
      console.error(e);
    }
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
    return [...projects].sort((a, b) => (
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    ))[0];
  }, [projects]);

  const sortedProjects = useMemo(() => (
    [...projects].sort((a, b) => (
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    ))
  ), [projects]);

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

  const insightCards = language === 'ja'
    ? [
        { title: 'Fragment Library', subtitle: 'フレーズやモチーフをここから育てる' },
        { title: 'Version History', subtitle: '良かった改稿を見失わない' },
      ]
    : [
        { title: 'Fragment Library', subtitle: 'Grow phrases and motifs from here' },
        { title: 'Version History', subtitle: 'Keep strong rewrites within reach' },
      ];

  return (
    <div className="home-shell">
      <aside className="home-sidebar">
        <div className="home-brand">
          <h1>{t('appTitle')}</h1>
          <p className="subtitle home-subtitle">{t('subtitle')}</p>
        </div>

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

        <nav className="home-nav">
          <button className="home-nav-item active" type="button">
            <span className="home-nav-icon">▣</span>
            <span>{t('projects')}</span>
          </button>
          <button className="home-nav-item" type="button" onClick={() => setShowTrashPanel(true)}>
            <span className="home-nav-icon">⋯</span>
            <span>{t('more')}</span>
          </button>
        </nav>

        <div className="home-sidebar-footer">
          <div className="home-sidebar-avatar">L</div>
          <div>
            <div className="home-sidebar-name">LyricLytic</div>
            <div className="home-sidebar-role">Local-first workspace</div>
          </div>
        </div>
      </aside>

      <main className="home-main">
        <header className="home-topbar">
          <div>
            <h2>{t('projects')}</h2>
            <p>{projectSummary}</p>
          </div>

          <div className="home-topbar-right">
            <div className="home-search">
              <span>⌕</span>
              <input
                type="text"
                placeholder={language === 'ja' ? 'プロジェクトを検索...' : 'Search projects...'}
                aria-label={language === 'ja' ? 'プロジェクト検索' : 'Search projects'}
              />
            </div>

            {recentProject && (
              <button
                className="home-recent-link"
                type="button"
                onClick={() => openProject(recentProject.project_id)}
              >
                <span className="home-recent-label">
                  {language === 'ja' ? 'Recent Activity' : 'Recent Activity'}
                </span>
                <span className="home-recent-title">{recentProject.title}</span>
              </button>
            )}
          </div>
        </header>

        {error && <div className="home-error-banner">{error}</div>}

        <section className="home-atelier-strip">
          <div className="home-atelier-copy">
            <p className="home-hero-kicker">
              {language === 'ja' ? 'Lyric Workspace' : 'Lyric Workspace'}
            </p>
            <h3>
              {language === 'ja'
                ? 'フレーズ、構成、改稿を静かに積み上げる'
                : 'Build fragments, structure, and revisions without breaking flow'}
            </h3>
            <p>
              {language === 'ja'
                ? '作業の主役はいつも歌詞本文です。最近の下書きへ戻りながら、必要なときだけ履歴やフレーズに触れられます。'
                : 'Keep the lyric draft at the center, and reach for history or fragments only when you need them.'}
            </p>
          </div>

          <div className="home-atelier-stats">
            <div className="home-atelier-pill">
              <span>{language === 'ja' ? 'Projects' : 'Projects'}</span>
              <strong>{projects.length}</strong>
            </div>
            <div className="home-atelier-pill">
              <span>{language === 'ja' ? 'Latest Draft' : 'Latest Draft'}</span>
              <strong>{recentProject ? recentProject.title : '-'}</strong>
            </div>
          </div>
        </section>

        <div className="home-view-tabs" aria-label={language === 'ja' ? 'プロジェクトビュー' : 'Project views'}>
          <button className="home-view-tab active" type="button">
            {language === 'ja' ? 'Recent' : 'Recent'}
          </button>
          <button className="home-view-tab" type="button">
            {language === 'ja' ? 'Favorites' : 'Favorites'}
          </button>
          <button className="home-view-tab" type="button">
            {language === 'ja' ? 'All Projects' : 'All Projects'}
          </button>
        </div>

        <section className="home-section">
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
                        onClick={(e) => handleDeleteProject(e, project.project_id)}
                        title={t('deleteProject')}
                      >
                        ×
                      </button>
                    </div>

                    <h4>{project.title}</h4>
                    <p className="home-project-desc">
                      {project.theme
                        ? project.theme
                        : (language === 'ja'
                          ? '新しいフレーズ、構成、改稿のアイデアをここから育てる。'
                          : 'Develop new phrases, structures, and rewrites from here.')}
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

        <section className="home-section">
          <div className="home-section-header">
            <div>
              <p className="home-section-kicker">Digital Atelier</p>
              <h3>{language === 'ja' ? 'Creative Notes' : 'Creative Notes'}</h3>
            </div>
          </div>

          <div className="home-insight-grid">
            {insightCards.map((card) => (
              <div key={card.title} className="home-insight-card">
                <h4>{card.title}</h4>
                <p>{card.subtitle}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="home-footer">
          <p>{t('footerText')}</p>
        </footer>
      </main>

      {showTrashPanel && (
        <TrashPanel
          onRestore={() => {
            loadProjects();
            setShowTrashPanel(false);
          }}
          onClose={() => setShowTrashPanel(false)}
        />
      )}
    </div>
  );
}

export default Home;
