use crate::db;
use crate::error::AppResult;
use crate::models::{CreateRevisionNoteInput, RevisionNote};
use crate::repositories::revision_note_repo;
use crate::services::write;
use tauri::AppHandle;

#[tauri::command]
pub fn get_revision_notes(
    app: AppHandle,
    lyric_version_id: String,
) -> AppResult<Vec<RevisionNote>> {
    let conn = db::get_connection(&app)?;
    revision_note_repo::get_by_version(&conn, &lyric_version_id)
}

#[tauri::command]
pub fn create_revision_note(
    app: AppHandle,
    input: CreateRevisionNoteInput,
) -> AppResult<RevisionNote> {
    let mut conn = db::get_connection(&app)?;
    write::create_revision_note(&mut conn, input)
}

#[tauri::command]
pub fn delete_revision_note(app: AppHandle, note_id: String) -> AppResult<()> {
    let mut conn = db::get_connection(&app)?;
    write::delete_revision_note(&mut conn, &note_id)
}
