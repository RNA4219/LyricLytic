import { useState, useEffect, useCallback } from 'react';
import {
  getProject,
  getWorkingDraft,
  getDraftSections,
  getVersions,
  getFragments,
  saveDraft,
  createVersion,
  createFragment,
  deleteVersion,
  deleteProject,
  Project,
  LyricVersion,
  DraftSectionInput,
  VersionSectionInput,
  CollectedFragment,
} from './api';
import { Section } from './section';

export interface ProjectDataState {
  project: Project | null;
  versions: LyricVersion[];
  sections: Section[];
  fragments: CollectedFragment[];
  loading: boolean;
  saving: boolean;
  lastSaved: Date | null;
  error: string | null;
}

export interface ProjectDataActions {
  loadData: (projectId: string) => Promise<void>;
  saveDraft: (sections: Section[]) => Promise<void>;
  createSnapshot: (name: string, note: string, sections: Section[]) => Promise<void>;
  restoreVersion: (version: LyricVersion) => Promise<void>;
  deleteVersion: (version: LyricVersion) => Promise<void>;
  deleteProject: () => Promise<void>;
  createFragment: (text: string, source: string) => Promise<void>;
  setSaving: (saving: boolean) => void;
  setError: (error: string | null) => void;
}

export type UseProjectDataReturn = ProjectDataState & ProjectDataActions;

/**
 * Hook for managing project data loading and mutations
 */
export function useProjectData(projectId: string | undefined): UseProjectDataReturn {
  const [project, setProject] = useState<Project | null>(null);
  const [versions, setVersions] = useState<LyricVersion[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [fragments, setFragments] = useState<CollectedFragment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (pid: string) => {
    try {
      setLoading(true);
      const [projectData, draftData, versionData, fragmentData] = await Promise.all([
        getProject(pid),
        getWorkingDraft(pid),
        getVersions(pid),
        getFragments(pid),
      ]);
      setProject(projectData);
      setVersions(versionData);
      setFragments(fragmentData);

      if (draftData) {
        const draftSections = await getDraftSections(draftData.working_draft_id);
        // Map draft sections to Section format
        const mappedSections: Section[] = draftSections.map(ds => ({
          id: ds.draft_section_id,
          type: ds.section_type || ds.display_name,
          displayName: ds.display_name,
          sortOrder: ds.sort_order,
          bodyText: ds.body_text,
        }));
        setSections(mappedSections);
      } else {
        setSections([]);
      }

      setError(null);
    } catch (e) {
      setError('Failed to load project');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSaveDraft = useCallback(async (secs: Section[]) => {
    if (!projectId || saving) return;

    try {
      setSaving(true);
      const sectionInputs: DraftSectionInput[] = secs.map(s => ({
        section_type: s.type,
        display_name: s.displayName,
        sort_order: s.sortOrder,
        body_text: s.bodyText,
      }));

      await saveDraft({
        project_id: projectId,
        body_text: secs.map(s => s.bodyText).join('\n\n'),
        sections: sectionInputs,
      });
      setLastSaved(new Date());
      setError(null);
    } catch (e) {
      setError('Auto-save failed');
      console.error(e);
    } finally {
      setSaving(false);
    }
  }, [projectId, saving]);

  const handleCreateSnapshot = useCallback(async (name: string, note: string, secs: Section[]) => {
    if (!projectId) return;

    try {
      const sectionInputs: VersionSectionInput[] = secs.map(s => ({
        section_type: s.type,
        display_name: s.displayName,
        sort_order: s.sortOrder,
        body_text: s.bodyText,
      }));
      const version = await createVersion({
        project_id: projectId,
        snapshot_name: name || new Date().toLocaleString('ja-JP'),
        body_text: secs.map(s => s.bodyText).join('\n\n'),
        note: note || undefined,
        parent_lyric_version_id: versions[0]?.lyric_version_id,
        sections: sectionInputs,
      });
      setVersions([version, ...versions]);
    } catch (e) {
      setError('Failed to save snapshot');
      console.error(e);
    }
  }, [projectId, versions]);

  const handleRestoreVersion = useCallback(async (version: LyricVersion) => {
    // Parse version body text to sections
    const parsedSections: Section[] = version.body_text.split('\n\n').map((text, idx) => ({
      id: crypto.randomUUID(),
      type: 'Section',
      displayName: `Section ${idx + 1}`,
      sortOrder: idx,
      bodyText: text,
    }));
    setSections(parsedSections);
    await handleSaveDraft(parsedSections);
  }, [handleSaveDraft]);

  const handleDeleteVersion = useCallback(async (version: LyricVersion) => {
    if (!confirm(`Delete version "${version.snapshot_name}"? It can be restored from deleted items.`)) return;

    try {
      await deleteVersion(version.lyric_version_id);
      setVersions(versions.filter(v => v.lyric_version_id !== version.lyric_version_id));
    } catch (e) {
      setError('Failed to delete version');
      console.error(e);
    }
  }, [versions]);

  const handleDeleteProject = useCallback(async () => {
    if (!projectId) return;

    try {
      await deleteProject(projectId);
    } catch (e) {
      setError('Failed to delete project');
      console.error(e);
    }
  }, [projectId]);

  const handleCreateFragment = useCallback(async (text: string, source: string) => {
    if (!projectId) return;

    try {
      const fragment = await createFragment({
        project_id: projectId,
        text,
        source,
      });
      setFragments([fragment, ...fragments]);
    } catch (e) {
      console.error('Failed to create fragment:', e);
    }
  }, [projectId, fragments]);

  // Load data when projectId changes
  useEffect(() => {
    if (projectId) {
      loadData(projectId);
    }
  }, [projectId, loadData]);

  return {
    project,
    versions,
    sections,
    fragments,
    loading,
    saving,
    lastSaved,
    error,
    loadData,
    saveDraft: handleSaveDraft,
    createSnapshot: handleCreateSnapshot,
    restoreVersion: handleRestoreVersion,
    deleteVersion: handleDeleteVersion,
    deleteProject: handleDeleteProject,
    createFragment: handleCreateFragment,
    setSaving,
    setError,
  };
}
