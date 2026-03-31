import { invoke } from '@tauri-apps/api/core';
import { DraftSection, SaveDraftInput, WorkingDraft } from './types';

export async function getWorkingDraft(projectId: string): Promise<WorkingDraft | null> {
  return invoke('get_working_draft', { projectId });
}

export async function getDraftSections(workingDraftId: string): Promise<DraftSection[]> {
  return invoke('get_draft_sections', { workingDraftId });
}

export async function saveDraft(input: SaveDraftInput): Promise<WorkingDraft> {
  return invoke('save_draft', { input });
}
