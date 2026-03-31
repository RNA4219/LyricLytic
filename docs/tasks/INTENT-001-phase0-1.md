---
intent_id: IC-001
status: active
created_at: 2026-03-31
---

# IntentContract: LyricLytic PoC Phase 0-1

## Intent

LyricLytic PoC の開発基盤と永続化基盤を確立する。
フェーズ 0 (Tauri 最小構成) とフェーズ 1 (SQLite 基盤) を縦切りで成立させる。

## Capabilities Required

- read_repo
- write_repo
- install_deps

## Risk Level

medium

## Task Seeds

- TS-001: Tauri 最小構成
- TS-002: SQLite 初期化
- TS-003: Repository 層 CRUD
- TS-004: 両 OS 起動確認

## Acceptance Gates

- 空画面遷移成立
- DB ファイル位置固定
- Windows/macOS 起動確認

## Source

`docs/requirements/poc-task-breakdown-v1.md#3.1-3.2`