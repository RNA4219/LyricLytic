# LyricLytic

LyricLytic は、AI 音楽生成サービス向けの歌詞制作を支援するデスクトップアプリの構想リポジトリです。  
この repo では、要件定義と参考調査を整理し、PoC 着手前の判断基準を固めることを主目的としています。

## 入口

- 正式な要件定義: `docs/requirements/requirements.md`
- フロントエンド要件定義: `docs/requirements/frontend-requirements-v1.md`
- PoC 実装タスク分解: `docs/requirements/poc-task-breakdown-v1.md`
- 参考調査レポート: `docs/research/deep-research-report-20260331.md`
- 詳細要件の元メモ: `docs/notes/detailed-requirements-source.txt`

## 現在の構成

```text
LyricLytic/
├─ README.md
├─ LICENSE
└─ docs/
   ├─ requirements/
   │  └─ requirements.md
   ├─ research/
   │  └─ deep-research-report-20260331.md
   └─ notes/
      └─ detailed-requirements-source.txt
```

## ドキュメントの使い分け

- `docs/requirements/requirements.md`
  実装判断の基準にする統合版の要件定義です。MVP 範囲、ドメインモデル、機能要件、非機能要件、受け入れ基準をまとめています。
- `docs/requirements/poc-task-breakdown-v1.md`
  PoC 実装へ入る前のフェーズ分解です。どこから着手し、どこで破綻を見つけるかを整理しています。
- `docs/requirements/frontend-requirements-v1.md`
  既存要件からフロントエンド実装に必要な内容だけを再編した文書です。画面、レイアウト、状態、導線、OS 差分をまとめています。
- `docs/research/deep-research-report-20260331.md`
  技術選定や構想の背景として参照する調査資料です。Monaco / Tauri / SQLite 前提の比較や設計観点を含みます。
- `docs/notes/detailed-requirements-source.txt`
  統合前の元メモです。判断の経緯や補足の参照元として残しています。

## 次に着手しやすいもの

1. `docs/requirements/requirements.md` の残論点を詰める
2. `docs/requirements/sqlite-schema-v1.sql` と要件の整合レビューを続ける
3. `docs/requirements/screen-flow-v1.md` と UI 要件の破綻を洗う
4. 実装に入る場合は `docs/requirements/poc-task-breakdown-v1.md` を起点に着手する
