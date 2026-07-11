use crate::db;
use crate::error::AppResult;
use crate::models::{CreateStyleProfileInput, StyleProfile, UpdateStyleProfileInput};
use crate::repositories::style_profile_repo;
use crate::services::write;
use tauri::AppHandle;

#[tauri::command]
pub fn get_style_profile(app: AppHandle, project_id: String) -> AppResult<Option<StyleProfile>> {
    let conn = db::get_connection(&app)?;
    style_profile_repo::get_by_project(&conn, &project_id)
}

#[tauri::command]
pub fn create_style_profile(
    app: AppHandle,
    input: CreateStyleProfileInput,
) -> AppResult<StyleProfile> {
    let mut conn = db::get_connection(&app)?;
    write::create_style_profile(&mut conn, input)
}

#[tauri::command]
pub fn update_style_profile(
    app: AppHandle,
    profile_id: String,
    input: UpdateStyleProfileInput,
) -> AppResult<StyleProfile> {
    let mut conn = db::get_connection(&app)?;
    write::update_style_profile(&mut conn, &profile_id, input)
}

#[tauri::command]
pub fn delete_style_profile(app: AppHandle, profile_id: String) -> AppResult<()> {
    let mut conn = db::get_connection(&app)?;
    write::delete_style_profile(&mut conn, &profile_id)
}
