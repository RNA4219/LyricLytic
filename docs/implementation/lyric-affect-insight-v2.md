# 歌詞感情インサイト実装仕様 v2

## 1. 参照元

- 要件: `docs/requirements/lyric-affect-insight-v2.md`
- 既存仕様: `docs/requirements/lyric-affect-metrics-v1.md`
- 着想元: `affect-wave` の `top_emotions`、`trend`、`wave_parameter`

## 2. 実装方針

- 既存の `src/lib/affect/lyricsAffectMetrics.ts` を拡張し、全文、セクション、行、比較を同一ロジックで扱う。
- 保存データ構造は変更しない。スナップショット比較は `LyricVersion.body_text` を都度解析する。
- 表示は `AffectMetricsPanel` と `DiffViewer` に統合し、新しい画面は増やさない。

## 3. 主要 API

```ts
analyzeLyricAffect(text: string): LyricAffectMetrics

analyzeLyricAffectInsight(input: {
  fullText: string;
  sections?: SectionAffectInput[];
}): LyricAffectInsight

compareLyricAffectVersions(leftText: string, rightText: string): LyricAffectComparison
```

## 4. データ構造

- `LyricAffectMetrics`
  - 既存の全文メトリクス。
  - `evidence` と `derived.tension` を追加する。
- `SectionAffectMetrics`
  - セクション ID、表示名、種別、本文、メトリクス、主要感情を持つ。
- `AffectWavePoint`
  - `label`、`scope`、`valence`、`arousal`、`density`、`tension` を持つ。
- `AffectProductionAlert`
  - `kind`、`severity`、`message`、`detail`、`sectionName` を持つ。
- `LyricAffectComparison`
  - 左右のメトリクス、差分、短い解釈文を持つ。

## 5. UI 仕様

### 5.1 右ペイン

- 先頭に全文の上位感情と主要数値を表示する。
- セクション別メトリクスをコンパクトな行リストで表示する。
- 感情波形はセクション順を優先し、セクションがない場合は行順を使う。
- 根拠表示は上位の語句と行を最大 5 件表示する。
- 制作向けアラートは最大 4 件表示する。

### 5.2 DiffViewer

- 歌詞比較タブで左右バージョンが選ばれている場合に、感情差分を表示する。
- `valence` は符号付き、`arousal`、`density`、`tension` は差分符号付きで表示する。
- 差分の解釈文は 3 件まで表示する。

## 6. テスト

- 既存 `lyricsAffectMetrics.test.ts` を拡張する。
- `src/test/fixtures/affectGoldenLyrics.ts` にゴールデン歌詞を置く。
- 以下を確認する。
  - セクション別メトリクスが Verse / Chorus / Bridge を返す。
  - 感情波形の値域が守られる。
  - 根拠が感情名、行番号、語句を返す。
  - Chorus 密度低下などの制作アラートが出る。
  - 明るい / 暗い / 高密度 / 低密度のゴールデンセットで期待傾向が保たれる。
  - スナップショット比較で差分と解釈文が返る。

## 7. five-tool-validation-gate 証跡

- 出力先: `.five-tool-validation/affect-insight-v2/`
- RanD 相当: 要件仮説と受入条件の JSON
- Code-to-gate: `code-to-gate/`
- HATE 相当: Vitest JSON を正規化した自動テスト証跡
- manual-bb 相当: 手動ブラックボックス観点とケース
- QEG 相当: Gate 入力と verdict 記録
