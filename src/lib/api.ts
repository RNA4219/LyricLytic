import { invoke } from '@tauri-apps/api/core';

// Types
export interface Project {
  project_id: string;
  title: string;
  theme?: string;
  memo?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  deleted_batch_id?: string;
}

export interface WorkingDraft {
  working_draft_id: string;
  project_id: string;
  latest_body_text: string;
  updated_at: string;
}

export interface DraftSection {
  draft_section_id: string;
  working_draft_id: string;
  section_type?: string;
  display_name: string;
  sort_order: number;
  body_text: string;
  note?: string;
}

export interface LyricVersion {
  lyric_version_id: string;
  project_id: string;
  snapshot_name: string;
  body_text: string;
  parent_lyric_version_id?: string;
  note?: string;
  created_at: string;
}

export interface CreateProjectInput {
  title: string;
  theme?: string;
  memo?: string;
}

export interface UpdateProjectInput {
  title?: string;
  theme?: string;
  memo?: string;
}

export interface SaveDraftInput {
  project_id: string;
  body_text: string;
  sections: DraftSectionInput[];
}

export interface DraftSectionInput {
  section_type?: string;
  display_name: string;
  sort_order: number;
  body_text: string;
}

export interface CreateVersionInput {
  project_id: string;
  snapshot_name: string;
  body_text: string;
  note?: string;
  parent_lyric_version_id?: string;
}

export interface CollectedFragment {
  collected_fragment_id: string;
  project_id: string;
  text: string;
  source?: string;
  tags?: string[];
  status: 'unused' | 'used' | 'hold';
  created_at: string;
  updated_at: string;
}

export interface CreateFragmentInput {
  project_id: string;
  text: string;
  source?: string;
  tags?: string[];
}

export interface UpdateFragmentInput {
  text?: string;
  source?: string;
  tags?: string[];
  status?: 'unused' | 'used' | 'hold';
}

export interface SongArtifact {
  song_artifact_id: string;
  project_id: string;
  lyric_version_id: string;
  service_name: string;
  song_title?: string;
  source_url?: string;
  source_file_path?: string;
  prompt_memo?: string;
  style_memo?: string;
  evaluation_memo?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSongArtifactInput {
  project_id: string;
  lyric_version_id: string;
  service_name: string;
  song_title?: string;
  source_url?: string;
  source_file_path?: string;
  prompt_memo?: string;
  style_memo?: string;
  evaluation_memo?: string;
}

// Project API
export async function getProjects(): Promise<Project[]> {
  return invoke('get_projects');
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  return invoke('create_project', { input });
}

export async function getProject(projectId: string): Promise<Project> {
  return invoke('get_project', { projectId });
}

export async function updateProject(projectId: string, input: UpdateProjectInput): Promise<Project> {
  return invoke('update_project', { projectId, input });
}

export async function deleteProject(projectId: string): Promise<void> {
  return invoke('delete_project', { projectId });
}

export async function getDeletedProjects(): Promise<Project[]> {
  return invoke('get_deleted_projects');
}

export async function restoreProject(projectId: string, batchId: string): Promise<void> {
  return invoke('restore_project', { projectId, batchId });
}

// Draft API
export async function getWorkingDraft(projectId: string): Promise<WorkingDraft | null> {
  return invoke('get_working_draft', { projectId });
}

export async function getDraftSections(workingDraftId: string): Promise<DraftSection[]> {
  return invoke('get_draft_sections', { workingDraftId });
}

export async function saveDraft(input: SaveDraftInput): Promise<WorkingDraft> {
  return invoke('save_draft', { input });
}

// Version API
export async function getVersions(projectId: string): Promise<LyricVersion[]> {
  return invoke('get_versions', { projectId });
}

export async function createVersion(input: CreateVersionInput): Promise<LyricVersion> {
  return invoke('create_version', { input });
}

export async function getVersion(lyricVersionId: string): Promise<LyricVersion> {
  return invoke('get_version', { lyricVersionId });
}

// Fragment API
export async function getFragments(projectId: string): Promise<CollectedFragment[]> {
  return invoke('get_fragments', { projectId });
}

export async function createFragment(input: CreateFragmentInput): Promise<CollectedFragment> {
  return invoke('create_fragment', { input });
}

export async function updateFragment(fragmentId: string, input: UpdateFragmentInput): Promise<CollectedFragment> {
  return invoke('update_fragment', { fragmentId, input });
}

export async function deleteFragment(fragmentId: string): Promise<void> {
  return invoke('delete_fragment', { fragmentId });
}

// SongArtifact API
export async function getSongArtifacts(projectId: string): Promise<SongArtifact[]> {
  return invoke('get_song_artifacts', { projectId });
}

export async function createSongArtifact(input: CreateSongArtifactInput): Promise<SongArtifact> {
  return invoke('create_song_artifact', { input });
}

export async function deleteSongArtifact(artifactId: string): Promise<void> {
  return invoke('delete_song_artifact', { artifactId });
}
