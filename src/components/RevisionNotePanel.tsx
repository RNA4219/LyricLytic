import { useState, useEffect } from 'react';
import {
  getRevisionNotes,
  createRevisionNote,
  deleteRevisionNote,
  RevisionNote,
  CreateRevisionNoteInput,
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
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({
    note_type: 'weakness',
    comment: '',
  });

  useEffect(() => {
    loadNotes();
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

  const handleAdd = async () => {
    if (!form.comment.trim()) return;

    try {
      const input: CreateRevisionNoteInput = {
        lyric_version_id: lyricVersionId,
        note_type: form.note_type,
        comment: form.comment,
      };
      const note = await createRevisionNote(input);
      setNotes([note, ...notes]);
      setForm({ note_type: 'weakness', comment: '' });
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

  if (loading) {
    return <div className="revision-note-panel loading">Loading...</div>;
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
          <button onClick={handleAdd} className="save-btn" disabled={!form.comment.trim()}>
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