import { invoke } from '@tauri-apps/api/core';
import { CreateSongArtifactInput, SongArtifact } from './types';

export async function getSongArtifacts(projectId: string): Promise<SongArtifact[]> {
  return invoke('get_song_artifacts', { projectId });
}

export async function createSongArtifact(input: CreateSongArtifactInput): Promise<SongArtifact> {
  return invoke('create_song_artifact', { input });
}

export async function deleteSongArtifact(artifactId: string): Promise<void> {
  return invoke('delete_song_artifact', { artifactId });
}
