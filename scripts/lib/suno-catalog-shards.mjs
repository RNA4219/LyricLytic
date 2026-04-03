import fs from 'node:fs/promises';
import path from 'node:path';

export async function writeSunoCatalogShards(repoRoot, payload) {
  const dataDir = path.join(repoRoot, 'src', 'data');
  const metaPath = path.join(dataDir, 'sunoPromptCatalog.meta.json');
  const importantSections = new Set(payload.importantSectionMeta?.sections ?? []);
  const targetBucketDefinitions = {
    style: [
      { key: 'style-core', mode: 'important', sections: ['日本音楽', 'Pop', 'Rock', 'Jazz'] },
      { key: 'style-club', mode: 'important', sections: ['Dance', 'techno', '年代', '感情'] },
      { key: 'style-voice', mode: 'important', sections: ['声', 'ボーカル'] },
      { key: 'style-instruments', mode: 'rest', sections: ['弦楽器', '主要楽器', '打楽器', '鍵盤楽器', '管楽器', '和楽器', '電子楽器', '楽器編成'] },
      { key: 'style-regions', mode: 'rest', sections: ['アフリカ', 'Africa', 'Europe', 'Asia', 'アメリカ', 'アジア', '中南米', '中南米地域', 'ヨーロッパ', 'オセアニア', '中東', 'America', '極地'] },
      { key: 'style-misc', mode: 'rest', sections: [] },
    ],
    vocal: [
      { key: 'vocal-core', mode: 'important', sections: ['声', 'ボーカル', '日本音楽'] },
      { key: 'vocal-emotion', mode: 'important', sections: ['感情', '年代', 'Pop', 'Rock', 'Jazz'] },
      { key: 'vocal-rest', mode: 'rest', sections: [] },
    ],
  };

  const resolveBucketDefinitions = (target) => {
    const usedSections = new Set(targetBucketDefinitions[target].flatMap((bucket) => bucket.sections));
    const targetSections = [...new Set((payload.entries ?? []).filter((entry) => entry.targets?.includes(target)).map((entry) => entry.section))];
    const miscBucket = targetBucketDefinitions[target].find((bucket) => bucket.sections.length === 0);
    if (miscBucket) {
      miscBucket.sections = targetSections.filter((section) => !usedSections.has(section));
    }
    return targetBucketDefinitions[target];
  };

  const baseMeta = {
    sourceUrl: payload.sourceUrl,
    licenseUrl: payload.licenseUrl,
    fetchedAt: payload.fetchedAt,
    entryCount: payload.entryCount,
    enrichmentMeta: payload.enrichmentMeta ?? null,
    importantSectionMeta: payload.importantSectionMeta ?? null,
    sectionEnrichment: payload.sectionEnrichment ?? {},
    targetBuckets: {},
  };

  const buildBucketPayload = (target, bucket) => {
    const sectionSet = new Set(bucket.sections);
    const entries = (payload.entries ?? []).filter((entry) => {
      if (!entry.targets?.includes(target)) {
        return false;
      }
      const isImportant = importantSections.has(entry.section);
      if (bucket.mode === 'important' && !isImportant) {
        return false;
      }
      if (bucket.mode === 'rest' && isImportant) {
        return false;
      }
      return sectionSet.has(entry.section);
    });
    const entryIds = new Set(entries.map((entry) => entry.id));
    const entryEnrichment = Object.fromEntries(
      Object.entries(payload.entryEnrichment ?? {}).filter(([id]) => entryIds.has(id)),
    );

    return {
      target,
      mode: bucket.mode,
      bucketKey: bucket.key,
      sections: bucket.sections,
      entryCount: entries.length,
      entries,
      entryEnrichment,
    };
  };

  const shardWrites = [];
  await fs.mkdir(dataDir, { recursive: true });
  for (const target of ['style', 'vocal']) {
    const buckets = resolveBucketDefinitions(target)
      .map((bucket) => buildBucketPayload(target, bucket))
      .filter((bucketPayload) => bucketPayload.entryCount > 0);

    baseMeta.targetBuckets[target] = buckets.map((bucketPayload) => ({
      key: bucketPayload.bucketKey,
      mode: bucketPayload.mode,
      sections: bucketPayload.sections,
      entryCount: bucketPayload.entryCount,
    }));

    for (const bucketPayload of buckets) {
      const filename = `sunoPromptCatalog.${bucketPayload.bucketKey}.json`;
      shardWrites.push(
        fs.writeFile(
          path.join(dataDir, filename),
          `${JSON.stringify(bucketPayload, null, 2)}\n`,
          'utf8',
        ),
      );
    }
  }

  await Promise.all([
    fs.writeFile(metaPath, `${JSON.stringify(baseMeta, null, 2)}\n`, 'utf8'),
    ...shardWrites,
  ]);
}
