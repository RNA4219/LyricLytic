use crate::error::{AppError, AppResult};
use chrono::Utc;
use rusqlite::{Connection, params};
use std::io::Write;
use zip::write::{FileOptions, SimpleFileOptions, ZipWriter};
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
    // Get project info
    let project = get_project(conn, project_id)?;
    let project_title = project.title.clone();

    // Collect all data
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

    // Create manifest
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

    // Create zip file in temp directory
    let timestamp = Utc::now().format("%Y%m%d-%H%M%S");
    let slug = sanitize_slug(&project_title);
    let filename = format!("{}_{}.lyrlytic.zip", slug, timestamp);
    let temp_dir = std::env::temp_dir();
    let zip_path = temp_dir.join(&filename);

    // Create zip file
    let file = std::fs::File::create(&zip_path)
        .map_err(|e| AppError::Other(format!("Failed to create zip file: {}", e)))?;
    let mut zip = ZipWriter::new(file);
    let options = SimpleFileOptions::default().compression_method(CompressionMethod::Stored);

    // Add manifest.json
    add_json_file(&mut zip, "manifest.json", &manifest)?;

    // Add project.json
    add_json_file(&mut zip, "project.json", &project)?;

    // Add project_tags.json
    add_json_file(&mut zip, "project_tags.json", &project_tags)?;

    // Add working-draft.json
    if let Some(draft) = &working_draft {
        add_json_file(&mut zip, "working-draft.json", draft)?;
    }

    // Add draft-sections.json
    add_json_file(&mut zip, "draft_sections.json", &draft_sections)?;

    // Add style-profile.json
    if let Some(profile) = &style_profile {
        add_json_file(&mut zip, "style-profile.json", profile)?;
    }

    // Add lyric-versions.json
    add_json_file(&mut zip, "lyric-versions.json", &lyric_versions)?;

    // Add version-sections.json
    add_json_file(&mut zip, "version-sections.json", &version_sections)?;

    // Add revision-notes.json
    add_json_file(&mut zip, "revision-notes.json", &revision_notes)?;

    // Add song-artifacts.json
    add_json_file(&mut zip, "song-artifacts.json", &song_artifacts)?;

    // Add collected-fragments.json
    add_json_file(&mut zip, "collected-fragments.json", &collected_fragments)?;

    // Add fragment_tags.json
    add_json_file(&mut zip, "fragment_tags.json", &fragment_tags)?;

    // Add texts/
    zip.add_directory("texts/", options)
        .map_err(|e| AppError::Other(format!("Failed to add texts directory: {}", e)))?;

    // Add working-draft.txt
    if let Some(draft) = &working_draft {
        add_text_file(&mut zip, "texts/working-draft.txt", &draft.latest_body_text)?;
    }

    // Add texts/versions/ directory
    zip.add_directory("texts/versions/", options)
        .map_err(|e| AppError::Other(format!("Failed to add versions directory: {}", e)))?;

    // Add each version's text file
    for version in &lyric_versions {
        let version_filename = format!("texts/versions/{}.txt", version.lyric_version_id);
        add_text_file(&mut zip, &version_filename, &version.body_text)?;
    }

    // Finish zip
    zip.finish()
        .map_err(|e| AppError::Other(format!("Failed to finalize zip: {}", e)))?;

    // Return path as string
    Ok(zip_path.to_string_lossy().to_string())
}

fn add_json_file<T: serde::Serialize>(zip: &mut ZipWriter<std::fs::File>, name: &str, data: &T) -> AppResult<()> {
    let json = serde_json::to_string_pretty(data)
        .map_err(|e| AppError::Other(format!("JSON serialization failed: {}", e)))?;

    let options = SimpleFileOptions::default().compression_method(CompressionMethod::Stored);
    zip.start_file(name, options)
        .map_err(|e| AppError::Other(format!("Failed to add file {}: {}", name, e)))?;
    zip.write_all(json.as_bytes())
        .map_err(|e| AppError::Other(format!("Failed to write {}: {}", name, e)))?;

    Ok(())
}

