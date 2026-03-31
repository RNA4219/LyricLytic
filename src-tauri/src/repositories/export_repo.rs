mod artifact_data;
mod project_data;
mod version_data;

use crate::error::{AppError, AppResult};
use artifact_data::*;
use chrono::Utc;
use project_data::*;
use rusqlite::Connection;
use std::io::Write;
use version_data::*;
use zip::write::{SimpleFileOptions, ZipWriter};
use zip::CompressionMethod;

#[derive(serde::Serialize)]
struct Manifest {
    format: String,
    format_version: String,
    exported_at: String,
    app_name: String,
    project_id: String,
    project_title: String,
    target_os: Vec<String>,
    includes_deleted: bool,
    entity_counts: EntityCounts,
}

#[derive(serde::Serialize)]
struct EntityCounts {
    lyric_versions: usize,
    song_artifacts: usize,
    collected_fragments: usize,
    revision_notes: usize,
}

pub fn create_export_zip(
    conn: &Connection,
    project_id: &str,
    include_deleted: bool,
) -> AppResult<String> {
    let project = get_project(conn, project_id)?;
    let project_title = project.title.clone();

    let working_draft = get_working_draft(conn, project_id)?;
    let style_profile = get_style_profile(conn, project_id)?;
    let project_tags = get_project_tags(conn, project_id)?;
    let draft_sections = get_draft_sections(conn, project_id, include_deleted)?;
    let lyric_versions = get_lyric_versions(conn, project_id, include_deleted)?;
    let version_sections = get_version_sections(conn, project_id, include_deleted)?;
    let revision_notes = get_revision_notes(conn, project_id, include_deleted)?;
    let song_artifacts = get_song_artifacts(conn, project_id, include_deleted)?;
    let collected_fragments = get_collected_fragments(conn, project_id, include_deleted)?;
    let fragment_tags = get_fragment_tags(conn, project_id)?;

    let manifest = Manifest {
        format: "lyrlytic-project-export".to_string(),
        format_version: "1".to_string(),
        exported_at: Utc::now().to_rfc3339(),
        app_name: "LyricLytic".to_string(),
        project_id: project_id.to_string(),
        project_title: project_title.clone(),
        target_os: vec!["windows".to_string(), "macos".to_string()],
        includes_deleted: include_deleted,
        entity_counts: EntityCounts {
            lyric_versions: lyric_versions.len(),
            song_artifacts: song_artifacts.len(),
            collected_fragments: collected_fragments.len(),
            revision_notes: revision_notes.len(),
        },
    };

    let timestamp = Utc::now().format("%Y%m%d-%H%M%S");
    let slug = sanitize_slug(&project_title);
    let filename = format!("{}_{}.lyrlytic.zip", slug, timestamp);
    let zip_path = std::env::temp_dir().join(&filename);

    let file = std::fs::File::create(&zip_path)
        .map_err(|error| AppError::Other(format!("Failed to create zip file: {}", error)))?;
    let mut zip = ZipWriter::new(file);
    let options = SimpleFileOptions::default().compression_method(CompressionMethod::Stored);

    add_json_file(&mut zip, "manifest.json", &manifest)?;
    add_json_file(&mut zip, "project.json", &project)?;
    add_json_file(&mut zip, "project_tags.json", &project_tags)?;

    if let Some(draft) = &working_draft {
        add_json_file(&mut zip, "working-draft.json", draft)?;
    }

    add_json_file(&mut zip, "draft_sections.json", &draft_sections)?;

    if let Some(profile) = &style_profile {
        add_json_file(&mut zip, "style-profile.json", profile)?;
    }

    add_json_file(&mut zip, "lyric-versions.json", &lyric_versions)?;
    add_json_file(&mut zip, "version-sections.json", &version_sections)?;
    add_json_file(&mut zip, "revision-notes.json", &revision_notes)?;
    add_json_file(&mut zip, "song-artifacts.json", &song_artifacts)?;
    add_json_file(&mut zip, "collected-fragments.json", &collected_fragments)?;
    add_json_file(&mut zip, "fragment_tags.json", &fragment_tags)?;

    zip.add_directory("texts/", options)
        .map_err(|error| AppError::Other(format!("Failed to add texts directory: {}", error)))?;

    if let Some(draft) = &working_draft {
        add_text_file(&mut zip, "texts/working-draft.txt", &draft.latest_body_text)?;
    }

    zip.add_directory("texts/versions/", options)
        .map_err(|error| AppError::Other(format!("Failed to add versions directory: {}", error)))?;

    for version in &lyric_versions {
        let version_filename = format!("texts/versions/{}.txt", version.lyric_version_id);
        add_text_file(&mut zip, &version_filename, &version.body_text)?;
    }

    zip.finish()
        .map_err(|error| AppError::Other(format!("Failed to finalize zip: {}", error)))?;

    Ok(zip_path.to_string_lossy().to_string())
}

fn add_json_file<T: serde::Serialize>(
    zip: &mut ZipWriter<std::fs::File>,
    name: &str,
    data: &T,
) -> AppResult<()> {
    let json = serde_json::to_string_pretty(data)
        .map_err(|error| AppError::Other(format!("JSON serialization failed: {}", error)))?;

    let options = SimpleFileOptions::default().compression_method(CompressionMethod::Stored);
    zip.start_file(name, options)
        .map_err(|error| AppError::Other(format!("Failed to add file {}: {}", name, error)))?;
    zip.write_all(json.as_bytes())
        .map_err(|error| AppError::Other(format!("Failed to write {}: {}", name, error)))?;

    Ok(())
}

fn add_text_file(zip: &mut ZipWriter<std::fs::File>, name: &str, content: &str) -> AppResult<()> {
    let options = SimpleFileOptions::default().compression_method(CompressionMethod::Stored);
    zip.start_file(name, options)
        .map_err(|error| AppError::Other(format!("Failed to add file {}: {}", name, error)))?;
    zip.write_all(content.as_bytes())
        .map_err(|error| AppError::Other(format!("Failed to write {}: {}", name, error)))?;

    Ok(())
}

fn sanitize_slug(title: &str) -> String {
    title
        .chars()
        .map(|ch| if ch.is_alphanumeric() { ch } else { '-' })
        .collect::<String>()
        .to_lowercase()
}
