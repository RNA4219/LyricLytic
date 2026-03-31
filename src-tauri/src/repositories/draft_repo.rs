use crate::error::AppResult;
use crate::models::{SaveDraftInput, WorkingDraft, DraftSection};
use crate::repositories::touch_project_updated_at;
use chrono::Utc;
use rusqlite::{params, Connection};
use uuid::Uuid;

pub fn get_active_by_project(conn: &Connection, project_id: &str) -> AppResult<Option<WorkingDraft>> {
    let mut stmt = conn.prepare(
        "SELECT working_draft_id, project_id, latest_body_text, style_text, vocal_text, updated_at
         FROM working_drafts
         WHERE project_id = ?1 AND deleted_at IS NULL"
    )?;

    let result = stmt.query_row(params![project_id], |row| {
        Ok(WorkingDraft {
            working_draft_id: row.get(0)?,
            project_id: row.get(1)?,
            latest_body_text: row.get(2)?,
            style_text: row.get(3)?,
            vocal_text: row.get(4)?,
            updated_at: row.get(5)?,
        })
    });

    match result {
        Ok(draft) => Ok(Some(draft)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.into()),
    }
}

pub fn get_sections(conn: &Connection, working_draft_id: &str) -> AppResult<Vec<DraftSection>> {
    let mut stmt = conn.prepare(
        "SELECT draft_section_id, working_draft_id, section_type, display_name, sort_order, body_text
         FROM draft_sections
         WHERE working_draft_id = ?1 AND deleted_at IS NULL
         ORDER BY sort_order"
    )?;

    let sections = stmt.query_map(params![working_draft_id], |row| {
        Ok(DraftSection {
            draft_section_id: row.get(0)?,
            working_draft_id: row.get(1)?,
            section_type: row.get(2)?,
            display_name: row.get(3)?,
            sort_order: row.get(4)?,
            body_text: row.get(5)?,
        })
    })?
    .collect::<std::result::Result<Vec<_>, _>>()?;

    Ok(sections)
}

pub fn save(conn: &Connection, input: SaveDraftInput) -> AppResult<WorkingDraft> {
    let now = Utc::now();
    let now_rfc3339 = now.to_rfc3339();

    let style_text = input.style_text.clone().unwrap_or_default();
    let vocal_text = input.vocal_text.clone().unwrap_or_default();

    // Get or create draft
    let draft = if let Some(existing) = get_active_by_project(conn, &input.project_id)? {
        existing
    } else {
        let draft_id = Uuid::new_v4().to_string();
        conn.execute(
            "INSERT INTO working_drafts (working_draft_id, project_id, latest_body_text, style_text, vocal_text, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![draft_id, input.project_id, input.body_text, style_text, vocal_text, now_rfc3339],
        )?;

        WorkingDraft {
            working_draft_id: draft_id,
            project_id: input.project_id.clone(),
            latest_body_text: input.body_text.clone(),
            style_text: Some(style_text.clone()),
            vocal_text: Some(vocal_text.clone()),
            updated_at: now,
        }
    };

    // Update body text, style_text, vocal_text
    conn.execute(
        "UPDATE working_drafts SET latest_body_text = ?1, style_text = ?2, vocal_text = ?3, updated_at = ?4 WHERE working_draft_id = ?5",
        params![input.body_text, style_text, vocal_text, now_rfc3339, draft.working_draft_id],
    )?;

    // Delete existing sections
    conn.execute(
        "DELETE FROM draft_sections WHERE working_draft_id = ?1",
        params![draft.working_draft_id],
    )?;

    // Insert new sections
    for section in input.sections {
        let section_id = Uuid::new_v4().to_string();
        conn.execute(
            "INSERT INTO draft_sections (draft_section_id, working_draft_id, section_type, display_name, sort_order, body_text, note, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, NULL, ?7, ?7)",
            params![
                section_id,
                draft.working_draft_id,
                section.section_type,
                section.display_name,
                section.sort_order,
                section.body_text,
                now_rfc3339
            ],
        )?;
    }

    touch_project_updated_at(conn, &input.project_id, &now_rfc3339)?;

    Ok(WorkingDraft {
        working_draft_id: draft.working_draft_id,
        project_id: input.project_id,
        latest_body_text: input.body_text,
        style_text: Some(style_text),
        vocal_text: Some(vocal_text),
        updated_at: now,
    })
}
