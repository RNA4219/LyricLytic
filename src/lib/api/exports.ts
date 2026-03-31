import { invoke } from '@tauri-apps/api/core';
import { ExportProjectInput } from './types';

export async function exportProject(input: ExportProjectInput): Promise<string> {
  return invoke('export_project', { input });
}
