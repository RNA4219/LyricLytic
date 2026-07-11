use super::RhymeGuideRowDto;
use crate::error::{AppError, AppResult};
use std::path::Path;
use std::sync::{Arc, Mutex, OnceLock};
use sudachi::analysis::stateless_tokenizer::StatelessTokenizer;
use sudachi::analysis::{Mode, Tokenize};
use sudachi::config::Config;
use sudachi::dic::dictionary::JapaneseDictionary;
use wana_kana::ConvertJapanese;

static ANALYZER: OnceLock<Mutex<Option<SudachiAnalyzer>>> = OnceLock::new();

struct SudachiAnalyzer {
    tokenizer: StatelessTokenizer<Arc<JapaneseDictionary>>,
}

impl SudachiAnalyzer {
    fn load(resource_dir: &Path) -> AppResult<Self> {
        let config_path = resource_dir.join("sudachi.json");
        let dictionary_path = resource_dir.join("system_core_20260428.dic");
        let config = Config::new(
            Some(config_path),
            Some(resource_dir.to_path_buf()),
            Some(dictionary_path),
        )
        .map_err(|error| AppError::Other(format!("Sudachi configuration failed: {error}")))?;
        let dictionary = JapaneseDictionary::from_cfg(&config)
            .map_err(|error| AppError::Other(format!("Sudachi dictionary failed: {error}")))?;
        Ok(Self {
            tokenizer: StatelessTokenizer::new(Arc::new(dictionary)),
        })
    }

    fn analyze(&self, text: &str) -> AppResult<Vec<RhymeGuideRowDto>> {
        let mut rows = Vec::new();
        for raw_line in text.lines() {
            let trimmed = raw_line.trim();
            if trimmed.is_empty() || (trimmed.starts_with('[') && trimmed.ends_with(']')) {
                continue;
            }
            if let Some(row) = self.analyze_line(raw_line)? {
                rows.push(row);
            }
        }
        Ok(rows)
    }

    fn analyze_line(&self, line: &str) -> AppResult<Option<RhymeGuideRowDto>> {
        let morphemes = self
            .tokenizer
            .tokenize(line, Mode::C, false)
            .map_err(|error| AppError::Other(format!("Sudachi tokenization failed: {error}")))?;

        let mut romanized = Vec::new();
        let mut vowels = Vec::new();
        let mut consonants = Vec::new();

        for morpheme in morphemes.iter() {
            let surface = morpheme.surface();
            if surface.trim().is_empty() {
                push_separator(&mut romanized, &mut vowels, &mut consonants);
                continue;
            }
            let reading = morpheme.reading_form();
            if reading == "キゴウ" {
                push_separator(&mut romanized, &mut vowels, &mut consonants);
                continue;
            }
            let romaji = reading.to_romaji().to_ascii_lowercase();
            let letters = romaji
                .chars()
                .filter(|value| value.is_ascii_alphabetic())
                .collect::<String>();
            if letters.is_empty() {
                continue;
            }
            let vowel_text = letters
                .chars()
                .filter(|value| matches!(value, 'a' | 'e' | 'i' | 'o' | 'u' | 'y'))
                .collect::<String>();
            let consonant_text = letters
                .chars()
                .filter(|value| !matches!(value, 'a' | 'e' | 'i' | 'o' | 'u' | 'y'))
                .collect::<String>();
            romanized.push(letters);
            vowels.push(if vowel_text.is_empty() {
                "—".into()
            } else {
                vowel_text
            });
            consonants.push(if consonant_text.is_empty() {
                "—".into()
            } else {
                consonant_text
            });
        }

        if romanized.is_empty() {
            return Ok(None);
        }

        Ok(Some(RhymeGuideRowDto {
            line: line.to_string(),
            romanized_text: normalize_tokens(&romanized),
            vowel_text: normalize_tokens(&vowels),
            consonant_text: normalize_tokens(&consonants),
            source: "sudachi_core".into(),
        }))
    }
}

fn push_separator(
    romanized: &mut Vec<String>,
    vowels: &mut Vec<String>,
    consonants: &mut Vec<String>,
) {
    if romanized.last().map(String::as_str) != Some("|") {
        romanized.push("|".into());
        vowels.push("|".into());
        consonants.push("|".into());
    }
}

fn normalize_tokens(tokens: &[String]) -> String {
    let start = tokens
        .iter()
        .position(|token| token != "|")
        .unwrap_or(tokens.len());
    let end = tokens
        .iter()
        .rposition(|token| token != "|")
        .map(|index| index + 1)
        .unwrap_or(start);
    tokens[start..end].join(" ")
}

pub fn analyze(resource_dir: &Path, text: &str) -> AppResult<Vec<RhymeGuideRowDto>> {
    let analyzer = ANALYZER.get_or_init(|| Mutex::new(None));
    let mut guard = analyzer
        .lock()
        .map_err(|_| AppError::Other("Sudachi analyzer lock was poisoned".into()))?;
    if guard.is_none() {
        *guard = Some(SudachiAnalyzer::load(resource_dir)?);
    }
    guard
        .as_ref()
        .expect("Sudachi analyzer initialized")
        .analyze(text)
}
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn analyzes_japanese_with_bundled_core_dictionary() {
        let resources = Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("resources")
            .join("sudachi");
        let analyzer = SudachiAnalyzer::load(&resources).expect("dictionary load");
        let rows = analyzer.analyze("夜を越える").expect("analysis");
        assert_eq!(rows.len(), 1);
        assert_eq!(rows[0].source, "sudachi_core");
        assert!(!rows[0].romanized_text.is_empty());
        assert!(!rows[0].vowel_text.is_empty());
    }
}
