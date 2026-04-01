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
        .plugin(tauri_plugin_dialog::init())
        .manage(commands::llm_runtime::LlamaCppRuntimeState::default())
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
            commands::version::get_version_sections,
            commands::version::delete_version,
            commands::version::get_deleted_versions,
            commands::version::restore_version,
            commands::fragment::get_fragments,
            commands::fragment::create_fragment,
            commands::fragment::update_fragment,
            commands::fragment::delete_fragment,
            commands::song_artifact::get_song_artifacts,
            commands::song_artifact::create_song_artifact,
            commands::song_artifact::delete_song_artifact,
            commands::revision_note::get_revision_notes,
            commands::revision_note::create_revision_note,
            commands::revision_note::delete_revision_note,
            commands::style_profile::get_style_profile,
            commands::style_profile::create_style_profile,
            commands::style_profile::update_style_profile,
            commands::style_profile::delete_style_profile,
            commands::export::export_project,
            commands::llm_runtime::get_llama_cpp_runtime_status,
            commands::llm_runtime::detect_llama_cpp_executable,
            commands::llm_runtime::start_llama_cpp_runtime,
            commands::llm_runtime::stop_llama_cpp_runtime,
            commands::rhyme::analyze_rhyme_text,
            commands::trash::get_deleted_items,
            commands::trash::restore_fragment,
            commands::trash::restore_song_artifact,
            commands::trash::restore_style_profile,
            commands::trash::permanently_delete_project,
            commands::trash::permanently_delete_version,
            commands::trash::permanently_delete_fragment,
            commands::trash::permanently_delete_song_artifact,
            commands::trash::permanently_delete_style_profile,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
