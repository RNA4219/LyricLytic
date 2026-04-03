const LAST_PROJECT_KEY = 'lyriclytic_last_project';
const PROJECT_ORDER_KEY = 'lyriclytic_project_order';
const PREVIEW_SECTION_PRIORITY = ['intro', 'chorus', 'verse', 'pre-chorus', 'bridge', 'outro'];

export function readProjectOrder(): string[] {
  try {
    const raw = localStorage.getItem(PROJECT_ORDER_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : [];
  } catch {
    return [];
  }
}

export function writeProjectOrder(order: string[]): void {
  localStorage.setItem(PROJECT_ORDER_KEY, JSON.stringify(order));
}

export function touchProjectOrder(projectId: string): string[] {
  const nextOrder = [projectId, ...readProjectOrder().filter((id) => id !== projectId)];
  writeProjectOrder(nextOrder);
  return nextOrder;
}

export function removeProjectFromOrder(projectId: string): string[] {
  const nextOrder = readProjectOrder().filter((id) => id !== projectId);
  writeProjectOrder(nextOrder);
  return nextOrder;
}

export function normalizeSectionName(name?: string): string {
  return (name ?? '').trim().toLowerCase();
}

export interface DraftSection {
  draft_section_id: string;
  section_type: string | null;
  display_name: string;
  sort_order: number;
  body_text: string;
}

export function extractSectionPreview(section: DraftSection | undefined, language: 'ja' | 'en'): string | null {
  if (!section) return null;
  const firstNonEmptyLine = section.body_text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length > 0);

  if (!firstNonEmptyLine) return null;

  const label = section.display_name?.trim() || (language === 'ja' ? '歌詞' : 'Lyrics');
  return `${label}: ${firstNonEmptyLine}`;
}

export function buildProjectPreview(
  sections: DraftSection[],
  bodyText: string,
  language: 'ja' | 'en',
): string | null {
  const nonEmptySections = [...sections]
    .sort((a, b) => a.sort_order - b.sort_order)
    .filter((section) => section.body_text.trim().length > 0);

  for (const key of PREVIEW_SECTION_PRIORITY) {
    const match = nonEmptySections.find((section) => {
      const type = normalizeSectionName(section.section_type);
      const displayName = normalizeSectionName(section.display_name);
      return type === key || displayName === key;
    });
    if (match) {
      const preview = extractSectionPreview(match, language);
      if (preview) return preview;
    }
  }

  const firstSectionPreview = extractSectionPreview(nonEmptySections[0], language);
  if (firstSectionPreview) return firstSectionPreview;

  const firstBodyLine = bodyText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length > 0 && !/^\[[^\]]+\]$/.test(line));

  return firstBodyLine ?? null;
}

export function getLastProjectId(): string | null {
  return localStorage.getItem(LAST_PROJECT_KEY);
}

export function setLastProjectId(projectId: string): void {
  localStorage.setItem(LAST_PROJECT_KEY, projectId);
}

export function clearLastProjectId(): void {
  localStorage.removeItem(LAST_PROJECT_KEY);
}