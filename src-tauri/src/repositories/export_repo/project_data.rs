use crate::error::{AppError, AppResult};
use rusqlite::{params, Connection};

#[derive(serde::Serialize)]
pub(super) struct ProjectExport {
    pub project_id: String,
    pub title: String,
    pub theme: Option<String>,
    pub memo: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

pub(super) fn get_project(conn: &Connection, project_id: &str) -> AppResult<ProjectExport> {
    let project = conn
        .query_row(
            "SELECT project_id, title, theme, memo, created_at, updated_at FROM projects WHERE project_id = ?1",
            params![project_id],
            |row| {
                Ok(ProjectExport {
                    project_id: row.get(0)?,
                    title: row.get(1)?,
                    theme: row.get(2)?,
                    memo: row.get(3)?,
                    created_at: row.get(4)?,
                    updated_at: row.get(5)?,
                })
            },
        )
        .map_err(|_| AppError::NotFound(format!("Project not found: {}", project_id)))?;
    Ok(project)
}

#[derive(serde::Serialize)]
pub(super) struct WorkingDraftExport {
    pub working_draft_id: String,
    pub project_id: String,
    pub latest_body_text: String,
    pub updated_at: String,
}

pub(super) fn get_working_draft(conn: &Connection, project_id: &str) -> AppResult<Option<WorkingDraftExport>> {
    let result = conn.query_row(
        "SELECT working_draft_id, project_id, latest_body_text, updated_at FROM working_drafts WHERE project_id = ?1 AND deleted_at IS NULL",
        params![project_id],
        |row| {
            Ok(WorkingDraftExport {
                working_draft_id: row.get(0)?,
                project_id: row.get(1)?,
                latest_body_text: row.get(2)?,
                updated_at: row.get(3)?,
            })
        },
    );

    match result {
        Ok(draft) => Ok(Some(draft)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(error) => Err(AppError::Other(format!("Failed to get working draft: {}", error))),
    }
}

#[derive(serde::Serialize)]
pub(super) struct StyleProfileExport {
    pub style_profile_id: String,
    pub project_id: String,
    pub tone: Option<String>,
    pub vocabulary_bias: Option<String>,
    pub taboo_words: Option<String>,
    pub structure_preference: Option<String>,
    pub memo: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

pub(super) fn get_style_profile(conn: &Connection, project_id: &str) -> AppResult<Option<StyleProfileExport>> {
    let result = conn.query_row(
        "SELECT style_profile_id, project_id, tone, vocabulary_bias, taboo_words, structure_preference, memo, created_at, updated_at FROM style_profiles WHERE project_id = ?1 AND deleted_at IS NULL",
        params![project_id],
        |row| {
            Ok(StyleProfileExport {
                style_profile_id: row.get(0)?,
                project_id: row.get(1)?,
                tone: row.get(2)?,
                vocabulary_bias: row.get(3)?,
                taboo_words: row.get(4)?,
                structure_preference: row.get(5)?,
                memo: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        },
    );

    match result {
        Ok(profile) => Ok(Some(profile)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(error) => Err(AppError::Other(format!("Failed to get style profile: {}", error))),
    }
}

pub(super) fn get_project_tags(conn: &Connection, project_id: &str) -> AppResult<Vec<String>> {
    let mut stmt = conn.prepare("SELECT tag FROM project_tags WHERE project_id = ?1 ORDER BY tag")?;
    let tags = stmt
        .query_map(params![project_id], |row| row.get(0))?
        .collect::<std::result::Result<Vec<_>, _>>()?;
    Ok(tags)
}

#[derive(serde::Serialize)]
pub(super) struct DraftSectionExport {
    pub draft_section_id: String,
    pub working_draft_id: String,
    pub section_type: Option<String>,
    pub display_name: String,
    pub sort_order: i32,
    pub body_text: String,
}

pub(super) fn get_draft_sections(conn: &Connection, project_id: &str, include_deleted: bool) -> AppResult<Vec<DraftSectionExport>> {
    let deleted_filter = if include_deleted { "" } else { "AND deleted_at IS NULL" };
    let sql = format!(
        "SELECT ds.draft_section_id, ds.working_draft_id, ds.section_type, ds.display_name, ds.sort_order, ds.body_text
         FROM draft_sections ds
         JOIN working_drafts wd ON ds.working_draft_id = wd.working_draft_id
         WHERE wd.project_id = ?1 {} ORDER BY ds.sort_order",
        deleted_filter
    );

    let mut stmt = conn.prepare(&sql)?;
    let sections = stmt
        .query_map(params![project_id], |row| {
            Ok(DraftSectionExport {
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
