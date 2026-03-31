---
intent_id: LL-004
owner: lyriclytic-dev
status: active
last_reviewed_at: 2026-04-01
next_review_due: 2026-04-15
---

# LyricLytic Birdseye

LyricLytic の文書・設計・実装の読み順を、俯瞰で掴むための Birdseye 入口です。  
機械向けの依存グラフは `docs/birdseye/index.json` を正本とし、本書は人間とエージェント向けの要約ハブとして使います。

## 1. 最初に見る順番

### 全体像を掴みたいとき

1. `README.md`
2. `HUB.codex.md`
3. `BLUEPRINT.md`
4. `docs/requirements/requirements.md`

### 実装に入るとき

1. `GUARDRAILS.md`
2. `docs/implementation/bootstrap-checklist-v1.md`
3. `docs/implementation/system-architecture-v1.md`
4. `docs/implementation/command-contracts-v1.md`

### 要件と実装のズレを確認したいとき

1. `docs/requirements/review-log.md`
2. `docs/requirements/implementation-gap-checklist-20260401.md`
3. `docs/requirements/frontend-design/runtime-visual-gap-review-20260401.md`
4. `docs/requirements/frontend-design/runtime-visual-gap-checklist-20260401.md`
5. `docs/requirements/acceptance-test-cases-v1.md`

## 2. 主要ノード

| ノード | 役割 | 先に読むべき理由 |
|---|---|---|
| `BLUEPRINT.md` | 最上位方針 | MVP 範囲と技術スタックの前提を掴める |
| `GUARDRAILS.md` | 実装制約 | ローカル完結、論理削除、LLM 制約を外さないため |
| `HUB.codex.md` | ドキュメントハブ | 正本と補助資料の位置がまとまっている |
| `docs/requirements/requirements.md` | 要件正本 | 実装判断の最終基準 |
| `docs/requirements/poc-task-breakdown-v1.md` | フェーズ分解 | 今どの段階を進めるべきか判断しやすい |
| `docs/implementation/system-architecture-v1.md` | 構成設計 | Frontend / Tauri / Repository / SQLite の境界確認 |
| `docs/implementation/command-contracts-v1.md` | command 契約 | UI と Rust 間の責務確認 |
| `docs/requirements/implementation-gap-checklist-20260401.md` | 実装逸脱一覧 | 直近のズレと優先度がまとまっている |
| `docs/requirements/frontend-design/runtime-visual-gap-review-20260401.md` | モックとの差分レビュー | 要件段階の質感と現行 UI のズレを見られる |
| `docs/requirements/frontend-design/runtime-visual-gap-checklist-20260401.md` | フロント修正チェックリスト | UI 質感差分を運用で埋めるため |

## 3. 依存の見方

`docs/birdseye/index.json` では、以下の流れで依存がつながっています。

- `BLUEPRINT.md`
  全体方針の起点
- `HUB.codex.md`
  正本と実装入口のハブ
- `docs/requirements/requirements.md`
  機能・非機能・受け入れ基準の正本
- `docs/implementation/*.md`
  実装構造と command 契約
- `docs/requirements/poc-task-breakdown-v1.md`
  PoC Phase の順序制御

要するに、`Blueprint -> Requirements -> Implementation Contracts -> Phase Breakdown` の順で辿ると破綻しにくい構造です。

## 4. 現在のホットスポット

2026-04-01 時点で、優先して見るべき箇所は次のとおりです。

- `docs/requirements/implementation-gap-checklist-20260401.md`
  現行実装と要件のズレ一覧
- `docs/requirements/frontend-design/runtime-visual-gap-review-20260401.md`
  モックとランタイム UI の質感差分レビュー
- `docs/requirements/frontend-design/runtime-visual-gap-checklist-20260401.md`
  フロント質感差分の運用チェックリスト
- `src/pages/Editor.tsx`
  母艦 UI として最も責務が集中している
- `src/components/ExportPanel.tsx`
  要件との差分が大きい
- `src/components/SearchPanel.tsx`
  実装はあるが未接続
- `src/components/StyleProfilePanel.tsx`
  実装はあるが未接続
- `src/components/TrashPanel.tsx`
  Project 専用で止まっている

## 5. Birdseye 正本データ

- 人間向け要約: `docs/BIRDSEYE.md`
- 機械向け依存グラフ: `docs/birdseye/index.json`

`index.json` を更新した場合は、本書の読み順・ホットスポット・主要ノードも合わせて見直してください。

## 6. HUB との関係

`HUB.codex.md` は正本への導線ハブ、`docs/BIRDSEYE.md` は読み順と熱い領域の俯瞰です。  
判断に迷ったら:

1. `HUB.codex.md` で正本を特定する
2. `docs/BIRDSEYE.md` で読む順番を決める
3. `docs/birdseye/index.json` で依存を精査する

この順で使うと、入口の迷いが少なくなります。
