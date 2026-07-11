use crate::error::{AppError, AppResult};
use rusqlite::Connection;

use super::{get_lyric_versions, get_project, get_working_draft};

pub fn export_quick(
    conn: &Connection,
    project_id: &str,
    format: &str,
    destination_path: &str,
) -> AppResult<String> {
    let project = get_project(conn, project_id)?;
    let draft = get_working_draft(conn, project_id)?;
    let versions = get_lyric_versions(conn, project_id, false)?;
    let body = draft
        .as_ref()
        .map(|value| value.latest_body_text.as_str())
        .unwrap_or("");

    let content = match format {
        "txt" => format!("[{}]\n\n{}", project.title, body),
        "markdown" | "md" => {
            let mut text = format!("# {}\n\n", project.title);
            if let Some(theme) = &project.theme {
                text.push_str(&format!("**Theme:** {}\n\n", theme));
            }
            if let Some(memo) = &project.memo {
                text.push_str(&format!("**Memo:** {}\n\n", memo));
            }
            text.push_str(&format!("---\n\n## Working Draft\n\n{}\n\n", body));
            if !versions.is_empty() {
                text.push_str("---\n\n## Version History\n\n");
                for version in &versions {
                    text.push_str(&format!("### {}\n\n", version.snapshot_name));
                    if let Some(note) = &version.note {
                        text.push_str(&format!("*Note: {}*\n\n", note));
                    }
                    text.push_str(&version.body_text);
                    text.push_str("\n\n");
                }
            }
            text
        }
        "json" => serde_json::to_string_pretty(&serde_json::json!({
            "project": project,
            "working_draft": body,
            "versions": versions,
        }))
        .map_err(|error| AppError::Other(format!("JSON serialization failed: {error}")))?,
        value => {
            return Err(AppError::Validation(format!(
                "Unsupported quick export format: {value}"
            )))
        }
    };

    std::fs::write(destination_path, content)?;
    Ok(destination_path.to_string())
}
