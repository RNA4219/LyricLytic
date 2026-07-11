use crate::db;
use crate::error::AppResult;
use crate::repositories::export_repo;
use tauri::AppHandle;

#[derive(serde::Deserialize)]
pub struct ExportProjectInput {
    pub project_id: String,
    pub include_deleted: bool,
    pub destination_path: String,
}

#[derive(serde::Deserialize)]
pub struct ExportQuickInput {
    pub project_id: String,
    pub format: String,
    pub destination_path: String,
}

#[tauri::command]
pub fn export_project(app: AppHandle, input: ExportProjectInput) -> AppResult<String> {
    let conn = db::get_connection(&app)?;
    export_repo::create_export_zip(
        &conn,
        &input.project_id,
        input.include_deleted,
        &input.destination_path,
    )
}
#[tauri::command]
pub fn export_quick(app: AppHandle, input: ExportQuickInput) -> AppResult<String> {
    let conn = db::get_connection(&app)?;
    export_repo::export_quick(
        &conn,
        &input.project_id,
        &input.format,
        &input.destination_path,
    )
}
