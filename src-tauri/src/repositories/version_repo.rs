use crate::error::{AppError, AppResult};
use crate::models::{CreateVersionInput, LyricVersion};
use crate::repositories::touch_project_updated_at;
use chrono::Utc;
use rusqlite::{params, Connection};
use uuid::Uuid;

pub fn get_by_project(conn: &Connection, project_id: &str) -> AppResult<Vec<LyricVersion>> {
    let mut stmt = conn.prepare(
        "SELECT lyric_version_id, project_id, snapshot_name, body_text, parent_lyric_version_id, note, created_at, deleted_at
         FROM lyric_versions
         WHERE project_id = ?1 AND deleted_at IS NULL
         ORDER BY created_at DESC"
    )?;

    let versions = stmt.query_map(params![project_id], |row| {
        Ok(LyricVersion {
            lyric_version_id: row.get(0)?,
            project_id: row.get(1)?,
            snapshot_name: row.get(2)?,
            body_text: row.get(3)?,
            parent_lyric_version_id: row.get(4)?,
            note: row.get(5)?,
            created_at: row.get(6)?,
            deleted_at: row.get(7)?,
        })
    })?
    .collect::<std::result::Result<Vec<_>, _>>()?;

    Ok(versions)
}

pub fn get_by_id(conn: &Connection, lyric_version_id: &str) -> AppResult<LyricVersion> {
    let mut stmt = conn.prepare(
        "SELECT lyric_version_id, project_id, snapshot_name, body_text, parent_lyric_version_id, note, created_at, deleted_at
         FROM lyric_versions
         WHERE lyric_version_id = ?1 AND deleted_at IS NULL"
    )?;

    let version = stmt.query_row(params![lyric_version_id], |row| {
        Ok(LyricVersion {
            lyric_version_id: row.get(0)?,
            project_id: row.get(1)?,
            snapshot_name: row.get(2)?,
            body_text: row.get(3)?,
            parent_lyric_version_id: row.get(4)?,
            note: row.get(5)?,
            created_at: row.get(6)?,
            deleted_at: row.get(7)?,
        })
    })
    .map_err(|_| AppError::NotFound(format!("Version not found: {}", lyric_version_id)))?;

    Ok(version)
}

pub fn create(conn: &Connection, input: CreateVersionInput) -> AppResult<LyricVersion> {
    let now = Utc::now();
    let version_id = Uuid::new_v4().to_string();
    let now_rfc3339 = now.to_rfc3339();

    conn.execute(
        "INSERT INTO lyric_versions (lyric_version_id, project_id, snapshot_name, body_text, parent_lyric_version_id, note, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![
            version_id,
            input.project_id,
            input.snapshot_name,
            input.body_text,
            input.parent_lyric_version_id,
            input.note,
            now_rfc3339
        ],
    )?;

    touch_project_updated_at(conn, &input.project_id, &now_rfc3339)?;

    get_by_id(conn, &version_id)
}
