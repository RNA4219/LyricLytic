use crate::error::AppResult;
use crate::models::{CollectedFragment, CreateFragmentInput, UpdateFragmentInput};
use crate::repositories::touch_project_updated_at;
use chrono::Utc;
use rusqlite::{params, Connection};
use uuid::Uuid;

pub fn get_by_project(conn: &Connection, project_id: &str) -> AppResult<Vec<CollectedFragment>> {
    let mut stmt = conn.prepare(
        "SELECT collected_fragment_id, project_id, text, source, status, created_at, updated_at
         FROM collected_fragments
         WHERE project_id = ?1 AND deleted_at IS NULL
         ORDER BY created_at DESC"
    )?;

    let fragments = stmt.query_map(params![project_id], |row| {
        Ok(CollectedFragment {
            collected_fragment_id: row.get(0)?,
            project_id: row.get(1)?,
            text: row.get(2)?,
            source: row.get(3)?,
            status: row.get(4)?,
            created_at: row.get(5)?,
            updated_at: row.get(6)?,
        })
    })?
    .collect::<std::result::Result<Vec<_>, _>>()?;

    Ok(fragments)
}

pub fn create(conn: &Connection, input: CreateFragmentInput) -> AppResult<CollectedFragment> {
    let now = Utc::now();
    let fragment_id = Uuid::new_v4().to_string();
    let status = "unused".to_string();
    let now_rfc3339 = now.to_rfc3339();

    conn.execute(
        "INSERT INTO collected_fragments (collected_fragment_id, project_id, text, source, status, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![fragment_id, input.project_id, input.text, input.source, status, now_rfc3339, now_rfc3339],
    )?;

    // Insert tags if provided
    if let Some(tags) = input.tags {
        for tag in tags {
            conn.execute(
                "INSERT INTO fragment_tags (collected_fragment_id, tag, created_at) VALUES (?1, ?2, ?3)",
                params![fragment_id, tag, now_rfc3339],
            )?;
        }
    }

    touch_project_updated_at(conn, &input.project_id, &now_rfc3339)?;

    get_by_id(conn, &fragment_id)
}

pub fn update(conn: &Connection, fragment_id: &str, input: UpdateFragmentInput) -> AppResult<CollectedFragment> {
    let now = Utc::now();
    let existing = get_by_id(conn, fragment_id)?;
    let now_rfc3339 = now.to_rfc3339();

    let text = input.text.unwrap_or(existing.text);
    let source = input.source.or(existing.source);
    let status = input.status.unwrap_or(existing.status);

    conn.execute(
        "UPDATE collected_fragments SET text = ?1, source = ?2, status = ?3, updated_at = ?4
         WHERE collected_fragment_id = ?5",
        params![text, source, status, now_rfc3339, fragment_id],
    )?;

    touch_project_updated_at(conn, &existing.project_id, &now_rfc3339)?;

    get_by_id(conn, fragment_id)
}

pub fn soft_delete(conn: &Connection, fragment_id: &str) -> AppResult<()> {
    let now = Utc::now();
    let batch_id = Uuid::new_v4().to_string();
    let existing = get_by_id(conn, fragment_id)?;
    let now_rfc3339 = now.to_rfc3339();

    conn.execute(
        "UPDATE collected_fragments SET deleted_at = ?1, deleted_batch_id = ?2 WHERE collected_fragment_id = ?3",
        params![now_rfc3339, batch_id, fragment_id],
    )?;

    touch_project_updated_at(conn, &existing.project_id, &now_rfc3339)?;

    Ok(())
}

fn get_by_id(conn: &Connection, fragment_id: &str) -> AppResult<CollectedFragment> {
    let mut stmt = conn.prepare(
        "SELECT collected_fragment_id, project_id, text, source, status, created_at, updated_at
         FROM collected_fragments
         WHERE collected_fragment_id = ?1 AND deleted_at IS NULL"
    )?;

    let fragment = stmt.query_row(params![fragment_id], |row| {
        Ok(CollectedFragment {
            collected_fragment_id: row.get(0)?,
            project_id: row.get(1)?,
            text: row.get(2)?,
            source: row.get(3)?,
            status: row.get(4)?,
            created_at: row.get(5)?,
            updated_at: row.get(6)?,
        })
    })
    .map_err(|_| crate::error::AppError::NotFound(format!("Fragment not found: {}", fragment_id)))?;

    Ok(fragment)
}
