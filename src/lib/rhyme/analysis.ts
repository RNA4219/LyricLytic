import { analyzeRhymeText } from '../api';

export type RhymeGuideSource = 'fallback' | 'sudachi_core';

export interface RhymeGuideRow {
  line: string;
  romanizedText: string;
  vowelText: string;
  consonantText: string;
  source: RhymeGuideSource;
}

export interface RhymeAnalysisOptions {
  includeSource?: boolean;
}

export interface GuideHighlightParts {
  prefix: string;
  match: string;
}

const LATIN_VOWELS = new Set(['a', 'e', 'i', 'o', 'u', 'y']);

const KANA_ROMAJI_MAP: Record<string, string> = {
  あ: 'a', い: 'i', う: 'u', え: 'e', お: 'o',
  か: 'ka', き: 'ki', く: 'ku', け: 'ke', こ: 'ko',
  さ: 'sa', し: 'shi', す: 'su', せ: 'se', そ: 'so',
  た: 'ta', ち: 'chi', つ: 'tsu', て: 'te', と: 'to',
  な: 'na', に: 'ni', ぬ: 'nu', ね: 'ne', の: 'no',
  は: 'ha', ひ: 'hi', ふ: 'fu', へ: 'he', ほ: 'ho',
  ま: 'ma', み: 'mi', む: 'mu', め: 'me', も: 'mo',
  や: 'ya', ゆ: 'yu', よ: 'yo',
  ら: 'ra', り: 'ri', る: 'ru', れ: 're', ろ: 'ro',
  わ: 'wa', を: 'o', ん: 'n',
  が: 'ga', ぎ: 'gi', ぐ: 'gu', げ: 'ge', ご: 'go',
  ざ: 'za', じ: 'ji', ず: 'zu', ぜ: 'ze', ぞ: 'zo',
  だ: 'da', ぢ: 'ji', づ: 'zu', で: 'de', ど: 'do',
  ば: 'ba', び: 'bi', ぶ: 'bu', べ: 'be', ぼ: 'bo',
  ぱ: 'pa', ぴ: 'pi', ぷ: 'pu', ぺ: 'pe', ぽ: 'po',
  ぁ: 'a', ぃ: 'i', ぅ: 'u', ぇ: 'e', ぉ: 'o',
  ゔ: 'vu',
};

const DIGRAPH_MAP: Record<string, string> = {
  きゃ: 'kya', きゅ: 'kyu', きょ: 'kyo',
  しゃ: 'sha', しゅ: 'shu', しょ: 'sho',
  ちゃ: 'cha', ちゅ: 'chu', ちょ: 'cho',
  にゃ: 'nya', にゅ: 'nyu', にょ: 'nyo',
  ひゃ: 'hya', ひゅ: 'hyu', ひょ: 'hyo',
  みゃ: 'mya', みゅ: 'myu', みょ: 'myo',
  りゃ: 'rya', りゅ: 'ryu', りょ: 'ryo',
  ぎゃ: 'gya', ぎゅ: 'gyu', ぎょ: 'gyo',
  じゃ: 'ja', じゅ: 'ju', じょ: 'jo',
  ぢゃ: 'ja', ぢゅ: 'ju', ぢょ: 'jo',
  びゃ: 'bya', びゅ: 'byu', びょ: 'byo',
  ぴゃ: 'pya', ぴゅ: 'pyu', ぴょ: 'pyo',
  うぁ: 'wa', うぃ: 'wi', うぇ: 'we', うぉ: 'wo',
  ふぁ: 'fa', ふぃ: 'fi', ふぇ: 'fe', ふぉ: 'fo',
  てぃ: 'ti', でぃ: 'di',
  とぅ: 'tu', どぅ: 'du',
  ゔぁ: 'va', ゔぃ: 'vi', ゔぇ: 've', ゔぉ: 'vo',
};

function katakanaToHiragana(value: string) {
  return value.replace(/[\u30a1-\u30f6]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) - 0x60),
  );
}

function splitRomanized(romaji: string) {
  const letters = romaji.toLowerCase().replace(/[^a-z]/g, '');
  if (!letters) {
    return null;
  }

  let vowelPart = '';
  let consonantPart = '';

  for (const char of letters) {
    if (LATIN_VOWELS.has(char)) {
      vowelPart += char;
    } else {
      consonantPart += char;
    }
  }

  return {
    romanized: letters,
    vowels: vowelPart || '—',
    consonants: consonantPart || '—',
  };
}

