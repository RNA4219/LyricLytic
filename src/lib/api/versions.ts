import { invoke } from '@tauri-apps/api/core';
import { CreateVersionInput, LyricVersion, VersionSection } from './types';

export async function getVersions(projectId: string): Promise<LyricVersion[]> {
  return invoke('get_versions', { projectId });
}

export async function createVersion(input: CreateVersionInput): Promise<LyricVersion> {
  return invoke('create_version', { input });
}

export async function getVersion(lyricVersionId: string): Promise<LyricVersion> {
  return invoke('get_version', { lyricVersionId });
}

export async function getVersionSections(lyricVersionId: string): Promise<VersionSection[]> {
  return invoke('get_version_sections', { lyricVersionId });
}

export async function deleteVersion(lyricVersionId: string): Promise<void> {
  return invoke('delete_version', { lyricVersionId });
}
