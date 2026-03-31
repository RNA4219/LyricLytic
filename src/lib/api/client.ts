/**
 * Type-safe Tauri command invoker
 * Provides a unified interface for all backend commands
 */

import { invoke } from '@tauri-apps/api/core';
import type {
  Project,
  CreateProjectInput,
  UpdateProjectInput,
  WorkingDraft,
  DraftSection,
  SaveDraftInput,
  LyricVersion,
  CreateVersionInput,
  VersionSection,
  CollectedFragment,
  CreateFragmentInput,
  UpdateFragmentInput,
  SongArtifact,
  CreateSongArtifactInput,
  RevisionNote,
  CreateRevisionNoteInput,
  StyleProfile,
  CreateStyleProfileInput,
  UpdateStyleProfileInput,
  ExportProjectInput,
  DeletedItem,
  StartLlamaCppInput,
  LlamaCppStatus,
} from './types';

// Re-export all types
export * from './types';

// Command names as const for type safety
const COMMANDS = {
  // Projects
  GET_PROJECTS: 'get_projects',
  CREATE_PROJECT: 'create_project',
  GET_PROJECT: 'get_project',
  UPDATE_PROJECT: 'update_project',
  DELETE_PROJECT: 'delete_project',
  GET_DELETED_PROJECTS: 'get_deleted_projects',
  RESTORE_PROJECT: 'restore_project',

  // Drafts
  GET_WORKING_DRAFT: 'get_working_draft',
  GET_DRAFT_SECTIONS: 'get_draft_sections',
  SAVE_DRAFT: 'save_draft',

  // Versions
  GET_VERSIONS: 'get_versions',
  CREATE_VERSION: 'create_version',
  GET_VERSION: 'get_version',
  GET_VERSION_SECTIONS: 'get_version_sections',
  DELETE_VERSION: 'delete_version',

  // Fragments
  GET_FRAGMENTS: 'get_fragments',
  CREATE_FRAGMENT: 'create_fragment',
  UPDATE_FRAGMENT: 'update_fragment',
  DELETE_FRAGMENT: 'delete_fragment',

  // Song Artifacts
  GET_SONG_ARTIFACTS: 'get_song_artifacts',
  CREATE_SONG_ARTIFACT: 'create_song_artifact',
  DELETE_SONG_ARTIFACT: 'delete_song_artifact',

  // Revision Notes
  GET_REVISION_NOTES: 'get_revision_notes',
  CREATE_REVISION_NOTE: 'create_revision_note',
  DELETE_REVISION_NOTE: 'delete_revision_note',

  // Style Profiles
  GET_STYLE_PROFILE: 'get_style_profile',
  CREATE_STYLE_PROFILE: 'create_style_profile',
  UPDATE_STYLE_PROFILE: 'update_style_profile',
  DELETE_STYLE_PROFILE: 'delete_style_profile',

  // Export
  EXPORT_PROJECT: 'export_project',

  // LLM runtime
  START_LLAMA_CPP_RUNTIME: 'start_llama_cpp_runtime',
  STOP_LLAMA_CPP_RUNTIME: 'stop_llama_cpp_runtime',
  GET_LLAMA_CPP_RUNTIME_STATUS: 'get_llama_cpp_runtime_status',

  // Trash
  GET_DELETED_ITEMS: 'get_deleted_items',
  RESTORE_VERSION: 'restore_version',
  RESTORE_FRAGMENT: 'restore_fragment',
  RESTORE_SONG_ARTIFACT: 'restore_song_artifact',
  RESTORE_STYLE_PROFILE: 'restore_style_profile',
} as const;

/**
 * Typed invoke wrapper with better error handling
 */
