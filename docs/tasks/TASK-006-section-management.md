---
task_seed_id: TS-006
intent_id: IC-002
status: completed
created_at: 2026-03-31
---

# TaskSeed: Section 管理

## Objective

セクションプリセットとカスタムセクションの管理を実装する。

## Requirements

### Behavior

- セクションプリセット: Intro, Verse, Pre-Chorus, Chorus, Bridge, Outro
- カスタムセクション追加
- セクション名変更
- セクション並べ替え (↑↓)
- セクション削除

### Constraints

- セクションは `[SectionName]` 形式で本文に埋め込む
- セクション削除は確認なしで即時実行

## Scope

- In: Editor.tsx section-tabs
- Out: Section テンプレート機能

## Dependencies

- TS-005

## Estimated Duration

0.25d

## Source

`docs/requirements/requirements.md#13`