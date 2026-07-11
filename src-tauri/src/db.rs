use crate::error::{AppError, AppResult};
use chrono::Utc;
use rusqlite::{backup::Backup, Connection, OpenFlags, OptionalExtension};
use std::fs;
use std::path::{Path, PathBuf};
use std::time::Duration;
use tauri::{AppHandle, Manager};

pub(crate) const MIGRATIONS: &[(&str, &str)] = &[
    ("001_init.sql", include_str!("../migrations/001_init.sql")),
    (
        "002_add_style_vocal.sql",
        include_str!("../migrations/002_add_style_vocal.sql"),
    ),
    (
        "003_add_version_style_vocal.sql",
        include_str!("../migrations/003_add_version_style_vocal.sql"),
    ),
    (
        "004_add_version_bpm.sql",
        include_str!("../migrations/004_add_version_bpm.sql"),
    ),
    (
        "005_add_working_draft_bpm.sql",
        include_str!("../migrations/005_add_working_draft_bpm.sql"),
    ),
];

pub fn get_db_path(app: &AppHandle) -> PathBuf {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .expect("Failed to get app data dir");
    fs::create_dir_all(&app_data_dir).ok();
    app_data_dir.join("lyriclytic.db")
}

fn configure_connection(conn: &Connection) -> AppResult<()> {
    conn.busy_timeout(Duration::from_secs(5))?;
    conn.execute_batch(
        "PRAGMA foreign_keys = ON;
         PRAGMA journal_mode = WAL;
         PRAGMA synchronous = NORMAL;",
    )?;

    let foreign_keys_enabled: i64 = conn.query_row("PRAGMA foreign_keys", [], |row| row.get(0))?;
    if foreign_keys_enabled != 1 {
        return Err(AppError::DatabaseIntegrity(
            "SQLite foreign key enforcement could not be enabled".into(),
        ));
    }

    Ok(())
}

fn backup_existing_database(conn: &Connection, db_path: &Path) -> AppResult<Option<PathBuf>> {
    if !db_path.is_file() || fs::metadata(db_path)?.len() == 0 {
        return Ok(None);
    }

    let file_name = db_path
        .file_name()
        .and_then(|value| value.to_str())
        .unwrap_or("lyriclytic.db");
    let backup_path = db_path.with_file_name(format!(
        "{file_name}.backup-{}",
        Utc::now().format("%Y%m%d-%H%M%S-%3f")
    ));
    let mut destination = Connection::open(&backup_path)?;
    {
        let backup = Backup::new(conn, &mut destination)?;
        backup.run_to_completion(64, Duration::from_millis(10), None)?;
    }
    drop(destination);

    let parent = db_path.parent().ok_or_else(|| {
        AppError::DatabaseIntegrity("Database path has no parent directory".into())
    })?;
    let prefix = format!("{file_name}.backup-");
    let mut backups = fs::read_dir(parent)?
        .filter_map(Result::ok)
        .map(|entry| entry.path())
        .filter(|path| {
            path.file_name()
                .and_then(|value| value.to_str())
                .is_some_and(|name| name.starts_with(&prefix))
        })
        .collect::<Vec<_>>();
    backups.sort();
    while backups.len() > 3 {
        let stale = backups.remove(0);
        fs::remove_file(stale)?;
    }

    Ok(Some(backup_path))
}

fn verify_foreign_key_integrity(conn: &Connection, backup_path: Option<&PathBuf>) -> AppResult<()> {
    let violation = conn
        .query_row(
            "SELECT \"table\", rowid, parent, fkid FROM pragma_foreign_key_check LIMIT 1",
            [],
            |row| {
                Ok((
                    row.get::<_, String>(0)?,
                    row.get::<_, i64>(1)?,
                    row.get::<_, String>(2)?,
                    row.get::<_, i64>(3)?,
                ))
            },
        )
        .optional()?;

    if let Some((table, row_id, parent, foreign_key_id)) = violation {
        let backup = backup_path
            .map(|path| path.display().to_string())
            .unwrap_or_else(|| "not created".into());
        return Err(AppError::DatabaseIntegrity(format!(
            "Foreign key violation in {table} row {row_id} referencing {parent} (fk {foreign_key_id}). Backup: {backup}"
        )));
    }

    Ok(())
}

