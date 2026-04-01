# LyricLytic 検収レビュー 2026-04-01

## 1. 結論

現時点の判定は **実装ベースで概ね受入れ可能 / テスト基盤は要再整備** とする。  
理由は、ランタイム起動と production build は成立しており、主要な体験も実装側では成立している一方で、**既存自動テスト群の多くが現仕様に追随しておらず、品質ゲートとしては古くなっている** ためである。

本レビューでは **実装を正**、既存テストは **現仕様への追随状況を確認する参考情報** として扱う。  
したがって、`npm test` の失敗件数はそのまま製品不合格を意味しない。ただし、保守性と継続検証の観点では早期に是正が必要である。

製品としての体験はかなり仕上がっており、次の改善が残課題である。

- Frontend 自動テストの再整備
- `llama.cpp` 一本化後のテスト期待値更新
- Rust 側の実テスト追加

## 2. 今回の確認範囲

### 実行コマンド

- `npm run build`
- `npm test`
- `cargo check`
- `cargo test`
- `Start.bat` 起動確認

### 結果サマリ

| 項目 | 結果 | 備考 |
|---|---|---|
| `npm run build` | Pass | production build 成功 |
| `npm test` | Fail | 既存テストの仕様追随遅れを含む |
| `cargo check` | Pass | backend compile 成功 |
| `cargo test` | Pass | 0 tests 実行 |
| `Start.bat` | Pass | 既存 dev server / runtime を検知 |

## 3. 検収 Findings

### F-01 Frontend 自動テストが品質ゲートとして破綻している

- 重要度: High
- 根拠:
  - `src/test/Layout.test.tsx` の 13 件が失敗
  - `src/test/useKeyboardShortcuts.test.ts` の 12 件が失敗
  - `src/test/llm-utils.test.ts` の 10 件が失敗
  - `src/test/config.test.ts` の 5 件が失敗
  - `src/test/useLLMSettings.test.ts` の 2 件が失敗
  - `src/test/sectionUtils.test.ts` の 1 件が失敗
- 評価:
  - 現在の `npm test` は検収用の安全網になっていない
  - ただし、ここでの失敗は **製品不具合そのもの** と **旧仕様テストの崩れ** が混在している
  - 本検収では、`npm test` 失敗をそのまま不合格理由にはせず、**テスト基盤の追随遅れ** として扱う

### F-02 `Layout` の provider 前提変更がテストと同期していない

- 重要度: High
- 該当:
  - `src/components/Layout.tsx`
- 内容:
  - `Layout` は `useProject()` を必須化している
  - 既存テストは `ProjectProvider` なしで描画しており、`useProject must be used within ProjectProvider` で連続失敗している
- 評価:
  - 実ランタイムでは成立しており、主にテスト側の追随不足
  - 検収観点では「テスト再整備対象」

### F-03 `useKeyboardShortcuts` が EventTarget を HTMLElement 前提で扱っている

- 重要度: High
- 該当:
  - `src/lib/hooks/useKeyboardShortcuts.ts`
- 内容:
  - `target.closest('.monaco-editor')` を無条件で呼んでいる
  - `closest` を持たない target で `TypeError` が発生している
- 評価:
  - テストだけでなく、想定外 EventTarget でランタイム例外になる余地がある
  - これはテスト追随ではなく、実装改善候補として扱うべき

### F-04 `llama.cpp` 一本化後も LLM / config 系テスト期待値が旧仕様のまま

- 重要度: High
- 該当:
  - `src/test/llm-utils.test.ts`
  - `src/test/config.test.ts`
  - `src/test/useLLMSettings.test.ts`
- 内容:
  - `Ollama / LM Studio / OpenAI-compatible` 混在時代の想定が残っている
  - 現在は `llama.cpp` 直起動中心の実装に変わっているため、期待値と仕様がずれている
- 評価:
  - テスト失敗の一部は製品不具合ではなく、**仕様変更未追従**
  - 実装を正とする前提では、まずテスト側を直すべき

### F-05 `sectionUtils` の期待値と現仕様がずれている

- 重要度: Medium
- 該当:
  - `src/pages/editor/sectionUtils.ts`
  - `src/test/sectionUtils.test.ts`
- 内容:
  - 改行の扱いが変わった後、旧期待値のまま 1 件失敗している
- 評価:
  - まずは実装を正として期待値を見直す
  - そのうえで違和感が残るなら個別にバグとして切り出す

### F-06 Rust 側の `cargo test` は通るが、実質 0 件である

- 重要度: High
- 該当:
  - `src-tauri/`
- 内容:
  - `cargo test` 自体は成功しているが、実行テスト数は 0
- 評価:
  - `build / check` は通っても、repository / command 契約は自動保証されていない
  - `docs/implementation/test-design-v1.md` の Blocker 群に対して未達

## 4. 受け入れ判定メモ

### 合格と見なせる点

- desktop app としての UI は大きく前進している
- `npm run build` が安定して通る
- `cargo check` が通る
- `Start.bat` が既存 dev server を再利用できる
- `llama.cpp` 前提の導入手順が README に整備されている
- 現行 UI / runtime は、主要なユーザー導線上で製品レベルにかなり近い

### まだ検収完了にできない点

- Frontend 自動テストが現仕様の検証基盤になっていない
- Rust 側の実テストが未整備
- 受け入れケース `TC-01` から `TC-22` を継続的に担保する自動ゲートが不足

## 5. 推奨アクション

### 優先度 A

1. `useKeyboardShortcuts` の `target.closest` 防御を入れる
2. `Layout.test.tsx` を `ProjectProvider` 前提へ更新する
3. `llm-utils / config / useLLMSettings` テストを `llama.cpp` 現仕様に合わせる

### 優先度 B

1. `sectionUtils` のテスト期待値を現仕様に合わせて再確認する
2. `docs/implementation/test-design-v1.md` の Blocker 項目に沿って frontend test を再構成する

### 優先度 C

1. Rust repository / command の単体テストを追加する
2. `cargo test` を 0 件から脱却させる

## 6. 判定更新条件

以下を満たしたら、再検収で `安定受入れ可` 判定へ引き上げられる。

- `npm test` が現仕様ベースで green
- `cargo test` に主要 repository / command テストが追加される
- Blocker 級の test drift が解消される
