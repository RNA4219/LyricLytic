use crate::error::AppResult;
use crate::models::{CreateSongArtifactInput, SongArtifact};
use crate::repositories::touch_project_updated_at;
use chrono::Utc;
use rusqlite::{params, Connection};
use uuid::Uuid;

pub fn get_by_project(conn: &Connection, project_id: &str) -> AppResult<Vec<SongArtifact>> {
    let mut stmt = conn.prepare(
        "SELECT song_artifact_id, project_id, lyric_version_id, service_name, song_title,
                source_url, source_file_path, prompt_memo, style_memo, evaluation_memo,
                created_at, updated_at
         FROM song_artifacts
         WHERE project_id = ?1 AND deleted_at IS NULL
         ORDER BY created_at DESC"
    )?;

    let artifacts = stmt.query_map(params![project_id], |row| {
        Ok(SongArtifact {
            song_artifact_id: row.get(0)?,
            project_id: row.get(1)?,
            lyric_version_id: row.get(2)?,
            service_name: row.get(3)?,
            song_title: row.get(4)?,
            source_url: row.get(5)?,
            source_file_path: row.get(6)?,
            prompt_memo: row.get(7)?,
            style_memo: row.get(8)?,
            evaluation_memo: row.get(9)?,
            created_at: row.get(10)?,
            updated_at: row.get(11)?,
        })
    })?
    .collect::<std::result::Result<Vec<_>, _>>()?;

    Ok(artifacts)
}

pub fn create(conn: &Connection, input: CreateSongArtifactInput) -> AppResult<SongArtifact> {
    let now = Utc::now();
    let artifact_id = Uuid::new_v4().to_string();
    let now_rfc3339 = now.to_rfc3339();

    conn.execute(
        "INSERT INTO song_artifacts (
            song_artifact_id, project_id, lyric_version_id, service_name, song_title,
            source_url, source_file_path, prompt_memo, style_memo, evaluation_memo,
            created_at, updated_at
         ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
        params![
            artifact_id,
            input.project_id,
            input.lyric_version_id,
            input.service_name,
            input.song_title,
            input.source_url,
            input.source_file_path,
            input.prompt_memo,
            input.style_memo,
            input.evaluation_memo,
            now_rfc3339,
            now_rfc3339
        ],
    )?;

    touch_project_updated_at(conn, &input.project_id, &now_rfc3339)?;

    get_by_id(conn, &artifact_id)
}

pub fn soft_delete(conn: &Connection, artifact_id: &str) -> AppResult<()> {
    let now = Utc::now();
    let batch_id = Uuid::new_v4().to_string();
    let existing = get_by_id(conn, artifact_id)?;
    let now_rfc3339 = now.to_rfc3339();

    conn.execute(
        "UPDATE song_artifacts SET deleted_at = ?1, deleted_batch_id = ?2 WHERE song_artifact_id = ?3",
        params![now_rfc3339, batch_id, artifact_id],
    )?;

    touch_project_updated_at(conn, &existing.project_id, &now_rfc3339)?;

    Ok(())
}

fn get_by_id(conn: &Connection, artifact_id: &str) -> AppResult<SongArtifact> {
    let mut stmt = conn.prepare(
        "SELECT song_artifact_id, project_id, lyric_version_id, service_name, song_title,
                source_url, source_file_path, prompt_memo, style_memo, evaluation_memo,
                created_at, updated_at
         FROM song_artifacts
         WHERE song_artifact_id = ?1 AND deleted_at IS NULL"
    )?;

    let artifact = stmt.query_row(params![artifact_id], |row| {
        Ok(SongArtifact {
            song_artifact_id: row.get(0)?,
            project_id: row.get(1)?,
            lyric_version_id: row.get(2)?,
            service_name: row.get(3)?,
            song_title: row.get(4)?,
            source_url: row.get(5)?,
            source_file_path: row.get(6)?,
            prompt_memo: row.get(7)?,
            style_memo: row.get(8)?,
            evaluation_memo: row.get(9)?,
            created_at: row.get(10)?,
            updated_at: row.get(11)?,
        })
    })
    .map_err(|_| crate::error::AppError::NotFound(format!("Song artifact not found: {}", artifact_id)))?;

    Ok(artifact)
}
