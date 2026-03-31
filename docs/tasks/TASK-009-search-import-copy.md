---
task_seed_id: TS-009
intent_id: IC-004
status: in_progress
created_at: 2026-04-01
---

# TaskSeed: 検索・インポート・コピー拡張

## Objective

検索パネル、.txtインポート、コピー整形オプションを実装する。

## Requirements

### Behavior

- 検索パネル (本文/過去版/断片/タグ 切替)
- .txtファイルインポート (断片または本文)
- コピー整形 (見出し有無/空行保持オプション)

## Scope

- In: SearchPanel.tsx, ImportDialog.tsx, CopyOptionsPanel.tsx
- Out: 高度な検索構文

## Dependencies

- TS-001, TS-002, TS-003

## Estimated Duration

0.5d