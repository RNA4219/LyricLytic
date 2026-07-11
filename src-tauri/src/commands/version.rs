use crate::db;
use crate::error::AppResult;
use crate::models::{CreateVersionInput, LyricVersion, VersionSection};
use crate::repositories::version_repo;
use crate::services::write;
use tauri::AppHandle;
use uuid::Uuid;

#[tauri::command]
pub fn get_versions(app: AppHandle, project_id: String) -> AppResult<Vec<LyricVersion>> {
    let conn = db::get_connection(&app)?;
    version_repo::get_by_project(&conn, &project_id)
}

#[tauri::command]
pub fn create_version(app: AppHandle, input: CreateVersionInput) -> AppResult<LyricVersion> {
    let mut conn = db::get_connection(&app)?;
    write::create_version(&mut conn, input)
}

#[tauri::command]
pub fn get_version(app: AppHandle, lyric_version_id: String) -> AppResult<LyricVersion> {
    let conn = db::get_connection(&app)?;
    version_repo::get_by_id(&conn, &lyric_version_id)
}

#[tauri::command]
pub fn get_version_sections(
    app: AppHandle,
    lyric_version_id: String,
) -> AppResult<Vec<VersionSection>> {
    let conn = db::get_connection(&app)?;
    version_repo::get_sections_by_version(&conn, &lyric_version_id)
}

#[tauri::command]
pub fn delete_version(app: AppHandle, lyric_version_id: String) -> AppResult<String> {
    let mut conn = db::get_connection(&app)?;
    let batch_id = Uuid::new_v4().to_string();
    write::soft_delete_version(&mut conn, &lyric_version_id, &batch_id)?;
    Ok(batch_id)
}

#[tauri::command]
pub fn get_deleted_versions(app: AppHandle) -> AppResult<Vec<LyricVersion>> {
    let conn = db::get_connection(&app)?;
    version_repo::get_all_deleted(&conn)
}

#[tauri::command]
pub fn restore_version(
    app: AppHandle,
    lyric_version_id: String,
    batch_id: String,
) -> AppResult<()> {
    let mut conn = db::get_connection(&app)?;
    write::restore_version(&mut conn, &lyric_version_id, &batch_id)
}
