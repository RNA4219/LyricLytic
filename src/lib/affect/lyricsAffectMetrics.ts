export type EmotionName =
  | 'joy'
  | 'calm'
  | 'curiosity'
  | 'surprise'
  | 'tension'
  | 'sadness'
  | 'anger'
  | 'fear';

export interface EmotionScore {
  name: EmotionName;
  score: number;
}

export interface LyricAffectMetrics {
  topEmotions: EmotionScore[];
  trend: {
    valence: number;
    arousal: number;
    stability: number;
  };
  waveParameter: {
    amplitude: number;
    frequency: number;
    jitter: number;
    glow: number;
    afterglow: number;
    density: number;
  };
  textStats: {
    lineCount: number;
    lyricLineCount: number;
    characterCount: number;
    averageLineLength: number;
    lexicalVariety: number;
  };
}

const EMOTIONS: EmotionName[] = [
  'joy',
  'calm',
  'curiosity',
  'surprise',
  'tension',
  'sadness',
  'anger',
  'fear',
];

const EMOTION_MARKERS: Record<EmotionName, string[]> = {
  joy: [
    '嬉', '喜', '楽', '笑', '希望', '光', '愛', '好き', 'ありがとう', '最高', '夢',
    'joy', 'happy', 'hope', 'love', 'bright', 'smile',
  ],
  calm: [
    '静', '穏', '安ら', '安心', '眠', '夜風', '月', 'ゆっくり', 'そっと', '優し',
    'calm', 'quiet', 'peace', 'soft', 'gentle',
  ],
  curiosity: [
    'なぜ', 'どうして', '知り', '探', '問い', '謎', '未来', '扉', 'どこ', '何',
    'why', 'wonder', 'search', 'question', 'future',
  ],
  surprise: [
    '突然', '驚', 'まさか', '閃', '奇跡', '目覚', '変わる', '一瞬',
    'sudden', 'surprise', 'shock', 'flash',
  ],
  tension: [
    '焦', '揺', '張り', '震', '迷', '壊', '歪', '息が', '鼓動', 'ぎりぎり',
    'tense', 'strain', 'shake', 'break', 'edge',
  ],
  sadness: [
    '悲', '寂', '淋', '泣', '涙', 'さよなら', '失', '孤独', '後悔', '痛み',
    'sad', 'cry', 'tear', 'lonely', 'loss', 'goodbye',
  ],
  anger: [
    '怒', '憎', '叫', '苛', '許せ', '燃や', '砕', '反抗', '牙',
    'anger', 'rage', 'hate', 'shout', 'fight',
  ],
  fear: [
    '怖', '恐', '不安', '怯', '逃げ', '闇', '影', '危険', '終わり', '沈む',
    'fear', 'afraid', 'dark', 'danger', 'dread',
  ],
};

const POLARITY: Record<EmotionName, number> = {
  joy: 0.9,
  calm: 0.45,
  curiosity: 0.2,
  surprise: 0.05,
  tension: -0.45,
  sadness: -0.75,
  anger: -0.7,
  fear: -0.85,
};

const HIGH_AROUSAL: Partial<Record<EmotionName, number>> = {
  joy: 0.45,
  surprise: 0.75,
  tension: 0.8,
  anger: 0.85,
  fear: 0.8,
  curiosity: 0.35,
};

export function analyzeLyricAffect(text: string): LyricAffectMetrics {
  const lyricLines = getLyricLines(text);
  const normalizedText = lyricLines.join('\n').toLowerCase();
  const tokens = tokenizeLyrics(normalizedText);
  const characterCount = [...lyricLines.join('')].length;
  const lyricLineCount = lyricLines.length;
  const averageLineLength = lyricLineCount > 0 ? characterCount / lyricLineCount : 0;
  const lexicalVariety = tokens.length > 0 ? new Set(tokens).size / tokens.length : 0;
  const punctuationEnergy = countMatches(normalizedText, /[!！?？]/g);
  const punctuationRatio = clamp01(punctuationEnergy / Math.max(4, lyricLineCount * 2));
  const lineDensity = clamp01(averageLineLength / 34);

  const emotionScores = scoreEmotions(normalizedText, tokens, {
    lexicalVariety,
    lineDensity,
    punctuationRatio,
  });
  const topEmotions = emotionScores.slice(0, 3);
  const valence = computeValence(emotionScores);
  const arousal = computeArousal(emotionScores, lineDensity, punctuationRatio);
  const stability = computeStability(topEmotions, lexicalVariety, punctuationRatio, lyricLines);
  const activeEmotionRatio = emotionScores.filter((emotion) => emotion.score >= 0.28).length / EMOTIONS.length;
  const density = clamp01(
    lineDensity * 0.34 +
    lexicalVariety * 0.22 +
    activeEmotionRatio * 0.24 +
    clamp01(lyricLineCount / 18) * 0.12 +
    punctuationRatio * 0.08,
  );
  const frequency = clamp01(arousal * 0.44 + activeEmotionRatio * 0.34 + punctuationRatio * 0.22);
  const jitter = compressHighEnd(
    (1 - stability) * 0.46 + activeEmotionRatio * 0.28 + punctuationRatio * 0.26,
    0.58,
    0.16,
  );
  const glow = clamp01(Math.max(0, valence) * 0.62 + scoreLookup(emotionScores, 'joy') * 0.22 + scoreLookup(emotionScores, 'calm') * 0.16);
  const afterglow = clamp01(stability * 0.5 + Math.abs(valence) * 0.22 + scoreLookup(emotionScores, 'calm') * 0.2 + scoreLookup(emotionScores, 'sadness') * 0.08);

  return {
    topEmotions,
    trend: {
      valence: round3(valence),
      arousal: round3(arousal),
      stability: round3(stability),
    },
    waveParameter: {
      amplitude: round3(clamp01(arousal * 0.7 + topEmotions[0].score * 0.3)),
      frequency: round3(frequency),
      jitter: round3(jitter),
      glow: round3(glow),
      afterglow: round3(afterglow),
      density: round3(density),
    },
    textStats: {
      lineCount: text.split('\n').length,
      lyricLineCount,
      characterCount,
      averageLineLength: round3(averageLineLength),
      lexicalVariety: round3(lexicalVariety),
    },
  };
}

