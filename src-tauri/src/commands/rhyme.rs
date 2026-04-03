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
    let output = run_python_candidates(&script_path, &text)?;

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

fn run_python_candidates(script_path: &PathBuf, text: &str) -> AppResult<std::process::Output> {
    run_python_candidates_with(script_path, text, [run_python, run_python_launcher])
}

fn run_python_candidates_with<const N: usize>(
    script_path: &PathBuf,
    text: &str,
    runners: [fn(&PathBuf, &str) -> AppResult<std::process::Output>; N],
) -> AppResult<std::process::Output> {
    let mut last_output: Option<std::process::Output> = None;

    for runner in runners {
        match runner(script_path, text) {
            Ok(output) if output.status.success() => return Ok(output),
            Ok(output) => last_output = Some(output),
            Err(_) => continue,
        }
    }

    if let Some(output) = last_output {
        return Ok(output);
    }

    run_python_launcher(script_path, text)
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

#[cfg(test)]
mod tests {
    use super::*;
    use std::os::windows::process::ExitStatusExt;
    use std::sync::atomic::{AtomicUsize, Ordering};

    fn sample_path() -> PathBuf {
        PathBuf::from("scripts/rhyme_analysis.py")
    }

    fn success_output(stdout: &str) -> std::process::Output {
        std::process::Output {
            status: std::process::ExitStatus::from_raw(0),
            stdout: stdout.as_bytes().to_vec(),
            stderr: Vec::new(),
        }
    }

    fn failure_output(stderr: &str) -> std::process::Output {
        std::process::Output {
            status: std::process::ExitStatus::from_raw(1),
            stdout: Vec::new(),
            stderr: stderr.as_bytes().to_vec(),
        }
    }

    #[test]
    fn falls_back_to_python_launcher_when_python_exits_with_error() {
        static PYTHON_CALLS: AtomicUsize = AtomicUsize::new(0);
        static LAUNCHER_CALLS: AtomicUsize = AtomicUsize::new(0);

        fn failing_python(_: &PathBuf, _: &str) -> AppResult<std::process::Output> {
            PYTHON_CALLS.fetch_add(1, Ordering::SeqCst);
            Ok(failure_output("Python"))
        }

        fn working_launcher(_: &PathBuf, _: &str) -> AppResult<std::process::Output> {
            LAUNCHER_CALLS.fetch_add(1, Ordering::SeqCst);
            Ok(success_output(r#"[{"line":"夜を越える","romanizedText":"yo ru","vowelText":"yo u","consonantText":"r","source":"sudachi_core"}]"#))
        }

        let output = run_python_candidates_with(&sample_path(), "夜を越える", [failing_python, working_launcher])
            .expect("runner selection should succeed");

        assert!(output.status.success());
        assert_eq!(PYTHON_CALLS.load(Ordering::SeqCst), 1);
        assert_eq!(LAUNCHER_CALLS.load(Ordering::SeqCst), 1);
    }

    #[test]
    fn returns_last_failed_output_when_all_runners_fail() {
        fn failing_python(_: &PathBuf, _: &str) -> AppResult<std::process::Output> {
            Ok(failure_output("python failed"))
        }

        fn failing_launcher(_: &PathBuf, _: &str) -> AppResult<std::process::Output> {
            Ok(failure_output("launcher failed"))
        }

        let output = run_python_candidates_with(&sample_path(), "夜を越える", [failing_python, failing_launcher])
            .expect("last failed output should be returned");

        assert!(!output.status.success());
        assert_eq!(String::from_utf8_lossy(&output.stderr), "launcher failed");
    }
}
