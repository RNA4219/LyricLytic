import { useState } from 'react';

type SearchType = 'draft' | 'versions' | 'fragments' | 'tags';

interface SearchResult {
  id: string;
  type: SearchType;
  title: string;
  context: string;
  match: string;
}

interface SearchPanelProps {
  projectId: string;
  draftText: string;
  versions: Array<{
    lyric_version_id: string;
    snapshot_name: string;
    body_text: string;
  }>;
  fragments: Array<{
    collected_fragment_id: string;
    text: string;
    source?: string;
    status: string;
  }>;
  onJumpToVersion?: (versionId: string) => void;
  onJumpToFragment?: (fragmentId: string) => void;
}

function SearchPanel({
  draftText,
  versions,
  fragments,
  onJumpToVersion,
  onJumpToFragment,
}: SearchPanelProps) {
  const [searchType, setSearchType] = useState<SearchType>('draft');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = () => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setSearching(true);
    const searchResults: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();

    if (searchType === 'draft') {
      const lines = draftText.split('\n');
      lines.forEach((line, idx) => {
        if (line.toLowerCase().includes(lowerQuery)) {
          searchResults.push({
            id: 'draft',
            type: 'draft',
            title: 'Working Draft',
            context: getContext(lines, idx, 2),
            match: line,
          });
        }
      });
    } else if (searchType === 'versions') {
      versions.forEach(v => {
        const lines = v.body_text.split('\n');
        lines.forEach((line, idx) => {
          if (line.toLowerCase().includes(lowerQuery)) {
            searchResults.push({
              id: v.lyric_version_id,
              type: 'versions',
              title: v.snapshot_name,
              context: getContext(lines, idx, 2),
              match: line,
            });
          }
        });
      });
    } else if (searchType === 'fragments') {
      fragments.forEach(f => {
        if (f.text.toLowerCase().includes(lowerQuery)) {
          searchResults.push({
            id: f.collected_fragment_id,
            type: 'fragments',
            title: f.source || 'Fragment',
            context: f.text.substring(0, 100),
            match: f.text,
          });
        }
        if (f.source && f.source.toLowerCase().includes(lowerQuery)) {
          searchResults.push({
            id: f.collected_fragment_id,
            type: 'fragments',
            title: f.text.substring(0, 30),
            context: f.source,
            match: f.source,
          });
        }
      });
    }

    setResults(searchResults.slice(0, 50));
    setSearching(false);
  };

  const getContext = (lines: string[], idx: number, contextLines: number): string => {
    const start = Math.max(0, idx - contextLines);
    const end = Math.min(lines.length, idx + contextLines + 1);
    return lines.slice(start, end).join('\n');
  };

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'versions' && onJumpToVersion) {
      onJumpToVersion(result.id);
    } else if (result.type === 'fragments' && onJumpToFragment) {
      onJumpToFragment(result.id);
    }
  };

  return (
    <div className="search-panel">
      <div className="search-header">
        <h4>🔍 Search</h4>
      </div>

      <div className="search-type-tabs">
        <button
          className={searchType === 'draft' ? 'active' : ''}
          onClick={() => setSearchType('draft')}
        >
          Draft
        </button>
        <button
          className={searchType === 'versions' ? 'active' : ''}
          onClick={() => setSearchType('versions')}
        >
          Versions
        </button>
        <button
          className={searchType === 'fragments' ? 'active' : ''}
          onClick={() => setSearchType('fragments')}
        >
          Fragments
        </button>
      </div>

      <div className="search-input-row">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search..."
          className="search-input"
        />
        <button onClick={handleSearch} className="search-btn" disabled={searching}>
          {searching ? '...' : '🔍'}
        </button>
      </div>

      <div className="search-results">
        {results.length === 0 && query && !searching && (
          <p className="no-results">No results found</p>
        )}
        {results.map((r, idx) => (
          <div
            key={`${r.type}-${r.id}-${idx}`}
            className="search-result-item"
            onClick={() => handleResultClick(r)}
          >
            <div className="result-header">
              <span className="result-type">{r.type}</span>
              <span className="result-title">{r.title}</span>
            </div>
            <div className="result-context">{r.context}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SearchPanel;