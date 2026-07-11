use crate::error::{AppError, AppResult};
use encoding_rs::{EUC_JP, ISO_2022_JP, SHIFT_JIS, UTF_8, WINDOWS_1252};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

const MAX_TEXT_BYTES: u64 = 10 * 1024 * 1024;

#[derive(Debug, Deserialize)]
pub struct ReadTextFileInput {
    pub path: String,
    pub encoding: String,
}

#[derive(Debug, Serialize)]
pub struct ReadTextFileResult {
    pub text: String,
    pub had_replacements: bool,
}

#[derive(Debug, Deserialize)]
pub struct ListModelCandidatesInput {
    pub root_path: String,
}

#[derive(Debug, Serialize)]
pub struct ModelCandidate {
    pub path: String,
    pub name: String,
    pub size_bytes: u64,
}

#[tauri::command]
pub fn read_text_file(input: ReadTextFileInput) -> AppResult<ReadTextFileResult> {
    let path = Path::new(&input.path);
    if path
        .extension()
        .and_then(|value| value.to_str())
        .map(|value| value.eq_ignore_ascii_case("txt"))
        != Some(true)
    {
        return Err(AppError::Validation("Only .txt files are supported".into()));
    }
    let metadata = fs::metadata(path)?;
    if !metadata.is_file() || metadata.len() > MAX_TEXT_BYTES {
        return Err(AppError::Validation(
            "Text file must be 10 MiB or smaller".into(),
        ));
    }
    let bytes = fs::read(path)?;
    let (text, had_replacements) = match input.encoding.to_ascii_lowercase().as_str() {
        "utf-8" | "utf8" => {
            let (value, _, errors) = UTF_8.decode(&bytes);
            (value.into_owned(), errors)
        }
        "shift_jis" | "shift-jis" | "windows-31j" => {
            let (value, _, errors) = SHIFT_JIS.decode(&bytes);
            (value.into_owned(), errors)
        }
        "euc-jp" | "euc_jp" => {
            let (value, _, errors) = EUC_JP.decode(&bytes);
            (value.into_owned(), errors)
        }
        "windows-1252" => {
            let (value, _, errors) = WINDOWS_1252.decode(&bytes);
            (value.into_owned(), errors)
        }
        "iso-2022-jp" => {
            let (value, _, errors) = ISO_2022_JP.decode(&bytes);
            (value.into_owned(), errors)
        }
        value => return Err(AppError::Encoding(format!("Unsupported encoding: {value}"))),
    };
    Ok(ReadTextFileResult {
        text,
        had_replacements,
    })
}

fn collect_model_candidates(
    directory: &Path,
    depth: usize,
    candidates: &mut Vec<ModelCandidate>,
) -> AppResult<()> {
    if depth > 4 {
        return Ok(());
    }
    for entry in fs::read_dir(directory)? {
        let entry = entry?;
        let path = entry.path();
        if path.is_dir() {
            collect_model_candidates(&path, depth + 1, candidates)?;
        } else if path
            .extension()
            .and_then(|value| value.to_str())
            .map(|value| value.eq_ignore_ascii_case("gguf"))
            == Some(true)
        {
            let metadata = entry.metadata()?;
            candidates.push(ModelCandidate {
                name: entry.file_name().to_string_lossy().into_owned(),
                path: path.to_string_lossy().into_owned(),
                size_bytes: metadata.len(),
            });
        }
    }
    Ok(())
}

#[tauri::command]
pub fn list_model_candidates(input: ListModelCandidatesInput) -> AppResult<Vec<ModelCandidate>> {
    let root = PathBuf::from(input.root_path);
    if !root.is_dir() {
        return Err(AppError::Validation(
            "Model root must be a directory".into(),
        ));
    }
    let mut candidates = Vec::new();
    collect_model_candidates(&root, 0, &mut candidates)?;
    candidates.sort_by(|a, b| a.name.cmp(&b.name));
    Ok(candidates)
}
#[cfg(test)]
mod tests {
    use super::*;
    use std::time::{SystemTime, UNIX_EPOCH};

    fn temp_txt(label: &str) -> PathBuf {
        let unique = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("clock")
            .as_nanos();
        std::env::temp_dir().join(format!("lyriclytic-{label}-{unique}.txt"))
    }

    fn assert_decodes(
        label: &str,
        encoding: &'static encoding_rs::Encoding,
        input_encoding: &str,
        expected: &str,
    ) {
        let path = temp_txt(label);
        let (bytes, _, had_errors) = encoding.encode(expected);
        assert!(!had_errors);
        fs::write(&path, bytes.as_ref()).expect("fixture write");

        let result = read_text_file(ReadTextFileInput {
            path: path.to_string_lossy().into_owned(),
            encoding: input_encoding.into(),
        })
        .expect("decode");
        assert_eq!(result.text, expected);
        assert!(!result.had_replacements);
        fs::remove_file(path).ok();
    }

    #[test]
    fn reads_all_supported_encodings() {
        assert_decodes("utf8", UTF_8, "utf-8", "夜を越える");
        assert_decodes("sjis", SHIFT_JIS, "shift_jis", "夜を越える");
        assert_decodes("eucjp", EUC_JP, "euc-jp", "夜を越える");
        assert_decodes("iso2022jp", ISO_2022_JP, "iso-2022-jp", "夜を越える");
        assert_decodes("cp1252", WINDOWS_1252, "windows-1252", "café");
    }

    #[test]
    fn rejects_non_txt_and_oversized_files() {
        let binary_path = temp_txt("wrong").with_extension("bin");
        fs::write(&binary_path, b"text").expect("fixture write");
        assert!(matches!(
            read_text_file(ReadTextFileInput {
                path: binary_path.to_string_lossy().into_owned(),
                encoding: "utf-8".into(),
            }),
            Err(AppError::Validation(_))
        ));
        fs::remove_file(binary_path).ok();

        let path = temp_txt("oversized");
        let file = fs::File::create(&path).expect("fixture create");
        file.set_len(MAX_TEXT_BYTES + 1).expect("fixture resize");
        assert!(matches!(
            read_text_file(ReadTextFileInput {
                path: path.to_string_lossy().into_owned(),
                encoding: "utf-8".into(),
            }),
            Err(AppError::Validation(_))
        ));
        fs::remove_file(path).ok();
    }

    #[test]
    fn reports_replacement_and_rejects_unknown_encoding() {
        let path = temp_txt("invalid");
        fs::write(&path, [0xff, 0xff]).expect("fixture write");
        let result = read_text_file(ReadTextFileInput {
            path: path.to_string_lossy().into_owned(),
            encoding: "utf-8".into(),
        })
        .expect("lossy decode");
        assert!(result.had_replacements);
        assert!(matches!(
            read_text_file(ReadTextFileInput {
                path: path.to_string_lossy().into_owned(),
                encoding: "unknown".into(),
            }),
            Err(AppError::Encoding(_))
        ));
        fs::remove_file(path).ok();
    }
}
