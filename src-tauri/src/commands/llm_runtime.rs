use crate::error::{AppError, AppResult};
use crate::models::{LlamaCppStatus, StartLlamaCppInput};
use std::fs;
use std::net::TcpStream;
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use std::time::{Duration, Instant};
use tauri::State;

#[derive(Debug, Clone)]
struct ManagedLlamaCppMeta {
    executable_path: String,
    model_path: String,
    resolved_model_path: String,
    base_url: String,
}

struct ManagedLlamaCppProcess {
    child: Child,
    meta: ManagedLlamaCppMeta,
}

#[derive(Default)]
pub struct LlamaCppRuntimeState {
    process: Mutex<Option<ManagedLlamaCppProcess>>,
}

impl Drop for LlamaCppRuntimeState {
    fn drop(&mut self) {
        if let Ok(mut guard) = self.process.lock() {
            if let Some(process) = guard.as_mut() {
                let _ = process.child.kill();
                let _ = process.child.wait();
            }
        }
    }
}

fn parse_local_base_url(base_url: &str) -> AppResult<(String, u16)> {
    let trimmed = base_url.trim().trim_end_matches('/');
    let without_scheme = trimmed
        .strip_prefix("http://")
        .or_else(|| trimmed.strip_prefix("https://"))
        .ok_or_else(|| AppError::Other("base_url must start with http:// or https://".into()))?;

    let host_port = without_scheme
        .split('/')
        .next()
        .ok_or_else(|| AppError::Other("Invalid base_url".into()))?;

    let mut parts = host_port.split(':');
    let host = parts.next().unwrap_or_default().trim().to_string();
    let port = parts
        .next()
        .unwrap_or("8080")
        .trim()
        .parse::<u16>()
        .map_err(|_| AppError::Other("Invalid port in base_url".into()))?;

    if host != "127.0.0.1" && host != "localhost" {
        return Err(AppError::Other(
            "llama.cpp managed runtime only supports localhost / 127.0.0.1".into(),
        ));
    }

    Ok((host, port))
}

fn collect_model_candidates(dir: &Path, out: &mut Vec<PathBuf>, depth: usize) -> AppResult<()> {
    if depth > 6 {
        return Ok(());
    }

    let mut entries = fs::read_dir(dir)?
        .filter_map(|entry| entry.ok())
        .map(|entry| entry.path())
        .collect::<Vec<_>>();
    entries.sort();

    for path in entries {
        if path.is_dir() {
            collect_model_candidates(&path, out, depth + 1)?;
            continue;
        }

        if let Some(ext) = path.extension().and_then(|ext| ext.to_str()) {
            let lower_ext = ext.to_ascii_lowercase();
            if lower_ext == "gguf" || lower_ext == "ggml" {
                out.push(path);
            }
        }
    }

    Ok(())
}

fn resolve_model_path(raw_model_path: &str) -> AppResult<PathBuf> {
    let path = PathBuf::from(raw_model_path.trim());
    if !path.exists() {
        return Err(AppError::Other("Model path does not exist".into()));
    }

    if path.is_file() {
        return Ok(path);
    }

    let mut candidates = Vec::new();
    collect_model_candidates(&path, &mut candidates, 0)?;

    candidates
        .into_iter()
        .next()
        .ok_or_else(|| AppError::Other("No GGUF/GGML model file found under model path".into()))
}

fn status_from_meta(meta: &ManagedLlamaCppMeta, pid: Option<u32>, message: Option<String>) -> LlamaCppStatus {
    LlamaCppStatus {
        running: pid.is_some(),
        pid,
        executable_path: Some(meta.executable_path.clone()),
        model_path: Some(meta.model_path.clone()),
        resolved_model_path: Some(meta.resolved_model_path.clone()),
        base_url: Some(meta.base_url.clone()),
        message,
    }
}

fn stopped_status(message: Option<String>) -> LlamaCppStatus {
    LlamaCppStatus {
        running: false,
        pid: None,
        executable_path: None,
        model_path: None,
        resolved_model_path: None,
        base_url: None,
        message,
    }
}

fn wait_for_port(host: &str, port: u16, timeout: Duration) -> AppResult<()> {
    let deadline = Instant::now() + timeout;
    loop {
        if TcpStream::connect((host, port)).is_ok() {
            return Ok(());
        }

        if Instant::now() >= deadline {
            return Err(AppError::Other("llama.cpp runtime did not become ready in time".into()));
        }

        std::thread::sleep(Duration::from_millis(250));
    }
}

