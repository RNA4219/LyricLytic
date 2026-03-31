import { invoke } from '@tauri-apps/api/core';
import { CollectedFragment, CreateFragmentInput, UpdateFragmentInput } from './types';

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
