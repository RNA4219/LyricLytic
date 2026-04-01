use rusqlite::Connection;
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

const MIGRATIONS: &[(&str, &str)] = &[
    ("001_init.sql", include_str!("../migrations/001_init.sql")),
    ("002_add_style_vocal.sql", include_str!("../migrations/002_add_style_vocal.sql")),
    ("003_add_version_style_vocal.sql", include_str!("../migrations/003_add_version_style_vocal.sql")),
    ("004_add_version_bpm.sql", include_str!("../migrations/004_add_version_bpm.sql")),
    ("005_add_working_draft_bpm.sql", include_str!("../migrations/005_add_working_draft_bpm.sql")),
];

pub fn get_db_path(app: &AppHandle) -> PathBuf {
    let app_data_dir = app.path().app_data_dir().expect("Failed to get app data dir");
    fs::create_dir_all(&app_data_dir).ok();
    app_data_dir.join("lyriclytic.db")
}

pub fn init_database(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let db_path = get_db_path(app);
    let mut conn = Connection::open(&db_path)?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS schema_migrations (
            name TEXT PRIMARY KEY,
            applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    )?;

    let tx = conn.transaction()?;
    for (name, sql) in MIGRATIONS {
        let already_applied = tx.query_row(
            "SELECT 1 FROM schema_migrations WHERE name = ?1 LIMIT 1",
            [name],
            |_| Ok(()),
        );

        if already_applied.is_ok() {
            continue;
        }

        tx.execute_batch(sql)?;
        tx.execute(
            "INSERT INTO schema_migrations (name) VALUES (?1)",
            [name],
        )?;
    }
    tx.commit()?;

    Ok(())
}

pub fn get_connection(app: &AppHandle) -> Result<Connection, rusqlite::Error> {
    let db_path = get_db_path(app);
    Connection::open(&db_path)
}
