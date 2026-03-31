# LyricLytic Run Command

LyricLytic 実装タスクを dispatch する入口。

## Usage

```bash
# Phase 0-1 縦切り
/lyriclytic-run phase0-1

# 特定タスク
/lyriclytic-run TS-001
```

## Flow

1. `docs/tasks/INTENT-*.md` から IntentContract 確認
2. `docs/tasks/TASK-*.md` から TaskSeed 確認
3. 実装開始

## shipyard-cp 連携

shipyard-cp が稼働している場合:

```bash
# shipyard-cp CLI
pnpm run dev
curl http://localhost:3000/healthz
```

## 参照

- `HUB.codex.md`
- `docs/requirements/poc-task-breakdown-v1.md`
- `docs/implementation/bootstrap-checklist-v1.md`