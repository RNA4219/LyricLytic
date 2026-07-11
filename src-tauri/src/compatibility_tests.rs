use crate::db;
use crate::models::{DraftSectionInput, SaveDraftInput};
use crate::repositories::{draft_repo, export_repo};
use crate::services::write;
use rusqlite::Connection;
use sha2::{Digest, Sha256};
use std::collections::BTreeMap;
use std::fs;
use std::io::Read;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};
use zip::ZipArchive;

const FIXTURE_ROOT: &str = concat!(env!("CARGO_MANIFEST_DIR"), "/tests/fixtures/v1.1.0");

fn fixture(name: &str) -> PathBuf {
    Path::new(FIXTURE_ROOT).join(name)
}

fn sha256(path: &Path) -> String {
    let bytes = fs::read(path).expect("read fixture");
    format!("{:X}", Sha256::digest(bytes))
}

fn expected_hashes() -> BTreeMap<String, String> {
    fs::read_to_string(fixture("SHA256SUMS"))
        .expect("read SHA256SUMS")
        .lines()
        .map(|line| {
            let (hash, name) = line.split_once(" *").expect("checksum format");
            (name.to_string(), hash.to_string())
        })
        .collect()
}

fn temp_path(label: &str, extension: &str) -> PathBuf {
    let nonce = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("clock")
        .as_nanos();
    std::env::temp_dir().join(format!(
        "lyriclytic-v11-{label}-{}-{nonce}.{extension}",
        std::process::id()
    ))
}

fn db_copy(label: &str) -> PathBuf {
    let path = temp_path(label, "db");
    fs::copy(fixture("lyriclytic-v1.1.0.db"), &path).expect("copy fixture DB");
    path
}

fn cleanup_db(path: &Path) {
    let _ = fs::remove_file(path);
    let _ = fs::remove_file(path.with_extension("db-shm"));
    let _ = fs::remove_file(path.with_extension("db-wal"));
    let prefix = format!(
        "{}.backup-",
        path.file_name().expect("file name").to_string_lossy()
    );
    if let Some(parent) = path.parent() {
        if let Ok(entries) = fs::read_dir(parent) {
            for entry in entries.flatten() {
                if entry.file_name().to_string_lossy().starts_with(&prefix) {
                    let _ = fs::remove_file(entry.path());
                }
            }
        }
    }
}

fn archive_names(path: &Path) -> Vec<String> {
    let file = fs::File::open(path).expect("open archive");
    let mut archive = ZipArchive::new(file).expect("read archive");
    (0..archive.len())
        .map(|index| archive.by_index(index).expect("entry").name().to_string())
        .collect()
}

fn archive_text(path: &Path, name: &str) -> String {
    let file = fs::File::open(path).expect("open archive");
    let mut archive = ZipArchive::new(file).expect("read archive");
    let mut entry = archive.by_name(name).expect("named entry");
    let mut content = String::new();
    entry.read_to_string(&mut content).expect("read text entry");
    content
}

#[test]
fn v1_1_fixture_hashes_are_immutable() {
    let hashes = expected_hashes();
    for name in ["lyriclytic-v1.1.0.db", "project-full.lyrlytic.zip"] {
        assert_eq!(hashes.get(name), Some(&sha256(&fixture(name))), "{name}");
    }
}

#[test]
fn v1_1_database_opens_edits_deletes_restores_and_exports() {
    let path = db_copy("database-flow");
    db::init_database_at_path(&path).expect("open v1.1 database");
    let mut conn = Connection::open(&path).expect("open migrated database");
    conn.execute_batch("PRAGMA foreign_keys = ON;")
        .expect("enable foreign keys");
    let draft = draft_repo::get_active_by_project(&conn, "v11-project")
        .expect("read draft")
        .expect("active draft");
    let sections = draft_repo::get_sections(&conn, &draft.working_draft_id).expect("read sections");
    write::save_draft(
        &mut conn,
        SaveDraftInput {
            project_id: "v11-project".to_string(),
            body_text: "[Verse]\n編集済み 😀".to_string(),
            sections: sections
                .into_iter()
                .map(|section| DraftSectionInput {
                    draft_section_id: Some(section.draft_section_id),
                    section_type: section.section_type,
                    display_name: section.display_name,
                    sort_order: section.sort_order,
                    body_text: format!("{} 編集", section.body_text),
                })
                .collect(),
            bpm: Some(130),
            style_text: Some("edited city pop".to_string()),
            vocal_text: Some("edited vocal".to_string()),
        },
    )
    .expect("edit v1.1 draft");
    write::soft_delete_project(&mut conn, "v11-project", "compat-delete")
        .expect("delete v1.1 project");
    write::restore_project(&mut conn, "v11-project", "compat-delete")
        .expect("restore v1.1 project");
    let export_path = temp_path("database-flow", "zip");
    export_repo::create_export_zip(
        &conn,
        "v11-project",
        true,
        export_path.to_str().expect("path"),
    )
    .expect("export v1.1 project");
    assert_eq!(
        serde_json::from_str::<serde_json::Value>(&archive_text(&export_path, "manifest.json"))
            .expect("manifest")["format_version"],
        "1"
    );
    drop(conn);
    let _ = fs::remove_file(export_path);
    cleanup_db(&path);
}

#[test]
fn current_export_keeps_v1_zip_entries_manifest_shape_and_texts() {
    let path = db_copy("zip-contract");
    db::init_database_at_path(&path).expect("open v1.1 database");
    let conn = Connection::open(&path).expect("open database");
    let current_export = temp_path("zip-contract", "zip");
    export_repo::create_export_zip(
        &conn,
        "v11-project",
        true,
        current_export.to_str().expect("path"),
    )
    .expect("export current v1 archive");

    let fixture_zip = fixture("project-full.lyrlytic.zip");
    let expected_names = archive_names(&fixture_zip);
    assert_eq!(archive_names(&current_export), expected_names);

    let expected_manifest: serde_json::Value =
        serde_json::from_str(&archive_text(&fixture_zip, "manifest.json"))
            .expect("fixture manifest");
    let actual_manifest: serde_json::Value =
        serde_json::from_str(&archive_text(&current_export, "manifest.json"))
            .expect("current manifest");
    let expected_keys = expected_manifest
        .as_object()
        .expect("object")
        .keys()
        .collect::<Vec<_>>();
    let actual_keys = actual_manifest
        .as_object()
        .expect("object")
        .keys()
        .collect::<Vec<_>>();
    assert_eq!(actual_keys, expected_keys);
    assert_eq!(actual_manifest["format_version"], "1");
    assert_eq!(actual_manifest["format"], "lyrlytic-project-export");

    for name in expected_names
        .iter()
        .filter(|name| name.starts_with("texts/") && !name.ends_with('/'))
    {
        assert_eq!(
            archive_text(&current_export, name),
            archive_text(&fixture_zip, name),
            "{name}"
        );
    }
    drop(conn);
    let _ = fs::remove_file(current_export);
    cleanup_db(&path);
}
