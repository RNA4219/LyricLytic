// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod db;
mod error;
mod models;
mod repositories;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let app_handle = app.handle();
            db::init_database(&app_handle)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::project::get_projects,
            commands::project::create_project,
            commands::project::get_project,
            commands::project::update_project,
            commands::project::delete_project,
            commands::project::get_deleted_projects,
            commands::project::restore_project,
            commands::draft::get_working_draft,
            commands::draft::get_draft_sections,
            commands::draft::save_draft,
            commands::version::get_versions,
            commands::version::create_version,
            commands::version::get_version,
            commands::fragment::get_fragments,
            commands::fragment::create_fragment,
            commands::fragment::update_fragment,
            commands::fragment::delete_fragment,
            commands::song_artifact::get_song_artifacts,
            commands::song_artifact::create_song_artifact,
            commands::song_artifact::delete_song_artifact,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
