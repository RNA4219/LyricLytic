---
task_seed_id: TS-007
intent_id: IC-003
status: completed
created_at: 2026-03-31
---

# TaskSeed: Diff Editor 統合

## Objective

Monaco Diff Editor を統合し、バージョン間の差分比較を実現する。

## Requirements

### Behavior

- 2 つのバージョンを選択して比較
- Side-by-side diff 表示
- 読み取り専用モード

### Constraints

- Monaco DiffEditor 使用
- ダークテーマ

## Scope

- In: src/components/DiffViewer.tsx
- Out: Inline diff

## Dependencies

- TS-005

## Estimated Duration

0.5d

## Source

`docs/requirements/poc-task-breakdown-v1.md#3.6`