async function call<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  try {
    // Check for test mock
    if (typeof window !== 'undefined' && (window as any).__TAURI_MOCK__) {
      const result = await (window as any).__TAURI_MOCK__(command, args);
      return result as T;
    }
    return await invoke<T>(command, args);
  } catch (error) {
    // Normalize error message
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Command "${command}" failed: ${message}`);
  }
}

// ===== Projects API =====

export async function getProjects(): Promise<Project[]> {
  return call<Project[]>(COMMANDS.GET_PROJECTS);
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  return call<Project>(COMMANDS.CREATE_PROJECT, { input });
}

export async function getProject(projectId: string): Promise<Project> {
  return call<Project>(COMMANDS.GET_PROJECT, { projectId });
}

export async function updateProject(projectId: string, input: UpdateProjectInput): Promise<Project> {
  return call<Project>(COMMANDS.UPDATE_PROJECT, { projectId, input });
}

export async function deleteProject(projectId: string): Promise<void> {
  return call<void>(COMMANDS.DELETE_PROJECT, { projectId });
}

export async function getDeletedProjects(): Promise<Project[]> {
  return call<Project[]>(COMMANDS.GET_DELETED_PROJECTS);
}

export async function restoreProject(projectId: string, batchId: string): Promise<void> {
  return call<void>(COMMANDS.RESTORE_PROJECT, { projectId, batchId });
}

// ===== Drafts API =====

export async function getWorkingDraft(projectId: string): Promise<WorkingDraft | null> {
  return call<WorkingDraft | null>(COMMANDS.GET_WORKING_DRAFT, { projectId });
}

export async function getDraftSections(workingDraftId: string): Promise<DraftSection[]> {
  return call<DraftSection[]>(COMMANDS.GET_DRAFT_SECTIONS, { workingDraftId });
}

export async function saveDraft(input: SaveDraftInput): Promise<void> {
  return call<void>(COMMANDS.SAVE_DRAFT, { input });
}

// ===== Versions API =====

export async function getVersions(projectId: string): Promise<LyricVersion[]> {
  return call<LyricVersion[]>(COMMANDS.GET_VERSIONS, { projectId });
}

export async function createVersion(input: CreateVersionInput): Promise<LyricVersion> {
  return call<LyricVersion>(COMMANDS.CREATE_VERSION, { input });
}

export async function getVersion(lyricVersionId: string): Promise<LyricVersion> {
  return call<LyricVersion>(COMMANDS.GET_VERSION, { lyricVersionId });
}

export async function getVersionSections(lyricVersionId: string): Promise<VersionSection[]> {
  return call<VersionSection[]>(COMMANDS.GET_VERSION_SECTIONS, { lyricVersionId });
}

export async function deleteVersion(lyricVersionId: string): Promise<void> {
  return call<void>(COMMANDS.DELETE_VERSION, { lyricVersionId });
}

// ===== Fragments API =====

export async function getFragments(projectId: string): Promise<CollectedFragment[]> {
  return call<CollectedFragment[]>(COMMANDS.GET_FRAGMENTS, { projectId });
}

export async function createFragment(input: CreateFragmentInput): Promise<CollectedFragment> {
  return call<CollectedFragment>(COMMANDS.CREATE_FRAGMENT, { input });
}

export async function updateFragment(fragmentId: string, input: UpdateFragmentInput): Promise<CollectedFragment> {
  return call<CollectedFragment>(COMMANDS.UPDATE_FRAGMENT, { fragmentId, input });
}

export async function deleteFragment(fragmentId: string): Promise<void> {
  return call<void>(COMMANDS.DELETE_FRAGMENT, { fragmentId });
}

// ===== Song Artifacts API =====

export async function getSongArtifacts(projectId: string): Promise<SongArtifact[]> {
  return call<SongArtifact[]>(COMMANDS.GET_SONG_ARTIFACTS, { projectId });
}

export async function createSongArtifact(input: CreateSongArtifactInput): Promise<SongArtifact> {
  return call<SongArtifact>(COMMANDS.CREATE_SONG_ARTIFACT, { input });
}

export async function deleteSongArtifact(artifactId: string): Promise<void> {
  return call<void>(COMMANDS.DELETE_SONG_ARTIFACT, { artifactId });
}

// ===== Revision Notes API =====

export async function getRevisionNotes(lyricVersionId: string): Promise<RevisionNote[]> {
  return call<RevisionNote[]>(COMMANDS.GET_REVISION_NOTES, { lyricVersionId });
}

export async function createRevisionNote(input: CreateRevisionNoteInput): Promise<RevisionNote> {
  return call<RevisionNote>(COMMANDS.CREATE_REVISION_NOTE, { input });
}

export async function deleteRevisionNote(noteId: string): Promise<void> {
  return call<void>(COMMANDS.DELETE_REVISION_NOTE, { noteId });
}

// ===== Style Profiles API =====

export async function getStyleProfile(projectId: string): Promise<StyleProfile | null> {
  return call<StyleProfile | null>(COMMANDS.GET_STYLE_PROFILE, { projectId });
}

export async function createStyleProfile(input: CreateStyleProfileInput): Promise<StyleProfile> {
  return call<StyleProfile>(COMMANDS.CREATE_STYLE_PROFILE, { input });
}

export async function updateStyleProfile(profileId: string, input: UpdateStyleProfileInput): Promise<StyleProfile> {
  return call<StyleProfile>(COMMANDS.UPDATE_STYLE_PROFILE, { profileId, input });
}

export async function deleteStyleProfile(profileId: string): Promise<void> {
  return call<void>(COMMANDS.DELETE_STYLE_PROFILE, { profileId });
}

// ===== Export API =====

export async function exportProject(input: ExportProjectInput): Promise<string> {
  return call<string>(COMMANDS.EXPORT_PROJECT, { input });
}

// ===== LLM Runtime API =====

export async function startLlamaCppRuntime(input: StartLlamaCppInput): Promise<LlamaCppStatus> {
  return call<LlamaCppStatus>(COMMANDS.START_LLAMA_CPP_RUNTIME, { input });
}

export async function stopLlamaCppRuntime(): Promise<LlamaCppStatus> {
  return call<LlamaCppStatus>(COMMANDS.STOP_LLAMA_CPP_RUNTIME);
}

export async function getLlamaCppRuntimeStatus(): Promise<LlamaCppStatus> {
  return call<LlamaCppStatus>(COMMANDS.GET_LLAMA_CPP_RUNTIME_STATUS);
}

// ===== Trash API =====

export async function getDeletedItems(): Promise<DeletedItem[]> {
  return call<DeletedItem[]>(COMMANDS.GET_DELETED_ITEMS);
}

export async function restoreVersion(lyricVersionId: string, batchId: string): Promise<void> {
  return call<void>(COMMANDS.RESTORE_VERSION, { lyricVersionId, batchId });
}

export async function restoreFragment(fragmentId: string, batchId: string): Promise<void> {
  return call<void>(COMMANDS.RESTORE_FRAGMENT, { fragmentId, batchId });
}

export async function restoreSongArtifact(artifactId: string, batchId: string): Promise<void> {
  return call<void>(COMMANDS.RESTORE_SONG_ARTIFACT, { artifactId, batchId });
}

export async function restoreStyleProfile(profileId: string, batchId: string): Promise<void> {
  return call<void>(COMMANDS.RESTORE_STYLE_PROFILE, { profileId, batchId });
}