function toRomanizedTokens(line: string) {
  const normalizedLine = katakanaToHiragana(line.toLowerCase());
  const tokens: string[] = [];
  let index = 0;

  while (index < normalizedLine.length) {
    const current = normalizedLine[index];
    const next = normalizedLine[index + 1] ?? '';
    const pair = `${current}${next}`;

    if (/\s/.test(current)) {
      if (tokens[tokens.length - 1] !== '|') {
        tokens.push('|');
      }
      index += 1;
      continue;
    }

    if (current === 'っ') {
      const lookaheadPair = `${next}${normalizedLine[index + 2] ?? ''}`;
      const nextRomaji = DIGRAPH_MAP[lookaheadPair] || KANA_ROMAJI_MAP[next] || '';
      if (nextRomaji) {
        tokens.push(nextRomaji[0]);
      }
      index += 1;
      continue;
    }

    if (current === 'ー') {
      const prev = tokens[tokens.length - 1] ?? '';
      const prevVowelMatch = prev.match(/[aeiou]$/);
      if (prevVowelMatch) {
        tokens.push(prevVowelMatch[0]);
      }
      index += 1;
      continue;
    }

    if (DIGRAPH_MAP[pair]) {
      tokens.push(DIGRAPH_MAP[pair]);
      index += 2;
      continue;
    }

    if (KANA_ROMAJI_MAP[current]) {
      tokens.push(KANA_ROMAJI_MAP[current]);
      index += 1;
      continue;
    }

    if (/[a-z]/.test(current)) {
      let latinWord = current;
      let j = index + 1;
      while (j < normalizedLine.length && /[a-z]/.test(normalizedLine[j])) {
        latinWord += normalizedLine[j];
        j += 1;
      }
      tokens.push(latinWord);
      index = j;
      continue;
    }

    index += 1;
  }

  return tokens;
}

function normalizePipeSpacing(value: string) {
  return value.replace(/\s*\|\s*/g, ' | ').trim().replace(/^\|\s*|\s*\|$/g, '');
}

function toGuide(line: string): RhymeGuideRow | null {
  const rawTokens = toRomanizedTokens(line);
  const guideTokens = rawTokens
    .map((token) => {
      if (token === '|') {
        return { romanized: '|', vowels: '|', consonants: '|' };
      }
      return splitRomanized(token);
    })
    .filter((token): token is { romanized: string; vowels: string; consonants: string } => Boolean(token));

  if (guideTokens.length === 0) {
    return null;
  }

  const romanizedText = normalizePipeSpacing(guideTokens.map((token) => token.romanized).join(' '));
  const vowelText = normalizePipeSpacing(guideTokens.map((token) => token.vowels).join(' '));
  const consonantText = normalizePipeSpacing(guideTokens.map((token) => token.consonants).join(' '));

  return {
    line,
    romanizedText: romanizedText || '—',
    vowelText: vowelText || '—',
    consonantText: consonantText || '—',
    source: 'fallback',
  };
}

export function buildFallbackRhymeGuideRows(text: string, _options: RhymeAnalysisOptions = {}): RhymeGuideRow[] {
  return text
    .split('\n')
    .filter((line) => line.trim().length > 0 && !/^\[[^\]]+\]$/.test(line.trim()))
    .map(toGuide)
    .filter((row): row is RhymeGuideRow => Boolean(row));
}

export function buildRhymeGuideRows(text: string, options: RhymeAnalysisOptions = {}) {
  return buildFallbackRhymeGuideRows(text, options);
}

function tokenizeGuideValue(value: string) {
  return value
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0);
}

export function getGuideHighlightParts(value: string, previousValue?: string | null): GuideHighlightParts {
  if (!previousValue) {
    return { prefix: value, match: '' };
  }

  const currentTokens = tokenizeGuideValue(value);
  const previousTokens = tokenizeGuideValue(previousValue);

  let matchCount = 0;
  while (
    matchCount < currentTokens.length &&
    matchCount < previousTokens.length
  ) {
    const currentToken = currentTokens[currentTokens.length - 1 - matchCount];
    const previousToken = previousTokens[previousTokens.length - 1 - matchCount];

    if (currentToken === '|' || previousToken === '|') {
      break;
    }

    if (currentToken !== previousToken) {
      break;
    }

    matchCount += 1;
  }

  if (matchCount === 0) {
    return { prefix: value, match: '' };
  }

  const prefixTokens = currentTokens.slice(0, currentTokens.length - matchCount);
  const matchTokens = currentTokens.slice(currentTokens.length - matchCount);

  return {
    prefix: prefixTokens.join(' ').trim(),
    match: matchTokens.join(' ').trim(),
  };
}

export async function analyzeRhymeGuideRows(text: string, options: RhymeAnalysisOptions = {}): Promise<RhymeGuideRow[]> {
  if (!text.trim()) {
    return [];
  }

  try {
    const rows = await analyzeRhymeText(text);
    if (rows.length > 0) {
      return rows;
    }
  } catch (error) {
    console.warn('Sudachi rhyme analysis failed. Falling back to local rules.', error);
  }

  return buildFallbackRhymeGuideRows(text, options);
}
