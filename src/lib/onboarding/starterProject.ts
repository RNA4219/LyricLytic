import type { Language } from '../i18n';
import type { DraftSectionInput } from '../api';
import type { Section } from '../section';

export interface StarterProject {
  title: string;
  bpm: number;
  styleText: string;
  vocalText: string;
  sections: Array<Pick<Section, 'type' | 'displayName' | 'sortOrder' | 'bodyText'>>;
}

const STARTER_PROJECTS: Record<Language, StarterProject> = {
  ja: {
    title: 'はじまりのサンプル',
    bpm: 124,
    styleText: 'J-pop, uplifting synth pop, gradual build, wide chorus, bright piano and pulsing bass',
    vocalText: 'Clear expressive vocal, intimate in the verse and open with energy in the chorus',
    sections: [
      {
        type: 'Verse',
        displayName: 'Verse',
        sortOrder: 0,
        bodyText: '雨上がりの駅で ひとり立ち止まる\nまだ名前のない光が 胸をよぎる\n小さな迷いをポケットにしまい\n次の一歩だけを 信じてみる',
      },
      {
        type: 'Pre-Chorus',
        displayName: 'Pre-Chorus',
        sortOrder: 1,
        bodyText: '遠回りした昨日も\nここへ続く道になる',
      },
      {
        type: 'Chorus',
        displayName: 'Chorus',
        sortOrder: 2,
        bodyText: '明日へ飛び出せ\n風を追い越せ\n声を響かせ\n夜を照らせ\n迷いをほどいて\nこの手で選べ',
      },
      {
        type: 'Outro',
        displayName: 'Outro',
        sortOrder: 3,
        bodyText: 'まだ見えない景色へ\n歩き出せ',
      },
    ],
  },
  en: {
    title: 'First Song Sample',
    bpm: 124,
    styleText: 'Uplifting synth pop, gradual build, wide chorus, bright piano and pulsing bass',
    vocalText: 'Clear expressive vocal, intimate in the verse and open with energy in the chorus',
    sections: [
      {
        type: 'Verse',
        displayName: 'Verse',
        sortOrder: 0,
        bodyText: 'At the station after rain, I pause alone\nA nameless light moves through my chest\nI keep a small doubt in my pocket\nAnd trust the next step I can take',
      },
      {
        type: 'Pre-Chorus',
        displayName: 'Pre-Chorus',
        sortOrder: 1,
        bodyText: 'Every long way from yesterday\nBecomes the road that brought me here',
      },
      {
        type: 'Chorus',
        displayName: 'Chorus',
        sortOrder: 2,
        bodyText: 'Run into tomorrow\nOutrun the wind\nLet every voice ring\nLight up the night\nUntie the doubt\nChoose it with these hands',
      },
      {
        type: 'Outro',
        displayName: 'Outro',
        sortOrder: 3,
        bodyText: 'Toward a view I cannot see\nI start to walk',
      },
    ],
  },
};

export function getStarterProject(language: Language): StarterProject {
  return STARTER_PROJECTS[language];
}

export function createStarterSections(language: Language): Section[] {
  return getStarterProject(language).sections.map((section) => ({
    ...section,
    id: crypto.randomUUID(),
  }));
}

export function createStarterDraftSections(language: Language): DraftSectionInput[] {
  return createStarterSections(language).map((section) => ({
    draft_section_id: section.id,
    section_type: section.type,
    display_name: section.displayName,
    sort_order: section.sortOrder,
    body_text: section.bodyText,
  }));
}

export function isDraftEmpty(sections: Section[], styleText = '', vocalText = ''): boolean {
  return !sections.some((section) => section.bodyText.trim())
    && !styleText.trim()
    && !vocalText.trim();
}
