import { invoke } from '@tauri-apps/api/core';

export interface DeletedProject {
  type: 'Project';
  project_id: string;
  title: string;
  deleted_at?: string;
  deleted_batch_id?: string;
}

export interface DeletedLyricVersion {
  type: 'LyricVersion';
  lyric_version_id: string;
  project_id: string;
  snapshot_name: string;
  deleted_at?: string;
  deleted_batch_id?: string;
}

export interface DeletedCollectedFragment {
  type: 'CollectedFragment';
  collected_fragment_id: string;
  project_id: string;
  text_preview: string;
  deleted_at?: string;
  deleted_batch_id?: string;
}

export interface DeletedSongArtifact {
  type: 'SongArtifact';
  song_artifact_id: string;
  project_id: string;
  service_name: string;
  song_title?: string;
  deleted_at?: string;
  deleted_batch_id?: string;
}

export interface DeletedStyleProfile {
  type: 'StyleProfile';
  style_profile_id: string;
  project_id: string;
  deleted_at?: string;
  deleted_batch_id?: string;
}

export type DeletedItem =
  | DeletedProject
  | DeletedLyricVersion
  | DeletedCollectedFragment
  | DeletedSongArtifact
  | DeletedStyleProfile;

export async function getDeletedItems(): Promise<DeletedItem[]> {
  return invoke('get_deleted_items');
}

export async function restoreVersion(lyricVersionId: string, batchId: string): Promise<void> {
  return invoke('restore_version', { lyricVersionId, batchId });
}

export async function restoreFragment(fragmentId: string, batchId: string): Promise<void> {
  return invoke('restore_fragment', { fragmentId, batchId });
}

export async function restoreSongArtifact(artifactId: string, batchId: string): Promise<void> {
  return invoke('restore_song_artifact', { artifactId, batchId });
}

export async function restoreStyleProfile(profileId: string, batchId: string): Promise<void> {
  return invoke('restore_style_profile', { profileId, batchId });
}