import { createContext, useContext, useState, ReactNode } from 'react';

interface ProjectContextType {
  projectTitle: string | null;
  setProjectTitle: (title: string | null) => void;
}

const ProjectContext = createContext<ProjectContextType | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projectTitle, setProjectTitle] = useState<string | null>(null);

  return (
    <ProjectContext.Provider value={{ projectTitle, setProjectTitle }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within ProjectProvider');
  }
  return context;
}