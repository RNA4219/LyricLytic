use rusqlite::Connection;
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

pub fn get_db_path(app: &AppHandle) -> PathBuf {
    let app_data_dir = app.path().app_data_dir().expect("Failed to get app data dir");
    fs::create_dir_all(&app_data_dir).ok();
    app_data_dir.join("lyriclytic.db")
}

pub fn init_database(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let db_path = get_db_path(app);
    let conn = Connection::open(&db_path)?;

    conn.execute_batch(include_str!("../migrations/001_init.sql"))?;

    Ok(())
}

pub fn get_connection(app: &AppHandle) -> Result<Connection, rusqlite::Error> {
    let db_path = get_db_path(app);
    Connection::open(&db_path)
}