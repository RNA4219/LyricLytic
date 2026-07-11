use crate::error::AppResult;
use crate::models::{
    CollectedFragment, CreateFragmentInput, CreateProjectInput, CreateRevisionNoteInput,
    CreateSongArtifactInput, CreateStyleProfileInput, CreateVersionInput, LyricVersion, Project,
    RevisionNote, SaveDraftInput, SongArtifact, StyleProfile, UpdateFragmentInput,
    UpdateProjectInput, UpdateStyleProfileInput, WorkingDraft,
};
use crate::repositories::{
    draft_repo, fragment_repo, project_repo, revision_note_repo, song_artifact_repo,
    style_profile_repo, version_repo,
};
use rusqlite::{Connection, Transaction};

pub(crate) fn transaction<T>(
    conn: &mut Connection,
    operation: impl FnOnce(&Transaction<'_>) -> AppResult<T>,
) -> AppResult<T> {
    let tx = conn.transaction()?;
    let value = operation(&tx)?;
    tx.commit()?;
    Ok(value)
}

pub(crate) fn create_project(
    conn: &mut Connection,
    input: CreateProjectInput,
) -> AppResult<Project> {
    transaction(conn, |tx| project_repo::create(tx, input))
}

pub(crate) fn update_project(
    conn: &mut Connection,
    project_id: &str,
    input: UpdateProjectInput,
) -> AppResult<Project> {
    transaction(conn, |tx| project_repo::update(tx, project_id, input))
}

pub(crate) fn save_draft(conn: &mut Connection, input: SaveDraftInput) -> AppResult<WorkingDraft> {
    transaction(conn, |tx| draft_repo::save(tx, input))
}

pub(crate) fn create_version(
    conn: &mut Connection,
    input: CreateVersionInput,
) -> AppResult<LyricVersion> {
    transaction(conn, |tx| version_repo::create(tx, input))
}

pub(crate) fn create_fragment(
    conn: &mut Connection,
    input: CreateFragmentInput,
) -> AppResult<CollectedFragment> {
    transaction(conn, |tx| fragment_repo::create(tx, input))
}

pub(crate) fn update_fragment(
    conn: &mut Connection,
    fragment_id: &str,
    input: UpdateFragmentInput,
) -> AppResult<CollectedFragment> {
    transaction(conn, |tx| fragment_repo::update(tx, fragment_id, input))
}

pub(crate) fn delete_fragment(conn: &mut Connection, fragment_id: &str) -> AppResult<()> {
    transaction(conn, |tx| fragment_repo::soft_delete(tx, fragment_id))
}

pub(crate) fn create_song_artifact(
    conn: &mut Connection,
    input: CreateSongArtifactInput,
) -> AppResult<SongArtifact> {
    transaction(conn, |tx| song_artifact_repo::create(tx, input))
}

pub(crate) fn delete_song_artifact(conn: &mut Connection, artifact_id: &str) -> AppResult<()> {
    transaction(conn, |tx| song_artifact_repo::soft_delete(tx, artifact_id))
}

pub(crate) fn create_revision_note(
    conn: &mut Connection,
    input: CreateRevisionNoteInput,
) -> AppResult<RevisionNote> {
    transaction(conn, |tx| revision_note_repo::create(tx, input))
}

pub(crate) fn delete_revision_note(conn: &mut Connection, note_id: &str) -> AppResult<()> {
    transaction(conn, |tx| revision_note_repo::soft_delete(tx, note_id))
}

pub(crate) fn create_style_profile(
    conn: &mut Connection,
    input: CreateStyleProfileInput,
) -> AppResult<StyleProfile> {
    transaction(conn, |tx| style_profile_repo::create(tx, input))
}

pub(crate) fn update_style_profile(
    conn: &mut Connection,
    profile_id: &str,
    input: UpdateStyleProfileInput,
) -> AppResult<StyleProfile> {
    transaction(conn, |tx| style_profile_repo::update(tx, profile_id, input))
}

pub(crate) fn delete_style_profile(conn: &mut Connection, profile_id: &str) -> AppResult<()> {
    transaction(conn, |tx| style_profile_repo::soft_delete(tx, profile_id))
}

pub(crate) fn soft_delete_project(
    conn: &mut Connection,
    project_id: &str,
    batch_id: &str,
) -> AppResult<()> {
    transaction(conn, |tx| {
        project_repo::soft_delete(tx, project_id, batch_id)
    })
}

pub(crate) fn restore_project(
    conn: &mut Connection,
    project_id: &str,
    batch_id: &str,
) -> AppResult<()> {
    transaction(conn, |tx| project_repo::restore(tx, project_id, batch_id))
}

pub(crate) fn hard_delete_project(
    conn: &mut Connection,
    project_id: &str,
    batch_id: &str,
) -> AppResult<()> {
    transaction(conn, |tx| {
        project_repo::hard_delete(tx, project_id, batch_id)
    })
}

pub(crate) fn soft_delete_version(
    conn: &mut Connection,
    lyric_version_id: &str,
    batch_id: &str,
) -> AppResult<()> {
    transaction(conn, |tx| {
        version_repo::soft_delete(tx, lyric_version_id, batch_id)
    })
}

pub(crate) fn restore_version(
    conn: &mut Connection,
    lyric_version_id: &str,
    batch_id: &str,
) -> AppResult<()> {
    transaction(conn, |tx| {
        version_repo::restore(tx, lyric_version_id, batch_id)
    })
}

pub(crate) fn hard_delete_version(
    conn: &mut Connection,
    lyric_version_id: &str,
    batch_id: &str,
) -> AppResult<()> {
    transaction(conn, |tx| {
        version_repo::hard_delete(tx, lyric_version_id, batch_id)
    })
}

pub(crate) fn restore_fragment(
    conn: &mut Connection,
    fragment_id: &str,
    batch_id: &str,
) -> AppResult<()> {
    transaction(conn, |tx| fragment_repo::restore(tx, fragment_id, batch_id))
}

pub(crate) fn hard_delete_fragment(
    conn: &mut Connection,
    fragment_id: &str,
    batch_id: &str,
) -> AppResult<()> {
    transaction(conn, |tx| {
        fragment_repo::hard_delete(tx, fragment_id, batch_id)
    })
}

pub(crate) fn restore_song_artifact(
    conn: &mut Connection,
    artifact_id: &str,
    batch_id: &str,
) -> AppResult<()> {
    transaction(conn, |tx| {
        song_artifact_repo::restore(tx, artifact_id, batch_id)
    })
}

pub(crate) fn hard_delete_song_artifact(
    conn: &mut Connection,
    artifact_id: &str,
    batch_id: &str,
) -> AppResult<()> {
    transaction(conn, |tx| {
        song_artifact_repo::hard_delete(tx, artifact_id, batch_id)
    })
}

pub(crate) fn restore_style_profile(
    conn: &mut Connection,
    profile_id: &str,
    batch_id: &str,
) -> AppResult<()> {
    transaction(conn, |tx| {
        style_profile_repo::restore(tx, profile_id, batch_id)
    })
}

pub(crate) fn hard_delete_style_profile(
    conn: &mut Connection,
    profile_id: &str,
    batch_id: &str,
) -> AppResult<()> {
    transaction(conn, |tx| {
        style_profile_repo::hard_delete(tx, profile_id, batch_id)
    })
}
