import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../lib/LanguageContext';
import { useProject } from '../lib/ProjectContext';

function Layout() {
  const { language, setLanguage, t } = useLanguage();
  const { projectTitle } = useProject();
  const navigate = useNavigate();
  const location = useLocation();

  // Reset project title when navigating away from editor
  const isEditorPage = location.pathname.startsWith('/project/');

  return (
    <div className="layout">
      <header className="header">
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