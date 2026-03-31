import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock @tauri-apps/api/core before importing
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

// Import after mocking
import { invoke } from '@tauri-apps/api/core';
import {
  getProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
  getWorkingDraft,
  getDraftSections,
  saveDraft,
  getVersions,
  createVersion,
  deleteVersion,
  getFragments,
  createFragment,
  deleteFragment,
} from '../lib/api/client';

const mockInvoke = invoke as ReturnType<typeof vi.fn>;

describe('API Client', () => {
  beforeEach(() => {
    mockInvoke.mockReset();
    // Clear window mock
    if (typeof window !== 'undefined') {
      delete (window as any).__TAURI_MOCK__;
    }
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('error handling', () => {
    it('should wrap errors with command name', async () => {
      mockInvoke.mockRejectedValue(new Error('Database error'));

      await expect(getProjects()).rejects.toThrow('Command "get_projects" failed: Database error');
    });

    it('should handle non-Error throws', async () => {
      mockInvoke.mockRejectedValue('String error');

      await expect(getProjects()).rejects.toThrow('Command "get_projects" failed: String error');
    });
  });

  describe('mock support', () => {
    it('should use window.__TAURI_MOCK__ when available', async () => {
      const mockData = [{ project_id: '1', title: 'Test' }];
      (window as any).__TAURI_MOCK__ = vi.fn().mockResolvedValue(mockData);

      const result = await getProjects();

      expect(result).toEqual(mockData);
      expect((window as any).__TAURI_MOCK__).toHaveBeenCalledWith('get_projects', undefined);
    });
  });

  describe('Projects API', () => {
    describe('getProjects', () => {
      it('should call get_projects command', async () => {
        const mockProjects = [
          { project_id: '1', title: 'Project 1' },
          { project_id: '2', title: 'Project 2' },
        ];
        mockInvoke.mockResolvedValue(mockProjects);

        const result = await getProjects();

        expect(mockInvoke).toHaveBeenCalledWith('get_projects', undefined);
        expect(result).toEqual(mockProjects);
      });
    });

    describe('createProject', () => {
      it('should call create_project with input', async () => {
        const input = { title: 'New Project' };
        const mockProject = { project_id: '1', title: 'New Project' };
        mockInvoke.mockResolvedValue(mockProject);

        const result = await createProject(input);

        expect(mockInvoke).toHaveBeenCalledWith('create_project', { input });
        expect(result).toEqual(mockProject);
      });
    });

    describe('getProject', () => {
      it('should call get_project with projectId', async () => {
        const mockProject = { project_id: '123', title: 'Test' };
        mockInvoke.mockResolvedValue(mockProject);

        const result = await getProject('123');

        expect(mockInvoke).toHaveBeenCalledWith('get_project', { projectId: '123' });
        expect(result).toEqual(mockProject);
      });
    });

    describe('updateProject', () => {
      it('should call update_project with projectId and input', async () => {
        const input = { title: 'Updated' };
        const mockProject = { project_id: '123', title: 'Updated' };
        mockInvoke.mockResolvedValue(mockProject);

        const result = await updateProject('123', input);

        expect(mockInvoke).toHaveBeenCalledWith('update_project', { projectId: '123', input });
        expect(result).toEqual(mockProject);
      });
    });

    describe('deleteProject', () => {
      it('should call delete_project with projectId', async () => {
        mockInvoke.mockResolvedValue(undefined);

        await deleteProject('123');

        expect(mockInvoke).toHaveBeenCalledWith('delete_project', { projectId: '123' });
      });
    });
  });

  describe('Drafts API', () => {
    describe('getWorkingDraft', () => {
      it('should call get_working_draft with projectId', async () => {
        const mockDraft = {
          working_draft_id: 'draft-1',
          project_id: 'proj-1',
          latest_body_text: 'Lyrics',
        };
        mockInvoke.mockResolvedValue(mockDraft);

        const result = await getWorkingDraft('proj-1');

        expect(mockInvoke).toHaveBeenCalledWith('get_working_draft', { projectId: 'proj-1' });
        expect(result).toEqual(mockDraft);
      });

      it('should return null when no draft exists', async () => {
        mockInvoke.mockResolvedValue(null);

        const result = await getWorkingDraft('proj-1');

        expect(result).toBeNull();
      });
    });

    describe('getDraftSections', () => {
      it('should call get_draft_sections with workingDraftId', async () => {
        const mockSections = [
          { draft_section_id: '1', display_name: 'Verse', body_text: 'Text' },
        ];
        mockInvoke.mockResolvedValue(mockSections);

        const result = await getDraftSections('draft-1');

        expect(mockInvoke).toHaveBeenCalledWith('get_draft_sections', { workingDraftId: 'draft-1' });
        expect(result).toEqual(mockSections);
      });
    });

    describe('saveDraft', () => {
      it('should call save_draft with input', async () => {
        const input = {
          project_id: 'proj-1',
          body_text: 'Lyrics',
          sections: [],
        };
        mockInvoke.mockResolvedValue(undefined);

        await saveDraft(input);

        expect(mockInvoke).toHaveBeenCalledWith('save_draft', { input });
      });
    });
  });

  describe('Versions API', () => {
    describe('getVersions', () => {
      it('should call get_versions with projectId', async () => {
        const mockVersions = [
          { lyric_version_id: 'v1', snapshot_name: 'Draft 1' },
        ];
        mockInvoke.mockResolvedValue(mockVersions);

        const result = await getVersions('proj-1');

        expect(mockInvoke).toHaveBeenCalledWith('get_versions', { projectId: 'proj-1' });
        expect(result).toEqual(mockVersions);
      });
    });

    describe('createVersion', () => {
      it('should call create_version with input', async () => {
        const input = {
          project_id: 'proj-1',
          snapshot_name: 'New Version',
          body_text: 'Lyrics',
        };
        const mockVersion = { lyric_version_id: 'v1', ...input };
        mockInvoke.mockResolvedValue(mockVersion);

        const result = await createVersion(input);

        expect(mockInvoke).toHaveBeenCalledWith('create_version', { input });
        expect(result).toEqual(mockVersion);
      });
    });

    describe('deleteVersion', () => {
      it('should call delete_version with lyricVersionId', async () => {
        mockInvoke.mockResolvedValue(undefined);

        await deleteVersion('v1');

        expect(mockInvoke).toHaveBeenCalledWith('delete_version', { lyricVersionId: 'v1' });
      });
    });
  });

  describe('Fragments API', () => {
    describe('getFragments', () => {
      it('should call get_fragments with projectId', async () => {
        const mockFragments = [
          { collected_fragment_id: 'f1', text: 'Fragment text' },
        ];
        mockInvoke.mockResolvedValue(mockFragments);

        const result = await getFragments('proj-1');

        expect(mockInvoke).toHaveBeenCalledWith('get_fragments', { projectId: 'proj-1' });
        expect(result).toEqual(mockFragments);
      });
    });

    describe('createFragment', () => {
      it('should call create_fragment with input', async () => {
        const input = {
          project_id: 'proj-1',
          text: 'New fragment',
        };
        const mockFragment = { collected_fragment_id: 'f1', ...input };
        mockInvoke.mockResolvedValue(mockFragment);

        const result = await createFragment(input);

        expect(mockInvoke).toHaveBeenCalledWith('create_fragment', { input });
        expect(result).toEqual(mockFragment);
      });
    });

    describe('deleteFragment', () => {
      it('should call delete_fragment with fragmentId', async () => {
        mockInvoke.mockResolvedValue(undefined);

        await deleteFragment('f1');

        expect(mockInvoke).toHaveBeenCalledWith('delete_fragment', { fragmentId: 'f1' });
      });
    });
  });
});