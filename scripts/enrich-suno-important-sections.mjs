import fs from 'node:fs';
import path from 'node:path';
import { writeSunoCatalogShards } from './lib/suno-catalog-shards.mjs';

const ROOT = process.cwd();
const catalogPath = path.join(ROOT, 'src', 'data', 'sunoPromptCatalog.json');

const baseUrlArg = process.argv.find((arg) => arg.startsWith('--base-url='));
const modelArg = process.argv.find((arg) => arg.startsWith('--model='));
const batchSizeArg = process.argv.find((arg) => arg.startsWith('--batch-size='));
const sectionsArg = process.argv.find((arg) => arg.startsWith('--sections='));

const baseUrl = (baseUrlArg?.split('=')[1] || process.env.LYRICLYTIC_LLM_BASE_URL || 'http://127.0.0.1:8080').replace(/\/$/, '');
const model = modelArg?.split('=')[1] || process.env.LYRICLYTIC_LLM_MODEL || 'local-model';
const batchSize = Math.max(1, Number.parseInt(batchSizeArg?.split('=')[1] || '10', 10));
const importantSections = (sectionsArg?.split('=')[1]?.split(',').map((value) => value.trim()).filter(Boolean) ?? [
  '日本音楽',
  'Pop',
  'Rock',
  'Jazz',
  'Dance',
  'techno',
  '声',
  'ボーカル',
  '感情',
  '年代',
]);

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

async function callLLM(prompt, maxTokens = 1500) {
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

function buildBatchPrompt(entries) {
  const payload = entries.map((entry, index) => ({
    key: `k${index + 1}`,
    section: entry.section,
    title: entry.title,
    prompt: entry.prompt,
    description: entry.description,
    targets: entry.targets,
  }));

  return `You are enriching important Suno prompt entries for offline retrieval inside a desktop app.
These entries already inherit broad section-level attributes. Your job is to add entry-specific fine-grained hints.
Infer compact routing attributes from the provided metadata only.
Do not invent facts beyond the wording given.

Allowed values:
- moods: ${MOODS.join(', ')}
- eras: ${ERAS.join(', ')}
- regions: ${REGIONS.join(', ')}
- instruments: ${INSTRUMENTS.join(', ')}
- vocalTraits: ${VOCAL_TRAITS.join(', ')}
- energy: ${ENERGIES.join(', ')}

Rules:
- routeTags: 3 to 8 short retrieval tags that are specific to this entry, not just the parent section.
- moods / eras / regions / instruments / vocalTraits: use only allowed values.
- energy: exactly one allowed value.
- Return every requested key exactly once.

Entries:
${JSON.stringify(payload)}

Respond ONLY with valid JSON:
{
  "entries": [
    {
      "key": "k1",
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

async function enrichBatch(entries) {
  const prompt = buildBatchPrompt(entries);
  const content = await callLLM(prompt);
  const parsed = parseFirstJsonObject(content);
  if (!parsed || !Array.isArray(parsed.entries)) {
    throw new Error('Failed to parse enrichment JSON');
  }
  const keyToId = new Map(entries.map((entry, index) => [`k${index + 1}`, entry.id]));
  const byId = new Map(
    parsed.entries
      .map((profile) => [keyToId.get(String(profile.key)), normalizeProfile(profile)])
      .filter(([id]) => Boolean(id)),
  );
  const missing = entries.filter((entry) => !byId.has(entry.id));
  if (missing.length > 0) {
    throw new Error(`Missing ids: ${missing.map((item) => item.id).join(', ')}`);
  }
  return byId;
}

async function main() {
  const raw = fs.readFileSync(catalogPath, 'utf8');
  const data = JSON.parse(raw);
  const entries = (data.entries || []).filter((entry) => importantSections.includes(entry.section));
  const entryEnrichment = { ...(data.entryEnrichment ?? {}) };

  for (let index = 0; index < entries.length; index += batchSize) {
    const batch = entries.slice(index, index + batchSize);
    let success = false;
    let attempts = 0;

    while (!success && attempts < 3) {
      attempts += 1;
      try {
        const enriched = await enrichBatch(batch);
        for (const entry of batch) {
          entryEnrichment[entry.id] = enriched.get(entry.id);
        }
        console.log(`enriched entries ${index + 1}-${index + batch.length} / ${entries.length}`);
        success = true;
      } catch (error) {
        console.warn(`entry batch ${index + 1}-${index + batch.length} failed (attempt ${attempts}):`, error.message);
        await sleep(500);
      }
    }

    if (!success) {
      throw new Error(`Failed to enrich entry batch ${index + 1}-${index + batch.length}`);
    }
  }

  data.entryEnrichment = entryEnrichment;
  data.importantSectionMeta = {
    baseModel: model,
    baseUrl,
    enrichedAt: new Date().toISOString(),
    schemaVersion: 1,
    sections: importantSections,
    entryCount: entries.length,
    batchSize,
  };

  fs.writeFileSync(catalogPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  await writeSunoCatalogShards(ROOT, data);
  console.log(`done: ${entries.length} important entries enriched using ${model} via ${baseUrl}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
