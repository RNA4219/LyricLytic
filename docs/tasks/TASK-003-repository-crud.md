---
task_seed_id: TS-003
intent_id: IC-001
status: completed
created_at: 2026-03-31
---

# TaskSeed: Repository 層 CRUD

## Objective

Project / WorkingDraft / LyricVersion の Repository 層 CRUD を実装する。

## Requirements

### Behavior

- ProjectRepository: create, read, update, delete (soft)
- WorkingDraftRepository: create, read, update
- LyricVersionRepository: create, read, list_by_project
- deleted_at IS NULL を active 既定フィルタ

### Constraints

- Transaction 境界明示
- UI 層に SQL 漏出禁止
- Rust async 実装

## Commands

```bash
# Rust 側実装
# src-tauri/src/repositories/project_repo.rs
# src-tauri/src/repositories/working_draft_repo.rs
# src-tauri/src/repositories/lyric_version_repo.rs
```

## Scope

- In: src-tauri/src/repositories/
- Out: Tauri Command 層

## Dependencies

- TS-002

## Estimated Duration

0.5d

## Source

`docs/implementation/system-architecture-v1.md#2.4`