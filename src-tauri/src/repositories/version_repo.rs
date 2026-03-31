use crate::error::{AppError, AppResult};
use crate::models::{CreateVersionInput, LyricVersion, VersionSection};
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

    // Create version_sections from input sections
    for section in &input.sections {
        let section_id = Uuid::new_v4().to_string();
        conn.execute(
            "INSERT INTO version_sections (version_section_id, lyric_version_id, section_type, display_name, sort_order, body_text, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?7)",
            params![
                section_id,
                version_id,
                section.section_type,
                section.display_name,
                section.sort_order,
                section.body_text,
                now_rfc3339
            ],
        )?;
    }

    touch_project_updated_at(conn, &input.project_id, &now_rfc3339)?;

    get_by_id(conn, &version_id)
}

pub fn get_sections_by_version(conn: &Connection, lyric_version_id: &str) -> AppResult<Vec<VersionSection>> {
    let mut stmt = conn.prepare(
        "SELECT version_section_id, lyric_version_id, section_type, display_name, sort_order, body_text
         FROM version_sections
         WHERE lyric_version_id = ?1 AND deleted_at IS NULL
         ORDER BY sort_order"
    )?;

    let sections = stmt.query_map(params![lyric_version_id], |row| {
        Ok(VersionSection {
            version_section_id: row.get(0)?,
            lyric_version_id: row.get(1)?,
            section_type: row.get(2)?,
            display_name: row.get(3)?,
            sort_order: row.get(4)?,
            body_text: row.get(5)?,
        })
    })?
    .collect::<std::result::Result<Vec<_>, _>>()?;

    Ok(sections)
}
