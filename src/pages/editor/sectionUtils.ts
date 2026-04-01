import { DraftSection } from '../../lib/api';
import { SECTION_PRESETS } from '../../lib/config';

export interface Section {
  id: string;
  type: string;
  displayName: string;
  sortOrder: number;
  bodyText: string;
}

// Re-export SECTION_PRESETS for backward compatibility
export { SECTION_PRESETS };

function trimTrailingSeparatorLines(lines: string[]): string[] {
  const next = [...lines];
  while (next.length > 0 && next[next.length - 1].trim() === '') {
    next.pop();
  }
  return next;
}

/**
 * Generate a unique display name for a new section.
 * If a section with the same base name exists, appends a number (e.g., "Verse 2", "Verse 3").
 */
export function generateUniqueSectionName(
  baseName: string,
  existingSections: Section[]
): string {
  const sameTypeCount = existingSections.filter(
    s => s.type === baseName || s.displayName.startsWith(baseName)
  ).length;

  if (sameTypeCount === 0) {
    return baseName;
  }

  // Check if there's already a section with exactly the base name
  const hasExactMatch = existingSections.some(s => s.displayName === baseName);

  if (!hasExactMatch) {
    return baseName;
  }

  // Find the highest number suffix
  let maxNumber = 1;
  existingSections.forEach(s => {
    if (s.displayName === baseName) {
      maxNumber = Math.max(maxNumber, 1);
    } else if (s.displayName.startsWith(baseName + ' ')) {
      const suffix = s.displayName.slice(baseName.length + 1);
      const num = parseInt(suffix, 10);
      if (!isNaN(num)) {
        maxNumber = Math.max(maxNumber, num);
      }
    }
  });

  return `${baseName} ${maxNumber + 1}`;
}

export function parseBodyToSections(body: string): Section[] {
  const lines = body.split('\n');
  const result: Section[] = [];
  let currentSection: Section | null = null;
  let currentLines: string[] = [];
  let order = 0;

  for (const line of lines) {
    const headerMatch = line.match(/^\[([^\]]+)\]$/);
    if (headerMatch) {
      if (currentSection) {
        currentSection.bodyText = trimTrailingSeparatorLines(currentLines).join('\n');
        result.push(currentSection);
      }
      currentSection = {
        id: crypto.randomUUID(),
        type: headerMatch[1],
        displayName: headerMatch[1],
        sortOrder: order++,
        bodyText: '',
      };
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }

  if (currentSection) {
    currentSection.bodyText = trimTrailingSeparatorLines(currentLines).join('\n');
    result.push(currentSection);
  }

  return result.length > 0
    ? result
    : [{
      id: crypto.randomUUID(),
      type: 'Verse',
      displayName: 'Verse',
      sortOrder: 0,
      bodyText: body,
    }];
}

export function sectionsToBody(sections: Section[]): string {
  return sections.map((section) => `[${section.displayName}]\n${section.bodyText}`).join('\n\n');
}

export function mapDraftSections(draftSections: DraftSection[]): Section[] {
  return draftSections.map((section) => ({
    id: section.draft_section_id,
    type: section.section_type ?? section.display_name,
    displayName: section.display_name,
    sortOrder: section.sort_order,
    bodyText: section.body_text,
  }));
}
