use crate::error::{AppError, AppResult};
use crate::models::{LlamaCppStatus, StartLlamaCppInput};
use std::env;
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
    ctx_size: u32,
    effective_max_tokens: u32,
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

    if candidates.is_empty() {
        return Err(AppError::Other("No GGUF/GGML model file found under model path".into()));
    }

    let preferred = candidates
        .iter()
        .find(|candidate| {
            let name = candidate
                .file_name()
                .and_then(|name| name.to_str())
                .unwrap_or_default()
                .to_ascii_lowercase();
            !name.contains("mmproj")
                && !name.contains("clip")
                && !name.contains("vision")
                && !name.contains("projector")
        })
        .cloned();

    preferred
        .or_else(|| candidates.into_iter().next())
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
        ctx_size: Some(meta.ctx_size),
        effective_max_tokens: Some(meta.effective_max_tokens),
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
        ctx_size: None,
        effective_max_tokens: None,
        message,
    }
}

fn derive_ctx_size(requested_max_tokens: Option<u32>) -> u32 {
    let max_tokens = requested_max_tokens.unwrap_or(262_144).clamp(2048, 262_144);
    let with_buffer = max_tokens.saturating_add(2048);
    with_buffer.clamp(4096, 262_144)
}

fn derive_effective_max_tokens(ctx_size: u32) -> u32 {
    ctx_size.saturating_sub(2048).max(1024)
}

fn build_ctx_retry_plan(initial_ctx_size: u32) -> Vec<u32> {
    let mut plan = Vec::new();
    let mut current = initial_ctx_size.clamp(4096, 262_144);

    while current >= 4096 {
        if !plan.contains(&current) {
            plan.push(current);
        }
        if current == 4096 {
            break;
        }
        current = (current / 2).max(4096);
    }

    plan
}

fn launch_llama_cpp_process(
    executable: &Path,
    resolved_model_path: &Path,
    host: &str,
    port: u16,
    ctx_size: u32,
) -> AppResult<Child> {
    let mut command = Command::new(executable);
    command
        .arg("--model")
        .arg(resolved_model_path)
        .arg("--n-gpu-layers")
        .arg("999")
        .arg("--host")
        .arg(host)
        .arg("--port")
        .arg(port.to_string())
        .arg("--ctx-size")
        .arg(ctx_size.to_string())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .stdin(Stdio::null());
    hide_console_window(&mut command);

    Ok(command.spawn()?)
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

fn executable_name_candidates() -> &'static [&'static str] {
    #[cfg(target_os = "windows")]
    {
        &["llama-server.exe", "llama-server"]
    }
    #[cfg(not(target_os = "windows"))]
    {
        &["llama-server"]
    }
}

fn find_executable_in_dir(dir: &Path) -> Option<PathBuf> {
    executable_name_candidates()
        .iter()
        .map(|name| dir.join(name))
        .find(|candidate| candidate.is_file())
}

fn detect_winget_llama_server() -> Option<PathBuf> {
    let local_app_data = env::var_os("LOCALAPPDATA")?;
    let packages_dir = PathBuf::from(local_app_data)
        .join("Microsoft")
        .join("WinGet")
        .join("Packages");

    let entries = fs::read_dir(packages_dir).ok()?;
    for entry in entries.filter_map(|entry| entry.ok()) {
        let path = entry.path();
        let name = path
            .file_name()
            .and_then(|value| value.to_str())
            .unwrap_or_default()
            .to_ascii_lowercase();

        if !name.contains("llamacpp") {
            continue;
        }

        if let Some(found) = find_executable_in_dir(&path) {
            return Some(found);
        }
    }

    None
}

fn detect_llama_server_executable() -> Option<PathBuf> {
    let path_env = env::var_os("PATH")?;
    for path in env::split_paths(&path_env) {
        if let Some(found) = find_executable_in_dir(&path) {
            return Some(found);
        }
    }

    detect_winget_llama_server()
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
pub fn detect_llama_cpp_executable(
    state: State<'_, LlamaCppRuntimeState>,
) -> AppResult<Option<String>> {
    let mut guard = state
        .process
        .lock()
        .map_err(|_| AppError::Other("Failed to lock llama.cpp runtime state".into()))?;

    if let Some(process) = guard.as_mut() {
        if process.child.try_wait()?.is_none() {
            return Ok(Some(process.meta.executable_path.clone()));
        }
    }

    Ok(detect_llama_server_executable().map(|path| path.to_string_lossy().to_string()))
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
    let requested_ctx_size = derive_ctx_size(input.max_tokens);
    let ctx_retry_plan = build_ctx_retry_plan(requested_ctx_size);

    let mut guard = state
        .process
        .lock()
        .map_err(|_| AppError::Other("Failed to lock llama.cpp runtime state".into()))?;

    if let Some(process) = guard.as_mut() {
        let same_process = process.meta.executable_path == executable.to_string_lossy()
            && process.meta.resolved_model_path == resolved_model_path.to_string_lossy()
            && process.meta.base_url == input.base_url
            && process.meta.ctx_size == requested_ctx_size;

        if process.child.try_wait()?.is_none() && same_process {
            return Ok(status_from_meta(&process.meta, Some(process.child.id()), Some("Already running".into())));
        }

        let _ = process.child.kill();
        let _ = process.child.wait();
        *guard = None;
    }

    let mut last_error: Option<String> = None;

    for ctx_size in ctx_retry_plan {
        let child = launch_llama_cpp_process(&executable, &resolved_model_path, &host, port, ctx_size)?;

        let meta = ManagedLlamaCppMeta {
            executable_path: executable.to_string_lossy().to_string(),
            model_path: input.model_path.clone(),
            resolved_model_path: resolved_model_path.to_string_lossy().to_string(),
            base_url: input.base_url.clone(),
            ctx_size,
            effective_max_tokens: derive_effective_max_tokens(ctx_size),
        };

        *guard = Some(ManagedLlamaCppProcess { child, meta });

        if let Some(process) = guard.as_mut() {
            let pid = process.child.id();
            match wait_for_port(&host, port, Duration::from_secs(20)) {
                Ok(()) => {
                    let message = if ctx_size == requested_ctx_size {
                        Some("Started".into())
                    } else {
                        Some(format!(
                            "Started with reduced ctx-size {} (requested {})",
                            ctx_size, requested_ctx_size
                        ))
                    };
                    return Ok(status_from_meta(&process.meta, Some(pid), message));
                }
                Err(err) => {
                    last_error = Some(err.to_string());
                    let _ = process.child.kill();
                    let _ = process.child.wait();
                    *guard = None;
                }
            }
        }
    }

    Err(AppError::Other(
        last_error.unwrap_or_else(|| "Failed to start llama.cpp runtime".into()),
    ))
}
