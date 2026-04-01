use crate::error::{AppError, AppResult};
use serde::{Deserialize, Serialize};
use std::io::Write;
use std::path::PathBuf;
use std::process::{Command, Stdio};

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
pub fn analyze_rhyme_text(text: String) -> AppResult<Vec<RhymeGuideRowDto>> {
    if text.trim().is_empty() {
        return Ok(Vec::new());
    }

    let script_path = rhyme_analysis_script_path();
    let output = run_python(&script_path, &text)
        .or_else(|_| run_python_launcher(&script_path, &text))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
        return Err(AppError::Other(if stderr.is_empty() {
            "Failed to analyze rhyme text with SudachiPy.".to_string()
        } else {
            format!("Failed to analyze rhyme text with SudachiPy: {stderr}")
        }));
    }

    let stdout = String::from_utf8(output.stdout)
        .map_err(|error| AppError::Other(format!("Rhyme analysis produced invalid UTF-8: {error}")))?;

    serde_json::from_str::<Vec<RhymeGuideRowDto>>(&stdout)
        .map_err(|error| AppError::Other(format!("Failed to parse rhyme analysis result: {error}")))
}

fn rhyme_analysis_script_path() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("scripts")
        .join("rhyme_analysis.py")
}

fn run_python(script_path: &PathBuf, text: &str) -> AppResult<std::process::Output> {
    let mut child = Command::new("python")
        .arg(script_path)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()?;

    if let Some(mut stdin) = child.stdin.take() {
        stdin.write_all(text.as_bytes())?;
    }

    Ok(child.wait_with_output()?)
}

fn run_python_launcher(script_path: &PathBuf, text: &str) -> AppResult<std::process::Output> {
    let mut child = Command::new("py")
        .args(["-3"])
        .arg(script_path)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()?;

    if let Some(mut stdin) = child.stdin.take() {
        stdin.write_all(text.as_bytes())?;
    }

    Ok(child.wait_with_output()?)
}