pub(crate) fn init_database_at_path(db_path: &Path) -> AppResult<()> {
    let existing_database = db_path.is_file() && fs::metadata(db_path)?.len() > 0;
    let backup_path = if existing_database {
        let readonly = Connection::open_with_flags(db_path, OpenFlags::SQLITE_OPEN_READ_ONLY)?;
        let backup = backup_existing_database(&readonly, db_path)?;
        verify_foreign_key_integrity(&readonly, backup.as_ref())?;
        backup
    } else {
        None
    };

    let mut conn = Connection::open(db_path)?;
    configure_connection(&conn)?;

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
        tx.execute("INSERT INTO schema_migrations (name) VALUES (?1)", [name])?;
    }
    tx.commit()?;

    verify_foreign_key_integrity(&conn, backup_path.as_ref())?;
    Ok(())
}

pub fn init_database(app: &AppHandle) -> AppResult<()> {
    let db_path = get_db_path(app);
    init_database_at_path(&db_path)
}

pub fn get_connection(app: &AppHandle) -> AppResult<Connection> {
    let db_path = get_db_path(app);
    let conn = Connection::open(&db_path)?;
    configure_connection(&conn)?;
    Ok(conn)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::{SystemTime, UNIX_EPOCH};

    fn temp_path(label: &str) -> PathBuf {
        let nonce = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("clock")
            .as_nanos();
        std::env::temp_dir().join(format!(
            "lyriclytic-{label}-{}-{nonce}.db",
            std::process::id()
        ))
    }

    fn cleanup(path: &Path) {
        let _ = fs::remove_file(path);
        if let Some(parent) = path.parent() {
            let stem = path
                .file_name()
                .and_then(|v| v.to_str())
                .unwrap_or_default();
            let prefix = format!("{stem}.backup-");
            if let Ok(entries) = fs::read_dir(parent) {
                for entry in entries.flatten() {
                    let candidate = entry.path();
                    if candidate
                        .file_name()
                        .and_then(|v| v.to_str())
                        .is_some_and(|n| n.starts_with(&prefix))
                    {
                        let _ = fs::remove_file(candidate);
                    }
                }
            }
        }
    }

    #[test]
    fn configured_connections_enable_fk_wal_and_busy_timeout() {
        let path = temp_path("pragmas");
        let conn = Connection::open(&path).expect("open");
        configure_connection(&conn).expect("configure");
        assert_eq!(
            conn.query_row("PRAGMA foreign_keys", [], |row| row.get::<_, i64>(0))
                .unwrap(),
            1
        );
        assert_eq!(
            conn.query_row("PRAGMA journal_mode", [], |row| row.get::<_, String>(0))
                .unwrap()
                .to_lowercase(),
            "wal"
        );
        assert_eq!(
            conn.query_row("PRAGMA busy_timeout", [], |row| row.get::<_, i64>(0))
                .unwrap(),
            5000
        );
        drop(conn);
        cleanup(&path);
    }

    #[test]
    fn invalid_foreign_key_database_is_not_modified_and_backup_is_reported() {
        let path = temp_path("invalid-fk");
        let conn = Connection::open(&path).expect("open");
        conn.execute_batch(
            "PRAGMA foreign_keys=OFF;
             CREATE TABLE parent(id INTEGER PRIMARY KEY);
             CREATE TABLE child(id INTEGER PRIMARY KEY, parent_id INTEGER REFERENCES parent(id));
             INSERT INTO child(id, parent_id) VALUES (1, 999);",
        )
        .expect("fixture");
        drop(conn);
        let before = fs::read(&path).expect("read before");
        let error = init_database_at_path(&path).expect_err("invalid FK must stop startup");
        assert!(
            matches!(error, AppError::DatabaseIntegrity(message) if message.contains("Backup:"))
        );
        assert_eq!(before, fs::read(&path).expect("read after"));
        let prefix = format!("{}.backup-", path.file_name().unwrap().to_string_lossy());
        let backups = fs::read_dir(path.parent().unwrap())
            .unwrap()
            .filter_map(Result::ok)
            .filter(|entry| entry.file_name().to_string_lossy().starts_with(&prefix))
            .count();
        assert_eq!(backups, 1);
        cleanup(&path);
    }

    #[test]
    fn backup_retention_keeps_three_generations() {
        let path = temp_path("retention");
        Connection::open(&path)
            .expect("open")
            .execute_batch("CREATE TABLE sample(id INTEGER PRIMARY KEY);")
            .unwrap();
        for _ in 0..4 {
            let conn = Connection::open(&path).unwrap();
            backup_existing_database(&conn, &path).unwrap();
            drop(conn);
            std::thread::sleep(Duration::from_millis(2));
        }
        let prefix = format!("{}.backup-", path.file_name().unwrap().to_string_lossy());
        let count = fs::read_dir(path.parent().unwrap())
            .unwrap()
            .filter_map(Result::ok)
            .filter(|entry| entry.file_name().to_string_lossy().starts_with(&prefix))
            .count();
        assert_eq!(count, 3);
        cleanup(&path);
    }
}
