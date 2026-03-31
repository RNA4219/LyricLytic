import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { LanguageProvider } from './lib/LanguageContext';
import { ProjectProvider } from './lib/ProjectContext';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <ProjectProvider>
          <App />
        </ProjectProvider>
      </LanguageProvider>
    </BrowserRouter>
  </React.StrictMode>
);