function getLyricLines(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !/^\[[^\]]+\]$/.test(line));
}

function tokenizeLyrics(text: string): string[] {
  const latinTokens = text.match(/[a-z0-9']+/g) ?? [];
  const japaneseChars = [...text].filter((char) => /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u.test(char));
  return [...latinTokens, ...japaneseChars];
}

function scoreEmotions(
  normalizedText: string,
  tokens: string[],
  context: { lexicalVariety: number; lineDensity: number; punctuationRatio: number },
): EmotionScore[] {
  const tokenCount = Math.max(1, tokens.length);
  const scores = EMOTIONS.map((emotion) => {
    const markers = EMOTION_MARKERS[emotion];
    const markerHits = markers.reduce((sum, marker) => sum + countMarker(normalizedText, marker.toLowerCase()), 0);
    const markerScore = clamp01(markerHits / Math.max(2.2, Math.sqrt(tokenCount) * 0.9));
    const densityBoost = context.lineDensity * (emotion === 'tension' || emotion === 'fear' ? 0.08 : 0.04);
    const varietyBoost = context.lexicalVariety * (emotion === 'curiosity' || emotion === 'surprise' ? 0.09 : 0.04);
    const punctuationBoost = context.punctuationRatio * (emotion === 'surprise' || emotion === 'anger' || emotion === 'fear' ? 0.16 : 0.05);
    const quietPenalty = markerHits === 0 && emotion !== 'calm' ? 0.04 : 0;
    const calmBase = emotion === 'calm' && markerHits === 0 ? 0.2 : 0.08;
    const rawScore = calmBase + markerScore * 0.72 + densityBoost + varietyBoost + punctuationBoost - quietPenalty;

    return {
      name: emotion,
      score: round3(clamp01(rawScore)),
    };
  });

  return scores.sort((a, b) => b.score - a.score);
}

function computeValence(scores: EmotionScore[]): number {
  const total = scores.reduce((sum, score) => sum + score.score, 0);
  if (total <= 0) return 0;

  const weighted = scores.reduce((sum, score) => sum + score.score * POLARITY[score.name], 0);
  return clamp(weighted / total, -1, 1);
}

function computeArousal(scores: EmotionScore[], lineDensity: number, punctuationRatio: number): number {
  const emotionEnergy = scores.reduce((sum, score) => {
    return sum + score.score * (HIGH_AROUSAL[score.name] ?? 0.2);
  }, 0) / Math.max(0.1, scores.reduce((sum, score) => sum + score.score, 0));

  return clamp01(emotionEnergy * 0.58 + lineDensity * 0.22 + punctuationRatio * 0.2);
}

function computeStability(
  topEmotions: EmotionScore[],
  lexicalVariety: number,
  punctuationRatio: number,
  lyricLines: string[],
): number {
  const first = topEmotions[0]?.score ?? 0;
  const second = topEmotions[1]?.score ?? 0;
  const third = topEmotions[2]?.score ?? 0;
  const concentration = clamp01(first * 0.5 + Math.max(0, first - second) * 1.6);
  const lineLengths = lyricLines.map((line) => [...line].length);
  const lineVariance = computeLineVariance(lineLengths);
  const tailPressure = clamp01(third * 0.38 + punctuationRatio * 0.42 + lineVariance * 0.2);
  return clamp01(0.46 + concentration * 0.34 + lexicalVariety * 0.08 - tailPressure * 0.28);
}

function computeLineVariance(lengths: number[]): number {
  if (lengths.length < 2) return 0;
  const average = lengths.reduce((sum, length) => sum + length, 0) / lengths.length;
  const variance = lengths.reduce((sum, length) => sum + (length - average) ** 2, 0) / lengths.length;
  return clamp01(Math.sqrt(variance) / 18);
}

function scoreLookup(scores: EmotionScore[], emotion: EmotionName): number {
  return scores.find((score) => score.name === emotion)?.score ?? 0;
}

function countMarker(text: string, marker: string): number {
  if (!marker) return 0;
  let count = 0;
  let index = text.indexOf(marker);
  while (index !== -1) {
    count += 1;
    index = text.indexOf(marker, index + marker.length);
  }
  return count;
}

function countMatches(text: string, pattern: RegExp): number {
  return text.match(pattern)?.length ?? 0;
}

function compressHighEnd(value: number, midpoint: number, slope: number): number {
  if (value <= 0) return 0;
  const clamped = clamp01(value);
  return clamp01(1 / (1 + Math.exp(-(clamped - midpoint) / slope)));
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}
