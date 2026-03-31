---
intent_id: IC-003
status: completed
created_at: 2026-03-31
---

# IntentContract: LyricLytic PoC Phase 5-6

## Intent

LyricLytic PoC の Phase 5 (差分比較) と Phase 6 (RevisionNote/Fragment) を完了させる。
Diff Editor 統合、Fragment 管理、本文挿入を実装。

## Capabilities Required

- read_repo
- write_repo
- install_deps

## Risk Level

medium

## Task Seeds

- TS-007: Diff Editor 統合 ✓
- TS-008: Fragment 管理 ✓

## Acceptance Gates

- 任意の 2 版を比較できる
- Fragment を追加・削除できる
- Fragment を本文に挿入できる

## Source

`docs/requirements/poc-task-breakdown-v1.md#3.6-3.7`