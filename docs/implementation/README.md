# LyricLytic 実装準備パッケージ

このディレクトリは、要件定義を `実装着手できる粒度` へ落とすための入口である。  
`requirements/` が何を作るかの正本なら、`implementation/` はどう着手するかの入口を担う。

## 読み順

1. `implementation-prep-v1.md`
2. `system-architecture-v1.md`
3. `command-contracts-v1.md`
4. `bootstrap-checklist-v1.md`

## 役割

- `implementation-prep-v1.md`
  実装準備の全体整理。PoC の対象、実装順、判断済み事項、残リスクをまとめる。
- `system-architecture-v1.md`
  Tauri / フロントエンド / Rust / SQLite の責務境界を整理する。
- `command-contracts-v1.md`
  フロントエンドと Tauri コマンド境界の暫定契約を定義する。
- `bootstrap-checklist-v1.md`
  repo 初期化から最初の縦切り完了までの作業手順を確認する。

## 正本との関係

- 要件の正本: `../requirements/requirements.md`
- 画面要件の正本: `../requirements/frontend-requirements-v1.md`
- 実装順の正本: `../requirements/poc-task-breakdown-v1.md`

このディレクトリの文書は、上記正本を置き換えない。  
要件変更が必要な場合は `requirements/` 側へ戻してから更新する。
