import { useState, useEffect } from 'react';
import { getFragments, createFragment, updateFragment, deleteFragment, CollectedFragment } from '../lib/api';

interface FragmentPanelProps {
  projectId: string;
  onInsert: (text: string) => void;
}

const STATUS_LABELS = {
  unused: { label: '未使用', color: '#4ade80' },
  used: { label: '使用済み', color: '#60a5fa' },
  hold: { label: '保留', color: '#fbbf24' },
};

function FragmentPanel({ projectId, onInsert }: FragmentPanelProps) {
  const [fragments, setFragments] = useState<CollectedFragment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newText, setNewText] = useState('');
  const [newSource, setNewSource] = useState('');
  const [newTags, setNewTags] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [tagFilter, setTagFilter] = useState<string>('');

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
        tags: newTags ? newTags.split(',').map(t => t.trim()).filter(t => t) : undefined,
      });
      setFragments([fragment, ...fragments]);
      setNewText('');
      setNewSource('');
      setNewTags('');
    } catch (e) {
      console.error('Failed to create fragment:', e);
    }
  };

  const handleStatusChange = async (id: string, status: 'unused' | 'used' | 'hold') => {
    try {
      await updateFragment(id, { status });
      setFragments(fragments.map(f =>
        f.collected_fragment_id === id ? { ...f, status } : f
      ));
    } catch (e) {
      console.error('Failed to update fragment:', e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('このフレーズを削除しますか？')) return;

    try {
      await deleteFragment(id);
      setFragments(fragments.filter(f => f.collected_fragment_id !== id));
    } catch (e) {
      console.error('Failed to delete fragment:', e);
    }
  };

  // Extract all unique tags
  const allTags = Array.from(new Set(
    fragments.flatMap(f => f.tags || [])
  )).sort();

  const filteredFragments = fragments.filter(f => {
    const matchesStatus = filter === 'all' || f.status === filter;
    const matchesSearch = !searchQuery ||
      f.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.source?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTag = !tagFilter || (f.tags && f.tags.includes(tagFilter));
    return matchesStatus && matchesSearch && matchesTag;
  });

  return (
    <div className="fragment-panel">
      <div className="panel-header">
        <h4>フレーズ</h4>
      </div>

      <div className="add-fragment-form">
          <textarea
            placeholder="フレーズのテキスト..."
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            rows={3}
          />
          <input
            type="text"
            placeholder="出典 (任意)"
            value={newSource}
            onChange={(e) => setNewSource(e.target.value)}
          />
          <input
            type="text"
            placeholder="タグ (カンマ区切り)"
            value={newTags}
            onChange={(e) => setNewTags(e.target.value)}
          />
          <button
            onClick={handleAddFragment}
            className="save-btn"
            disabled={!newText.trim()}
          >
            追加
          </button>
        </div>

      <div className="fragment-filters">
        <input
          type="text"
          placeholder="検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">すべて</option>
          <option value="unused">未使用</option>
          <option value="used">使用済み</option>
          <option value="hold">保留</option>
        </select>
      </div>

      {allTags.length > 0 && (
        <div className="tag-filter-row">
          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="tag-filter-select"
          >
            <option value="">タグで絞り込み</option>
            {allTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>
      )}

      <div className="fragment-list">
        {loading ? (
          <p className="loading-text">読み込み中...</p>
        ) : filteredFragments.length === 0 ? (
          <p className="empty-text">フレーズがありません</p>
        ) : (
          filteredFragments.map(f => (
            <div key={f.collected_fragment_id} className={`fragment-item status-${f.status}`}>
              <div className="fragment-header">
                <span
                  className="status-badge"
                  style={{ backgroundColor: STATUS_LABELS[f.status]?.color || '#888' }}
                >
                  {STATUS_LABELS[f.status]?.label || f.status}
                </span>
                {f.tags && f.tags.length > 0 && (
                  <div className="fragment-tags">
                    {f.tags.map(tag => (
                      <span key={tag} className="tag-chip">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="fragment-text">{f.text}</div>
              {f.source && <div className="fragment-source">出典: {f.source}</div>}
              <div className="fragment-actions">
                <button onClick={() => onInsert(f.text)} title="挿入" className="insert-btn">
                  📥 挿入
                </button>
                <select
                  value={f.status}
                  onChange={(e) => handleStatusChange(f.collected_fragment_id, e.target.value as 'unused' | 'used' | 'hold')}
                  className="status-select"
                >
                  <option value="unused">未使用</option>
                  <option value="used">使用済み</option>
                  <option value="hold">保留</option>
                </select>
                <button onClick={() => handleDelete(f.collected_fragment_id)} className="delete-btn" title="削除">
                  🗑
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="fragment-count">
        {filteredFragments.length} / {fragments.length} 件
      </div>
    </div>
  );
}

export default FragmentPanel;