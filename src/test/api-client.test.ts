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
  getDeletedProjects,
  restoreProject,
  getWorkingDraft,
  getDraftSections,
  saveDraft,
  getVersions,
  createVersion,
  getVersion,
  getVersionSections,
  deleteVersion,
  getFragments,
  createFragment,
  updateFragment,
  deleteFragment,
  getSongArtifacts,
  createSongArtifact,
  deleteSongArtifact,
  getRevisionNotes,
  createRevisionNote,
  deleteRevisionNote,
  getStyleProfile,
  createStyleProfile,
  updateStyleProfile,
  deleteStyleProfile,
  exportProject,
  startLlamaCppRuntime,
  stopLlamaCppRuntime,
  getLlamaCppRuntimeStatus,
  detectLlamaCppExecutable,
  analyzeRhymeText,
  getDeletedItems,
  restoreVersion,
  restoreFragment,
  restoreSongArtifact,
  restoreStyleProfile,
  permanentlyDeleteProject,
  permanentlyDeleteVersion,
  permanentlyDeleteFragment,
  permanentlyDeleteSongArtifact,
  permanentlyDeleteStyleProfile,
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

  describe('Song Artifacts API', () => {
    describe('getSongArtifacts', () => {
      it('should call get_song_artifacts with projectId', async () => {
        const mockArtifacts = [{ song_artifact_id: 'sa1', song_title: 'Test' }];
        mockInvoke.mockResolvedValue(mockArtifacts);

        const result = await getSongArtifacts('proj-1');

        expect(mockInvoke).toHaveBeenCalledWith('get_song_artifacts', { projectId: 'proj-1' });
        expect(result).toEqual(mockArtifacts);
      });
    });

    describe('createSongArtifact', () => {
      it('should call create_song_artifact with input', async () => {
        const input = { project_id: 'proj-1', service_name: 'Suno', song_title: 'Test' };
        const mockArtifact = { song_artifact_id: 'sa1', ...input };
        mockInvoke.mockResolvedValue(mockArtifact);

        const result = await createSongArtifact(input);

        expect(mockInvoke).toHaveBeenCalledWith('create_song_artifact', { input });
        expect(result).toEqual(mockArtifact);
      });
    });

    describe('deleteSongArtifact', () => {
      it('should call delete_song_artifact with artifactId', async () => {
        mockInvoke.mockResolvedValue(undefined);

        await deleteSongArtifact('sa1');

        expect(mockInvoke).toHaveBeenCalledWith('delete_song_artifact', { artifactId: 'sa1' });
      });
    });
  });

  describe('Revision Notes API', () => {
    describe('getRevisionNotes', () => {
      it('should call get_revision_notes with lyricVersionId', async () => {
        const mockNotes = [{ revision_note_id: 'rn1', content: 'Note' }];
        mockInvoke.mockResolvedValue(mockNotes);

        const result = await getRevisionNotes('lv1');

        expect(mockInvoke).toHaveBeenCalledWith('get_revision_notes', { lyricVersionId: 'lv1' });
        expect(result).toEqual(mockNotes);
      });
    });

    describe('createRevisionNote', () => {
      it('should call create_revision_note with input', async () => {
        const input = { lyric_version_id: 'lv1', content: 'Note' };
        const mockNote = { revision_note_id: 'rn1', ...input };
        mockInvoke.mockResolvedValue(mockNote);

        const result = await createRevisionNote(input);

        expect(mockInvoke).toHaveBeenCalledWith('create_revision_note', { input });
        expect(result).toEqual(mockNote);
      });
    });

    describe('deleteRevisionNote', () => {
      it('should call delete_revision_note with noteId', async () => {
        mockInvoke.mockResolvedValue(undefined);

        await deleteRevisionNote('rn1');

        expect(mockInvoke).toHaveBeenCalledWith('delete_revision_note', { noteId: 'rn1' });
      });
    });
  });

  describe('Style Profiles API', () => {
    describe('getStyleProfile', () => {
      it('should call get_style_profile with projectId', async () => {
        const mockProfile = { style_profile_id: 'sp1', genre: 'Pop' };
        mockInvoke.mockResolvedValue(mockProfile);

        const result = await getStyleProfile('proj-1');

        expect(mockInvoke).toHaveBeenCalledWith('get_style_profile', { projectId: 'proj-1' });
        expect(result).toEqual(mockProfile);
      });

      it('should return null when no profile exists', async () => {
        mockInvoke.mockResolvedValue(null);

        const result = await getStyleProfile('proj-1');

        expect(result).toBeNull();
      });
    });

    describe('createStyleProfile', () => {
      it('should call create_style_profile with input', async () => {
        const input = { project_id: 'proj-1', genre: 'Rock' };
        const mockProfile = { style_profile_id: 'sp1', ...input };
        mockInvoke.mockResolvedValue(mockProfile);

        const result = await createStyleProfile(input);

        expect(mockInvoke).toHaveBeenCalledWith('create_style_profile', { input });
        expect(result).toEqual(mockProfile);
      });
    });

    describe('updateStyleProfile', () => {
      it('should call update_style_profile with profileId and input', async () => {
        const input = { genre: 'Jazz' };
        const mockProfile = { style_profile_id: 'sp1', genre: 'Jazz' };
        mockInvoke.mockResolvedValue(mockProfile);

        const result = await updateStyleProfile('sp1', input);

        expect(mockInvoke).toHaveBeenCalledWith('update_style_profile', { profileId: 'sp1', input });
        expect(result).toEqual(mockProfile);
      });
    });

    describe('deleteStyleProfile', () => {
      it('should call delete_style_profile with profileId', async () => {
        mockInvoke.mockResolvedValue(undefined);

        await deleteStyleProfile('sp1');

        expect(mockInvoke).toHaveBeenCalledWith('delete_style_profile', { profileId: 'sp1' });
      });
    });
  });

  describe('Export API', () => {
    describe('exportProject', () => {
      it('should call export_project with input', async () => {
        const input = { project_id: 'proj-1', destination_path: '/path/to/export.zip' };
        mockInvoke.mockResolvedValue('/path/to/export.zip');

        const result = await exportProject(input);

        expect(mockInvoke).toHaveBeenCalledWith('export_project', { input });
        expect(result).toBe('/path/to/export.zip');
      });
    });
  });

  describe('LLM Runtime API', () => {
    describe('startLlamaCppRuntime', () => {
      it('should call start_llama_cpp_runtime with input', async () => {
        const input = { executable_path: '/path/to/llama', model_path: '/path/to/model' };
        const mockStatus = { running: true, pid: 1234 };
        mockInvoke.mockResolvedValue(mockStatus);

        const result = await startLlamaCppRuntime(input);

        expect(mockInvoke).toHaveBeenCalledWith('start_llama_cpp_runtime', { input });
        expect(result).toEqual(mockStatus);
      });
    });

    describe('stopLlamaCppRuntime', () => {
      it('should call stop_llama_cpp_runtime', async () => {
        const mockStatus = { running: false, pid: null };
        mockInvoke.mockResolvedValue(mockStatus);

        const result = await stopLlamaCppRuntime();

        expect(mockInvoke).toHaveBeenCalledWith('stop_llama_cpp_runtime', undefined);
        expect(result).toEqual(mockStatus);
      });
    });

    describe('getLlamaCppRuntimeStatus', () => {
      it('should call get_llama_cpp_runtime_status', async () => {
        const mockStatus = { running: true, pid: 1234 };
        mockInvoke.mockResolvedValue(mockStatus);

        const result = await getLlamaCppRuntimeStatus();

        expect(mockInvoke).toHaveBeenCalledWith('get_llama_cpp_runtime_status', undefined);
        expect(result).toEqual(mockStatus);
      });
    });

    describe('detectLlamaCppExecutable', () => {
      it('should call detect_llama_cpp_executable', async () => {
        const mockResult = { found: true, path: '/path/to/llama' };
        mockInvoke.mockResolvedValue(mockResult);

        const result = await detectLlamaCppExecutable();

        expect(mockInvoke).toHaveBeenCalledWith('detect_llama_cpp_executable', undefined);
        expect(result).toEqual(mockResult);
      });
    });

    describe('analyzeRhymeText', () => {
      it('should call analyze_rhyme_text with text', async () => {
        const mockRows = [{ line: 'Hello', rhymes: [] }];
        mockInvoke.mockResolvedValue(mockRows);

        const result = await analyzeRhymeText('Hello world');

        expect(mockInvoke).toHaveBeenCalledWith('analyze_rhyme_text', { text: 'Hello world' });
        expect(result).toEqual(mockRows);
      });
    });
  });

  describe('Trash API', () => {
    describe('getDeletedItems', () => {
      it('should call get_deleted_items', async () => {
        const mockItems = [{ id: '1', type: 'version' }];
        mockInvoke.mockResolvedValue(mockItems);

        const result = await getDeletedItems();

        expect(mockInvoke).toHaveBeenCalledWith('get_deleted_items', undefined);
        expect(result).toEqual(mockItems);
      });
    });

    describe('getDeletedProjects', () => {
      it('should call get_deleted_projects', async () => {
        const mockProjects = [{ project_id: '1', title: 'Deleted' }];
        mockInvoke.mockResolvedValue(mockProjects);

        const result = await getDeletedProjects();

        expect(mockInvoke).toHaveBeenCalledWith('get_deleted_projects', undefined);
        expect(result).toEqual(mockProjects);
      });
    });

    describe('restoreProject', () => {
      it('should call restore_project with projectId and batchId', async () => {
        mockInvoke.mockResolvedValue(undefined);

        await restoreProject('proj-1', 'batch-1');

        expect(mockInvoke).toHaveBeenCalledWith('restore_project', { projectId: 'proj-1', batchId: 'batch-1' });
      });
    });

    describe('restoreVersion', () => {
      it('should call restore_version with lyricVersionId and batchId', async () => {
        mockInvoke.mockResolvedValue(undefined);

        await restoreVersion('lv1', 'batch-1');

        expect(mockInvoke).toHaveBeenCalledWith('restore_version', { lyricVersionId: 'lv1', batchId: 'batch-1' });
      });
    });

    describe('restoreFragment', () => {
      it('should call restore_fragment with fragmentId and batchId', async () => {
        mockInvoke.mockResolvedValue(undefined);

        await restoreFragment('f1', 'batch-1');

        expect(mockInvoke).toHaveBeenCalledWith('restore_fragment', { fragmentId: 'f1', batchId: 'batch-1' });
      });
    });

    describe('restoreSongArtifact', () => {
      it('should call restore_song_artifact with artifactId and batchId', async () => {
        mockInvoke.mockResolvedValue(undefined);

        await restoreSongArtifact('sa1', 'batch-1');

        expect(mockInvoke).toHaveBeenCalledWith('restore_song_artifact', { artifactId: 'sa1', batchId: 'batch-1' });
      });
    });

    describe('restoreStyleProfile', () => {
      it('should call restore_style_profile with profileId and batchId', async () => {
        mockInvoke.mockResolvedValue(undefined);

        await restoreStyleProfile('sp1', 'batch-1');

        expect(mockInvoke).toHaveBeenCalledWith('restore_style_profile', { profileId: 'sp1', batchId: 'batch-1' });
      });
    });

    describe('permanentlyDeleteProject', () => {
      it('should call permanently_delete_project', async () => {
        mockInvoke.mockResolvedValue(undefined);

        await permanentlyDeleteProject('proj-1', 'batch-1');

        expect(mockInvoke).toHaveBeenCalledWith('permanently_delete_project', { projectId: 'proj-1', batchId: 'batch-1' });
      });
    });

    describe('permanentlyDeleteVersion', () => {
      it('should call permanently_delete_version', async () => {
        mockInvoke.mockResolvedValue(undefined);

        await permanentlyDeleteVersion('lv1', 'batch-1');

        expect(mockInvoke).toHaveBeenCalledWith('permanently_delete_version', { lyricVersionId: 'lv1', batchId: 'batch-1' });
      });
    });

    describe('permanentlyDeleteFragment', () => {
      it('should call permanently_delete_fragment', async () => {
        mockInvoke.mockResolvedValue(undefined);

        await permanentlyDeleteFragment('f1', 'batch-1');

        expect(mockInvoke).toHaveBeenCalledWith('permanently_delete_fragment', { fragmentId: 'f1', batchId: 'batch-1' });
      });
    });

    describe('permanentlyDeleteSongArtifact', () => {
      it('should call permanently_delete_song_artifact', async () => {
        mockInvoke.mockResolvedValue(undefined);

        await permanentlyDeleteSongArtifact('sa1', 'batch-1');

        expect(mockInvoke).toHaveBeenCalledWith('permanently_delete_song_artifact', { artifactId: 'sa1', batchId: 'batch-1' });
      });
    });

    describe('permanentlyDeleteStyleProfile', () => {
      it('should call permanently_delete_style_profile', async () => {
        mockInvoke.mockResolvedValue(undefined);

        await permanentlyDeleteStyleProfile('sp1', 'batch-1');

        expect(mockInvoke).toHaveBeenCalledWith('permanently_delete_style_profile', { profileId: 'sp1', batchId: 'batch-1' });
      });
    });
  });

  describe('Additional Version API tests', () => {
    describe('getVersion', () => {
      it('should call get_version with lyricVersionId', async () => {
        const mockVersion = { lyric_version_id: 'lv1', snapshot_name: 'v1' };
        mockInvoke.mockResolvedValue(mockVersion);

        const result = await getVersion('lv1');

        expect(mockInvoke).toHaveBeenCalledWith('get_version', { lyricVersionId: 'lv1' });
        expect(result).toEqual(mockVersion);
      });
    });

    describe('getVersionSections', () => {
      it('should call get_version_sections with lyricVersionId', async () => {
        const mockSections = [{ version_section_id: 'vs1', display_name: 'Verse' }];
        mockInvoke.mockResolvedValue(mockSections);

        const result = await getVersionSections('lv1');

        expect(mockInvoke).toHaveBeenCalledWith('get_version_sections', { lyricVersionId: 'lv1' });
        expect(result).toEqual(mockSections);
      });
    });
  });

  describe('Additional Fragment API tests', () => {
    describe('updateFragment', () => {
      it('should call update_fragment with fragmentId and input', async () => {
        const input = { text: 'Updated text' };
        const mockFragment = { collected_fragment_id: 'f1', text: 'Updated text' };
        mockInvoke.mockResolvedValue(mockFragment);

        const result = await updateFragment('f1', input);

        expect(mockInvoke).toHaveBeenCalledWith('update_fragment', { fragmentId: 'f1', input });
        expect(result).toEqual(mockFragment);
      });
    });
  });
});