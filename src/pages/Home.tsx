import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProjects, createProject, deleteProject, Project } from '../lib/api';
import TrashPanel from '../components/TrashPanel';

const LAST_PROJECT_KEY = 'lyriclytic_last_project';

function Home() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [showNewProjectInput, setShowNewProjectInput] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await getProjects();
      setProjects(data);
      setError(null);

      // Auto-open last project if exists
      const lastProjectId = localStorage.getItem(LAST_PROJECT_KEY);
      if (lastProjectId && data.some(p => p.project_id === lastProjectId)) {
        // Uncomment to auto-redirect:
        // navigate(`/project/${lastProjectId}`);
      }
    } catch (e) {
      setError('Failed to load projects');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    try {
      const project = await createProject({
        title: newProjectTitle || 'Untitled Project',
      });
      localStorage.setItem(LAST_PROJECT_KEY, project.project_id);
      navigate(`/project/${project.project_id}`);
    } catch (e) {
      setError('Failed to create project');
      console.error(e);
    }
  };

  const openProject = (projectId: string) => {
    localStorage.setItem(LAST_PROJECT_KEY, projectId);
    navigate(`/project/${projectId}`);
  };

  const handleDeleteProject = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    if (!confirm('Delete this project? It can be restored from deleted items.')) return;

    try {
      await deleteProject(projectId);
      setProjects(projects.filter(p => p.project_id !== projectId));
      if (localStorage.getItem(LAST_PROJECT_KEY) === projectId) {
        localStorage.removeItem(LAST_PROJECT_KEY);
      }
    } catch (e) {
      setError('Failed to delete project');
      console.error(e);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="home">
      <div className="home-header">
        <h2>LyricLytic</h2>
        <p className="subtitle">AI音楽生成向け歌詞制作ツール</p>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="project-list">
        <div className="project-list-header">
          <h3>Projects ({projects.length})</h3>
          {!showNewProjectInput ? (
            <button onClick={() => setShowNewProjectInput(true)}>
              + New Project
            </button>
          ) : (
            <div className="new-project-form">
              <input
                type="text"
                placeholder="Project title"
                value={newProjectTitle}
                onChange={(e) => setNewProjectTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                autoFocus
              />
              <button onClick={handleCreateProject}>Create</button>
              <button onClick={() => { setShowNewProjectInput(false); setNewProjectTitle(''); }}>
                Cancel
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <p className="loading-text">Loading...</p>
        ) : projects.length === 0 ? (
          <p className="empty-text">No projects yet. Create one to get started.</p>
        ) : (
          <ul className="projects">
            {projects.map((p) => (
              <li key={p.project_id} onClick={() => openProject(p.project_id)}>
                <div className="project-item-content">
                  <span className="project-title">{p.title}</span>
                  <span className="project-date">{formatDate(p.updated_at)}</span>
                </div>
                <button
                  className="delete-btn"
                  onClick={(e) => handleDeleteProject(e, p.project_id)}
                  title="Delete project"
                >
                  🗑
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <TrashPanel onRestore={loadProjects} />

      <div className="home-footer">
        <p>Local-first • Auto-save • Version history</p>
      </div>
    </div>
  );
}

export default Home;