fn add_text_file(zip: &mut ZipWriter<std::fs::File>, name: &str, content: &str) -> AppResult<()> {
    let options = SimpleFileOptions::default().compression_method(CompressionMethod::Stored);
    zip.start_file(name, options)
        .map_err(|e| AppError::Other(format!("Failed to add file {}: {}", name, e)))?;
    zip.write_all(content.as_bytes())
        .map_err(|e| AppError::Other(format!("Failed to write {}: {}", name, e)))?;

    Ok(())
}

fn sanitize_slug(title: &str) -> String {
    title
        .chars()
        .map(|c| if c.is_alphanumeric() { c } else { '-' })
        .collect::<String>()
        .to_lowercase()
}

// Data fetching functions

#[derive(serde::Serialize)]
struct ProjectExport {
    project_id: String,
    title: String,
    theme: Option<String>,
    memo: Option<String>,
    created_at: String,
    updated_at: String,
}

fn get_project(conn: &Connection, project_id: &str) -> AppResult<ProjectExport> {
    let project = conn.query_row(
        "SELECT project_id, title, theme, memo, created_at, updated_at FROM projects WHERE project_id = ?1",
        params![project_id],
        |row| Ok(ProjectExport {
            project_id: row.get(0)?,
            title: row.get(1)?,
            theme: row.get(2)?,
            memo: row.get(3)?,
            created_at: row.get(4)?,
            updated_at: row.get(5)?,
        }),
    ).map_err(|_| AppError::NotFound(format!("Project not found: {}", project_id)))?;
    Ok(project)
}

#[derive(serde::Serialize)]
struct WorkingDraftExport {
    working_draft_id: String,
    project_id: String,
    latest_body_text: String,
    updated_at: String,
}

