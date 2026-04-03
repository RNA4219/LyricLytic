---
intent_id: LL-001
owner: lyriclytic-dev
status: active
last_reviewed_at: 2026-03-31
next_review_due: 2026-04-15
---

# LyricLytic Blueprint

`HUB_SCOPE_DECLARATION`: 本ファイルの適用範囲は `LyricLytic/` ツリー全体。

LyricLytic は AI 音楽生成サービス向けの歌詞制作支援デスクトップアプリである。
本書は要件定義 `docs/requirements/requirements.md` を最上位方針として扱い、実装判断の基準を定める。

## 1. 目的

- 歌詞の断片収集、構成整理、推敲、バージョン管理、曲紐付けを一貫して扱う
- 編集・推敲中心のローカル完結アプリとして実装する
- AI 支援は局所的なレビュー・候補提示に限定する

## 2. MVP 範囲

### 含めるもの

- Project 管理、歌詞編集、Section 管理、自動保存
- Snapshot 保存、履歴、差分比較、復元
- RevisionNote、CollectedFragment 管理
- SongArtifact 紐付け、全文/Section コピー
- 検索（本文/過去版/断片/タグ）
- モデル頻出表現チェック、低頻出候補レコメンド
- StyleProfile 保持、テキストインポート
- 論理削除と復元、Project エクスポート

### 含めないもの

- 外部 API 連携、クラウド同期
- モバイルアプリ、共同編集
- 全文ドラフト自動生成
- 著作権不明瞭な学習機能

## 3. 技術スタック

| Layer | Technology |
|---|---|
| Frontend | React + Monaco Editor |
| Desktop Shell | Tauri |
| Application | Rust |
| Persistence | SQLite |
| LLM Connector | OpenAI 互換ローカル HTTP API |

## 4. 実装優先順序

PoCフェーズに従う:

```
P0: 開発基盤 → P1: 永続化基盤 → P2: Project/Draft → P3: 歌詞編集 → P4: Snapshot →
P5: 差分比較 → P6: RevisionNote/Fragment → P7: SongArtifact → P8: 論理削除UI →
P9: エクスポート → P10: LLM接続 → P11: OS検証
```

正本: `docs/requirements/poc-task-breakdown-v1.md`

## 5. 主要制約

- Working Draft 1 Project = 1 active draft
- LyricVersion 復元は Working Draft 再構築のみ
- 論理削除前提で unique 制約を partial index で担保
- LLM 接続先は 127.0.0.1/localhost 限定
- 外部 URL は保存・表示のみ、自動アクセス禁止

## 6. 成果物参照

| 文書 | 正本パス |
|---|---|
| 要件定義 | `docs/requirements/requirements.md` |
| PoCタスク分解 | `docs/requirements/poc-task-breakdown-v1.md` |
| システム構成 | `docs/implementation/system-architecture-v1.md` |
| コマンド契約 | `docs/implementation/command-contracts-v1.md` |
| Frontend Constants | `docs/implementation/frontend-constants-v1.md` |
| SQLite Schema | `docs/requirements/sqlite-schema-v1.sql` |
| 画面フロー | `docs/requirements/screen-flow-v1.md` |
| フロントエンド要件 | `docs/requirements/frontend-requirements-v1.md` |
| Bootstrap Checklist | `docs/implementation/bootstrap-checklist-v1.md` |

## 7. 受け入れ基準

- Project 作成 → 歌詞編集 → Snapshot 保存 → 差分比較 → 復元 が成立
- 断片管理 → 本文挿入 が成立
- 曲紐付け → StyleProfile が成立
- 論理削除 → 復元 が成立
- LLM 接続確認 → 頻出表現チェック → 低頻出候補提示 が成立
- Windows/macOS 両方で主要フロー成立

詳細: `docs/requirements/acceptance-test-cases-v1.md`