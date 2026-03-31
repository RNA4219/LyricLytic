import { useState, useEffect } from 'react';
import { getFragments, createFragment, updateFragment, deleteFragment, CollectedFragment } from '../lib/api';

interface FragmentPanelProps {
  projectId: string;
  onInsert: (text: string) => void;
}

function FragmentPanel({ projectId, onInsert }: FragmentPanelProps) {
  const [fragments, setFragments] = useState<CollectedFragment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newText, setNewText] = useState('');
  const [newSource, setNewSource] = useState('');
  const [newTags, setNewTags] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadFragments();
  }, [projectId]);

  const loadFragments = async () => {
    try {
      setLoading(true);
      const data = await getFragments(projectId);
      setFragments(data);
    } catch (e) {
      console.error('Failed to load fragments:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFragment = async () => {
    if (!newText.trim()) return;

    try {
      const fragment = await createFragment({
        project_id: projectId,
        text: newText,
        source: newSource || undefined,
        tags: newTags ? newTags.split(',').map(t => t.trim()) : undefined,
      });
      setFragments([fragment, ...fragments]);
      setNewText('');
      setNewSource('');
      setNewTags('');
      setShowAddForm(false);
    } catch (e) {
      console.error('Failed to create fragment:', e);
    }
  };

  const handleStatusChange = async (id: string, status: 'unused' | 'used' | 'hold') => {
    try {
      const fragment = fragments.find(f => f.collected_fragment_id === id);
      if (!fragment) return;

      await updateFragment(id, { status });
      setFragments(fragments.map(f =>
        f.collected_fragment_id === id ? { ...f, status } : f
      ));
    } catch (e) {
      console.error('Failed to update fragment:', e);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteFragment(id);
      setFragments(fragments.filter(f => f.collected_fragment_id !== id));
    } catch (e) {
      console.error('Failed to delete fragment:', e);
    }
  };

  const filteredFragments = fragments.filter(f => {
    const matchesStatus = filter === 'all' || f.status === filter;
    const matchesSearch = !searchQuery ||
      f.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.source?.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="fragment-panel">
      <div className="panel-header">
        <h4>Fragments</h4>
        <button onClick={() => setShowAddForm(!showAddForm)} className="add-btn">
          {showAddForm ? '×' : '+'}
        </button>
      </div>

      {showAddForm && (
        <div className="add-fragment-form">
          <textarea
            placeholder="Fragment text..."
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
          />
          <input
            type="text"
            placeholder="Source (optional)"
            value={newSource}
            onChange={(e) => setNewSource(e.target.value)}
          />
          <input
            type="text"
            placeholder="Tags (comma separated)"
            value={newTags}
            onChange={(e) => setNewTags(e.target.value)}
          />
          <button onClick={handleAddFragment} className="save-btn">Add</button>
        </div>
      )}

      <div className="fragment-filters">
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="unused">Unused</option>
          <option value="used">Used</option>
          <option value="hold">Hold</option>
        </select>
      </div>

      <div className="fragment-list">
        {loading ? (
          <p className="loading-text">Loading...</p>
        ) : filteredFragments.length === 0 ? (
          <p className="empty-text">No fragments</p>
        ) : (
          filteredFragments.map(f => (
            <div key={f.collected_fragment_id} className={`fragment-item ${f.status}`}>
              <div className="fragment-text">{f.text}</div>
              {f.source && <div className="fragment-source">Source: {f.source}</div>}
              <div className="fragment-actions">
                <button onClick={() => onInsert(f.text)} title="Insert">📥</button>
                <select
                  value={f.status}
                  onChange={(e) => handleStatusChange(f.collected_fragment_id, e.target.value as any)}
                >
                  <option value="unused">Unused</option>
                  <option value="used">Used</option>
                  <option value="hold">Hold</option>
                </select>
                <button onClick={() => handleDelete(f.collected_fragment_id)} className="delete-btn">🗑</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default FragmentPanel;