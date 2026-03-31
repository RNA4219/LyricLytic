import { useState, useEffect } from 'react';
import {
  getStyleProfile,
  createStyleProfile,
  updateStyleProfile,
  StyleProfile,
  CreateStyleProfileInput,
  UpdateStyleProfileInput,
} from '../lib/api';

interface StyleProfilePanelProps {
  projectId: string;
}

function StyleProfilePanel({ projectId }: StyleProfilePanelProps) {
  const [profile, setProfile] = useState<StyleProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<CreateStyleProfileInput>({
    project_id: projectId,
    tone: '',
    vocabulary_bias: '',
    taboo_words: '',
    structure_preference: '',
    memo: '',
  });

  useEffect(() => {
    loadProfile();
  }, [projectId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await getStyleProfile(projectId);
      setProfile(data);
      if (data) {
        setForm({
          project_id: projectId,
          tone: data.tone || '',
          vocabulary_bias: data.vocabulary_bias || '',
          taboo_words: data.taboo_words || '',
          structure_preference: data.structure_preference || '',
          memo: data.memo || '',
        });
      }
    } catch (e) {
      console.error('Failed to load style profile:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (profile) {
        const input: UpdateStyleProfileInput = {
          tone: form.tone || undefined,
          vocabulary_bias: form.vocabulary_bias || undefined,
          taboo_words: form.taboo_words || undefined,
          structure_preference: form.structure_preference || undefined,
          memo: form.memo || undefined,
        };
        const updated = await updateStyleProfile(profile.style_profile_id, input);
        setProfile(updated);
      } else {
        const input: CreateStyleProfileInput = {
          ...form,
          tone: form.tone || undefined,
          vocabulary_bias: form.vocabulary_bias || undefined,
          taboo_words: form.taboo_words || undefined,
          structure_preference: form.structure_preference || undefined,
          memo: form.memo || undefined,
        };
        const created = await createStyleProfile(input);
        setProfile(created);
      }
      setEditing(false);
    } catch (e) {
      console.error('Failed to save style profile:', e);
    }
  };

  if (loading) {
    return <div className="style-panel loading">Loading...</div>;
  }

  return (
    <div className="style-panel">
      <div className="panel-header">
        <h4>🎨 Style Profile</h4>
        {!editing && (
          <button onClick={() => setEditing(true)} className="edit-btn">
            ✏️
          </button>
        )}
      </div>

      {editing ? (
        <div className="style-form">
          <div className="form-field">
            <label>Tone</label>
            <input
              value={form.tone}
              onChange={(e) => setForm({ ...form, tone: e.target.value })}
              placeholder="e.g., emotional, upbeat, melancholic"
            />
          </div>

          <div className="form-field">
            <label>Vocabulary Bias</label>
            <input
              value={form.vocabulary_bias}
              onChange={(e) => setForm({ ...form, vocabulary_bias: e.target.value })}
              placeholder="e.g., casual, formal, poetic"
            />
          </div>

          <div className="form-field">
            <label>Taboo Words</label>
            <input
              value={form.taboo_words}
              onChange={(e) => setForm({ ...form, taboo_words: e.target.value })}
              placeholder="Words to avoid (comma separated)"
            />
          </div>

          <div className="form-field">
            <label>Structure Preference</label>
            <input
              value={form.structure_preference}
              onChange={(e) => setForm({ ...form, structure_preference: e.target.value })}
              placeholder="e.g., AABA, verse-chorus"
            />
          </div>

          <div className="form-field">
            <label>Memo</label>
            <textarea
              value={form.memo}
              onChange={(e) => setForm({ ...form, memo: e.target.value })}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>

          <div className="form-actions">
            <button onClick={() => setEditing(false)} className="cancel-btn">
              Cancel
            </button>
            <button onClick={handleSave} className="save-btn">
              Save
            </button>
          </div>
        </div>
      ) : (
        <div className="style-view">
          {profile ? (
            <>
              {profile.tone && (
                <div className="style-item">
                  <span className="label">Tone:</span>
                  <span className="value">{profile.tone}</span>
                </div>
              )}
              {profile.vocabulary_bias && (
                <div className="style-item">
                  <span className="label">Vocabulary:</span>
                  <span className="value">{profile.vocabulary_bias}</span>
                </div>
              )}
              {profile.taboo_words && (
                <div className="style-item">
                  <span className="label">Taboo:</span>
                  <span className="value taboo">{profile.taboo_words}</span>
                </div>
              )}
              {profile.structure_preference && (
                <div className="style-item">
                  <span className="label">Structure:</span>
                  <span className="value">{profile.structure_preference}</span>
                </div>
              )}
              {profile.memo && (
                <div className="style-item memo">
                  <span className="value">{profile.memo}</span>
                </div>
              )}
              {!profile.tone && !profile.vocabulary_bias && !profile.taboo_words && !profile.structure_preference && !profile.memo && (
                <p className="empty-hint">Click edit to add style info</p>
              )}
            </>
          ) : (
            <p className="empty-hint">No style profile. Click edit to create one.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default StyleProfilePanel;