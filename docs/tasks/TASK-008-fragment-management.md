---
task_seed_id: TS-008
intent_id: IC-003
status: completed
created_at: 2026-03-31
---

# TaskSeed: Fragment 管理

## Objective

CollectedFragment の CRUD と本文への挿入を実装する。

## Requirements

### Behavior

- Fragment 一覧表示
- Fragment 作成 (text, source, tags)
- Fragment ステータス更新 (unused/used/hold)
- Fragment 削除
- 本文への挿入

### Constraints

- 検索・フィルタ機能
- ステータス別色分け

## Scope

- In: src/components/FragmentPanel.tsx, src-tauri/src/repositories/fragment_repo.rs
- Out: TXT インポート

## Dependencies

- TS-001, TS-002

## Estimated Duration

0.5d

## Source

`docs/requirements/poc-task-breakdown-v1.md#3.7`