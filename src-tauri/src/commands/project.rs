use crate::db;
use crate::error::AppResult;
use crate::models::{CreateProjectInput, Project, UpdateProjectInput};
use crate::repositories::project_repo;
use tauri::AppHandle;
use uuid::Uuid;

#[tauri::command]
pub fn get_projects(app: AppHandle) -> AppResult<Vec<Project>> {
    let conn = db::get_connection(&app)?;
    project_repo::get_all_active(&conn)
}

#[tauri::command]
pub fn create_project(app: AppHandle, input: CreateProjectInput) -> AppResult<Project> {
    let conn = db::get_connection(&app)?;
    project_repo::create(&conn, input)
}

#[tauri::command]
pub fn get_project(app: AppHandle, project_id: String) -> AppResult<Project> {
    let conn = db::get_connection(&app)?;
    project_repo::get_by_id(&conn, &project_id)
}

#[tauri::command]
pub fn update_project(app: AppHandle, project_id: String, input: UpdateProjectInput) -> AppResult<Project> {
    let conn = db::get_connection(&app)?;
    project_repo::update(&conn, &project_id, input)
}

#[tauri::command]
pub fn delete_project(app: AppHandle, project_id: String) -> AppResult<()> {
    let conn = db::get_connection(&app)?;
    let batch_id = Uuid::new_v4().to_string();
    project_repo::soft_delete(&conn, &project_id, &batch_id)
}

#[tauri::command]
pub fn get_deleted_projects(app: AppHandle) -> AppResult<Vec<Project>> {
    let conn = db::get_connection(&app)?;
    project_repo::get_all_deleted(&conn)
}

#[tauri::command]
pub fn restore_project(app: AppHandle, project_id: String, batch_id: String) -> AppResult<()> {
    let conn = db::get_connection(&app)?;
    project_repo::restore(&conn, &project_id, &batch_id)
}