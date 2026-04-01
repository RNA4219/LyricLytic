PRAGMA foreign_keys = ON;

-- Projects
CREATE TABLE IF NOT EXISTS projects (
    project_id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    theme TEXT,
    memo TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_batch_id TEXT,
    deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS project_tags (
    project_id TEXT NOT NULL,
    tag TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (project_id, tag),
    FOREIGN KEY (project_id) REFERENCES projects(project_id)
);

-- Style Profiles
CREATE TABLE IF NOT EXISTS style_profiles (
    style_profile_id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    tone TEXT,
    vocabulary_bias TEXT,
    taboo_words TEXT,
    structure_preference TEXT,
    memo TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_batch_id TEXT,
    deleted_at TEXT,
    FOREIGN KEY (project_id) REFERENCES projects(project_id)
);

CREATE TABLE IF NOT EXISTS style_profile_tags (
    style_profile_id TEXT NOT NULL,
    tag TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (style_profile_id, tag),
    FOREIGN KEY (style_profile_id) REFERENCES style_profiles(style_profile_id)
);

-- Working Drafts
CREATE TABLE IF NOT EXISTS working_drafts (
    working_draft_id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    latest_body_text TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL,
    deleted_batch_id TEXT,
    deleted_at TEXT,
    FOREIGN KEY (project_id) REFERENCES projects(project_id)
);

-- Lyric Versions
CREATE TABLE IF NOT EXISTS lyric_versions (
    lyric_version_id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    snapshot_name TEXT NOT NULL,
    body_text TEXT NOT NULL DEFAULT '',
    parent_lyric_version_id TEXT,
    note TEXT,
    copy_include_headings INTEGER NOT NULL DEFAULT 0 CHECK (copy_include_headings IN (0, 1)),
    copy_preserve_blank_lines INTEGER NOT NULL DEFAULT 1 CHECK (copy_preserve_blank_lines IN (0, 1)),
    created_at TEXT NOT NULL,
    deleted_batch_id TEXT,
    deleted_at TEXT,
    FOREIGN KEY (project_id) REFERENCES projects(project_id),
    FOREIGN KEY (parent_lyric_version_id) REFERENCES lyric_versions(lyric_version_id)
);

-- Version Sections
CREATE TABLE IF NOT EXISTS version_sections (
    version_section_id TEXT PRIMARY KEY,
    lyric_version_id TEXT NOT NULL,
    section_type TEXT,
    display_name TEXT NOT NULL,
    sort_order INTEGER NOT NULL,
    body_text TEXT NOT NULL DEFAULT '',
    note TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_batch_id TEXT,
    deleted_at TEXT,
    FOREIGN KEY (lyric_version_id) REFERENCES lyric_versions(lyric_version_id),
    UNIQUE (version_section_id, lyric_version_id)
);

-- Draft Sections
CREATE TABLE IF NOT EXISTS draft_sections (
    draft_section_id TEXT PRIMARY KEY,
    working_draft_id TEXT NOT NULL,
    section_type TEXT,
    display_name TEXT NOT NULL,
    sort_order INTEGER NOT NULL,
    body_text TEXT NOT NULL DEFAULT '',
    note TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_batch_id TEXT,
    deleted_at TEXT,
    FOREIGN KEY (working_draft_id) REFERENCES working_drafts(working_draft_id)
);

-- Revision Notes
CREATE TABLE IF NOT EXISTS revision_notes (
    revision_note_id TEXT PRIMARY KEY,
    lyric_version_id TEXT NOT NULL,
    version_section_id TEXT NOT NULL,
    range_start INTEGER,
    range_end INTEGER,
    note_type TEXT NOT NULL,
    comment TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_batch_id TEXT,
    deleted_at TEXT,
    FOREIGN KEY (lyric_version_id) REFERENCES lyric_versions(lyric_version_id),
    FOREIGN KEY (version_section_id, lyric_version_id) REFERENCES version_sections(version_section_id, lyric_version_id),
    CHECK (
        (range_start IS NULL AND range_end IS NULL) OR
        (range_start IS NOT NULL AND range_end IS NOT NULL AND range_start >= 0 AND range_end >= range_start)
    )
);

-- Song Artifacts
CREATE TABLE IF NOT EXISTS song_artifacts (
    song_artifact_id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    lyric_version_id TEXT NOT NULL,
    service_name TEXT NOT NULL,
    song_title TEXT,
    source_url TEXT,
    source_file_path TEXT,
    prompt_memo TEXT,
    style_memo TEXT,
    evaluation_memo TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_batch_id TEXT,
    deleted_at TEXT,
    FOREIGN KEY (project_id) REFERENCES projects(project_id),
    FOREIGN KEY (lyric_version_id) REFERENCES lyric_versions(lyric_version_id),
    CHECK (source_url IS NOT NULL OR source_file_path IS NOT NULL)
);

-- Collected Fragments
CREATE TABLE IF NOT EXISTS collected_fragments (
    collected_fragment_id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    text TEXT NOT NULL,
    source TEXT,
    status TEXT NOT NULL DEFAULT 'unused' CHECK (status IN ('unused', 'used', 'hold')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_batch_id TEXT,
    deleted_at TEXT,
    FOREIGN KEY (project_id) REFERENCES projects(project_id)
);

CREATE TABLE IF NOT EXISTS fragment_tags (
    collected_fragment_id TEXT NOT NULL,
    tag TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (collected_fragment_id, tag),
    FOREIGN KEY (collected_fragment_id) REFERENCES collected_fragments(collected_fragment_id)
);

-- App Settings
CREATE TABLE IF NOT EXISTS app_settings (
    setting_key TEXT PRIMARY KEY,
    setting_value TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Partial unique indexes for logical deletion
CREATE UNIQUE INDEX IF NOT EXISTS uq_style_profiles_active_project ON style_profiles(project_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_working_drafts_active_project ON working_drafts(project_id) WHERE deleted_at IS NULL;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at);
CREATE INDEX IF NOT EXISTS idx_lyric_versions_project_created ON lyric_versions(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_version_sections_lyric_version_sort ON version_sections(lyric_version_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_draft_sections_working_draft_sort ON draft_sections(working_draft_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_revision_notes_version_section ON revision_notes(lyric_version_id, version_section_id);
CREATE INDEX IF NOT EXISTS idx_song_artifacts_project_version ON song_artifacts(project_id, lyric_version_id);
CREATE INDEX IF NOT EXISTS idx_collected_fragments_project_status ON collected_fragments(project_id, status);
CREATE INDEX IF NOT EXISTS idx_project_tags_tag ON project_tags(tag);
CREATE INDEX IF NOT EXISTS idx_fragment_tags_tag ON fragment_tags(tag);
CREATE INDEX IF NOT EXISTS idx_projects_deleted_batch ON projects(deleted_batch_id);
CREATE INDEX IF NOT EXISTS idx_lyric_versions_deleted_batch ON lyric_versions(deleted_batch_id);
CREATE INDEX IF NOT EXISTS idx_song_artifacts_deleted_batch ON song_artifacts(deleted_batch_id);
CREATE INDEX IF NOT EXISTS idx_collected_fragments_deleted_batch ON collected_fragments(deleted_batch_id);
CREATE INDEX IF NOT EXISTS idx_revision_notes_deleted_batch ON revision_notes(deleted_batch_id);
