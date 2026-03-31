export interface Project {
  project_id: string;
  title: string;
  theme?: string;
  memo?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  deleted_batch_id?: string;
}

export interface WorkingDraft {
  working_draft_id: string;
  project_id: string;
  latest_body_text: string;
  updated_at: string;
}

export interface DraftSection {
  draft_section_id: string;
  working_draft_id: string;
  section_type?: string;
  display_name: string;
  sort_order: number;
  body_text: string;
}

export interface LyricVersion {
  lyric_version_id: string;
  project_id: string;
  snapshot_name: string;
  body_text: string;
  parent_lyric_version_id?: string;
  note?: string;
  created_at: string;
  deleted_at?: string;
  deleted_batch_id?: string;
}

export interface VersionSection {
  version_section_id: string;
  lyric_version_id: string;
  section_type?: string;
  display_name: string;
  sort_order: number;
  body_text: string;
}

export interface CollectedFragment {
  collected_fragment_id: string;
  project_id: string;
  text: string;
  source?: string;
  tags?: string[];
  status: 'unused' | 'used' | 'hold';
  created_at: string;
  updated_at: string;
}

export interface SongArtifact {
  song_artifact_id: string;
  project_id: string;
  lyric_version_id: string;
  service_name: string;
  song_title?: string;
  source_url?: string;
  source_file_path?: string;
  prompt_memo?: string;
  style_memo?: string;
  evaluation_memo?: string;
  created_at: string;
  updated_at: string;
}

export interface RevisionNote {
  revision_note_id: string;
  lyric_version_id: string;
  version_section_id: string;
  range_start?: number;
  range_end?: number;
  note_type: string;
  comment: string;
  created_at: string;
  updated_at: string;
}

export interface StyleProfile {
  style_profile_id: string;
  project_id: string;
  tone?: string;
  vocabulary_bias?: string;
  taboo_words?: string;
  structure_preference?: string;
  memo?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectInput {
  title: string;
  theme?: string;
  memo?: string;
}

export interface UpdateProjectInput {
  title?: string;
  theme?: string;
  memo?: string;
}

export interface DraftSectionInput {
  section_type?: string;
  display_name: string;
  sort_order: number;
  body_text: string;
}

export interface SaveDraftInput {
  project_id: string;
  body_text: string;
  sections: DraftSectionInput[];
}

export interface VersionSectionInput {
  section_type?: string;
  display_name: string;
  sort_order: number;
  body_text: string;
}

export interface CreateVersionInput {
  project_id: string;
  snapshot_name: string;
  body_text: string;
  note?: string;
  parent_lyric_version_id?: string;
  sections: VersionSectionInput[];
}

export interface CreateFragmentInput {
  project_id: string;
  text: string;
  source?: string;
  tags?: string[];
}

export interface UpdateFragmentInput {
  text?: string;
  source?: string;
  status?: 'unused' | 'used' | 'hold';
}

export interface CreateSongArtifactInput {
  project_id: string;
  lyric_version_id: string;
  service_name: string;
  song_title?: string;
  source_url?: string;
  source_file_path?: string;
  prompt_memo?: string;
  style_memo?: string;
  evaluation_memo?: string;
}

export interface CreateRevisionNoteInput {
  lyric_version_id: string;
  version_section_id: string;
  range_start?: number;
  range_end?: number;
  note_type: string;
  comment: string;
}

export interface CreateStyleProfileInput {
  project_id: string;
  tone?: string;
  vocabulary_bias?: string;
  taboo_words?: string;
  structure_preference?: string;
  memo?: string;
}

export interface UpdateStyleProfileInput {
  tone?: string;
  vocabulary_bias?: string;
  taboo_words?: string;
  structure_preference?: string;
  memo?: string;
}

export interface ExportProjectInput {
  project_id: string;
  include_deleted: boolean;
}
