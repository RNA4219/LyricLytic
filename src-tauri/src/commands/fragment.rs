use crate::db;
use crate::error::AppResult;
use crate::models::{CollectedFragment, CreateFragmentInput, UpdateFragmentInput};
use crate::repositories::fragment_repo;
use crate::services::write;
use tauri::AppHandle;

#[tauri::command]
pub fn get_fragments(app: AppHandle, project_id: String) -> AppResult<Vec<CollectedFragment>> {
    let conn = db::get_connection(&app)?;
    fragment_repo::get_by_project(&conn, &project_id)
}

#[tauri::command]
pub fn create_fragment(app: AppHandle, input: CreateFragmentInput) -> AppResult<CollectedFragment> {
    let mut conn = db::get_connection(&app)?;
    write::create_fragment(&mut conn, input)
}

#[tauri::command]
pub fn update_fragment(
    app: AppHandle,
    fragment_id: String,
    input: UpdateFragmentInput,
) -> AppResult<CollectedFragment> {
    let mut conn = db::get_connection(&app)?;
    write::update_fragment(&mut conn, &fragment_id, input)
}

#[tauri::command]
pub fn delete_fragment(app: AppHandle, fragment_id: String) -> AppResult<()> {
    let mut conn = db::get_connection(&app)?;
    write::delete_fragment(&mut conn, &fragment_id)
}
