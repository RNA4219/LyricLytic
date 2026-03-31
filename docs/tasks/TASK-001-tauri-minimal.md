---
task_seed_id: TS-001
intent_id: IC-001
status: completed
created_at: 2026-03-31
---

# TaskSeed: Tauri 最小構成

## Objective

Tauri アプリの最小構成を作り、空のホーム画面と歌詞編集画面の遷移を成立させる。

## Requirements

### Behavior

- Tauri shell 生成 (npm create tauri-app)
- Frontend React 最小構成
- ルーティング設定 (Home → Editor)
- 基本レイアウト (3ペイン枠組み)

### Constraints

- Frontend は React + TypeScript
- CSP: default-src 'self';
- capabilities 最小権限

## Commands

```bash
npm create tauri-app@latest lyriclytic-poc -- --template react-ts
cd lyriclytic-poc
npm install
npm run tauri dev
```

## Scope

- In: src/, src-tauri/src/main.rs, tauri.conf.json
- Out: Monaco Editor, SQLite, LLM

## Dependencies

なし

## Estimated Duration

0.5d

## Source

`docs/requirements/poc-task-breakdown-v1.md#3.1`