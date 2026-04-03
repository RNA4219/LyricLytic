import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useProjectData } from '../lib/useProjectData';

// Mock the API module
vi.mock('../lib/api', () => ({
  getProject: vi.fn(),
  getWorkingDraft: vi.fn(),
  getDraftSections: vi.fn(),
  getVersions: vi.fn(),
  getFragments: vi.fn(),
  saveDraft: vi.fn(),
  createVersion: vi.fn(),
  createFragment: vi.fn(),
  deleteVersion: vi.fn(),
  deleteProject: vi.fn(),
}));

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
} from '../lib/api';

const mockGetProject = getProject as ReturnType<typeof vi.fn>;
const mockGetWorkingDraft = getWorkingDraft as ReturnType<typeof vi.fn>;
const mockGetDraftSections = getDraftSections as ReturnType<typeof vi.fn>;
const mockGetVersions = getVersions as ReturnType<typeof vi.fn>;
const mockGetFragments = getFragments as ReturnType<typeof vi.fn>;
const mockSaveDraft = saveDraft as ReturnType<typeof vi.fn>;
const mockCreateVersion = createVersion as ReturnType<typeof vi.fn>;
const mockCreateFragment = createFragment as ReturnType<typeof vi.fn>;
const mockDeleteVersion = deleteVersion as ReturnType<typeof vi.fn>;
const mockDeleteProject = deleteProject as ReturnType<typeof vi.fn>;

