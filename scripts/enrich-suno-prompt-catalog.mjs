import fs from 'node:fs';
import path from 'node:path';
import { writeSunoCatalogShards } from './lib/suno-catalog-shards.mjs';

const ROOT = process.cwd();
const catalogPath = path.join(ROOT, 'src', 'data', 'sunoPromptCatalog.json');

const baseUrlArg = process.argv.find((arg) => arg.startsWith('--base-url='));
const modelArg = process.argv.find((arg) => arg.startsWith('--model='));
const batchSizeArg = process.argv.find((arg) => arg.startsWith('--batch-size='));

const baseUrl = (baseUrlArg?.split('=')[1] || process.env.LYRICLYTIC_LLM_BASE_URL || 'http://127.0.0.1:8080').replace(/\/$/, '');
const model = modelArg?.split('=')[1] || process.env.LYRICLYTIC_LLM_MODEL || 'local-model';
const batchSize = Math.max(1, Number.parseInt(batchSizeArg?.split('=')[1] || '6', 10));

const MOODS = [
  'bright', 'joyful', 'hopeful', 'romantic', 'cute', 'playful', 'calm', 'dreamy', 'nostalgic',
  'melancholic', 'sad', 'dark', 'mysterious', 'epic', 'dramatic', 'aggressive', 'energetic',
  'groovy', 'spiritual', 'warm', 'cool',
];

const ERAS = [
  'traditional', 'retro', '70s', '80s', '90s', '2000s', '2010s', 'modern', 'timeless', 'futuristic',
];

const REGIONS = [
  'japan', 'asia', 'europe', 'america', 'latin', 'africa', 'middle-east', 'oceania', 'global',
];

const INSTRUMENTS = [
  'synth', 'piano', 'electric-piano', 'guitar', 'bass', 'drums', 'strings', 'brass', 'woodwinds',
  'orchestra', 'choir', 'percussion', 'fx', 'electronic', 'traditional-japanese', 'traditional-asian',
];

const VOCAL_TRAITS = [
  'female', 'male', 'boy', 'girl', 'duet', 'choir', 'whisper', 'breathy', 'soft', 'powerful',
  'rap', 'spoken', 'falsetto', 'soulful', 'ethereal', 'robotic',
];

