import { useState, useEffect } from 'react';
import { buildSearchResults, extractAllTags, SearchResult, SearchType } from './search/searchUtils';
import { useLanguage } from '../lib/LanguageContext';

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
    tags?: string[];
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
  const { t } = useLanguage();
  const [searchType, setSearchType] = useState<SearchType>('draft');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [allTags, setAllTags] = useState<string[]>([]);

  useEffect(() => {
    setAllTags(extractAllTags(fragments));
  }, [fragments]);

  const handleSearch = () => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setSearching(true);
    const searchResults = buildSearchResults(searchType, query, draftText, versions, fragments);
    setResults(searchResults);
    setSearching(false);
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
        <h4>🔍 {t('search')}</h4>
      </div>

      <div className="search-type-tabs">
        <button
          className={searchType === 'draft' ? 'active' : ''}
          onClick={() => setSearchType('draft')}
        >
          {t('searchDraft')}
        </button>
        <button
          className={searchType === 'versions' ? 'active' : ''}
          onClick={() => setSearchType('versions')}
        >
          {t('searchVersions')}
        </button>
        <button
          className={searchType === 'fragments' ? 'active' : ''}
          onClick={() => setSearchType('fragments')}
        >
          {t('fragments')}
        </button>
        <button
          className={searchType === 'tags' ? 'active' : ''}
          onClick={() => setSearchType('tags')}
        >
          {t('searchTags')}
        </button>
      </div>

      <div className="search-input-row">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder={searchType === 'tags' ? t('searchTagsPlaceholder') : t('searchPlaceholder')}
          className="search-input"
        />
        <button onClick={handleSearch} className="search-btn" disabled={searching}>
          {searching ? '...' : '🔍'}
        </button>
      </div>

      {searchType === 'tags' && allTags.length > 0 && (
        <div className="tag-suggestions">
          <span className="tag-hint">{t('availableTags')}</span>
          <div className="tag-list">
            {allTags.slice(0, 10).map(tag => (
              <button
                key={tag}
                className="tag-chip"
                onClick={() => {
                  setQuery(tag);
                  setTimeout(handleSearch, 0);
                }}
              >
                {tag}
              </button>
            ))}
            {allTags.length > 10 && <span className="tag-more">+{allTags.length - 10} {t('moreCount')}</span>}
          </div>
        </div>
      )}

      <div className="search-results">
        {results.length === 0 && query && !searching && (
          <p className="no-results">{t('noResultsFound')}</p>
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
