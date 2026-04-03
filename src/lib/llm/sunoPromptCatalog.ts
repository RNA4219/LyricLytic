export type SunoPromptTarget = 'style' | 'vocal';

export interface SunoPromptCatalogEnrichment {
  routeTags: string[];
  moods: string[];
  eras: string[];
  regions: string[];
  instruments: string[];
  vocalTraits: string[];
  energy: 'low' | 'medium' | 'high' | 'variable';
}

export interface SunoPromptCatalogEntry {
  id: string;
  section: string;
  title: string;
  prompt: string;
  description: string;
  tags: string[];
  targets: SunoPromptTarget[];
  enrichment?: SunoPromptCatalogEnrichment;
}

interface SunoPromptBucketMeta {
  key: string;
  mode: 'important' | 'rest';
  sections: string[];
  entryCount: number;
}

interface SunoPromptCatalogMetaPayload {
  sourceUrl: string;
  licenseUrl: string;
  fetchedAt: string;
  entryCount: number;
  sectionEnrichment?: Record<string, SunoPromptCatalogEnrichment>;
  targetBuckets?: Record<SunoPromptTarget, SunoPromptBucketMeta[]>;
  enrichmentMeta?: {
    baseModel: string;
    baseUrl: string;
    enrichedAt: string;
    schemaVersion: number;
    mode?: string;
    sectionCount?: number;
    batchSize: number;
  };
  importantSectionMeta?: {
    baseModel: string;
    baseUrl: string;
    enrichedAt: string;
    schemaVersion: number;
    sections: string[];
    entryCount: number;
    batchSize: number;
  };
}

interface SunoPromptCatalogBucketPayload {
  target: SunoPromptTarget;
  mode: 'important' | 'rest';
  bucketKey: string;
  sections: string[];
  entryCount: number;
  entries: SunoPromptCatalogEntry[];
  entryEnrichment?: Record<string, SunoPromptCatalogEnrichment>;
}

interface MatchOptions {
  target: SunoPromptTarget;
  userPrompt: string;
  currentLyrics: string;
  currentStyle: string;
  currentVocal: string;
  emotionHint?: string;
  limit?: number;
}

interface CatalogSectionInfo {
  name: string;
  entryCount: number;
}

let metaPromise: Promise<SunoPromptCatalogMetaPayload> | null = null;
const bucketPromises = new Map<string, Promise<SunoPromptCatalogBucketPayload>>();

const vocalKeywords = [
  'vocal', 'vocals', 'voice', 'voices', 'male', 'female', 'boy', 'girl', 'whisper', 'breathy',
  'falsetto', 'choir', 'chant', 'rap', 'spoken', 'scat', 'duet', 'ボーカル', '歌声', '声', '歌唱',
  '囁き', 'ささやき', '合唱', 'ラップ', 'デュエット', '男声', '女声',
];

const emptyEnrichment: SunoPromptCatalogEnrichment = {
  routeTags: [],
  moods: [],
  eras: [],
  regions: [],
  instruments: [],
  vocalTraits: [],
  energy: 'variable',
};

async function loadMetaCatalog(): Promise<SunoPromptCatalogMetaPayload> {
  if (!metaPromise) {
    metaPromise = import('../../data/sunoPromptCatalog.meta.json')
      .then((module) => module.default as SunoPromptCatalogMetaPayload);
  }

  return metaPromise;
}

