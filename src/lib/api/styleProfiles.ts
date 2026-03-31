import { invoke } from '@tauri-apps/api/core';
import {
  CreateStyleProfileInput,
  StyleProfile,
  UpdateStyleProfileInput,
} from './types';

export async function getStyleProfile(projectId: string): Promise<StyleProfile | null> {
  return invoke('get_style_profile', { projectId });
}

export async function createStyleProfile(input: CreateStyleProfileInput): Promise<StyleProfile> {
  return invoke('create_style_profile', { input });
}

export async function updateStyleProfile(profileId: string, input: UpdateStyleProfileInput): Promise<StyleProfile> {
  return invoke('update_style_profile', { profileId, input });
}

export async function deleteStyleProfile(profileId: string): Promise<void> {
  return invoke('delete_style_profile', { profileId });
}
