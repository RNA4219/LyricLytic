# LyricLytic 主要ソフトウェアとライセンス

製品概要と導入手順は [README.md](README.md) を参照してください。

本書は、LyricLytic で**直接利用している主要ソフトウェア**のライセンスを確認しやすくするための一覧である。  
網羅的な transitive dependency 一覧ではなく、運用上説明責任が生じやすい主要構成要素を対象とする。

## 1. アプリ本体の主要構成

| ソフトウェア | 用途 | ライセンス |
|---|---|---|
| React | Frontend UI | MIT |
| React DOM | Frontend rendering | MIT |
| React Router DOM | 画面遷移 | MIT |
| Vite | Frontend build / dev server | MIT |
| Vitest | Frontend test | MIT |
| Playwright | E2E test | Apache-2.0 |
| TypeScript | 型検査 / build | Apache-2.0 |
| Monaco Editor | 歌詞編集 / 差分表示 | MIT |
| `@monaco-editor/react` | Monaco の React binding | MIT |

## 2. デスクトップ実行基盤

| ソフトウェア | 用途 | ライセンス |
|---|---|---|
| Tauri | Desktop framework | MIT または Apache-2.0 |
| `@tauri-apps/api` | Frontend - Tauri bridge | MIT または Apache-2.0 |
| `@tauri-apps/plugin-dialog` | ファイル / ダイアログ | MIT または Apache-2.0 |
| `@tauri-apps/plugin-fs` | ローカルファイル操作 | MIT または Apache-2.0 |
| `@tauri-apps/plugin-shell` | 外部プロセス / URL 起動 | MIT または Apache-2.0 |
| Rust | Backend implementation language | MIT または Apache-2.0 |
| rusqlite | SQLite access | MIT |
| SQLite | ローカル DB | Public Domain |

## 3. ローカル LLM 実行

| ソフトウェア | 用途 | ライセンス |
|---|---|---|
| llama.cpp | ローカル LLM 実行 | MIT |

補足:

- 現在の LyricLytic は `llama.cpp` の `llama-server.exe` を前提にしている
- LM Studio / Ollama は現行導線の前提から外している

## 4. 韻ガイド / 音韻解析

| ソフトウェア | 用途 | ライセンス |
|---|---|---|
| SudachiPy | 形態素解析 | Apache-2.0 |
| SudachiDict-core | 実行時辞書 | Apache-2.0 |

補足:

- 現時点の実装は `SudachiPy + SudachiDict-core` を使う
- `NEologd` と `UniDic` は要件・検討対象にはあるが、現行実装の runtime 同梱前提ではない

## 5. 推奨モデルの配布元について

README に記載している GGUF モデルは Hugging Face 上の配布物を案内している。  
モデル本体のライセンスは**各モデル配布ページの記載に従う**こと。

2026-04-01 時点で README に案内している主なモデル:

- `Qwen3.5-4B`
- `Qwen3.5-9B`
- `GPT-OSS-Swallow-20B`

モデルはアプリ本体の bundled software ではなく、**ユーザーが別途取得して指定する外部アセット**として扱う。

## 6. 運用メモ

- ライセンス表記の更新対象は、まず `package.json` と `src-tauri/Cargo.toml` の直接依存を優先する
- 辞書やモデルのような外部アセットは、**アプリ依存**と**ユーザー取得物**を分けて書く
- `NEologd` / `UniDic` を runtime 同梱や配布対象に含める場合は、本書へ追記する
