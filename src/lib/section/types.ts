import { SECTION_PRESETS } from '../config';

export interface Section {
  id: string;
  type: string;
  displayName: string;
  sortOrder: number;
  bodyText: string;
}

export type SectionPreset = typeof SECTION_PRESETS[number];

// Re-export SECTION_PRESETS for convenience
export { SECTION_PRESETS };