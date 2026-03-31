use crate::error::AppResult;
use rusqlite::{params, Connection};

pub mod project_repo;
pub mod draft_repo;
pub mod version_repo;
pub mod fragment_repo;
pub mod song_artifact_repo;
pub mod revision_note_repo;
pub mod style_profile_repo;
pub mod export_repo;

pub fn touch_project_updated_at(conn: &Connection, project_id: &str, timestamp: &str) -> AppResult<()> {
    conn.execute(
        "UPDATE projects SET updated_at = ?1 WHERE project_id = ?2 AND deleted_at IS NULL",
        params![timestamp, project_id],
    )?;

    Ok(())
}
