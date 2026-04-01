use crate::db;
use crate::error::AppResult;
use crate::repositories::{fragment_repo, project_repo, song_artifact_repo, style_profile_repo, version_repo};
use serde::Serialize;
use tauri::AppHandle;

#[derive(Debug, Clone, Serialize)]
#[serde(tag = "type")]
pub enum DeletedItem {
    Project {
        project_id: String,
        title: String,
        deleted_at: Option<String>,
        deleted_batch_id: Option<String>,
    },
    LyricVersion {
        lyric_version_id: String,
        project_id: String,
        snapshot_name: String,
        deleted_at: Option<String>,
        deleted_batch_id: Option<String>,
    },
    CollectedFragment {
        collected_fragment_id: String,
        project_id: String,
        text_preview: String,
        deleted_at: Option<String>,
        deleted_batch_id: Option<String>,
    },
    SongArtifact {
        song_artifact_id: String,
        project_id: String,
        service_name: String,
        song_title: Option<String>,
        deleted_at: Option<String>,
        deleted_batch_id: Option<String>,
    },
    StyleProfile {
        style_profile_id: String,
        project_id: String,
        deleted_at: Option<String>,
        deleted_batch_id: Option<String>,
    },
}

#[tauri::command]
pub fn get_deleted_items(app: AppHandle) -> AppResult<Vec<DeletedItem>> {
    let conn = db::get_connection(&app)?;
    let mut items: Vec<DeletedItem> = Vec::new();

    // Get deleted projects
    let projects = project_repo::get_all_deleted(&conn)?;
    for p in projects {
        items.push(DeletedItem::Project {
            project_id: p.project_id,
            title: p.title,
            deleted_at: p.deleted_at.map(|d| d.to_rfc3339()),
            deleted_batch_id: p.deleted_batch_id,
        });
    }

    // Get deleted lyric versions (not tied to a deleted project)
    let versions = version_repo::get_all_deleted(&conn)?;
    for v in versions {
        // Only include if the project is not deleted (otherwise it would be double-counted)
        let project_exists = conn.query_row(
            "SELECT 1 FROM projects WHERE project_id = ?1 AND deleted_at IS NULL",
            rusqlite::params![v.project_id],
            |_| Ok(true),
        ).unwrap_or(false);

        if project_exists {
            items.push(DeletedItem::LyricVersion {
                lyric_version_id: v.lyric_version_id,
                project_id: v.project_id,
                snapshot_name: v.snapshot_name,
                deleted_at: v.deleted_at.map(|d| d.to_rfc3339()),
                deleted_batch_id: v.deleted_batch_id,
            });
        }
    }

    // Get deleted fragments (not tied to a deleted project)
    let fragments = fragment_repo::get_all_deleted(&conn)?;
    for f in fragments {
        let project_exists = conn.query_row(
            "SELECT 1 FROM projects WHERE project_id = ?1 AND deleted_at IS NULL",
            rusqlite::params![f.project_id],
            |_| Ok(true),
        ).unwrap_or(false);

        if project_exists {
            items.push(DeletedItem::CollectedFragment {
                collected_fragment_id: f.collected_fragment_id,
                project_id: f.project_id,
                text_preview: if f.text.len() > 50 { format!("{}...", &f.text[..50]) } else { f.text.clone() },
                deleted_at: f.deleted_at.map(|d| d.to_rfc3339()),
                deleted_batch_id: f.deleted_batch_id,
            });
        }
    }

    // Get deleted song artifacts (not tied to a deleted project)
    let artifacts = song_artifact_repo::get_all_deleted(&conn)?;
    for a in artifacts {
        let project_exists = conn.query_row(
            "SELECT 1 FROM projects WHERE project_id = ?1 AND deleted_at IS NULL",
            rusqlite::params![a.project_id],
            |_| Ok(true),
        ).unwrap_or(false);

        if project_exists {
            items.push(DeletedItem::SongArtifact {
                song_artifact_id: a.song_artifact_id,
                project_id: a.project_id,
                service_name: a.service_name,
                song_title: a.song_title,
                deleted_at: a.deleted_at.map(|d| d.to_rfc3339()),
                deleted_batch_id: a.deleted_batch_id,
            });
        }
    }

    // Get deleted style profiles (not tied to a deleted project)
    let profiles = style_profile_repo::get_all_deleted(&conn)?;
    for s in profiles {
        let project_exists = conn.query_row(
            "SELECT 1 FROM projects WHERE project_id = ?1 AND deleted_at IS NULL",
            rusqlite::params![s.project_id],
            |_| Ok(true),
        ).unwrap_or(false);

        if project_exists {
            items.push(DeletedItem::StyleProfile {
                style_profile_id: s.style_profile_id,
                project_id: s.project_id,
                deleted_at: s.deleted_at.map(|d| d.to_rfc3339()),
                deleted_batch_id: s.deleted_batch_id,
            });
        }
    }

    // Sort by deleted_at descending
    items.sort_by(|a, b| {
        let a_time = match a {
            DeletedItem::Project { deleted_at, .. } => deleted_at.as_deref().unwrap_or(""),
            DeletedItem::LyricVersion { deleted_at, .. } => deleted_at.as_deref().unwrap_or(""),
            DeletedItem::CollectedFragment { deleted_at, .. } => deleted_at.as_deref().unwrap_or(""),
            DeletedItem::SongArtifact { deleted_at, .. } => deleted_at.as_deref().unwrap_or(""),
            DeletedItem::StyleProfile { deleted_at, .. } => deleted_at.as_deref().unwrap_or(""),
        };
        let b_time = match b {
            DeletedItem::Project { deleted_at, .. } => deleted_at.as_deref().unwrap_or(""),
            DeletedItem::LyricVersion { deleted_at, .. } => deleted_at.as_deref().unwrap_or(""),
            DeletedItem::CollectedFragment { deleted_at, .. } => deleted_at.as_deref().unwrap_or(""),
            DeletedItem::SongArtifact { deleted_at, .. } => deleted_at.as_deref().unwrap_or(""),
            DeletedItem::StyleProfile { deleted_at, .. } => deleted_at.as_deref().unwrap_or(""),
        };
        b_time.cmp(a_time)
    });

    Ok(items)
}

