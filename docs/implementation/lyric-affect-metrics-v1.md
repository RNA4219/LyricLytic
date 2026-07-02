# 歌詞感情メトリクス実装仕様 v1

## 1. 参照元

- 要件: `docs/requirements/lyric-affect-metrics-v1.md`
- 着想元: `affect-wave` の `top_emotions`、`trend`、`wave_parameter`

## 2. 責務分離

- `src/lib/affect/lyricsAffectMetrics.ts`
  - 歌詞テキストからメトリクスを算出する純粋関数。
  - UI、保存、LLM 接続に依存しない。
- `src/components/AffectMetricsPanel.tsx`
  - 解析結果を右ペインに表示する。
  - 表示と補助説明のみを担当する。
- `src/pages/editor/ActionPane.tsx`
  - 現在表示中の歌詞を `AffectMetricsPanel` へ渡す。

## 3. データ構造

```ts
type EmotionName =
  | 'joy'
  | 'calm'
  | 'curiosity'
  | 'surprise'
  | 'tension'
  | 'sadness'
  | 'anger'
  | 'fear';

interface LyricAffectMetrics {
  topEmotions: Array<{ name: EmotionName; score: number }>;
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
```

## 4. 算出ルール

- セクション見出し `[Verse]` などは感情・密度計算から除外する。
- 日本語は文字単位、英数字は単語単位で簡易 token 化する。
- 感情スコアは、ラベル別マーカーの出現、句読点・感嘆符・疑問符、行密度を組み合わせる。
- `valence` は感情ラベルの極性重み付き平均で算出する。
- `arousal` は高覚醒感情、句読点、行密度から算出する。
- `stability` は上位感情の集中度、疑問符・感嘆符、短行の揺れから算出する。
- `density` は `averageLineLength`、`lexicalVariety`、活性感情数、歌詞行数を合成する。

## 5. 表示仕様

- 右ペインの LLM 補助より前に表示する。
- 上位 3 感情は横棒でスコア表示する。
- trend と wave parameter は小さな数値グリッドで表示する。
- `density` は「密度」として目立つ位置に表示する。
- 空テキストでは中立表示にする。

## 6. テスト

- `src/test/lyricsAffectMetrics.test.ts` で以下を確認する。
  - 空テキストの安全性
  - 値域
  - 明るい歌詞で positive 系が上位
  - 不安・恐怖の歌詞で negative/high arousal 系が上位
  - 密度の差分