async function loadBucketByKey(bucketKey: string): Promise<SunoPromptCatalogBucketPayload> {
  if (!bucketPromises.has(bucketKey)) {
    let promise: Promise<SunoPromptCatalogBucketPayload>;
    switch (bucketKey) {
      case 'style-core':
        promise = import('../../data/sunoPromptCatalog.style-core.json').then((module) => module.default as SunoPromptCatalogBucketPayload);
        break;
      case 'style-club':
        promise = import('../../data/sunoPromptCatalog.style-club.json').then((module) => module.default as SunoPromptCatalogBucketPayload);
        break;
      case 'style-voice':
        promise = import('../../data/sunoPromptCatalog.style-voice.json').then((module) => module.default as SunoPromptCatalogBucketPayload);
        break;
      case 'style-instruments':
        promise = import('../../data/sunoPromptCatalog.style-instruments.json').then((module) => module.default as SunoPromptCatalogBucketPayload);
        break;
      case 'style-regions':
        promise = import('../../data/sunoPromptCatalog.style-regions.json').then((module) => module.default as SunoPromptCatalogBucketPayload);
        break;
      case 'style-misc':
        promise = import('../../data/sunoPromptCatalog.style-misc.json').then((module) => module.default as SunoPromptCatalogBucketPayload);
        break;
      case 'vocal-core':
        promise = import('../../data/sunoPromptCatalog.vocal-core.json').then((module) => module.default as SunoPromptCatalogBucketPayload);
        break;
      case 'vocal-emotion':
        promise = import('../../data/sunoPromptCatalog.vocal-emotion.json').then((module) => module.default as SunoPromptCatalogBucketPayload);
        break;
      case 'vocal-rest':
        promise = import('../../data/sunoPromptCatalog.vocal-rest.json').then((module) => module.default as SunoPromptCatalogBucketPayload);
        break;
      default:
        throw new Error(`Unknown Suno prompt bucket: ${bucketKey}`);
    }
    bucketPromises.set(bucketKey, promise);
  }

  return bucketPromises.get(bucketKey)!;
}

