# Manual BB Report: 歌詞感情インサイト v2

## Intake Status

- status: ok
- assumptions: ローカル同期計算のみ、採点ではなく参考値、保存スキーマ変更なし
- blockers: なし

## 根拠付き観点

| id | title | view | techniques | source | rationale |
|---|---|---|---|---|---|
| OBS-SECTION-01 | セクション名ごとに制作判断の粒度が変わる | black | equivalence_partitioning, rule | REQ-V2 | Verse と Chorus の密度差が制作判断に直結する |
| OBS-DIFF-01 | 左右バージョン選択で感情差分が変わる | black | state_transition | REQ-V2 | DiffViewer の選択状態に依存して比較結果が変わる |
| OBS-ORACLE-01 | 根拠表示がブラックボックス感を下げる | black | data, exploratory | REQ-V2 | 数値の判断根拠をユーザーが確認できる必要がある |

## リスク

| id | scenario | I | L | modifiers | score | priority | rationale |
|---|---|---:|---:|---|---:|---|---|
| RISK-01 | 感情値が採点や品質判定に見えてしまう | 3 | 3 | D1/C1/A2 | 44 | P2 | 注意文と制作メモ表現で緩和。最終 UX は目視推奨 |
| RISK-02 | Chorus / Verse の判定が表記揺れで意図通りにならない | 3 | 2 | D1/C1/A2 | 38 | P2 | 代表表記は実装済み。独自名は custom として扱う |
| RISK-03 | 波形や根拠リストが右ペインで読みづらい | 2 | 3 | D1/C1/A2 | 36 | P2 | スモークテストあり。実機目視は推奨 |

## 優先度

- P1: セクション別メトリクス、スナップショット比較
- P2: 根拠表示、制作メモ、右ペイン視認性

## 手動テストケース

| tc_id | priority | title | preconditions | steps | expected | oracle | trace_to | minutes |
|---|---|---|---|---|---|---|---|---:|
| TC-AFFECT-001 | P1 | Verse と Chorus のセクション別メトリクス確認 | Verse / Chorus を含むプロジェクト | 右ペインを確認 | Verse と Chorus が個別行で表示され、密度と緊張が見える | specified: AC-SECTION-METRICS | OBS-SECTION-01, RISK-02 | 4 |
| TC-AFFECT-002 | P1 | DiffViewer の感情差分確認 | 明るい版と暗い版が保存済み | バージョン比較を開き左右を選択 | 明暗・密度・緊張の差分と変化メモが出る | specified: AC-SNAPSHOT-COMPARE | OBS-DIFF-01 | 5 |
| TC-AFFECT-003 | P2 | 根拠と制作メモの読まれ方確認 | 感情語を含む歌詞 | 根拠、制作メモ、注意文を見る | 語句・行番号・該当行が表示され、品質点ではない旨が読める | specified: AC-EVIDENCE / AC-PRODUCTION-ALERTS | OBS-ORACLE-01, RISK-01, RISK-03 | 5 |

## 工数

- prep: 5 分
- execution: 14 分
- evidence: 6 分
- retry buffer: 5 分
- total: 30 分

## Gate

- profile: standard
- decision: go
- reasons:
  - 自動テスト 1356/1356 pass
  - code-to-gate critical/high/risk 0
  - Playwright system-chrome で TC-AFFECT-001..003 を実行し pass
  - P0/P1 blocker と critical assumption は残っていない
- blocking_risks: なし
- waivers: なし
- execution_evidence:
  - `.five-tool-validation/affect-insight-v2/manual-bb/execution-evidence.json`
  - `.five-tool-validation/affect-insight-v2/manual-bb/screenshots/TC-AFFECT-001-003-affect-panel.png`
  - `.five-tool-validation/affect-insight-v2/manual-bb/screenshots/TC-AFFECT-002-diff-viewer.png`

## Go/No-Go Brief

- feature: 歌詞感情インサイト v2
- decision: go
- top risks: 採点に見える UX、セクション名表記揺れ、右ペイン視認性
- evidence: Vitest JSON、HATE real-repo report、code-to-gate analysis、UI smoke、Playwright manual BB execution
- residual risk: 独自セクション名は `custom` 扱いになるため、将来の命名拡張で追加確認する
- required follow-up: なし
