---
intent_id: LL-003
owner: lyriclytic-dev
status: active
last_reviewed_at: 2026-03-31
next_review_due: 2026-04-15
---

# LyricLytic HUB

`HUB_SCOPE_DECLARATION`: 本ファイルの適用範囲は `LyricLytic/` ツリー全体。

LyricLytic 配下のドキュメント・仕様・タスクを集約し、実装者・エージェントが正本へ迷わず接続するためのハブ。

## 1. 入口

| 目的 | 最初に読む |
|---|---|
| 要件理解 | `BLUEPRINT.md` → `docs/requirements/requirements.md` |
| 実装着手 | `GUARDRAILS.md` → `docs/implementation/bootstrap-checklist-v1.md` |
| タスク把握 | `docs/requirements/poc-task-breakdown-v1.md` |
| 状態確認 | `docs/requirements/review-log.md` |
| 俯瞰確認 | `docs/BIRDSEYE.md` → `docs/birdseye/index.json` |

## 2. 正本ドキュメント

### 2.1 要件系

| 文書 | 役割 |
|---|---|
| `docs/requirements/requirements.md` | MVP 要件定義正本 |
| `docs/requirements/poc-task-breakdown-v1.md` | PoC フェーズ分解正本 |
| `docs/requirements/frontend-requirements-v1.md` | Frontend 要件正本 |
| `docs/requirements/acceptance-test-cases-v1.md` | 受け入れテスト正本 |
| `docs/requirements/review-log.md` | 要件変更 Gate ログ |

### 2.2 実装系

| 文書 | 役割 |
|---|---|
| `docs/implementation/system-architecture-v1.md` | 4 層構成正本 |
| `docs/implementation/command-contracts-v1.md` | Tauri command 契約正本 |
| `docs/implementation/test-design-v1.md` | テスト設計 / 運用チェックリスト正本 |
| `docs/implementation/bootstrap-checklist-v1.md` | 初期縦切り手順 |
| `docs/implementation/rhyme-implementation-checklist-v1.md` | 韻ガイド実装チェックリスト |
| `docs/requirements/sqlite-schema-v1.sql` | SQLite 正本 |

### 2.3 補助

| 文書 | 役割 |
|---|---|
| `docs/requirements/screen-flow-v1.md` | 画面遷移 |
| `docs/requirements/os-differences-v1.md` | OS 差分メモ |
| `docs/requirements/local-llm-connector-v1.md` | LLM 接続仕様 |
| `docs/requirements/rhyme-analysis-v1.md` | 韻ガイド / 音韻解析仕様 |
| `docs/requirements/logical-delete-ui-v1.md` | 論理削除 UI |
| `docs/requirements/export-spec-v1.md` | エクスポート仕様 |
| `docs/requirements/frontend-design/runtime-visual-gap-review-20260401.md` | モックと現行 UI の質感差分レビュー |
| `docs/requirements/frontend-design/runtime-visual-gap-checklist-20260401.md` | フロント質感差分の対応チェックリスト |

## 3. PoC フェーズ参照

| Phase | 正本節 | 完了条件 |
|---|---|---|
| P0: 開発基盤 | poc-task-breakdown-v1.md#3.1 | 空画面遷移、DB 位置固定、両 OS 起動 |
| P1: 永続化基盤 | poc-task-breakdown-v1.md#3.2 | テーブル生成、CRUD 通、論理削除除外 |
| P2: Project/Draft | poc-task-breakdown-v1.md#3.3 | Project 作成遷移、Draft 復元、切替 1s |
| P3: 歌詞編集 | poc-task-breakdown-v1.md#3.4 | Monaco 組込、自動保存、Section 同期 |
| P4: Snapshot | poc-task-breakdown-v1.md#3.5 | 保存ダイアログ、履歴生成、メモ記録 |
| P5: 差分比較 | poc-task-breakdown-v1.md#3.6 | Diff Editor、版選択、復元確認 |
| P6: RevisionNote/Fragment | poc-task-breakdown-v1.md#3.7 | CRUD、TXT インポート、挿入導線 |
| P7: SongArtifact | poc-task-breakdown-v1.md#3.8 | 紐付け UI、URL/FilePath 必須、確認ダイアログ |
| P8: 論理削除UI | poc-task-breakdown-v1.md#3.9 | バッチ管理、復元、競合チェック |
| P9: エクスポート | poc-task-breakdown-v1.md#3.10 | zip 生成、JSON 正本、論理削除オプション |
| P10: LLM接続 | poc-task-breakdown-v1.md#3.11 | 設定画面、接続確認、JSON パース |
| P11: OS検証 | poc-task-breakdown-v1.md#3.12 | 両 OS 主要フロー、差分記録 |

## 4. Birdseye 参照

人間向けの俯瞰入口は `docs/BIRDSEYE.md`。  
機械向けの依存トポロジ正本は `docs/birdseye/index.json`。

## 5. Task Seed 参照

`docs/tasks/TASK.*-*.md` は未着手タスク候補。

## 6. Agent_tools 連携

| Agent_tools | 活用方法 |
|---|---|
| workflow-cookbook | Birdseye/Task Seed パターン、ガードレール適用 |
| shipyard-cp | plan→dev→acceptance→integrate オーケストレーション |
| agent-protocols | IntentContract/TaskSeed 契約正規化 |

## 7. 読み順

### 新規実装者

1. `BLUEPRINT.md`
2. `GUARDRAILS.md`
3. `docs/BIRDSEYE.md`
4. `docs/requirements/requirements.md` 目次
5. `docs/requirements/poc-task-breakdown-v1.md` フェーズ 0
6. `docs/implementation/bootstrap-checklist-v1.md`

### 機能追加時

1. `GUARDRAILS.md` 禁止事項確認
2. 対象フェーズ正本節
3. `docs/implementation/command-contracts-v1.md` 契約確認
4. 実装 → テスト → Gate ログ

### 要件変更時

1. `docs/requirements/requirements.md` 対象節
2. `docs/requirements/review-log.md` Gate 追記
3. 影響フェーズ確認 → BLUEPRINT 更新

## 8. 運用メモ

- 要件変更は review-log.md へ Gate 追記必須
- PoC フェーズ完了条件は逐次チェック
- OS 差分発見時は os-differences-v1.md 更新
- LLM JSON 揺れ発見時は local-llm-connector-v1.md 更新
