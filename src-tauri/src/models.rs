use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Project {
    pub project_id: String,
    pub title: String,
    pub theme: Option<String>,
    pub memo: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
    pub deleted_batch_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkingDraft {
    pub working_draft_id: String,
    pub project_id: String,
    pub latest_body_text: String,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DraftSection {
    pub draft_section_id: String,
    pub working_draft_id: String,
    pub section_type: Option<String>,
    pub display_name: String,
    pub sort_order: i32,
    pub body_text: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LyricVersion {
    pub lyric_version_id: String,
    pub project_id: String,
    pub snapshot_name: String,
    pub body_text: String,
    pub parent_lyric_version_id: Option<String>,
    pub note: Option<String>,
    pub created_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
    pub deleted_batch_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VersionSection {
    pub version_section_id: String,
    pub lyric_version_id: String,
    pub section_type: Option<String>,
    pub display_name: String,
    pub sort_order: i32,
    pub body_text: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateProjectInput {
    pub title: String,
    pub theme: Option<String>,
    pub memo: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateProjectInput {
    pub title: Option<String>,
    pub theme: Option<String>,
    pub memo: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SaveDraftInput {
    pub project_id: String,
    pub body_text: String,
    pub sections: Vec<DraftSectionInput>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DraftSectionInput {
    pub section_type: Option<String>,
    pub display_name: String,
    pub sort_order: i32,
    pub body_text: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateVersionInput {
    pub project_id: String,
    pub snapshot_name: String,
    pub body_text: String,
    pub note: Option<String>,
    pub parent_lyric_version_id: Option<String>,
    pub sections: Vec<VersionSectionInput>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VersionSectionInput {
    pub section_type: Option<String>,
    pub display_name: String,
    pub sort_order: i32,
    pub body_text: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CollectedFragment {
    pub collected_fragment_id: String,
    pub project_id: String,
    pub text: String,
    pub source: Option<String>,
    pub status: String,
    pub tags: Vec<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateFragmentInput {
    pub project_id: String,
    pub text: String,
    pub source: Option<String>,
    pub tags: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateFragmentInput {
    pub text: Option<String>,
    pub source: Option<String>,
    pub status: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SongArtifact {
    pub song_artifact_id: String,
    pub project_id: String,
    pub lyric_version_id: String,
    pub service_name: String,
    pub song_title: Option<String>,
    pub source_url: Option<String>,
    pub source_file_path: Option<String>,
    pub prompt_memo: Option<String>,
    pub style_memo: Option<String>,
    pub evaluation_memo: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateSongArtifactInput {
    pub project_id: String,
    pub lyric_version_id: String,
    pub service_name: String,
    pub song_title: Option<String>,
    pub source_url: Option<String>,
    pub source_file_path: Option<String>,
    pub prompt_memo: Option<String>,
    pub style_memo: Option<String>,
    pub evaluation_memo: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RevisionNote {
    pub revision_note_id: String,
    pub lyric_version_id: String,
    pub version_section_id: String,
    pub range_start: Option<i32>,
    pub range_end: Option<i32>,
    pub note_type: String,
    pub comment: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateRevisionNoteInput {
    pub lyric_version_id: String,
    pub version_section_id: String,
    pub range_start: Option<i32>,
    pub range_end: Option<i32>,
    pub note_type: String,
    pub comment: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StyleProfile {
    pub style_profile_id: String,
    pub project_id: String,
    pub tone: Option<String>,
    pub vocabulary_bias: Option<String>,
    pub taboo_words: Option<String>,
    pub structure_preference: Option<String>,
    pub memo: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateStyleProfileInput {
    pub project_id: String,
    pub tone: Option<String>,
    pub vocabulary_bias: Option<String>,
    pub taboo_words: Option<String>,
    pub structure_preference: Option<String>,
    pub memo: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateStyleProfileInput {
    pub tone: Option<String>,
    pub vocabulary_bias: Option<String>,
    pub taboo_words: Option<String>,
    pub structure_preference: Option<String>,
    pub memo: Option<String>,
}