# LyricLytic Pipeline Command

plan → dev → acceptance → integrate → publish フローを追う入口。

## Full Pipeline

```
Phase 0-1 (縦切り)
  ↓
Phase 2-3 (Project/Editor)
  ↓
Phase 4-5 (Snapshot/Diff)
  ↓
Phase 6-7 (Note/Fragment/Song)
  ↓
Phase 8-9 (Delete/Export)
  ↓
Phase 10-11 (LLM/OS Verify)
```

## Milestones

1. 編集骨格完了 (P0-P3)
2. 履歴と比較完了 (P4-P5)
3. 管理機能完了 (P6-P9)
4. AI 補助と OS 検証完了 (P10-P11)

## shipyard-cp 連携

```bash
# task 作成
.claude/commands/run.md

# 進捗確認
.claude/commands/status.md
```

## 参照

- `docs/requirements/poc-task-breakdown-v1.md`
- `docs/requirements/acceptance-test-cases-v1.md`