function normalize(value: string) {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTokens(value: string): string[] {
  const normalized = normalize(value);
  const englishTokens = normalized.match(/[a-z0-9][a-z0-9+'&-]{2,}/g) ?? [];
  const mixedTokens = normalized.match(/[a-z0-9]+[\p{Script=Han}]+|[\p{Script=Han}]+[a-z0-9]+/gu) ?? [];
  const katakanaTokens = normalized.match(/[\p{Script=Katakana}ー]{2,}/gu) ?? [];
  const kanjiTokens = normalized.match(/[\p{Script=Han}]{2,}/gu) ?? [];

  return [...new Set([...englishTokens, ...mixedTokens, ...katakanaTokens, ...kanjiTokens])];
}

function resolveEnrichment(
  metaCatalog: SunoPromptCatalogMetaPayload,
  bucket: SunoPromptCatalogBucketPayload,
  entry: SunoPromptCatalogEntry,
) {
  return (
    entry.enrichment ??
    bucket.entryEnrichment?.[entry.id] ??
    metaCatalog.sectionEnrichment?.[entry.section] ??
    emptyEnrichment
  );
}

function keywordScore(
  metaCatalog: SunoPromptCatalogMetaPayload,
  bucket: SunoPromptCatalogBucketPayload,
  entry: SunoPromptCatalogEntry,
  target: SunoPromptTarget,
) {
  const enrichment = resolveEnrichment(metaCatalog, bucket, entry);
  const haystack = normalize([
    entry.section,
    entry.title,
    entry.prompt,
    entry.description,
    ...entry.tags,
    ...enrichment.routeTags,
    ...enrichment.moods,
    ...enrichment.eras,
    ...enrichment.regions,
    ...enrichment.instruments,
    ...enrichment.vocalTraits,
    enrichment.energy,
  ].join(' '));
  const hasVocalSignal = vocalKeywords.some((keyword) => haystack.includes(keyword));

  if (target === 'vocal') {
    return hasVocalSignal ? 10 : -4;
  }

  return hasVocalSignal ? 1 : 6;
}

function matchScore(
  metaCatalog: SunoPromptCatalogMetaPayload,
  bucket: SunoPromptCatalogBucketPayload,
  entry: SunoPromptCatalogEntry,
  tokens: string[],
) {
  const enrichment = resolveEnrichment(metaCatalog, bucket, entry);
  const routeTags = enrichment.routeTags;
  const haystack = normalize([
    entry.section,
    entry.title,
    entry.prompt,
    entry.description,
    ...entry.tags,
    ...routeTags,
    ...enrichment.moods,
    ...enrichment.eras,
    ...enrichment.regions,
    ...enrichment.instruments,
    ...enrichment.vocalTraits,
    enrichment.energy,
  ].join(' '));

  return tokens.reduce((score, token) => {
    if (!token) return score;
    if (haystack.includes(token)) {
      const isRouteTagHit = routeTags.some((routeTag) => normalize(routeTag).includes(token));
      return score + (isRouteTagHit ? 10 : token.length >= 6 ? 8 : 4);
    }
    return score;
  }, 0);
}

function scoreBucket(
  metaCatalog: SunoPromptCatalogMetaPayload,
  bucket: SunoPromptBucketMeta,
  tokens: string[],
) {
  const sectionScore = bucket.sections.reduce((score, section) => {
    const enrichment = metaCatalog.sectionEnrichment?.[section] ?? emptyEnrichment;
    const haystack = normalize([
      section,
      ...enrichment.routeTags,
      ...enrichment.moods,
      ...enrichment.eras,
      ...enrichment.regions,
      ...enrichment.instruments,
      ...enrichment.vocalTraits,
      enrichment.energy,
    ].join(' '));

    return score + tokens.reduce((inner, token) => {
      if (!token) return inner;
      if (haystack.includes(token)) {
        return inner + 5;
      }
      return inner;
    }, 0);
  }, 0);

  const modeBonus = bucket.mode === 'important' ? 12 : 0;
  return sectionScore + modeBonus;
}

async function getRankedBuckets(
  metaCatalog: SunoPromptCatalogMetaPayload,
  target: SunoPromptTarget,
  queryText: string,
): Promise<SunoPromptBucketMeta[]> {
  const buckets = metaCatalog.targetBuckets?.[target] ?? [];
  const tokens = extractTokens(queryText);

  return [...buckets].sort((a, b) => {
    const scoreDiff = scoreBucket(metaCatalog, b, tokens) - scoreBucket(metaCatalog, a, tokens);
    if (scoreDiff !== 0) {
      return scoreDiff;
    }
    return a.key.localeCompare(b.key, 'ja');
  });
}

export async function getCatalogMeta() {
  const catalog = await loadMetaCatalog();
  return {
    sourceUrl: catalog.sourceUrl,
    licenseUrl: catalog.licenseUrl,
    fetchedAt: catalog.fetchedAt,
    entryCount: catalog.entryCount,
    enrichmentMeta: catalog.enrichmentMeta ?? null,
    importantSectionMeta: catalog.importantSectionMeta ?? null,
  };
}

export async function getCatalogSections(target: SunoPromptTarget): Promise<CatalogSectionInfo[]> {
  const metaCatalog = await loadMetaCatalog();
  const counts = new Map<string, number>();
  for (const bucket of metaCatalog.targetBuckets?.[target] ?? []) {
    for (const section of bucket.sections) {
      counts.set(section, (counts.get(section) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([name, entryCount]) => ({ name, entryCount }))
    .sort((a, b) => a.name.localeCompare(b.name, 'ja'));
}

export async function getRelevantSunoPromptEntries(options: MatchOptions): Promise<SunoPromptCatalogEntry[]> {
  const metaCatalog = await loadMetaCatalog();
  const {
    target,
    userPrompt,
    currentLyrics,
    currentStyle,
    currentVocal,
    emotionHint = '',
    limit = 6,
  } = options;

  const queryText = [
    userPrompt,
    target === 'style' ? currentStyle : currentVocal,
    currentLyrics,
    emotionHint,
  ]
    .filter(Boolean)
    .join('\n');

  const tokens = extractTokens(queryText);
  const rankedBuckets = await getRankedBuckets(metaCatalog, target, queryText);
  const primaryBuckets = rankedBuckets.slice(0, Math.min(target === 'style' ? 2 : 2, rankedBuckets.length));
  const remainingBuckets = rankedBuckets.slice(primaryBuckets.length);
  const loadedBuckets: SunoPromptCatalogBucketPayload[] = [];

  for (const bucketMeta of primaryBuckets) {
    loadedBuckets.push(await loadBucketByKey(bucketMeta.key));
  }

  const rankLoadedEntries = (buckets: SunoPromptCatalogBucketPayload[]) => {
    const ranked = buckets.flatMap((bucket) =>
      bucket.entries.map((entry) => ({
        entry,
        score: keywordScore(metaCatalog, bucket, entry, target) + matchScore(metaCatalog, bucket, entry, tokens),
      })),
    )
      .filter(({ score }) => score > 0)
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return a.entry.title.localeCompare(b.entry.title, 'ja');
      });

    const unique = new Map<string, SunoPromptCatalogEntry>();
    for (const candidate of ranked) {
      if (!unique.has(candidate.entry.prompt)) {
        unique.set(candidate.entry.prompt, candidate.entry);
      }
      if (unique.size >= limit) {
        break;
      }
    }
    return [...unique.values()];
  };

  let selected = rankLoadedEntries(loadedBuckets);

  for (const bucketMeta of remainingBuckets) {
    if (selected.length >= limit) {
      break;
    }
    loadedBuckets.push(await loadBucketByKey(bucketMeta.key));
    selected = rankLoadedEntries(loadedBuckets);
  }

  return selected;
}

export async function buildSunoPromptReferenceBlock(options: MatchOptions): Promise<string> {
  const metaCatalog = await loadMetaCatalog();
  const matches = await getRelevantSunoPromptEntries(options);
  if (matches.length === 0) {
    return '';
  }

  const bucketByEntryId = new Map<string, SunoPromptCatalogBucketPayload>();
  const rankedBuckets = await getRankedBuckets(metaCatalog, options.target, [
    options.userPrompt,
    options.target === 'style' ? options.currentStyle : options.currentVocal,
    options.currentLyrics,
    options.emotionHint ?? '',
  ].filter(Boolean).join('\n'));

  for (const bucketMeta of rankedBuckets) {
    if (matches.every((entry) => bucketByEntryId.has(entry.id))) {
      break;
    }
    const bucket = await loadBucketByKey(bucketMeta.key);
    for (const entry of bucket.entries) {
      if (!bucketByEntryId.has(entry.id)) {
        bucketByEntryId.set(entry.id, bucket);
      }
    }
  }

  const intro = options.target === 'style'
    ? 'Use the following Suno style prompt references as strong inspiration when they fit the request.'
    : 'Use the following Suno vocal prompt references as strong inspiration when they fit the request.';

  const items = matches.map((entry, index) => {
    const bucket = bucketByEntryId.get(entry.id);
    const enrichment = bucket
      ? resolveEnrichment(metaCatalog, bucket, entry)
      : metaCatalog.sectionEnrichment?.[entry.section] ?? emptyEnrichment;
    const routeTags = enrichment.routeTags.length
      ? ` | route: ${enrichment.routeTags.slice(0, 4).join(', ')}`
      : '';
    const compactNote = enrichment.moods.length > 0 || enrichment.eras.length > 0 || enrichment.vocalTraits.length > 0
      ? ` | facet: ${[
          ...enrichment.moods.slice(0, 2),
          ...enrichment.eras.slice(0, 1),
          ...enrichment.vocalTraits.slice(0, 2),
        ].join(', ')}`
      : '';
    return `${index + 1}. [${entry.section}] ${entry.title} => ${entry.prompt}${routeTags}${compactNote}`;
  }).join('\n');

  return `${intro}
These references were pre-ranked with offline catalog facets, so prioritize the matched terminology and mood cues when they fit the request.
Blend their terminology naturally instead of copying them blindly, and keep the output clean and directly usable.

Suno prompt references:
${items}`;
}
