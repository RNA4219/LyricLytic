---
task_seed_id: TS-004
intent_id: IC-001
status: completed
created_at: 2026-03-31
---

# TaskSeed: 両 OS 起動確認

## Objective

Windows 11 と macOS 最新安定版で Tauri アプリ起動確認を行う。

## Requirements

### Behavior

- Windows 11: npm run tauri dev 起動成功
- macOS: npm run tauri dev 起動成功
- 空画面遷移確認
- DB ファイル生成位置確認

### Constraints

- 両 OS 同一コードベース
- OS 差分は os-differences-v1.md に記録

## Commands

```bash
# Windows
npm run tauri dev

# macOS
npm run tauri dev
```

## Scope

- In: 起動確認、DB 位置確認
- Out: 機能テスト

## Dependencies

- TS-001
- TS-002
- TS-003

## Estimated Duration

0.25d

## Source

`docs/requirements/poc-task-breakdown-v1.md#3.1完了条件`