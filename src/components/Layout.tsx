import { Outlet } from 'react-router-dom';

function Layout() {
  return (
    <div className="layout">
      <header className="header">
        <h1>LyricLytic</h1>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;