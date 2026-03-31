use crate::error::AppResult;
use rusqlite::{params, Connection};

#[derive(serde::Serialize)]
pub(super) struct LyricVersionExport {
    pub lyric_version_id: String,
    pub project_id: String,
    pub snapshot_name: String,
    pub body_text: String,
    pub parent_lyric_version_id: Option<String>,
    pub note: Option<String>,
    pub created_at: String,
}

pub(super) fn get_lyric_versions(conn: &Connection, project_id: &str, include_deleted: bool) -> AppResult<Vec<LyricVersionExport>> {
    let deleted_filter = if include_deleted { "" } else { "AND deleted_at IS NULL" };
    let sql = format!(
        "SELECT lyric_version_id, project_id, snapshot_name, body_text, parent_lyric_version_id, note, created_at
         FROM lyric_versions WHERE project_id = ?1 {} ORDER BY created_at DESC",
        deleted_filter
    );

    let mut stmt = conn.prepare(&sql)?;
    let versions = stmt
        .query_map(params![project_id], |row| {
            Ok(LyricVersionExport {
                lyric_version_id: row.get(0)?,
                project_id: row.get(1)?,
                snapshot_name: row.get(2)?,
                body_text: row.get(3)?,
                parent_lyric_version_id: row.get(4)?,
                note: row.get(5)?,
                created_at: row.get(6)?,
            })
        })?
        .collect::<std::result::Result<Vec<_>, _>>()?;

    Ok(versions)
}

#[derive(serde::Serialize)]
pub(super) struct VersionSectionExport {
    pub version_section_id: String,
    pub lyric_version_id: String,
    pub section_type: Option<String>,
    pub display_name: String,
    pub sort_order: i32,
    pub body_text: String,
}

pub(super) fn get_version_sections(conn: &Connection, project_id: &str, include_deleted: bool) -> AppResult<Vec<VersionSectionExport>> {
    let deleted_filter = if include_deleted { "" } else { "AND vs.deleted_at IS NULL" };
    let sql = format!(
        "SELECT vs.version_section_id, vs.lyric_version_id, vs.section_type, vs.display_name, vs.sort_order, vs.body_text
         FROM version_sections vs
         JOIN lyric_versions lv ON vs.lyric_version_id = lv.lyric_version_id
         WHERE lv.project_id = ?1 {} ORDER BY vs.sort_order",
        deleted_filter
    );

    let mut stmt = conn.prepare(&sql)?;
    let sections = stmt
        .query_map(params![project_id], |row| {
            Ok(VersionSectionExport {
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

#[derive(serde::Serialize)]
pub(super) struct RevisionNoteExport {
    pub revision_note_id: String,
    pub lyric_version_id: String,
    pub version_section_id: String,
    pub range_start: Option<i32>,
    pub range_end: Option<i32>,
    pub note_type: String,
    pub comment: String,
    pub created_at: String,
}

pub(super) fn get_revision_notes(conn: &Connection, project_id: &str, include_deleted: bool) -> AppResult<Vec<RevisionNoteExport>> {
    let deleted_filter = if include_deleted { "" } else { "AND rn.deleted_at IS NULL" };
    let sql = format!(
        "SELECT rn.revision_note_id, rn.lyric_version_id, rn.version_section_id, rn.range_start, rn.range_end, rn.note_type, rn.comment, rn.created_at
         FROM revision_notes rn
         JOIN lyric_versions lv ON rn.lyric_version_id = lv.lyric_version_id
         WHERE lv.project_id = ?1 {} ORDER BY rn.created_at DESC",
        deleted_filter
    );

    let mut stmt = conn.prepare(&sql)?;
    let notes = stmt
        .query_map(params![project_id], |row| {
            Ok(RevisionNoteExport {
                revision_note_id: row.get(0)?,
                lyric_version_id: row.get(1)?,
                version_section_id: row.get(2)?,
                range_start: row.get(3)?,
                range_end: row.get(4)?,
                note_type: row.get(5)?,
                comment: row.get(6)?,
                created_at: row.get(7)?,
            })
        })?
        .collect::<std::result::Result<Vec<_>, _>>()?;

    Ok(notes)
}
