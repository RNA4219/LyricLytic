# LyricLytic

LyricLytic は、AI 音楽生成サービス向けの歌詞制作を支援するデスクトップアプリです。
歌詞の断片収集、構成整理、推敲、バージョン管理、曲紐付けを一貫して扱うローカル完結環境を提供します。

## 導入手順

LyricLytic は現在、`llama.cpp` を LyricLytic 側から直接起動する前提です。  
LM Studio や Ollama は使わず、`llama-server.exe + GGUF` をローカルで扱います。

### 1. 前提ソフトを入れる

- Node.js 20 系以上
- Rust / Cargo
- Windows では WebView2 Runtime
- `llama.cpp`

Windows で `llama.cpp` を入れる一番簡単な方法は `winget` です。

```powershell
winget install --id ggml.llamacpp --accept-package-agreements --accept-source-agreements
```

インストール後、`llama-server.exe` の場所は環境によって違いますが、LyricLytic からは次のようなパスで見つかることが多いです。

```text
C:\Users\<ユーザー名>\AppData\Local\Microsoft\WinGet\Packages\ggml.llamacpp_Microsoft.Winget.Source_8wekyb3d8bbwe\llama-server.exe
```

### 2. モデルをダウンロードする

2026-04-01 時点でのおすすめ GGUF は次の 3 つです。

1. 軽さ優先: `Qwen3.5-4B`
   - [Hugging Face](https://huggingface.co/unsloth/Qwen3.5-4B-GGUF?show_file_info=Qwen3.5-4B-UD-Q4_K_XL.gguf&library=llama-cpp-python)
   - まず試すならこれが一番扱いやすいです。
2. バランス型: `Qwen3.5-9B`
   - [Hugging Face](https://huggingface.co/unsloth/Qwen3.5-9B-GGUF?show_file_info=Qwen3.5-9B-UD-Q4_K_XL.gguf)
   - 品質と速度のバランスが良く、常用しやすいです。
3. 表現力重視: `GPT-OSS-Swallow-20B`
   - [Hugging Face](https://huggingface.co/mmnga-o/GPT-OSS-Swallow-20B-RL-v0.1-gguf/blob/main/GPT-OSS-Swallow-20B-RL-v0.1-Q4_K_M.gguf)
   - VRAM とメモリに余裕がある環境向けです。

モデルは `.gguf` ファイルとして保存してください。  
LyricLytic では、フォルダではなく **GGUF ファイルそのもの** を指定するのがいちばん確実です。

### 3. LyricLytic を起動する

依存を入れてから開発起動します。

```powershell
npm install
npm run tauri:dev
```

またはルートにある [Start.bat](C:\Users\ryo-n\Codex_dev\LyricLytic\Start.bat) でも起動できます。

### 4. 初回の LLM 設定

右下の `AI補助` から `LLM構成` を開き、次の 2 つを設定します。

- `llama.cpp 実行ファイルパス`
  - `llama-server.exe` を指定
- `モデルファイルパス`
  - ダウンロードした `.gguf` を指定

その後、

1. `AI起動`
2. `接続確認`

の順に押してください。

### 5. 使い始める前の注意

- `Style` と `Vocal` の AI 生成は英語出力前提です。
- `Lyrics` は現在の JA / EN 言語設定に合わせて生成します。
- `最大出力トークン` は大きめで始まりますが、重すぎて起動しにくい場合は LyricLytic が自動で下げます。
- `タイムアウト` の既定値は 300 秒です。重いモデルでも途中停止しにくいよう、やや長めにしています。

## Agent_tools 連携

本リポジトリは Agent_tools パターン適用済み:

| Agent_tools | 活用 |
|---|---|
| workflow-cookbook | Birdseye/Task Seed パターン |
| shipyard-cp | CLI-first オーケストレーション |
| agent-protocols | IntentContract/TaskSeed 契約 |

## 入口

- **最上位方針**: `BLUEPRINT.md`
- **ガードレール**: `GUARDRAILS.md`
- **ドキュメントハブ**: `HUB.codex.md`
- **Birdseye**: `docs/BIRDSEYE.md`
- **正本要件**: `docs/requirements/requirements.md`
- **韻ガイド仕様**: `docs/requirements/rhyme-analysis-v1.md`
- **韻ガイド実装チェックリスト**: `docs/implementation/rhyme-implementation-checklist-v1.md`
- **PoCタスク**: `docs/requirements/poc-task-breakdown-v1.md`
- **実装入口**: `docs/implementation/bootstrap-checklist-v1.md`
- **テスト設計**: `docs/implementation/test-design-v1.md`

## Birdseye

- 人間向け俯瞰: `docs/BIRDSEYE.md`
- 機械向け依存グラフ: `docs/birdseye/index.json`

## Task Seeds

`docs/tasks/` で未着手タスク候補:

- TS-001: Tauri 最小構成
- TS-002: SQLite 初期化
- TS-003: Repository 層 CRUD
- TS-004: 両 OS 起動確認

- 正式な要件定義: `docs/requirements/requirements.md`
- フロントエンド要件定義: `docs/requirements/frontend-requirements-v1.md`
- フロント質感差分レビュー: `docs/requirements/frontend-design/runtime-visual-gap-review-20260401.md`
- フロント質感差分チェックリスト: `docs/requirements/frontend-design/runtime-visual-gap-checklist-20260401.md`
- PoC 実装タスク分解: `docs/requirements/poc-task-breakdown-v1.md`
- 実装準備パッケージ: `docs/implementation/README.md`
- 参考調査レポート: `docs/research/deep-research-report-20260331.md`
- 詳細要件の元メモ: `docs/notes/detailed-requirements-source.txt`

## 現在の構成

```text
LyricLytic/
├─ README.md
├─ LICENSE
└─ docs/
   ├─ implementation/
   │  └─ README.md
   ├─ notes/
   │  └─ detailed-requirements-source.txt
   ├─ requirements/
   │  ├─ requirements.md
   │  ├─ frontend-requirements-v1.md
   │  └─ poc-task-breakdown-v1.md
   ├─ research/
   │  └─ deep-research-report-20260331.md
```

## ドキュメントの使い分け

- `docs/requirements/requirements.md`
  実装判断の基準にする統合版の要件定義です。MVP 範囲、ドメインモデル、機能要件、非機能要件、受け入れ基準をまとめています。
- `docs/requirements/poc-task-breakdown-v1.md`
  PoC 実装へ入る前のフェーズ分解です。どこから着手し、どこで破綻を見つけるかを整理しています。
- `docs/implementation/README.md`
  実装開始前に読むべき設計入口です。構成、command 契約、初期チェックリストをまとめています。
- `docs/implementation/test-design-v1.md`
  要件定義と仕様に基づくテスト設計書です。層別方針、優先度付きチェックリスト、完了条件をまとめています。
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
4. 実装に入る場合は `docs/implementation/README.md` を起点に着手する
