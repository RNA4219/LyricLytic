use crate::error::AppResult;
use crate::models::{CreateStyleProfileInput, StyleProfile, UpdateStyleProfileInput};
use crate::repositories::touch_project_updated_at;
use chrono::Utc;
use rusqlite::{params, Connection};
use uuid::Uuid;

pub fn get_by_project(conn: &Connection, project_id: &str) -> AppResult<Option<StyleProfile>> {
    let mut stmt = conn.prepare(
        "SELECT style_profile_id, project_id, tone, vocabulary_bias, taboo_words,
                structure_preference, memo, created_at, updated_at
         FROM style_profiles
         WHERE project_id = ?1 AND deleted_at IS NULL"
    )?;

    let result = stmt.query_row(params![project_id], |row| {
        Ok(StyleProfile {
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
    });

    match result {
        Ok(profile) => Ok(Some(profile)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.into()),
    }
}

pub fn create(conn: &Connection, input: CreateStyleProfileInput) -> AppResult<StyleProfile> {
    let now = Utc::now();
    let profile_id = Uuid::new_v4().to_string();
    let now_rfc3339 = now.to_rfc3339();

    conn.execute(
        "INSERT INTO style_profiles (
            style_profile_id, project_id, tone, vocabulary_bias, taboo_words,
            structure_preference, memo, created_at, updated_at
         ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?8)",
        params![
            profile_id,
            input.project_id,
            input.tone,
            input.vocabulary_bias,
            input.taboo_words,
            input.structure_preference,
            input.memo,
            now_rfc3339
        ],
    )?;

    get_by_id(conn, &profile_id)
}

pub fn update(conn: &Connection, profile_id: &str, input: UpdateStyleProfileInput) -> AppResult<StyleProfile> {
    let now = Utc::now();
    let existing = get_by_id(conn, profile_id)?;
    let now_rfc3339 = now.to_rfc3339();

    let tone = input.tone.or(existing.tone);
    let vocabulary_bias = input.vocabulary_bias.or(existing.vocabulary_bias);
    let taboo_words = input.taboo_words.or(existing.taboo_words);
    let structure_preference = input.structure_preference.or(existing.structure_preference);
    let memo = input.memo.or(existing.memo);

    conn.execute(
        "UPDATE style_profiles SET tone = ?1, vocabulary_bias = ?2, taboo_words = ?3,
         structure_preference = ?4, memo = ?5, updated_at = ?6
         WHERE style_profile_id = ?7",
        params![tone, vocabulary_bias, taboo_words, structure_preference, memo, now_rfc3339, profile_id],
    )?;

    touch_project_updated_at(conn, &existing.project_id, &now_rfc3339)?;

    get_by_id(conn, profile_id)
}

pub fn soft_delete(conn: &Connection, profile_id: &str) -> AppResult<()> {
    let now = Utc::now();
    let batch_id = Uuid::new_v4().to_string();
    let existing = get_by_id(conn, profile_id)?;
    let now_rfc3339 = now.to_rfc3339();

    conn.execute(
        "UPDATE style_profiles SET deleted_at = ?1, deleted_batch_id = ?2 WHERE style_profile_id = ?3",
        params![now_rfc3339, batch_id, profile_id],
    )?;

    touch_project_updated_at(conn, &existing.project_id, &now_rfc3339)?;

    Ok(())
}

fn get_by_id(conn: &Connection, profile_id: &str) -> AppResult<StyleProfile> {
    let mut stmt = conn.prepare(
        "SELECT style_profile_id, project_id, tone, vocabulary_bias, taboo_words,
                structure_preference, memo, created_at, updated_at
         FROM style_profiles
         WHERE style_profile_id = ?1 AND deleted_at IS NULL"
    )?;

    let profile = stmt.query_row(params![profile_id], |row| {
        Ok(StyleProfile {
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
    })
    .map_err(|_| crate::error::AppError::NotFound(format!("StyleProfile not found: {}", profile_id)))?;

    Ok(profile)
}

#[derive(Debug, Clone)]
pub struct DeletedStyleProfile {
    pub style_profile_id: String,
    pub project_id: String,
    pub deleted_at: Option<chrono::DateTime<chrono::Utc>>,
    pub deleted_batch_id: Option<String>,
}

pub fn get_all_deleted(conn: &Connection) -> AppResult<Vec<DeletedStyleProfile>> {
    let mut stmt = conn.prepare(
        "SELECT style_profile_id, project_id, deleted_at, deleted_batch_id
         FROM style_profiles
         WHERE deleted_at IS NOT NULL
         ORDER BY deleted_at DESC"
    )?;

    let profiles = stmt.query_map(params![], |row| {
        Ok(DeletedStyleProfile {
            style_profile_id: row.get(0)?,
            project_id: row.get(1)?,
            deleted_at: row.get(2)?,
            deleted_batch_id: row.get(3)?,
        })
    })?
    .collect::<std::result::Result<Vec<_>, _>>()?;

    Ok(profiles)
}

pub fn restore(conn: &Connection, profile_id: &str, batch_id: &str) -> AppResult<()> {
    conn.execute(
        "UPDATE style_profiles SET deleted_at = NULL, deleted_batch_id = NULL WHERE style_profile_id = ?1 AND deleted_batch_id = ?2",
        params![profile_id, batch_id],
    )?;
    Ok(())
}