describe('useProjectData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console.error to suppress noise
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initial state', () => {
    it('should return initial loading state', () => {
      mockGetProject.mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useProjectData('proj-1'));

      expect(result.current.loading).toBe(true);
      expect(result.current.project).toBeNull();
      expect(result.current.versions).toEqual([]);
      expect(result.current.sections).toEqual([]);
      expect(result.current.fragments).toEqual([]);
      expect(result.current.saving).toBe(false);
      expect(result.current.lastSaved).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('should return default values when projectId is undefined', () => {
      const { result } = renderHook(() => useProjectData(undefined));

      expect(result.current.loading).toBe(true);
      expect(result.current.project).toBeNull();
    });
  });

  describe('loadData', () => {
    it('should load all project data successfully', async () => {
      const mockProject = { project_id: 'proj-1', title: 'Test Project' };
      const mockDraft = { working_draft_id: 'wd-1', project_id: 'proj-1' };
      const mockDraftSections = [
        { draft_section_id: 'ds-1', display_name: 'Verse', sort_order: 0, body_text: 'Lyrics' },
      ];
      const mockVersions = [{ lyric_version_id: 'lv-1', snapshot_name: 'v1' }];
      const mockFragments = [{ collected_fragment_id: 'f-1', text: 'Fragment' }];

      mockGetProject.mockResolvedValue(mockProject);
      mockGetWorkingDraft.mockResolvedValue(mockDraft);
      mockGetDraftSections.mockResolvedValue(mockDraftSections);
      mockGetVersions.mockResolvedValue(mockVersions);
      mockGetFragments.mockResolvedValue(mockFragments);

      const { result } = renderHook(() => useProjectData('proj-1'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.project).toEqual(mockProject);
      expect(result.current.versions).toEqual(mockVersions);
      expect(result.current.fragments).toEqual(mockFragments);
      expect(result.current.sections).toHaveLength(1);
      expect(result.current.sections[0].displayName).toBe('Verse');
      expect(result.current.sections[0].bodyText).toBe('Lyrics');
      expect(result.current.error).toBeNull();
    });

    it('should handle null working draft', async () => {
      const mockProject = { project_id: 'proj-1', title: 'Test' };

      mockGetProject.mockResolvedValue(mockProject);
      mockGetWorkingDraft.mockResolvedValue(null);
      mockGetVersions.mockResolvedValue([]);
      mockGetFragments.mockResolvedValue([]);

      const { result } = renderHook(() => useProjectData('proj-1'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.sections).toEqual([]);
    });

    it('should set error on load failure', async () => {
      mockGetProject.mockRejectedValue(new Error('Load failed'));

      const { result } = renderHook(() => useProjectData('proj-1'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load project');
    });

    it('should map sections with null section_type', async () => {
      const mockProject = { project_id: 'proj-1', title: 'Test' };
      const mockDraft = { working_draft_id: 'wd-1', project_id: 'proj-1' };
      const mockDraftSections = [
        { draft_section_id: 'ds-1', section_type: null, display_name: 'Verse', sort_order: 0, body_text: 'Lyrics' },
      ];

      mockGetProject.mockResolvedValue(mockProject);
      mockGetWorkingDraft.mockResolvedValue(mockDraft);
      mockGetDraftSections.mockResolvedValue(mockDraftSections);
      mockGetVersions.mockResolvedValue([]);
      mockGetFragments.mockResolvedValue([]);

      const { result } = renderHook(() => useProjectData('proj-1'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.sections[0].type).toBe('Verse');
    });
  });

  describe('saveDraft', () => {
    it('should save draft successfully', async () => {
      mockGetProject.mockResolvedValue({ project_id: 'proj-1' });
      mockGetWorkingDraft.mockResolvedValue(null);
      mockGetVersions.mockResolvedValue([]);
      mockGetFragments.mockResolvedValue([]);
      mockSaveDraft.mockResolvedValue(undefined);

      const { result } = renderHook(() => useProjectData('proj-1'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const sections = [
        { id: '1', type: 'Verse', displayName: 'Verse', sortOrder: 0, bodyText: 'Lyrics' },
      ];

      await act(async () => {
        await result.current.saveDraft(sections);
      });

      expect(mockSaveDraft).toHaveBeenCalledWith({
        project_id: 'proj-1',
        body_text: 'Lyrics',
        sections: [{
          section_type: 'Verse',
          display_name: 'Verse',
          sort_order: 0,
          body_text: 'Lyrics',
        }],
      });
      expect(result.current.saving).toBe(false);
      expect(result.current.lastSaved).not.toBeNull();
    });

    it('should not save when projectId is undefined', async () => {
      const { result } = renderHook(() => useProjectData(undefined));

      const sections = [
        { id: '1', type: 'Verse', displayName: 'Verse', sortOrder: 0, bodyText: 'Lyrics' },
      ];

      await act(async () => {
        await result.current.saveDraft(sections);
      });

      expect(mockSaveDraft).not.toHaveBeenCalled();
    });

    it('should not save when already saving', async () => {
      mockGetProject.mockResolvedValue({ project_id: 'proj-1' });
      mockGetWorkingDraft.mockResolvedValue(null);
      mockGetVersions.mockResolvedValue([]);
      mockGetFragments.mockResolvedValue([]);
      mockSaveDraft.mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useProjectData('proj-1'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const sections = [
        { id: '1', type: 'Verse', displayName: 'Verse', sortOrder: 0, bodyText: 'Lyrics' },
      ];

      // First save
      act(() => {
        result.current.saveDraft(sections);
      });

      // Second save should be ignored
      await act(async () => {
        await result.current.saveDraft(sections);
      });

      expect(mockSaveDraft).toHaveBeenCalledTimes(1);
    });

    it('should set error on save failure', async () => {
      mockGetProject.mockResolvedValue({ project_id: 'proj-1' });
      mockGetWorkingDraft.mockResolvedValue(null);
      mockGetVersions.mockResolvedValue([]);
      mockGetFragments.mockResolvedValue([]);
      mockSaveDraft.mockRejectedValue(new Error('Save failed'));

      const { result } = renderHook(() => useProjectData('proj-1'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const sections = [
        { id: '1', type: 'Verse', displayName: 'Verse', sortOrder: 0, bodyText: 'Lyrics' },
      ];

      await act(async () => {
        await result.current.saveDraft(sections);
      });

      expect(result.current.error).toBe('Auto-save failed');
      expect(result.current.saving).toBe(false);
    });
  });

  describe('createSnapshot', () => {
    it('should create version successfully', async () => {
      const mockProject = { project_id: 'proj-1' };
      const mockVersion = { lyric_version_id: 'lv-1', snapshot_name: 'v1' };

      mockGetProject.mockResolvedValue(mockProject);
      mockGetWorkingDraft.mockResolvedValue(null);
      mockGetVersions.mockResolvedValue([]);
      mockGetFragments.mockResolvedValue([]);
      mockCreateVersion.mockResolvedValue(mockVersion);

      const { result } = renderHook(() => useProjectData('proj-1'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const sections = [
        { id: '1', type: 'Verse', displayName: 'Verse', sortOrder: 0, bodyText: 'Lyrics' },
      ];

      await act(async () => {
        await result.current.createSnapshot('v1', 'Note', sections);
      });

      expect(mockCreateVersion).toHaveBeenCalled();
      expect(result.current.versions).toHaveLength(1);
    });

    it('should not create snapshot when projectId is undefined', async () => {
      const { result } = renderHook(() => useProjectData(undefined));

      const sections = [
        { id: '1', type: 'Verse', displayName: 'Verse', sortOrder: 0, bodyText: 'Lyrics' },
      ];

      await act(async () => {
        await result.current.createSnapshot('v1', 'Note', sections);
      });

      expect(mockCreateVersion).not.toHaveBeenCalled();
    });
  });

  describe('restoreVersion', () => {
    it('should restore version and save draft', async () => {
      const mockProject = { project_id: 'proj-1' };
      const mockVersion = {
        lyric_version_id: 'lv-1',
        snapshot_name: 'v1',
        body_text: 'Section 1\n\nSection 2',
      };

      mockGetProject.mockResolvedValue(mockProject);
      mockGetWorkingDraft.mockResolvedValue(null);
      mockGetVersions.mockResolvedValue([]);
      mockGetFragments.mockResolvedValue([]);
      mockSaveDraft.mockResolvedValue(undefined);

      const { result } = renderHook(() => useProjectData('proj-1'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.restoreVersion(mockVersion as any);
      });

      expect(result.current.sections).toHaveLength(2);
      expect(mockSaveDraft).toHaveBeenCalled();
    });
  });

  describe('deleteVersion', () => {
    it('should not delete when user cancels confirmation', async () => {
      const mockProject = { project_id: 'proj-1' };
      const mockVersion = { lyric_version_id: 'lv-1', snapshot_name: 'v1' };

      mockGetProject.mockResolvedValue(mockProject);
      mockGetWorkingDraft.mockResolvedValue(null);
      mockGetVersions.mockResolvedValue([mockVersion]);
      mockGetFragments.mockResolvedValue([]);

      // Mock confirm to return false
      vi.spyOn(window, 'confirm').mockReturnValue(false);

      const { result } = renderHook(() => useProjectData('proj-1'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.deleteVersion(mockVersion as any);
      });

      expect(mockDeleteVersion).not.toHaveBeenCalled();
    });

    it('should delete version when confirmed', async () => {
      const mockProject = { project_id: 'proj-1' };
      const mockVersion = { lyric_version_id: 'lv-1', snapshot_name: 'v1' };

      mockGetProject.mockResolvedValue(mockProject);
      mockGetWorkingDraft.mockResolvedValue(null);
      mockGetVersions.mockResolvedValue([mockVersion]);
      mockGetFragments.mockResolvedValue([]);
      mockDeleteVersion.mockResolvedValue('batch-1');

      vi.spyOn(window, 'confirm').mockReturnValue(true);

      const { result } = renderHook(() => useProjectData('proj-1'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.deleteVersion(mockVersion as any);
      });

      expect(mockDeleteVersion).toHaveBeenCalledWith('lv-1');
      expect(result.current.versions).toHaveLength(0);
    });
  });

  describe('deleteProject', () => {
    it('should delete project', async () => {
      const mockProject = { project_id: 'proj-1' };

      mockGetProject.mockResolvedValue(mockProject);
      mockGetWorkingDraft.mockResolvedValue(null);
      mockGetVersions.mockResolvedValue([]);
      mockGetFragments.mockResolvedValue([]);
      mockDeleteProject.mockResolvedValue(undefined);

      const { result } = renderHook(() => useProjectData('proj-1'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.deleteProject();
      });

      expect(mockDeleteProject).toHaveBeenCalledWith('proj-1');
    });

    it('should not delete when projectId is undefined', async () => {
      const { result } = renderHook(() => useProjectData(undefined));

      await act(async () => {
        await result.current.deleteProject();
      });

      expect(mockDeleteProject).not.toHaveBeenCalled();
    });
  });

  describe('createFragment', () => {
    it('should create fragment and add to list', async () => {
      const mockProject = { project_id: 'proj-1' };
      const mockFragment = { collected_fragment_id: 'f-1', text: 'New fragment' };

      mockGetProject.mockResolvedValue(mockProject);
      mockGetWorkingDraft.mockResolvedValue(null);
      mockGetVersions.mockResolvedValue([]);
      mockGetFragments.mockResolvedValue([]);
      mockCreateFragment.mockResolvedValue(mockFragment);

      const { result } = renderHook(() => useProjectData('proj-1'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.createFragment('New fragment', 'user');
      });

      expect(mockCreateFragment).toHaveBeenCalledWith({
        project_id: 'proj-1',
        text: 'New fragment',
        source: 'user',
      });
      expect(result.current.fragments).toHaveLength(1);
    });

    it('should not create fragment when projectId is undefined', async () => {
      const { result } = renderHook(() => useProjectData(undefined));

      await act(async () => {
        await result.current.createFragment('Test', 'user');
      });

      expect(mockCreateFragment).not.toHaveBeenCalled();
    });
  });

  describe('setSaving', () => {
    it('should update saving state', async () => {
      mockGetProject.mockResolvedValue({ project_id: 'proj-1' });
      mockGetWorkingDraft.mockResolvedValue(null);
      mockGetVersions.mockResolvedValue([]);
      mockGetFragments.mockResolvedValue([]);

      const { result } = renderHook(() => useProjectData('proj-1'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setSaving(true);
      });

      expect(result.current.saving).toBe(true);

      act(() => {
        result.current.setSaving(false);
      });

      expect(result.current.saving).toBe(false);
    });
  });

  describe('setError', () => {
    it('should update error state', async () => {
      mockGetProject.mockResolvedValue({ project_id: 'proj-1' });
      mockGetWorkingDraft.mockResolvedValue(null);
      mockGetVersions.mockResolvedValue([]);
      mockGetFragments.mockResolvedValue([]);

      const { result } = renderHook(() => useProjectData('proj-1'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setError('Test error');
      });

      expect(result.current.error).toBe('Test error');

      act(() => {
        result.current.setError(null);
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('reload on projectId change', () => {
    it('should reload data when projectId changes', async () => {
      const mockProject1 = { project_id: 'proj-1', title: 'Project 1' };
      const mockProject2 = { project_id: 'proj-2', title: 'Project 2' };

      mockGetProject.mockResolvedValueOnce(mockProject1);
      mockGetWorkingDraft.mockResolvedValue(null);
      mockGetVersions.mockResolvedValue([]);
      mockGetFragments.mockResolvedValue([]);

      const { result, rerender } = renderHook(
        ({ projectId }) => useProjectData(projectId),
        { initialProps: { projectId: 'proj-1' } }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.project).toEqual(mockProject1);

      mockGetProject.mockResolvedValueOnce(mockProject2);

      rerender({ projectId: 'proj-2' });

      await waitFor(() => {
        expect(result.current.project).toEqual(mockProject2);
      });
    });
  });
});