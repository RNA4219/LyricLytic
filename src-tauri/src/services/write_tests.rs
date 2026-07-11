use super::write;
use crate::error::AppError;
use crate::models::{
    CreateFragmentInput, CreateProjectInput, CreateVersionInput, DraftSectionInput, SaveDraftInput,
    VersionSectionInput,
};
use rusqlite::{types::ValueRef, Connection};

fn connection() -> Connection {
    let conn = Connection::open_in_memory().expect("open test database");
    conn.execute_batch("PRAGMA foreign_keys = ON;")
        .expect("enable foreign keys");
    for (_, migration) in crate::db::MIGRATIONS {
        conn.execute_batch(migration).expect("apply migration");
    }
    conn
}

fn project_input(title: &str) -> CreateProjectInput {
    CreateProjectInput {
        title: title.to_string(),
        theme: Some("theme".to_string()),
        memo: Some("memo".to_string()),
    }
}

fn section(id: &str, body: &str, sort_order: i32) -> DraftSectionInput {
    DraftSectionInput {
        draft_section_id: Some(id.to_string()),
        section_type: Some("Verse".to_string()),
        display_name: format!("Verse {sort_order}"),
        sort_order,
        body_text: body.to_string(),
    }
}

fn save_input(project_id: &str, sections: Vec<DraftSectionInput>) -> SaveDraftInput {
    SaveDraftInput {
        project_id: project_id.to_string(),
        body_text: "latest body".to_string(),
        sections,
        bpm: Some(128),
        style_text: Some("city pop".to_string()),
        vocal_text: Some("soft vocal".to_string()),
    }
}

fn version_input(project_id: &str, parent_lyric_version_id: Option<String>) -> CreateVersionInput {
    CreateVersionInput {
        project_id: project_id.to_string(),
        snapshot_name: "snapshot".to_string(),
        body_text: "version body".to_string(),
        bpm: Some(128),
        style_text: Some("city pop".to_string()),
        vocal_text: Some("soft vocal".to_string()),
        note: Some("note".to_string()),
        parent_lyric_version_id,
        sections: vec![
            VersionSectionInput {
                section_type: Some("Verse".to_string()),
                display_name: "First".to_string(),
                sort_order: 0,
                body_text: "first".to_string(),
            },
            VersionSectionInput {
                section_type: Some("Chorus".to_string()),
                display_name: "Fail".to_string(),
                sort_order: 1,
                body_text: "fail".to_string(),
            },
        ],
    }
}

fn value(value: ValueRef<'_>) -> String {
    match value {
        ValueRef::Null => "NULL".to_string(),
        ValueRef::Integer(value) => format!("I:{value}"),
        ValueRef::Real(value) => format!("R:{value}"),
        ValueRef::Text(value) => format!("T:{}", String::from_utf8_lossy(value)),
        ValueRef::Blob(value) => format!("B:{value:?}"),
    }
}

fn snapshot(conn: &Connection) -> String {
    const TABLES: &[&str] = &[
        "projects",
        "project_tags",
        "style_profiles",
        "style_profile_tags",
        "working_drafts",
        "draft_sections",
        "lyric_versions",
        "version_sections",
        "revision_notes",
        "song_artifacts",
        "collected_fragments",
        "fragment_tags",
    ];
    let mut output = String::new();
    for table in TABLES {
        output.push_str(table);
        output.push('\n');
        let mut statement = conn
            .prepare(&format!("SELECT * FROM {table} ORDER BY rowid"))
            .expect("prepare snapshot");
        let columns = statement.column_count();
        let mut rows = statement.query([]).expect("query snapshot");
        while let Some(row) = rows.next().expect("next snapshot row") {
            for index in 0..columns {
                output.push_str(&value(row.get_ref(index).expect("snapshot value")));
                output.push('|');
            }
            output.push('\n');
        }
    }
    output
}

#[test]
fn project_creation_is_atomic_when_default_draft_insert_fails() {
    let mut conn = connection();
    let before = snapshot(&conn);
    conn.execute_batch(
        "CREATE TRIGGER fail_default_draft BEFORE INSERT ON working_drafts
         BEGIN SELECT RAISE(ABORT, 'injected default draft failure'); END;",
    )
    .expect("install failure trigger");

    assert!(write::create_project(&mut conn, project_input("atomic project")).is_err());
    assert_eq!(snapshot(&conn), before);
}

#[test]
fn draft_save_is_atomic_and_rejects_cross_draft_section_ids() {
    let mut conn = connection();
    let first = write::create_project(&mut conn, project_input("first")).expect("project");
    write::save_draft(
        &mut conn,
        save_input(
            &first.project_id,
            vec![section("stable-section", "before", 0)],
        ),
    )
    .expect("baseline draft");
    let before = snapshot(&conn);
    conn.execute_batch(
        "CREATE TRIGGER fail_second_section BEFORE INSERT ON draft_sections
         WHEN NEW.draft_section_id = 'failing-section'
         BEGIN SELECT RAISE(ABORT, 'injected draft section failure'); END;",
    )
    .expect("install failure trigger");

    assert!(write::save_draft(
        &mut conn,
        save_input(
            &first.project_id,
            vec![
                section("stable-section", "after", 0),
                section("failing-section", "new", 1)
            ],
        ),
    )
    .is_err());
    assert_eq!(snapshot(&conn), before);
    conn.execute_batch("DROP TRIGGER fail_second_section")
        .expect("drop trigger");

    let second = write::create_project(&mut conn, project_input("second")).expect("second project");
    let before_cross_draft = snapshot(&conn);
    let error = write::save_draft(
        &mut conn,
        save_input(
            &second.project_id,
            vec![section("stable-section", "stolen", 0)],
        ),
    )
    .expect_err("cross-draft section id must be rejected");
    assert!(matches!(error, AppError::Validation(_)));
    assert_eq!(snapshot(&conn), before_cross_draft);
}

