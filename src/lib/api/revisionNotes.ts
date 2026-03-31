import { invoke } from '@tauri-apps/api/core';
import { CreateRevisionNoteInput, RevisionNote } from './types';

export async function getRevisionNotes(lyricVersionId: string): Promise<RevisionNote[]> {
  return invoke('get_revision_notes', { lyricVersionId });
}

export async function createRevisionNote(input: CreateRevisionNoteInput): Promise<RevisionNote> {
  return invoke('create_revision_note', { input });
}

export async function deleteRevisionNote(noteId: string): Promise<void> {
  return invoke('delete_revision_note', { noteId });
}
