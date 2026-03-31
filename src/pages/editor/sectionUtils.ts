import { DraftSection } from '../../lib/api';

export interface Section {
  id: string;
  type: string;
  displayName: string;
  sortOrder: number;
  bodyText: string;
}

export const SECTION_PRESETS = ['Intro', 'Verse', 'Pre-Chorus', 'Chorus', 'Bridge', 'Outro'];

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
        currentSection.bodyText = currentLines.join('\n');
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
    currentSection.bodyText = currentLines.join('\n');
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
