use crate::error::{AppError, AppResult};
use crate::models::{CreateProjectInput, Project, UpdateProjectInput};
use chrono::Utc;
use rusqlite::{params, Connection};
use uuid::Uuid;

pub fn get_all_active(conn: &Connection) -> AppResult<Vec<Project>> {
    let mut stmt = conn.prepare(
        "SELECT project_id, title, theme, memo, created_at, updated_at, deleted_at, deleted_batch_id
         FROM projects
         WHERE deleted_at IS NULL
         ORDER BY updated_at DESC"
    )?;

    let projects = stmt.query_map([], |row| {
        Ok(Project {
            project_id: row.get(0)?,
            title: row.get(1)?,
            theme: row.get(2)?,
            memo: row.get(3)?,
            created_at: row.get(4)?,
            updated_at: row.get(5)?,
            deleted_at: row.get(6)?,
            deleted_batch_id: row.get(7)?,
        })
    })?
    .collect::<std::result::Result<Vec<_>, _>>()?;

    Ok(projects)
}

pub fn get_by_id(conn: &Connection, project_id: &str) -> AppResult<Project> {
    let mut stmt = conn.prepare(
        "SELECT project_id, title, theme, memo, created_at, updated_at, deleted_at, deleted_batch_id
         FROM projects
         WHERE project_id = ?1 AND deleted_at IS NULL"
    )?;

    let project = stmt.query_row(params![project_id], |row| {
        Ok(Project {
            project_id: row.get(0)?,
            title: row.get(1)?,
            theme: row.get(2)?,
            memo: row.get(3)?,
            created_at: row.get(4)?,
            updated_at: row.get(5)?,
            deleted_at: row.get(6)?,
            deleted_batch_id: row.get(7)?,
        })
    })
    .map_err(|_| AppError::NotFound(format!("Project not found: {}", project_id)))?;

    Ok(project)
}

pub fn create(conn: &Connection, input: CreateProjectInput) -> AppResult<Project> {
    let now = Utc::now();
    let project_id = Uuid::new_v4().to_string();

    conn.execute(
        "INSERT INTO projects (project_id, title, theme, memo, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![project_id, input.title, input.theme, input.memo, now.to_rfc3339(), now.to_rfc3339()],
    )?;

    // Create default working draft
    let draft_id = Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO working_drafts (working_draft_id, project_id, latest_body_text, updated_at)
         VALUES (?1, ?2, '', ?3)",
        params![draft_id, project_id, now.to_rfc3339()],
    )?;

    get_by_id(conn, &project_id)
}

pub fn update(conn: &Connection, project_id: &str, input: UpdateProjectInput) -> AppResult<Project> {
    let now = Utc::now();
    let existing = get_by_id(conn, project_id)?;

    let title = input.title.unwrap_or(existing.title);
    let theme = input.theme.or(existing.theme);
    let memo = input.memo.or(existing.memo);

    conn.execute(
        "UPDATE projects SET title = ?1, theme = ?2, memo = ?3, updated_at = ?4
         WHERE project_id = ?5",
        params![title, theme, memo, now.to_rfc3339(), project_id],
    )?;

    get_by_id(conn, project_id)
}

pub fn soft_delete(conn: &Connection, project_id: &str, batch_id: &str) -> AppResult<()> {
    let now = Utc::now();
    let now_rfc3339 = now.to_rfc3339();

    // Delete project
    conn.execute(
        "UPDATE projects SET deleted_at = ?1, deleted_batch_id = ?2 WHERE project_id = ?3",
        params![now_rfc3339, batch_id, project_id],
    )?;

    // Cascade to style profiles
    conn.execute(
        "UPDATE style_profiles SET deleted_at = ?1, deleted_batch_id = ?2 WHERE project_id = ?3",
        params![now_rfc3339, batch_id, project_id],
    )?;

    // Cascade to working draft
    conn.execute(
        "UPDATE working_drafts SET deleted_at = ?1, deleted_batch_id = ?2 WHERE project_id = ?3",
        params![now_rfc3339, batch_id, project_id],
    )?;

    // Cascade to draft sections through working drafts
    conn.execute(
        "UPDATE draft_sections
         SET deleted_at = ?1, deleted_batch_id = ?2
         WHERE working_draft_id IN (
             SELECT working_draft_id FROM working_drafts WHERE project_id = ?3
         )",
        params![now_rfc3339, batch_id, project_id],
    )?;

    // Cascade to lyric versions
    conn.execute(
        "UPDATE lyric_versions SET deleted_at = ?1, deleted_batch_id = ?2 WHERE project_id = ?3",
        params![now_rfc3339, batch_id, project_id],
    )?;

    // Cascade to version sections through lyric versions
    conn.execute(
        "UPDATE version_sections
         SET deleted_at = ?1, deleted_batch_id = ?2
         WHERE lyric_version_id IN (
             SELECT lyric_version_id FROM lyric_versions WHERE project_id = ?3
         )",
        params![now_rfc3339, batch_id, project_id],
    )?;

    // Cascade to revision notes through lyric versions
    conn.execute(
        "UPDATE revision_notes
         SET deleted_at = ?1, deleted_batch_id = ?2
         WHERE lyric_version_id IN (
             SELECT lyric_version_id FROM lyric_versions WHERE project_id = ?3
         )",
        params![now_rfc3339, batch_id, project_id],
    )?;

    // Cascade to song artifacts
    conn.execute(
        "UPDATE song_artifacts SET deleted_at = ?1, deleted_batch_id = ?2 WHERE project_id = ?3",
        params![now_rfc3339, batch_id, project_id],
    )?;

    // Cascade to collected fragments
    conn.execute(
        "UPDATE collected_fragments SET deleted_at = ?1, deleted_batch_id = ?2 WHERE project_id = ?3",
        params![now_rfc3339, batch_id, project_id],
    )?;

    Ok(())
}

