import { useState, useEffect } from 'react';
import {
  getRevisionNotes,
  createRevisionNote,
  deleteRevisionNote,
  getVersionSections,
  RevisionNote,
  CreateRevisionNoteInput,
  VersionSection,
} from '../lib/api';

interface RevisionNotePanelProps {
  lyricVersionId: string;
  versionName: string;
}

const NOTE_TYPE_OPTIONS = [
  { value: 'weakness', label: '🔴 Weakness' },
  { value: 'hook', label: '🟢 Hook' },
  { value: 'rewrite', label: '🟡 Rewrite' },
  { value: 'hold', label: '⚪ Hold' },
];

function RevisionNotePanel({ lyricVersionId, versionName }: RevisionNotePanelProps) {
  const [notes, setNotes] = useState<RevisionNote[]>([]);
  const [sections, setSections] = useState<VersionSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({
    version_section_id: '',
    note_type: 'weakness',
    comment: '',
  });

  useEffect(() => {
    loadNotes();
    loadSections();
  }, [lyricVersionId]);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const data = await getRevisionNotes(lyricVersionId);
      setNotes(data);
    } catch (e) {
      console.error('Failed to load revision notes:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadSections = async () => {
    try {
      const data = await getVersionSections(lyricVersionId);
      setSections(data);
      if (data.length > 0) {
        setForm(prev => ({ ...prev, version_section_id: data[0].version_section_id }));
      }
    } catch (e) {
      console.error('Failed to load version sections:', e);
    }
  };

  const handleAdd = async () => {
    if (!form.comment.trim() || !form.version_section_id) return;

    try {
      const input: CreateRevisionNoteInput = {
        lyric_version_id: lyricVersionId,
        version_section_id: form.version_section_id,
        note_type: form.note_type,
        comment: form.comment,
      };
      const note = await createRevisionNote(input);
      setNotes([note, ...notes]);
      setForm({ version_section_id: sections[0]?.version_section_id || '', note_type: 'weakness', comment: '' });
      setShowAddForm(false);
    } catch (e) {
      console.error('Failed to create revision note:', e);
    }
  };

  const handleDelete = async (noteId: string) => {
    if (!confirm('Delete this note?')) return;

    try {
      await deleteRevisionNote(noteId);
      setNotes(notes.filter(n => n.revision_note_id !== noteId));
    } catch (e) {
      console.error('Failed to delete revision note:', e);
    }
  };

  const getNoteTypeLabel = (type: string): string => {
    return NOTE_TYPE_OPTIONS.find(o => o.value === type)?.label || type;
  };

  const getSectionDisplayName = (sectionId: string): string => {
    const section = sections.find(s => s.version_section_id === sectionId);
    return section?.display_name || 'Unknown Section';
  };

  if (loading) {
    return <div className="revision-note-panel loading">Loading...</div>;
  }

  if (sections.length === 0) {
    return (
      <div className="revision-note-panel">
        <div className="panel-header">
          <h4>📝 Notes for {versionName}</h4>
        </div>
        <p className="empty-hint">No sections available. Save a snapshot first to create sections.</p>
      </div>
    );
  }

  return (
    <div className="revision-note-panel">
      <div className="panel-header">
        <h4>📝 Notes for {versionName}</h4>
        <button onClick={() => setShowAddForm(!showAddForm)} className="add-btn">
          {showAddForm ? '×' : '+'}
        </button>
      </div>

      {showAddForm && (
        <div className="add-note-form">
          <select
            value={form.version_section_id}
            onChange={(e) => setForm({ ...form, version_section_id: e.target.value })}
          >
            {sections.map(s => (
              <option key={s.version_section_id} value={s.version_section_id}>
                {s.display_name}
              </option>
            ))}
          </select>
          <select
            value={form.note_type}
            onChange={(e) => setForm({ ...form, note_type: e.target.value })}
          >
            {NOTE_TYPE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <textarea
            value={form.comment}
            onChange={(e) => setForm({ ...form, comment: e.target.value })}
            placeholder="Write your note..."
            rows={3}
          />
          <button onClick={handleAdd} className="save-btn" disabled={!form.comment.trim() || !form.version_section_id}>
            Add Note
          </button>
        </div>
      )}

      <div className="notes-list">
        {notes.length === 0 ? (
          <p className="empty-hint">No notes yet</p>
        ) : (
          notes.map(note => (
            <div key={note.revision_note_id} className={`note-item type-${note.note_type}`}>
              <div className="note-header">
                <span className="note-section">{getSectionDisplayName(note.version_section_id || '')}</span>
                <span className="note-type">{getNoteTypeLabel(note.note_type)}</span>
                <button onClick={() => handleDelete(note.revision_note_id)} className="delete-btn">
                  ×
                </button>
              </div>
              <div className="note-comment">{note.comment}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default RevisionNotePanel;