use crate::error::AppResult;
use crate::models::{CreateRevisionNoteInput, RevisionNote};
use chrono::Utc;
use rusqlite::{params, Connection};
use uuid::Uuid;

pub fn get_by_version(conn: &Connection, lyric_version_id: &str) -> AppResult<Vec<RevisionNote>> {
    let mut stmt = conn.prepare(
        "SELECT revision_note_id, lyric_version_id, version_section_id, range_start, range_end,
                note_type, comment, created_at, updated_at
         FROM revision_notes
         WHERE lyric_version_id = ?1 AND deleted_at IS NULL
         ORDER BY created_at DESC"
    )?;

    let notes = stmt.query_map(params![lyric_version_id], |row| {
        Ok(RevisionNote {
            revision_note_id: row.get(0)?,
            lyric_version_id: row.get(1)?,
            version_section_id: row.get(2)?,
            range_start: row.get(3)?,
            range_end: row.get(4)?,
            note_type: row.get(5)?,
            comment: row.get(6)?,
            created_at: row.get(7)?,
            updated_at: row.get(8)?,
        })
    })?
    .collect::<std::result::Result<Vec<_>, _>>()?;

    Ok(notes)
}

pub fn create(conn: &Connection, input: CreateRevisionNoteInput) -> AppResult<RevisionNote> {
    let now = Utc::now();
    let note_id = Uuid::new_v4().to_string();
    let now_rfc3339 = now.to_rfc3339();

    conn.execute(
        "INSERT INTO revision_notes (
            revision_note_id, lyric_version_id, version_section_id, range_start, range_end,
            note_type, comment, created_at, updated_at
         ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?8)",
        params![
            note_id,
            input.lyric_version_id,
            input.version_section_id,
            input.range_start,
            input.range_end,
            input.note_type,
            input.comment,
            now_rfc3339
        ],
    )?;

    get_by_id(conn, &note_id)
}

pub fn soft_delete(conn: &Connection, note_id: &str) -> AppResult<()> {
    let now = Utc::now();
    let batch_id = Uuid::new_v4().to_string();

    conn.execute(
        "UPDATE revision_notes SET deleted_at = ?1, deleted_batch_id = ?2 WHERE revision_note_id = ?3",
        params![now.to_rfc3339(), batch_id, note_id],
    )?;

    Ok(())
}

fn get_by_id(conn: &Connection, note_id: &str) -> AppResult<RevisionNote> {
    let mut stmt = conn.prepare(
        "SELECT revision_note_id, lyric_version_id, version_section_id, range_start, range_end,
                note_type, comment, created_at, updated_at
         FROM revision_notes
         WHERE revision_note_id = ?1 AND deleted_at IS NULL"
    )?;

    let note = stmt.query_row(params![note_id], |row| {
        Ok(RevisionNote {
            revision_note_id: row.get(0)?,
            lyric_version_id: row.get(1)?,
            version_section_id: row.get(2)?,
            range_start: row.get(3)?,
            range_end: row.get(4)?,
            note_type: row.get(5)?,
            comment: row.get(6)?,
            created_at: row.get(7)?,
            updated_at: row.get(8)?,
        })
    })
    .map_err(|_| crate::error::AppError::NotFound(format!("RevisionNote not found: {}", note_id)))?;

    Ok(note)
}