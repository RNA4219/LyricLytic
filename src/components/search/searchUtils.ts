export type SearchType = 'draft' | 'versions' | 'fragments' | 'tags';

export interface SearchResult {
  id: string;
  type: SearchType;
  title: string;
  context: string;
  match: string;
}

interface SearchVersion {
  lyric_version_id: string;
  snapshot_name: string;
  body_text: string;
}

interface SearchFragment {
  collected_fragment_id: string;
  text: string;
  source?: string;
  tags?: string[];
}

export function extractAllTags(fragments: SearchFragment[]): string[] {
  const tags = new Set<string>();
  fragments.forEach((fragment) => {
    fragment.tags?.forEach((tag) => tags.add(tag));
  });
  return Array.from(tags).sort();
}

export function getContext(lines: string[], index: number, contextLines: number): string {
  const start = Math.max(0, index - contextLines);
  const end = Math.min(lines.length, index + contextLines + 1);
  return lines.slice(start, end).join('\n');
}

export function buildSearchResults(
  searchType: SearchType,
  query: string,
  draftText: string,
  versions: SearchVersion[],
  fragments: SearchFragment[],
): SearchResult[] {
  const searchResults: SearchResult[] = [];
  const lowerQuery = query.toLowerCase();

  if (searchType === 'draft') {
    const lines = draftText.split('\n');
    lines.forEach((line, index) => {
      if (line.toLowerCase().includes(lowerQuery)) {
        searchResults.push({
          id: 'draft',
          type: 'draft',
          title: 'Working Draft',
          context: getContext(lines, index, 2),
          match: line,
        });
      }
    });
  } else if (searchType === 'versions') {
    versions.forEach((version) => {
      const lines = version.body_text.split('\n');
      lines.forEach((line, index) => {
        if (line.toLowerCase().includes(lowerQuery)) {
          searchResults.push({
            id: version.lyric_version_id,
            type: 'versions',
            title: version.snapshot_name,
            context: getContext(lines, index, 2),
            match: line,
          });
        }
      });
    });
  } else if (searchType === 'fragments') {
    fragments.forEach((fragment) => {
      if (fragment.text.toLowerCase().includes(lowerQuery)) {
        searchResults.push({
          id: fragment.collected_fragment_id,
          type: 'fragments',
          title: fragment.source || 'Fragment',
          context: fragment.text.substring(0, 100),
          match: fragment.text,
        });
      }

      if (fragment.source && fragment.source.toLowerCase().includes(lowerQuery)) {
        searchResults.push({
          id: fragment.collected_fragment_id,
          type: 'fragments',
          title: fragment.text.substring(0, 30),
          context: fragment.source,
          match: fragment.source,
        });
      }
    });
  } else {
    fragments.forEach((fragment) => {
      if (fragment.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))) {
        searchResults.push({
          id: fragment.collected_fragment_id,
          type: 'tags',
          title: fragment.source || 'Fragment',
          context: `Tags: ${(fragment.tags || []).join(', ')}`,
          match: fragment.text.substring(0, 100),
        });
      }
    });
  }

  return searchResults.slice(0, 50);
}