pub fn get_all_deleted(conn: &Connection) -> AppResult<Vec<Project>> {
    let mut stmt = conn.prepare(
        "SELECT project_id, title, theme, memo, created_at, updated_at, deleted_at, deleted_batch_id
         FROM projects
         WHERE deleted_at IS NOT NULL
         ORDER BY deleted_at DESC"
    )?;

    let projects = stmt.query_map([], |row| {
        Ok(Project {
            project_id: row.get(0)?,
            title: row.get(1)?,
            theme: row.get(2)?,
            memo: row.get(3)?,
            created_at: row.get(4)?,
            updated_at: row.get(5)?,
            deleted_at: row.get(6)?,
            deleted_batch_id: row.get(7)?,
        })
    })?
    .collect::<std::result::Result<Vec<_>, _>>()?;

    Ok(projects)
}

pub fn restore(conn: &Connection, project_id: &str, batch_id: &str) -> AppResult<()> {
    let now = Utc::now();
    let now_rfc3339 = now.to_rfc3339();

    // Restore project
    conn.execute(
        "UPDATE projects SET deleted_at = NULL, deleted_batch_id = NULL, updated_at = ?1 WHERE project_id = ?2 AND deleted_batch_id = ?3",
        params![now_rfc3339, project_id, batch_id],
    )?;

    // Restore style profiles
    conn.execute(
        "UPDATE style_profiles SET deleted_at = NULL, deleted_batch_id = NULL WHERE project_id = ?1 AND deleted_batch_id = ?2",
        params![project_id, batch_id],
    )?;

    // Restore working draft
    conn.execute(
        "UPDATE working_drafts SET deleted_at = NULL, deleted_batch_id = NULL WHERE project_id = ?1 AND deleted_batch_id = ?2",
        params![project_id, batch_id],
    )?;

    // Restore draft sections
    conn.execute(
        "UPDATE draft_sections SET deleted_at = NULL, deleted_batch_id = NULL WHERE deleted_batch_id = ?1",
        params![batch_id],
    )?;

    // Restore lyric versions
    conn.execute(
        "UPDATE lyric_versions SET deleted_at = NULL, deleted_batch_id = NULL WHERE project_id = ?1 AND deleted_batch_id = ?2",
        params![project_id, batch_id],
    )?;

    // Restore version sections
    conn.execute(
        "UPDATE version_sections SET deleted_at = NULL, deleted_batch_id = NULL WHERE deleted_batch_id = ?1",
        params![batch_id],
    )?;

    // Restore revision notes
    conn.execute(
        "UPDATE revision_notes SET deleted_at = NULL, deleted_batch_id = NULL WHERE deleted_batch_id = ?1",
        params![batch_id],
    )?;

    // Restore song artifacts
    conn.execute(
        "UPDATE song_artifacts SET deleted_at = NULL, deleted_batch_id = NULL WHERE project_id = ?1 AND deleted_batch_id = ?2",
        params![project_id, batch_id],
    )?;

    // Restore collected fragments
    conn.execute(
        "UPDATE collected_fragments SET deleted_at = NULL, deleted_batch_id = NULL WHERE project_id = ?1 AND deleted_batch_id = ?2",
        params![project_id, batch_id],
    )?;

    Ok(())
}
