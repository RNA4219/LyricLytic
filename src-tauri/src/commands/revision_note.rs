use crate::db;
use crate::error::AppResult;
use crate::models::{CreateRevisionNoteInput, RevisionNote};
use crate::repositories::revision_note_repo;
use tauri::AppHandle;

#[tauri::command]
pub fn get_revision_notes(app: AppHandle, lyric_version_id: String) -> AppResult<Vec<RevisionNote>> {
    let conn = db::get_connection(&app)?;
    revision_note_repo::get_by_version(&conn, &lyric_version_id)
}

#[tauri::command]
pub fn create_revision_note(app: AppHandle, input: CreateRevisionNoteInput) -> AppResult<RevisionNote> {
    let conn = db::get_connection(&app)?;
    revision_note_repo::create(&conn, input)
}

#[tauri::command]
pub fn delete_revision_note(app: AppHandle, note_id: String) -> AppResult<()> {
    let conn = db::get_connection(&app)?;
    revision_note_repo::soft_delete(&conn, &note_id)
}