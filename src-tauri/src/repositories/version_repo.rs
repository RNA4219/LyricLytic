use crate::error::{AppError, AppResult};
use crate::models::{CreateVersionInput, LyricVersion, VersionSection};
use crate::repositories::touch_project_updated_at;
use chrono::Utc;
use rusqlite::{params, Connection};
use uuid::Uuid;

pub fn get_by_project(conn: &Connection, project_id: &str) -> AppResult<Vec<LyricVersion>> {
    let mut stmt = conn.prepare(
        "SELECT lyric_version_id, project_id, snapshot_name, body_text, bpm, style_text, vocal_text, parent_lyric_version_id, note, created_at, deleted_at, deleted_batch_id
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
            bpm: row.get(4)?,
            style_text: row.get(5)?,
            vocal_text: row.get(6)?,
            parent_lyric_version_id: row.get(7)?,
            note: row.get(8)?,
            created_at: row.get(9)?,
            deleted_at: row.get(10)?,
            deleted_batch_id: row.get(11)?,
        })
    })?
    .collect::<std::result::Result<Vec<_>, _>>()?;

    Ok(versions)
}

pub fn get_by_id(conn: &Connection, lyric_version_id: &str) -> AppResult<LyricVersion> {
    let mut stmt = conn.prepare(
        "SELECT lyric_version_id, project_id, snapshot_name, body_text, bpm, style_text, vocal_text, parent_lyric_version_id, note, created_at, deleted_at, deleted_batch_id
         FROM lyric_versions
         WHERE lyric_version_id = ?1 AND deleted_at IS NULL"
    )?;

    let version = stmt.query_row(params![lyric_version_id], |row| {
        Ok(LyricVersion {
            lyric_version_id: row.get(0)?,
            project_id: row.get(1)?,
            snapshot_name: row.get(2)?,
            body_text: row.get(3)?,
            bpm: row.get(4)?,
            style_text: row.get(5)?,
            vocal_text: row.get(6)?,
            parent_lyric_version_id: row.get(7)?,
            note: row.get(8)?,
            created_at: row.get(9)?,
            deleted_at: row.get(10)?,
            deleted_batch_id: row.get(11)?,
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
        "INSERT INTO lyric_versions (lyric_version_id, project_id, snapshot_name, body_text, bpm, style_text, vocal_text, parent_lyric_version_id, note, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
        params![
            version_id,
            input.project_id,
            input.snapshot_name,
            input.body_text,
            input.bpm,
            input.style_text,
            input.vocal_text,
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

pub fn get_all_deleted(conn: &Connection) -> AppResult<Vec<LyricVersion>> {
    let mut stmt = conn.prepare(
        "SELECT lyric_version_id, project_id, snapshot_name, body_text, bpm, style_text, vocal_text, parent_lyric_version_id, note, created_at, deleted_at, deleted_batch_id
         FROM lyric_versions
         WHERE deleted_at IS NOT NULL
         ORDER BY deleted_at DESC"
    )?;

    let versions = stmt.query_map(params![], |row| {
        Ok(LyricVersion {
            lyric_version_id: row.get(0)?,
            project_id: row.get(1)?,
            snapshot_name: row.get(2)?,
            body_text: row.get(3)?,
            bpm: row.get(4)?,
            style_text: row.get(5)?,
            vocal_text: row.get(6)?,
            parent_lyric_version_id: row.get(7)?,
            note: row.get(8)?,
            created_at: row.get(9)?,
            deleted_at: row.get(10)?,
            deleted_batch_id: row.get(11)?,
        })
    })?
    .collect::<std::result::Result<Vec<_>, _>>()?;

    Ok(versions)
}

pub fn restore(conn: &Connection, lyric_version_id: &str, batch_id: &str) -> AppResult<()> {
    conn.execute(
        "UPDATE lyric_versions SET deleted_at = NULL, deleted_batch_id = NULL WHERE lyric_version_id = ?1 AND deleted_batch_id = ?2",
        params![lyric_version_id, batch_id],
    )?;

    // Also restore related version_sections
    conn.execute(
        "UPDATE version_sections SET deleted_at = NULL, deleted_batch_id = NULL WHERE lyric_version_id = ?1 AND deleted_batch_id = ?2",
        params![lyric_version_id, batch_id],
    )?;

    // Also restore related revision_notes
    conn.execute(
        "UPDATE revision_notes SET deleted_at = NULL, deleted_batch_id = NULL WHERE lyric_version_id = ?1 AND deleted_batch_id = ?2",
        params![lyric_version_id, batch_id],
    )?;

    Ok(())
}

pub fn soft_delete(conn: &Connection, lyric_version_id: &str, batch_id: &str) -> AppResult<()> {
    let now = chrono::Utc::now().to_rfc3339();

    // Soft delete the version
    conn.execute(
        "UPDATE lyric_versions SET deleted_at = ?1, deleted_batch_id = ?2 WHERE lyric_version_id = ?3",
        params![now, batch_id, lyric_version_id],
    )?;

    // Soft delete related version_sections
    conn.execute(
        "UPDATE version_sections SET deleted_at = ?1, deleted_batch_id = ?2 WHERE lyric_version_id = ?3",
        params![now, batch_id, lyric_version_id],
    )?;

    // Soft delete related revision_notes
    conn.execute(
        "UPDATE revision_notes SET deleted_at = ?1, deleted_batch_id = ?2 WHERE lyric_version_id = ?3",
        params![now, batch_id, lyric_version_id],
    )?;

    Ok(())
}

pub fn hard_delete(conn: &Connection, lyric_version_id: &str, batch_id: &str) -> AppResult<()> {
    conn.execute(
        "DELETE FROM revision_notes WHERE lyric_version_id = ?1 AND deleted_batch_id = ?2",
        params![lyric_version_id, batch_id],
    )?;

    conn.execute(
        "DELETE FROM version_sections WHERE lyric_version_id = ?1 AND deleted_batch_id = ?2",
        params![lyric_version_id, batch_id],
    )?;

    conn.execute(
        "DELETE FROM lyric_versions WHERE lyric_version_id = ?1 AND deleted_batch_id = ?2",
        params![lyric_version_id, batch_id],
    )?;

    Ok(())
}