#[tauri::command]
pub fn restore_fragment(app: AppHandle, fragment_id: String, batch_id: String) -> AppResult<()> {
    let conn = db::get_connection(&app)?;
    fragment_repo::restore(&conn, &fragment_id, &batch_id)
}

#[tauri::command]
pub fn restore_song_artifact(app: AppHandle, artifact_id: String, batch_id: String) -> AppResult<()> {
    let conn = db::get_connection(&app)?;
    song_artifact_repo::restore(&conn, &artifact_id, &batch_id)
}

#[tauri::command]
pub fn restore_style_profile(app: AppHandle, profile_id: String, batch_id: String) -> AppResult<()> {
    let conn = db::get_connection(&app)?;
    style_profile_repo::restore(&conn, &profile_id, &batch_id)
}

#[tauri::command]
pub fn permanently_delete_project(app: AppHandle, project_id: String, batch_id: String) -> AppResult<()> {
    let conn = db::get_connection(&app)?;
    project_repo::hard_delete(&conn, &project_id, &batch_id)
}

#[tauri::command]
pub fn permanently_delete_version(app: AppHandle, lyric_version_id: String, batch_id: String) -> AppResult<()> {
    let conn = db::get_connection(&app)?;
    version_repo::hard_delete(&conn, &lyric_version_id, &batch_id)
}

#[tauri::command]
pub fn permanently_delete_fragment(app: AppHandle, fragment_id: String, batch_id: String) -> AppResult<()> {
    let conn = db::get_connection(&app)?;
    fragment_repo::hard_delete(&conn, &fragment_id, &batch_id)
}

#[tauri::command]
pub fn permanently_delete_song_artifact(app: AppHandle, artifact_id: String, batch_id: String) -> AppResult<()> {
    let conn = db::get_connection(&app)?;
    song_artifact_repo::hard_delete(&conn, &artifact_id, &batch_id)
}

#[tauri::command]
pub fn permanently_delete_style_profile(app: AppHandle, profile_id: String, batch_id: String) -> AppResult<()> {
    let conn = db::get_connection(&app)?;
    style_profile_repo::hard_delete(&conn, &profile_id, &batch_id)
}
