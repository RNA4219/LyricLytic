import { Outlet } from 'react-router-dom';
import { useLanguage } from '../lib/LanguageContext';

function Layout() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="layout">
      <header className="header">
        <h1>{t('appTitle')}</h1>
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