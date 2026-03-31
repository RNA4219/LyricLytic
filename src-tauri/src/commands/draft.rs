use crate::db;
use crate::error::AppResult;
use crate::models::{DraftSection, SaveDraftInput, WorkingDraft};
use crate::repositories::draft_repo;
use tauri::AppHandle;

#[tauri::command]
pub fn get_working_draft(app: AppHandle, project_id: String) -> AppResult<Option<WorkingDraft>> {
    let conn = db::get_connection(&app)?;
    draft_repo::get_active_by_project(&conn, &project_id)
}

#[tauri::command]
pub fn get_draft_sections(app: AppHandle, working_draft_id: String) -> AppResult<Vec<DraftSection>> {
    let conn = db::get_connection(&app)?;
    draft_repo::get_sections(&conn, &working_draft_id)
}

#[tauri::command]
pub fn save_draft(app: AppHandle, input: SaveDraftInput) -> AppResult<WorkingDraft> {
    let conn = db::get_connection(&app)?;
    draft_repo::save(&conn, input)
}
