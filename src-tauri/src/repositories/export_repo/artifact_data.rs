use crate::error::AppResult;
use rusqlite::{params, Connection};

#[derive(serde::Serialize)]
pub(super) struct SongArtifactExport {
    pub song_artifact_id: String,
    pub project_id: String,
    pub lyric_version_id: String,
    pub service_name: String,
    pub song_title: Option<String>,
    pub source_url: Option<String>,
    pub source_file_path: Option<String>,
    pub prompt_memo: Option<String>,
    pub style_memo: Option<String>,
    pub evaluation_memo: Option<String>,
    pub created_at: String,
}

pub(super) fn get_song_artifacts(conn: &Connection, project_id: &str, include_deleted: bool) -> AppResult<Vec<SongArtifactExport>> {
    let deleted_filter = if include_deleted { "" } else { "AND deleted_at IS NULL" };
    let sql = format!(
        "SELECT song_artifact_id, project_id, lyric_version_id, service_name, song_title, source_url, source_file_path, prompt_memo, style_memo, evaluation_memo, created_at
         FROM song_artifacts WHERE project_id = ?1 {} ORDER BY created_at DESC",
        deleted_filter
    );

    let mut stmt = conn.prepare(&sql)?;
    let artifacts = stmt
        .query_map(params![project_id], |row| {
            Ok(SongArtifactExport {
                song_artifact_id: row.get(0)?,
                project_id: row.get(1)?,
                lyric_version_id: row.get(2)?,
                service_name: row.get(3)?,
                song_title: row.get(4)?,
                source_url: row.get(5)?,
                source_file_path: row.get(6)?,
                prompt_memo: row.get(7)?,
                style_memo: row.get(8)?,
                evaluation_memo: row.get(9)?,
                created_at: row.get(10)?,
            })
        })?
        .collect::<std::result::Result<Vec<_>, _>>()?;

    Ok(artifacts)
}

#[derive(serde::Serialize)]
pub(super) struct CollectedFragmentExport {
    pub collected_fragment_id: String,
    pub project_id: String,
    pub text: String,
    pub source: Option<String>,
    pub status: String,
    pub created_at: String,
}

pub(super) fn get_collected_fragments(conn: &Connection, project_id: &str, include_deleted: bool) -> AppResult<Vec<CollectedFragmentExport>> {
    let deleted_filter = if include_deleted { "" } else { "AND deleted_at IS NULL" };
    let sql = format!(
        "SELECT collected_fragment_id, project_id, text, source, status, created_at
         FROM collected_fragments WHERE project_id = ?1 {} ORDER BY created_at DESC",
        deleted_filter
    );

    let mut stmt = conn.prepare(&sql)?;
    let fragments = stmt
        .query_map(params![project_id], |row| {
            Ok(CollectedFragmentExport {
                collected_fragment_id: row.get(0)?,
                project_id: row.get(1)?,
                text: row.get(2)?,
                source: row.get(3)?,
                status: row.get(4)?,
                created_at: row.get(5)?,
            })
        })?
        .collect::<std::result::Result<Vec<_>, _>>()?;

    Ok(fragments)
}

#[derive(serde::Serialize)]
pub(super) struct FragmentTagExport {
    pub collected_fragment_id: String,
    pub tag: String,
}

pub(super) fn get_fragment_tags(conn: &Connection, project_id: &str) -> AppResult<Vec<FragmentTagExport>> {
    let mut stmt = conn.prepare(
        "SELECT ft.collected_fragment_id, ft.tag
         FROM fragment_tags ft
         JOIN collected_fragments cf ON ft.collected_fragment_id = cf.collected_fragment_id
         WHERE cf.project_id = ?1 AND cf.deleted_at IS NULL
         ORDER BY ft.tag",
    )?;

    let tags = stmt
        .query_map(params![project_id], |row| {
            Ok(FragmentTagExport {
                collected_fragment_id: row.get(0)?,
                tag: row.get(1)?,
            })
        })?
        .collect::<std::result::Result<Vec<_>, _>>()?;

    Ok(tags)
}
