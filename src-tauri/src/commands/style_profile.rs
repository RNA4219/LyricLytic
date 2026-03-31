use crate::db;
use crate::error::AppResult;
use crate::models::{CreateStyleProfileInput, StyleProfile, UpdateStyleProfileInput};
use crate::repositories::style_profile_repo;
use tauri::AppHandle;

#[tauri::command]
pub fn get_style_profile(app: AppHandle, project_id: String) -> AppResult<Option<StyleProfile>> {
    let conn = db::get_connection(&app)?;
    style_profile_repo::get_by_project(&conn, &project_id)
}

#[tauri::command]
pub fn create_style_profile(app: AppHandle, input: CreateStyleProfileInput) -> AppResult<StyleProfile> {
    let conn = db::get_connection(&app)?;
    style_profile_repo::create(&conn, input)
}

#[tauri::command]
pub fn update_style_profile(app: AppHandle, profile_id: String, input: UpdateStyleProfileInput) -> AppResult<StyleProfile> {
    let conn = db::get_connection(&app)?;
    style_profile_repo::update(&conn, &profile_id, input)
}

#[tauri::command]
pub fn delete_style_profile(app: AppHandle, profile_id: String) -> AppResult<()> {
    let conn = db::get_connection(&app)?;
    style_profile_repo::soft_delete(&conn, &profile_id)
}