---
task_seed_id: TS-002
intent_id: IC-001
status: completed
created_at: 2026-03-31
---

# TaskSeed: SQLite 初期化

## Objective

SQLite 初期化とマイグレーション適用を実装し、DB ファイル位置を固定する。

## Requirements

### Behavior

- sqlite-schema-v1.sql を初期マイグレーションへ適用
- DB ファイル位置固定 (Tauri app_data_dir)
- マイグレーション実行確認コマンド

### Constraints

- foreign_keys ON
- ISO-8601 UTC text timestamps
- Partial unique indexes 設定

## Commands

```bash
# Rust 側実装
# src-tauri/src/db/migration.rs
# src-tauri/migrations/001_init.sql
```

## Scope

- In: src-tauri/src/db/, src-tauri/migrations/
- Out: Repository 層 CRUD

## Dependencies

- TS-001

## Estimated Duration

0.25d

## Source

`docs/requirements/sqlite-schema-v1.sql`