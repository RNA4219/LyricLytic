import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM, VirtualConsole } from 'jsdom';
import { writeSunoCatalogShards } from './lib/suno-catalog-shards.mjs';

const SOURCE_URL = 'https://ai.suno.jp/prompt/';
const LICENSE_URL = 'https://ai.suno.jp/license/';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const outputPath = path.join(repoRoot, 'src', 'data', 'sunoPromptCatalog.json');

const vocalKeywords = [
  'vocal', 'vocals', 'voice', 'voices', 'male vocal', 'female vocal', 'boy vocals', 'girl vocals',
  'whisper', 'breathy', 'falsetto', 'choir', 'chant', 'rap', 'scream', 'spoken', 'duet', 'scat',
  'ボーカル', '声', '歌声', '歌唱', '囁き', 'ささやき', 'ラップ', '合唱', '詠唱', 'デュエット', '男声', '女声',
];

const normalizeWhitespace = (value) => value.replace(/\s+/g, ' ').trim();

function decodePromptValue(rawValue) {
  return rawValue
    .replace(/\\’/g, '’')
    .replace(/\\\\/g, '')
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildDescription(flatText, prompt, title, tags) {
  let description = flatText
    .replace(/^Suno\s+Wiki\s+/i, '')
    .replace(prompt, '')
    .replace(title, '')
    .replace(/♬\s*(検証曲\d+|参考曲)+/g, ' ')
    .replace(/\[[^\]]+\]/g, ' ')
    .replace(/画像出典/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  for (const tag of tags) {
    description = description.replace(tag, '').trim();
  }

  return description;
}

function classifyTargets({ section, title, prompt, description, tags }) {
  const haystack = `${section} ${title} ${prompt} ${description} ${tags.join(' ')}`.toLowerCase();
  const vocalHit = vocalKeywords.some((keyword) => haystack.includes(keyword.toLowerCase()));
  if (vocalHit) {
    return ['style', 'vocal'];
  }
  if (section.includes('声') || section.includes('ボーカル')) {
    return ['style', 'vocal'];
  }
  return ['style'];
}

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'LyricLytic prompt catalog updater (+https://github.com/)',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: HTTP ${response.status}`);
  }

  return response.text();
}

async function main() {
  const html = await fetchHtml(SOURCE_URL);
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('error', () => {});
  virtualConsole.on('warn', () => {});

  const dom = new JSDOM(html, { virtualConsole });
  const { document } = dom.window;

  let currentSection = '';
  const entries = [];

  for (const row of [...document.querySelectorAll('tr')]) {
    const heading = row.querySelector('h2[id]');
    if (heading) {
      currentSection = normalizeWhitespace((heading.textContent || '').replace(/プロンプト$/, ''));
      continue;
    }

    const promptAnchors = [...row.querySelectorAll('a')].filter((anchor) =>
      (anchor.getAttribute('onclick') || '').includes("ax('"),
    );

    if (promptAnchors.length === 0) {
      continue;
    }

    const promptOnClick = promptAnchors[0].getAttribute('onclick') || '';
    const promptMatch = promptOnClick.match(/ax\('([\s\S]*?)'\)/);
    const prompt = decodePromptValue(promptMatch?.[1] || '');
    if (!prompt) {
      continue;
    }

    const titleAnchor = promptAnchors[1] || promptAnchors[0];
    const title = normalizeWhitespace(titleAnchor.textContent || prompt);
    const hiddenTagText = row.querySelector('.c_k')?.textContent || '';
    const tags = [...hiddenTagText.matchAll(/\[([^\]]+)\]/g)].map((match) => match[1]);
    const flatText = normalizeWhitespace(row.textContent || '');
    const description = buildDescription(flatText, prompt, title, tags);
    const targets = classifyTargets({ section: currentSection, title, prompt, description, tags });

    entries.push({
      id: `${currentSection || 'misc'}:${title}`.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, ''),
      section: currentSection || 'misc',
      title,
      prompt,
      description,
      tags,
      targets,
    });
  }

  const payload = {
    sourceUrl: SOURCE_URL,
    licenseUrl: LICENSE_URL,
    fetchedAt: new Date().toISOString(),
    entryCount: entries.length,
    entries,
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  await writeSunoCatalogShards(repoRoot, payload);
  console.log(`Updated ${outputPath} with ${entries.length} entries.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
