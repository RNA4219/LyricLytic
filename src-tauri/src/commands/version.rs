use crate::db;
use crate::error::AppResult;
use crate::models::{CreateVersionInput, LyricVersion, VersionSection};
use crate::repositories::version_repo;
use tauri::AppHandle;

#[tauri::command]
pub fn get_versions(app: AppHandle, project_id: String) -> AppResult<Vec<LyricVersion>> {
    let conn = db::get_connection(&app)?;
    version_repo::get_by_project(&conn, &project_id)
}

#[tauri::command]
pub fn create_version(app: AppHandle, input: CreateVersionInput) -> AppResult<LyricVersion> {
    let conn = db::get_connection(&app)?;
    version_repo::create(&conn, input)
}

#[tauri::command]
pub fn get_version(app: AppHandle, lyric_version_id: String) -> AppResult<LyricVersion> {
    let conn = db::get_connection(&app)?;
    version_repo::get_by_id(&conn, &lyric_version_id)
}

#[tauri::command]
pub fn get_version_sections(app: AppHandle, lyric_version_id: String) -> AppResult<Vec<VersionSection>> {
    let conn = db::get_connection(&app)?;
    version_repo::get_sections_by_version(&conn, &lyric_version_id)
}

#[tauri::command]
pub fn get_deleted_versions(app: AppHandle) -> AppResult<Vec<LyricVersion>> {
    let conn = db::get_connection(&app)?;
    version_repo::get_all_deleted(&conn)
}

#[tauri::command]
pub fn restore_version(app: AppHandle, lyric_version_id: String, batch_id: String) -> AppResult<()> {
    let conn = db::get_connection(&app)?;
    version_repo::restore(&conn, &lyric_version_id, &batch_id)
}