#[test]
fn version_creation_is_atomic_and_rejects_cross_project_parent() {
    let mut conn = connection();
    let first = write::create_project(&mut conn, project_input("first")).expect("project");
    let before = snapshot(&conn);
    conn.execute_batch(
        "CREATE TRIGGER fail_version_section BEFORE INSERT ON version_sections
         WHEN NEW.display_name = 'Fail'
         BEGIN SELECT RAISE(ABORT, 'injected version section failure'); END;",
    )
    .expect("install failure trigger");

    assert!(write::create_version(&mut conn, version_input(&first.project_id, None)).is_err());
    assert_eq!(snapshot(&conn), before);
    conn.execute_batch("DROP TRIGGER fail_version_section")
        .expect("drop trigger");

    let parent = write::create_version(&mut conn, version_input(&first.project_id, None))
        .expect("parent version");
    let second = write::create_project(&mut conn, project_input("second")).expect("second project");
    let before_cross_project = snapshot(&conn);
    let error = write::create_version(
        &mut conn,
        version_input(&second.project_id, Some(parent.lyric_version_id)),
    )
    .expect_err("parent version from another project must be rejected");
    assert!(matches!(error, AppError::Validation(_)));
    assert_eq!(snapshot(&conn), before_cross_project);
}

#[test]
fn project_delete_restore_and_hard_delete_are_atomic() {
    let mut conn = connection();
    let project = write::create_project(&mut conn, project_input("lifecycle")).expect("project");
    write::save_draft(
        &mut conn,
        save_input(
            &project.project_id,
            vec![section("lifecycle-section", "body", 0)],
        ),
    )
    .expect("draft");
    let mut valid_version = version_input(&project.project_id, None);
    valid_version.sections[1].display_name = "Second".to_string();
    write::create_version(&mut conn, valid_version).expect("version");
    let before_soft_delete = snapshot(&conn);
    conn.execute_batch(
        "CREATE TRIGGER fail_project_delete BEFORE UPDATE ON working_drafts
         WHEN NEW.deleted_at IS NOT NULL
         BEGIN SELECT RAISE(ABORT, 'injected delete failure'); END;",
    )
    .expect("install delete trigger");
    assert!(write::soft_delete_project(&mut conn, &project.project_id, "batch-a").is_err());
    assert_eq!(snapshot(&conn), before_soft_delete);
    conn.execute_batch("DROP TRIGGER fail_project_delete")
        .expect("drop trigger");

    write::soft_delete_project(&mut conn, &project.project_id, "batch-a").expect("soft delete");
    let before_restore = snapshot(&conn);
    conn.execute_batch(
        "CREATE TRIGGER fail_project_restore BEFORE UPDATE ON draft_sections
         WHEN NEW.deleted_at IS NULL
         BEGIN SELECT RAISE(ABORT, 'injected restore failure'); END;",
    )
    .expect("install restore trigger");
    assert!(write::restore_project(&mut conn, &project.project_id, "batch-a").is_err());
    assert_eq!(snapshot(&conn), before_restore);
    conn.execute_batch("DROP TRIGGER fail_project_restore")
        .expect("drop trigger");

    write::restore_project(&mut conn, &project.project_id, "batch-a").expect("restore");
    write::soft_delete_project(&mut conn, &project.project_id, "batch-b")
        .expect("soft delete again");
    let before_hard_delete = snapshot(&conn);
    conn.execute_batch(
        "CREATE TRIGGER fail_project_hard_delete BEFORE DELETE ON version_sections
         BEGIN SELECT RAISE(ABORT, 'injected hard delete failure'); END;",
    )
    .expect("install hard delete trigger");
    assert!(write::hard_delete_project(&mut conn, &project.project_id, "batch-b").is_err());
    assert_eq!(snapshot(&conn), before_hard_delete);
}

#[test]
fn fragment_tag_creation_is_atomic_when_one_tag_fails() {
    let mut conn = connection();
    let project = write::create_project(&mut conn, project_input("tags")).expect("project");
    let before = snapshot(&conn);
    conn.execute_batch(
        "CREATE TRIGGER fail_fragment_tag BEFORE INSERT ON fragment_tags
         WHEN NEW.tag = 'fail'
         BEGIN SELECT RAISE(ABORT, 'injected fragment tag failure'); END;",
    )
    .expect("install tag trigger");
    let error = write::create_fragment(
        &mut conn,
        CreateFragmentInput {
            project_id: project.project_id,
            text: "fragment".to_string(),
            source: Some("test".to_string()),
            tags: Some(vec!["ok".to_string(), "fail".to_string()]),
        },
    )
    .expect_err("second tag should fail");
    assert!(matches!(error, AppError::Database(_)));
    assert_eq!(snapshot(&conn), before);
}