fn get_working_draft(conn: &Connection, project_id: &str) -> AppResult<Option<WorkingDraftExport>> {
    let result = conn.query_row(
        "SELECT working_draft_id, project_id, latest_body_text, updated_at FROM working_drafts WHERE project_id = ?1 AND deleted_at IS NULL",
        params![project_id],
        |row| Ok(WorkingDraftExport {
            working_draft_id: row.get(0)?,
            project_id: row.get(1)?,
            latest_body_text: row.get(2)?,
            updated_at: row.get(3)?,
        }),
    );

    match result {
        Ok(draft) => Ok(Some(draft)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(AppError::Other(format!("Failed to get working draft: {}", e))),
    }
}

#[derive(serde::Serialize)]
struct StyleProfileExport {
    style_profile_id: String,
    project_id: String,
    tone: Option<String>,
    vocabulary_bias: Option<String>,
    taboo_words: Option<String>,
    structure_preference: Option<String>,
    memo: Option<String>,
    created_at: String,
    updated_at: String,
}

fn get_style_profile(conn: &Connection, project_id: &str) -> AppResult<Option<StyleProfileExport>> {
    let result = conn.query_row(
        "SELECT style_profile_id, project_id, tone, vocabulary_bias, taboo_words, structure_preference, memo, created_at, updated_at FROM style_profiles WHERE project_id = ?1 AND deleted_at IS NULL",
        params![project_id],
        |row| Ok(StyleProfileExport {
            style_profile_id: row.get(0)?,
            project_id: row.get(1)?,
            tone: row.get(2)?,
            vocabulary_bias: row.get(3)?,
            taboo_words: row.get(4)?,
            structure_preference: row.get(5)?,
            memo: row.get(6)?,
            created_at: row.get(7)?,
            updated_at: row.get(8)?,
        }),
    );

    match result {
        Ok(profile) => Ok(Some(profile)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(AppError::Other(format!("Failed to get style profile: {}", e))),
    }
}

fn get_project_tags(conn: &Connection, project_id: &str) -> AppResult<Vec<String>> {
    let mut stmt = conn.prepare(
        "SELECT tag FROM project_tags WHERE project_id = ?1 ORDER BY tag"
    )?;

    let tags = stmt.query_map(params![project_id], |row| row.get(0))?
        .collect::<std::result::Result<Vec<_>, _>>()?;

    Ok(tags)
}

#[derive(serde::Serialize)]
struct DraftSectionExport {
    draft_section_id: String,
    working_draft_id: String,
    section_type: Option<String>,
    display_name: String,
    sort_order: i32,
    body_text: String,
}

fn get_draft_sections(conn: &Connection, project_id: &str, include_deleted: bool) -> AppResult<Vec<DraftSectionExport>> {
    let deleted_filter = if include_deleted { "" } else { "AND deleted_at IS NULL" };
    let sql = format!(
        "SELECT ds.draft_section_id, ds.working_draft_id, ds.section_type, ds.display_name, ds.sort_order, ds.body_text
         FROM draft_sections ds
         JOIN working_drafts wd ON ds.working_draft_id = wd.working_draft_id
         WHERE wd.project_id = ?1 {} ORDER BY ds.sort_order",
        deleted_filter
    );

    let mut stmt = conn.prepare(&sql)?;

    let sections = stmt.query_map(params![project_id], |row| Ok(DraftSectionExport {
        draft_section_id: row.get(0)?,
        working_draft_id: row.get(1)?,
        section_type: row.get(2)?,
        display_name: row.get(3)?,
        sort_order: row.get(4)?,
        body_text: row.get(5)?,
    }))?
    .collect::<std::result::Result<Vec<_>, _>>()?;

    Ok(sections)
}

#[derive(serde::Serialize)]
struct LyricVersionExport {
    lyric_version_id: String,
    project_id: String,
    snapshot_name: String,
    body_text: String,
    parent_lyric_version_id: Option<String>,
    note: Option<String>,
    created_at: String,
}

fn get_lyric_versions(conn: &Connection, project_id: &str, include_deleted: bool) -> AppResult<Vec<LyricVersionExport>> {
    let deleted_filter = if include_deleted { "" } else { "AND deleted_at IS NULL" };
    let sql = format!(
        "SELECT lyric_version_id, project_id, snapshot_name, body_text, parent_lyric_version_id, note, created_at
         FROM lyric_versions WHERE project_id = ?1 {} ORDER BY created_at DESC",
        deleted_filter
    );

    let mut stmt = conn.prepare(&sql)?;

    let versions = stmt.query_map(params![project_id], |row| Ok(LyricVersionExport {
        lyric_version_id: row.get(0)?,
        project_id: row.get(1)?,
        snapshot_name: row.get(2)?,
        body_text: row.get(3)?,
        parent_lyric_version_id: row.get(4)?,
        note: row.get(5)?,
        created_at: row.get(6)?,
    }))?
    .collect::<std::result::Result<Vec<_>, _>>()?;

    Ok(versions)
}

#[derive(serde::Serialize)]
struct VersionSectionExport {
    version_section_id: String,
    lyric_version_id: String,
    section_type: Option<String>,
    display_name: String,
    sort_order: i32,
    body_text: String,
}

fn get_version_sections(conn: &Connection, project_id: &str, include_deleted: bool) -> AppResult<Vec<VersionSectionExport>> {
    let deleted_filter = if include_deleted { "" } else { "AND vs.deleted_at IS NULL" };
    let sql = format!(
        "SELECT vs.version_section_id, vs.lyric_version_id, vs.section_type, vs.display_name, vs.sort_order, vs.body_text
         FROM version_sections vs
         JOIN lyric_versions lv ON vs.lyric_version_id = lv.lyric_version_id
         WHERE lv.project_id = ?1 {} ORDER BY vs.sort_order",
        deleted_filter
    );

    let mut stmt = conn.prepare(&sql)?;

    let sections = stmt.query_map(params![project_id], |row| Ok(VersionSectionExport {
        version_section_id: row.get(0)?,
        lyric_version_id: row.get(1)?,
        section_type: row.get(2)?,
        display_name: row.get(3)?,
        sort_order: row.get(4)?,
        body_text: row.get(5)?,
    }))?
    .collect::<std::result::Result<Vec<_>, _>>()?;

    Ok(sections)
}

#[derive(serde::Serialize)]
struct RevisionNoteExport {
    revision_note_id: String,
    lyric_version_id: String,
    version_section_id: String,
    range_start: Option<i32>,
    range_end: Option<i32>,
    note_type: String,
    comment: String,
    created_at: String,
}

fn get_revision_notes(conn: &Connection, project_id: &str, include_deleted: bool) -> AppResult<Vec<RevisionNoteExport>> {
    let deleted_filter = if include_deleted { "" } else { "AND rn.deleted_at IS NULL" };
    let sql = format!(
        "SELECT rn.revision_note_id, rn.lyric_version_id, rn.version_section_id, rn.range_start, rn.range_end, rn.note_type, rn.comment, rn.created_at
         FROM revision_notes rn
         JOIN lyric_versions lv ON rn.lyric_version_id = lv.lyric_version_id
         WHERE lv.project_id = ?1 {} ORDER BY rn.created_at DESC",
        deleted_filter
    );

    let mut stmt = conn.prepare(&sql)?;

    let notes = stmt.query_map(params![project_id], |row| Ok(RevisionNoteExport {
        revision_note_id: row.get(0)?,
        lyric_version_id: row.get(1)?,
        version_section_id: row.get(2)?,
        range_start: row.get(3)?,
        range_end: row.get(4)?,
        note_type: row.get(5)?,
        comment: row.get(6)?,
        created_at: row.get(7)?,
    }))?
    .collect::<std::result::Result<Vec<_>, _>>()?;

    Ok(notes)
}

#[derive(serde::Serialize)]
struct SongArtifactExport {
    song_artifact_id: String,
    project_id: String,
    lyric_version_id: String,
    service_name: String,
    song_title: Option<String>,
    source_url: Option<String>,
    source_file_path: Option<String>,
    prompt_memo: Option<String>,
    style_memo: Option<String>,
    evaluation_memo: Option<String>,
    created_at: String,
}

fn get_song_artifacts(conn: &Connection, project_id: &str, include_deleted: bool) -> AppResult<Vec<SongArtifactExport>> {
    let deleted_filter = if include_deleted { "" } else { "AND deleted_at IS NULL" };
    let sql = format!(
        "SELECT song_artifact_id, project_id, lyric_version_id, service_name, song_title, source_url, source_file_path, prompt_memo, style_memo, evaluation_memo, created_at
         FROM song_artifacts WHERE project_id = ?1 {} ORDER BY created_at DESC",
        deleted_filter
    );

    let mut stmt = conn.prepare(&sql)?;

    let artifacts = stmt.query_map(params![project_id], |row| Ok(SongArtifactExport {
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
    }))?
    .collect::<std::result::Result<Vec<_>, _>>()?;

    Ok(artifacts)
}

#[derive(serde::Serialize)]
struct CollectedFragmentExport {
    collected_fragment_id: String,
    project_id: String,
    text: String,
    source: Option<String>,
    status: String,
    created_at: String,
}

fn get_collected_fragments(conn: &Connection, project_id: &str, include_deleted: bool) -> AppResult<Vec<CollectedFragmentExport>> {
    let deleted_filter = if include_deleted { "" } else { "AND deleted_at IS NULL" };
    let sql = format!(
        "SELECT collected_fragment_id, project_id, text, source, status, created_at
         FROM collected_fragments WHERE project_id = ?1 {} ORDER BY created_at DESC",
        deleted_filter
    );

    let mut stmt = conn.prepare(&sql)?;

    let fragments = stmt.query_map(params![project_id], |row| Ok(CollectedFragmentExport {
        collected_fragment_id: row.get(0)?,
        project_id: row.get(1)?,
        text: row.get(2)?,
        source: row.get(3)?,
        status: row.get(4)?,
        created_at: row.get(5)?,
    }))?
    .collect::<std::result::Result<Vec<_>, _>>()?;

    Ok(fragments)
}

#[derive(serde::Serialize)]
struct FragmentTagExport {
    collected_fragment_id: String,
    tag: String,
}

fn get_fragment_tags(conn: &Connection, project_id: &str) -> AppResult<Vec<FragmentTagExport>> {
    let mut stmt = conn.prepare(
        "SELECT ft.collected_fragment_id, ft.tag
         FROM fragment_tags ft
         JOIN collected_fragments cf ON ft.collected_fragment_id = cf.collected_fragment_id
         WHERE cf.project_id = ?1 AND cf.deleted_at IS NULL
         ORDER BY ft.tag"
    )?;

    let tags = stmt.query_map(params![project_id], |row| Ok(FragmentTagExport {
        collected_fragment_id: row.get(0)?,
        tag: row.get(1)?,
    }))?
    .collect::<std::result::Result<Vec<_>, _>>()?;

    Ok(tags)
}