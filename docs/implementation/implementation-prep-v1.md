# LyricLytic 実装準備 v1

## 1. 目的

本書は、LyricLytic を PoC として実装開始する前に、`何を固定し、何を後回しにし、どこから着手するか` を実装観点で整理するための文書である。

対象は `Windows 11 / macOS 最新安定版向け Tauri デスクトップアプリ PoC` とする。

## 2. 今回の判断

### 2.1 この repo で実装準備を進める理由

`agent-tools-hub` の観点では、本件は `workflow-cookbook` や `agent-taskstate` へルーティングする依頼ではなく、LyricLytic repo 自体の実装着手準備に該当する。  
そのため、Agent_tools は入口としてのみ使い、実作業の成果物は LyricLytic repo 内へ置く。

### 2.2 実装前に固定済みとみなす事項

- 対応 OS は Windows / macOS
- PoC のインポート対象は `.txt`
- 編集画面を母艦にした 3 ペイン UI を採用
- 差分確認は半独立ビュー
- 削除済みデータ管理は深い階層
- SongArtifact 紐付けは LyricVersion 単位
- ローカル LLM は OpenAI 互換ローカル HTTP API 前提

## 3. 実装準備の成果物

実装開始前に最低限そろえるものを以下とする。

1. システム構成の責務境界
2. Tauri コマンドの入出力契約
3. 初期ディレクトリ構成と命名
4. 最初の縦切り完了条件
5. 実装中に要件へ戻す条件

## 4. 最初の縦切り

最初に成立させるべきフローは以下とする。

1. ホームから Project を作成する
2. 編集ワークスペースへ遷移する
3. Working Draft を編集する
4. 自動保存される
5. Save Snapshot で LyricVersion を増やす
6. 保存後も Working Draft を編集し続ける

この縦切りで、LyricLytic のコアである `Working Draft 主体の編集体験` を最初に検証する。

## 5. 実装順の再整理

### 5.1 先にやること

- Tauri 最小構成
- SQLite 初期化とマイグレーション適用
- Project / Working Draft / LyricVersion repository
- ホーム画面と編集画面の最小 UI
- Save Snapshot ダイアログ

### 5.2 後でよいこと

- LLM 補助の細かいプロンプト調整
- 高度な検索 UI
- StyleProfile の深い編集体験
- エクスポート詳細の polish
- 視覚的な装飾アニメーション

## 6. 実装開始時のブロッカー

現時点で `要件未確定だから止まる` 類の大きなブロッカーはない。  
実装側で気を付けるべきブロッカーは以下である。

- `draft_sections` と `latest_body_text` の同期戦略
- Tauri コマンド境界でのエラー表現統一
- 論理削除と unique 制約の整合
- ローカル LLM 応答の JSON 揺れ

## 7. 実装中に要件へ戻す条件

以下が起きた場合は、コードで無理に吸収せず `requirements/` へ戻す。

- 右ペイン 1 面では情報量が足りず、画面責務の変更が必要
- Windows / macOS のファイルダイアログ差で UX が成立しない
- SQLite 制約だけで担保できない整合条件が増える
- LLM 結果を JSON 固定で扱う前提が破綻する

## 8. 実装開始の判定

現時点の判定は `実装開始可能` とする。  
ただし、実装は `docs/implementation/system-architecture-v1.md` と `docs/implementation/command-contracts-v1.md` を起点に進めること。