const ENERGIES = ['low', 'medium', 'high', 'variable'];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseFirstJsonObject(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

function normalizeArray(input, allowed, maxLength) {
  if (!Array.isArray(input)) {
    return [];
  }
  const allowedSet = new Set(allowed);
  return [...new Set(input.map((value) => String(value).trim()).filter((value) => allowedSet.has(value)))].slice(0, maxLength);
}

function normalizeRouteTags(input) {
  if (!Array.isArray(input)) {
    return [];
  }
  return [...new Set(
    input
      .map((value) => String(value).trim())
      .filter((value) => value && value.length <= 32),
  )].slice(0, 8);
}

async function callLLM(prompt, maxTokens = 1800) {
  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature: 0.1,
      messages: [{ role: 'user', content: prompt }],
      chat_template_kwargs: { enable_thinking: false },
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const json = await response.json();
  return json?.choices?.[0]?.message?.content ?? '';
}

function buildSectionSummaries(entries) {
  const grouped = new Map();
  for (const entry of entries) {
    const current = grouped.get(entry.section) ?? [];
    current.push(entry);
    grouped.set(entry.section, current);
  }

  return [...grouped.entries()]
    .map(([section, sectionEntries]) => {
      const sample = sectionEntries.slice(0, 10).map((entry) => ({
        title: entry.title,
        prompt: entry.prompt,
        description: entry.description,
        targets: entry.targets,
      }));

      return {
        section,
        entryCount: sectionEntries.length,
        sample,
      };
    })
    .sort((a, b) => {
      if (b.entryCount !== a.entryCount) {
        return b.entryCount - a.entryCount;
      }
      return a.section.localeCompare(b.section, 'ja');
    });
}

function buildBatchPrompt(sectionSummaries) {
  return `You are enriching Suno prompt catalog categories for offline routing inside a desktop app.
Infer compact category attributes from the section name and sample entries.
Do not invent facts beyond the samples.
Keep the output conservative and compact.

Allowed values:
- moods: ${MOODS.join(', ')}
- eras: ${ERAS.join(', ')}
- regions: ${REGIONS.join(', ')}
- instruments: ${INSTRUMENTS.join(', ')}
- vocalTraits: ${VOCAL_TRAITS.join(', ')}
- energy: ${ENERGIES.join(', ')}

Rules:
- routeTags: 4 to 8 short retrieval tags for the whole category. Mix Japanese and English when useful.
- moods / eras / regions / instruments / vocalTraits: use only allowed values.
- energy: exactly one allowed value.
- Return every requested section exactly once.

Sections:
${JSON.stringify(sectionSummaries)}

Respond ONLY with valid JSON:
{
  "sections": [
    {
      "section": "section-name",
      "routeTags": ["tag1", "tag2"],
      "moods": ["bright"],
      "eras": ["80s"],
      "regions": ["japan"],
      "instruments": ["synth", "electric-piano"],
      "vocalTraits": ["female", "soft"],
      "energy": "medium"
    }
  ]
}`;
}

function normalizeProfile(profile) {
  return {
    routeTags: normalizeRouteTags(profile?.routeTags),
    moods: normalizeArray(profile?.moods, MOODS, 5),
    eras: normalizeArray(profile?.eras, ERAS, 4),
    regions: normalizeArray(profile?.regions, REGIONS, 4),
    instruments: normalizeArray(profile?.instruments, INSTRUMENTS, 6),
    vocalTraits: normalizeArray(profile?.vocalTraits, VOCAL_TRAITS, 6),
    energy: ENERGIES.includes(profile?.energy) ? profile.energy : 'variable',
  };
}

async function enrichBatch(sectionSummaries) {
  const prompt = buildBatchPrompt(sectionSummaries);
  const content = await callLLM(prompt);
  const parsed = parseFirstJsonObject(content);
  if (!parsed || !Array.isArray(parsed.sections)) {
    throw new Error('Failed to parse enrichment JSON');
  }

  const bySection = new Map(parsed.sections.map((profile) => [String(profile.section), normalizeProfile(profile)]));
  const missing = sectionSummaries.filter((summary) => !bySection.has(summary.section));
  if (missing.length > 0) {
    throw new Error(`Missing sections: ${missing.map((item) => item.section).join(', ')}`);
  }

  return bySection;
}

async function main() {
  const raw = fs.readFileSync(catalogPath, 'utf8');
  const data = JSON.parse(raw);
  const entries = data.entries || [];
  const sectionSummaries = buildSectionSummaries(entries);
  const sectionEnrichment = {};

  for (let index = 0; index < sectionSummaries.length; index += batchSize) {
    const batch = sectionSummaries.slice(index, index + batchSize);
    let success = false;
    let attempts = 0;

    while (!success && attempts < 3) {
      attempts += 1;
      try {
        const enriched = await enrichBatch(batch);
        for (const summary of batch) {
          sectionEnrichment[summary.section] = enriched.get(summary.section);
        }
        console.log(`enriched sections ${index + 1}-${index + batch.length} / ${sectionSummaries.length}`);
        success = true;
      } catch (error) {
        console.warn(`section batch ${index + 1}-${index + batch.length} failed (attempt ${attempts}):`, error.message);
        await sleep(500);
      }
    }

    if (!success) {
      throw new Error(`Failed to enrich section batch ${index + 1}-${index + batch.length}`);
    }
  }

  data.sectionEnrichment = sectionEnrichment;
  data.enrichmentMeta = {
    baseModel: model,
    baseUrl,
    enrichedAt: new Date().toISOString(),
    schemaVersion: 2,
    mode: 'section',
    sectionCount: sectionSummaries.length,
    batchSize,
  };
  data.entries = entries.map((entry) => {
    const { enrichment: _ignored, ...rest } = entry;
    return rest;
  });

  fs.writeFileSync(catalogPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  await writeSunoCatalogShards(ROOT, data);
  console.log(`done: ${sectionSummaries.length} sections enriched using ${model} via ${baseUrl}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
