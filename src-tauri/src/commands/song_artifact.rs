use crate::db;
use crate::error::AppResult;
use crate::models::{CreateSongArtifactInput, SongArtifact};
use crate::repositories::song_artifact_repo;
use crate::services::write;
use tauri::AppHandle;

#[tauri::command]
pub fn get_song_artifacts(app: AppHandle, project_id: String) -> AppResult<Vec<SongArtifact>> {
    let conn = db::get_connection(&app)?;
    song_artifact_repo::get_by_project(&conn, &project_id)
}

#[tauri::command]
pub fn create_song_artifact(
    app: AppHandle,
    input: CreateSongArtifactInput,
) -> AppResult<SongArtifact> {
    let mut conn = db::get_connection(&app)?;
    write::create_song_artifact(&mut conn, input)
}

#[tauri::command]
pub fn delete_song_artifact(app: AppHandle, artifact_id: String) -> AppResult<()> {
    let mut conn = db::get_connection(&app)?;
    write::delete_song_artifact(&mut conn, &artifact_id)
}
