import { createContext, useCallback, useContext, useRef, useState, ReactNode } from 'react';

interface ProjectContextType {
  projectTitle: string | null;
  setProjectTitle: (title: string | null) => void;
  setBeforeLeave: (handler: (() => Promise<boolean>) | null) => void;
  runBeforeLeave: () => Promise<boolean>;
}

const ProjectContext = createContext<ProjectContextType | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projectTitle, setProjectTitle] = useState<string | null>(null);

  const beforeLeaveRef = useRef<(() => Promise<boolean>) | null>(null);
  const setBeforeLeave = useCallback((handler: (() => Promise<boolean>) | null) => {
    beforeLeaveRef.current = handler;
  }, []);
  const runBeforeLeave = useCallback(async (): Promise<boolean> => {
    if (beforeLeaveRef.current) {
      return beforeLeaveRef.current();
    }
    return true;
  }, []);
  return (
    <ProjectContext.Provider value={{ projectTitle, setProjectTitle, setBeforeLeave, runBeforeLeave }}>
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