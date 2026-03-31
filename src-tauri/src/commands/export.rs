use crate::db;
use crate::error::AppResult;
use crate::repositories::export_repo;
use tauri::AppHandle;

#[derive(serde::Deserialize)]
pub struct ExportProjectInput {
    pub project_id: String,
    pub include_deleted: bool,
}

#[tauri::command]
pub fn export_project(app: AppHandle, input: ExportProjectInput) -> AppResult<String> {
    let conn = db::get_connection(&app)?;
    export_repo::create_export_zip(&conn, &input.project_id, input.include_deleted)
}