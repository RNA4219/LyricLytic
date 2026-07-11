mod sudachi_adapter;

use crate::error::{AppError, AppResult};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RhymeGuideRowDto {
    pub line: String,
    pub romanized_text: String,
    pub vowel_text: String,
    pub consonant_text: String,
    pub source: String,
}

#[tauri::command]
pub fn analyze_rhyme_text(app: AppHandle, text: String) -> AppResult<Vec<RhymeGuideRowDto>> {
    if text.trim().is_empty() {
        return Ok(Vec::new());
    }
    let resource_dir = app
        .path()
        .resource_dir()
        .map_err(|error| AppError::Other(format!("Resource directory unavailable: {error}")))?
        .join("sudachi");
    sudachi_adapter::analyze(&resource_dir, &text)
}
