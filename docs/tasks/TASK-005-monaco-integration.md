---
task_seed_id: TS-005
intent_id: IC-002
status: completed
created_at: 2026-03-31
---

# TaskSeed: Monaco Editor 統合

## Objective

Monaco Editor を React に統合し、セクション単位の編集を実現する。

## Requirements

### Behavior

- Monaco Editor 表示
- セクションタブ切り替え
- 自動保存 (1s debounce)
- セクション追加・削除・並べ替え

### Constraints

- VS Code ライクな編集体験
- ダークテーマ
- minimap 無効

## Commands

```bash
npm install @monaco-editor/react
```

## Scope

- In: src/pages/Editor.tsx, src/styles.css
- Out: Diff Editor, LLM 連携

## Dependencies

- TS-001

## Estimated Duration

0.5d

## Source

`docs/requirements/poc-task-breakdown-v1.md#3.4`