#[cfg(target_os = "windows")]
fn hide_console_window(command: &mut Command) {
    use std::os::windows::process::CommandExt;
    const CREATE_NO_WINDOW: u32 = 0x08000000;
    command.creation_flags(CREATE_NO_WINDOW);
}

#[cfg(not(target_os = "windows"))]
fn hide_console_window(_command: &mut Command) {}

fn refresh_status(guard: &mut Option<ManagedLlamaCppProcess>) -> AppResult<LlamaCppStatus> {
    if let Some(process) = guard.as_mut() {
        if let Some(exit) = process.child.try_wait()? {
            let status = status_from_meta(
                &process.meta,
                None,
                Some(format!("Exited with status {exit}")),
            );
            *guard = None;
            return Ok(status);
        }

        return Ok(status_from_meta(&process.meta, Some(process.child.id()), None));
    }

    Ok(stopped_status(Some("Not running".into())))
}

#[tauri::command]
pub fn get_llama_cpp_runtime_status(
    state: State<'_, LlamaCppRuntimeState>,
) -> AppResult<LlamaCppStatus> {
    let mut guard = state
        .process
        .lock()
        .map_err(|_| AppError::Other("Failed to lock llama.cpp runtime state".into()))?;
    refresh_status(&mut guard)
}

#[tauri::command]
pub fn stop_llama_cpp_runtime(
    state: State<'_, LlamaCppRuntimeState>,
) -> AppResult<LlamaCppStatus> {
    let mut guard = state
        .process
        .lock()
        .map_err(|_| AppError::Other("Failed to lock llama.cpp runtime state".into()))?;

    if let Some(process) = guard.as_mut() {
        let _ = process.child.kill();
        let _ = process.child.wait();
    }

    *guard = None;
    Ok(stopped_status(Some("Stopped".into())))
}

#[tauri::command]
pub fn start_llama_cpp_runtime(
    state: State<'_, LlamaCppRuntimeState>,
    input: StartLlamaCppInput,
) -> AppResult<LlamaCppStatus> {
    let executable_path = input.executable_path.trim();
    if executable_path.is_empty() {
        return Err(AppError::Other("Executable path is required".into()));
    }

    let executable = PathBuf::from(executable_path);
    if !executable.is_file() {
        return Err(AppError::Other("llama.cpp executable path is invalid".into()));
    }

    let resolved_model_path = resolve_model_path(&input.model_path)?;
    let (host, port) = parse_local_base_url(&input.base_url)?;

    let mut guard = state
        .process
        .lock()
        .map_err(|_| AppError::Other("Failed to lock llama.cpp runtime state".into()))?;

    if let Some(process) = guard.as_mut() {
        let same_process = process.meta.executable_path == executable.to_string_lossy()
            && process.meta.resolved_model_path == resolved_model_path.to_string_lossy()
            && process.meta.base_url == input.base_url;

        if process.child.try_wait()?.is_none() && same_process {
            return Ok(status_from_meta(&process.meta, Some(process.child.id()), Some("Already running".into())));
        }

        let _ = process.child.kill();
        let _ = process.child.wait();
        *guard = None;
    }

    let mut command = Command::new(&executable);
    command
        .arg("--model")
        .arg(&resolved_model_path)
        .arg("--host")
        .arg(&host)
        .arg("--port")
        .arg(port.to_string())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .stdin(Stdio::null());
    hide_console_window(&mut command);

    let child = command.spawn()?;

    let meta = ManagedLlamaCppMeta {
        executable_path: executable.to_string_lossy().to_string(),
        model_path: input.model_path,
        resolved_model_path: resolved_model_path.to_string_lossy().to_string(),
        base_url: input.base_url,
    };

    *guard = Some(ManagedLlamaCppProcess { child, meta });

    if let Some(process) = guard.as_mut() {
        let pid = process.child.id();
        wait_for_port(&host, port, Duration::from_secs(20))?;
        return Ok(status_from_meta(
            &process.meta,
            Some(pid),
            Some("Started".into()),
        ));
    }

    Err(AppError::Other("Failed to retain llama.cpp process state".into()))
}
