use crate::db;
use crate::error::AppResult;
use crate::models::{CollectedFragment, CreateFragmentInput, UpdateFragmentInput};
use crate::repositories::fragment_repo;
use tauri::AppHandle;

#[tauri::command]
pub fn get_fragments(app: AppHandle, project_id: String) -> AppResult<Vec<CollectedFragment>> {
    let conn = db::get_connection(&app)?;
    fragment_repo::get_by_project(&conn, &project_id)
}

#[tauri::command]
pub fn create_fragment(app: AppHandle, input: CreateFragmentInput) -> AppResult<CollectedFragment> {
    let conn = db::get_connection(&app)?;
    fragment_repo::create(&conn, input)
}

#[tauri::command]
pub fn update_fragment(app: AppHandle, fragment_id: String, input: UpdateFragmentInput) -> AppResult<CollectedFragment> {
    let conn = db::get_connection(&app)?;
    fragment_repo::update(&conn, &fragment_id, input)
}

#[tauri::command]
pub fn delete_fragment(app: AppHandle, fragment_id: String) -> AppResult<()> {
    let conn = db::get_connection(&app)?;
    fragment_repo::soft_delete(&conn, &fragment_id)
}