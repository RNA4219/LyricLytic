# LyricLytic PoC 実装タスク分解 v1

## 1. 目的

本書は、`requirements.md` を PoC 実装へ接続するためのタスク分解である。  
目的は、実装順序、依存関係、受け入れ条件を明確にし、PoC 段階で破綻しやすい箇所を先に潰すことにある。

PoC では、要件の網羅実装よりも、主要フローが Windows / macOS の両方で成立することを優先する。

## 2. PoC 完了条件

PoC は少なくとも以下を満たした時点で完了とみなす。

- Project を作成し、Working Draft を編集できること
- 自動保存とスナップショット保存が分離して動作すること
- LyricVersion の差分比較ができること
- CollectedFragment を取り込み、本文へ挿入できること
- SongArtifact を LyricVersion に紐付けられること
- 論理削除と復元が主要フローとして成立すること
- Project 単位エクスポートが通ること
- ローカル LLM 接続確認と頻出表現チェックが通ること
- Windows 11 と macOS 最新安定版で主要フロー確認が取れること

## 3. 実装優先順

### 3.1 フェーズ 0: 開発基盤

- Tauri アプリの最小構成を作る
- フロントエンド、Rust、SQLite の責務境界を決める
- ルーティング、レイアウト、基本状態管理を入れる
- 共通エラーハンドリングと通知方式を決める

完了条件:

- 空のホーム画面と歌詞編集画面が遷移できる
- 開発時に SQLite ファイル生成位置が固定されている
- Windows / macOS の両方で起動確認できる

### 3.2 フェーズ 1: 永続化基盤

- `sqlite-schema-v1.sql` を初期マイグレーションへ落とす
- repository 層を作り、Project / WorkingDraft / LyricVersion の CRUD を通す
- `deleted_at` と `deleted_batch_id` を扱う共通クエリ方針を入れる
- app_settings 永続化を入れる

完了条件:

- 新規 DB 作成時に必要テーブルが揃う
- 1 Project につき active Working Draft が 1 件に保たれる
- 論理削除済みデータを既定一覧から除外できる

### 3.3 フェーズ 2: Project と Working Draft

- ホーム / プロジェクト選択画面を実装する
- Project 作成、一覧、選択、更新を実装する
- Project 作成時に Working Draft を自動作成する
- Working Draft の本文と draft_sections を読み書きできるようにする

完了条件:

- Project を作成すると編集画面へ遷移する
- 再起動後に最後の Working Draft を復元できる
- Project 切替が 1 秒以内を目標値として大きく破綻しない

### 3.4 フェーズ 3: 歌詞編集と自動保存

- Monaco Editor を組み込む
- 自動保存のデバウンスと保存失敗表示を入れる
- Section 一覧と本文の同期ルールを決める
- セクション追加、並べ替え、名称連番付与を実装する

完了条件:

- 通常入力で知覚可能な詰まりが出ない
- セクションの追加と本文編集が保存される
- 保存失敗時にユーザーが再試行導線を確認できる

### 3.5 フェーズ 4: スナップショット保存と履歴

- 保存ダイアログを実装する
- Working Draft から LyricVersion を生成する
- parent_lyric_version_id を持つ履歴構造を実装する
- LyricVersion 一覧とメモ表示を実装する

完了条件:

- 保存時に snapshotName とメモを記録できる
- 連続保存で複数版が残る
- 保存後も編集対象は Working Draft のままである

### 3.6 フェーズ 5: 差分比較と復元

- Monaco Diff Editor を組み込む
- 比較対象の 2 版を選択できる UI を実装する
- 過去版から Working Draft を再構築する復元処理を実装する
- 復元確認ダイアログを実装する

完了条件:

- 任意の 2 版を比較できる
- 過去版復元後に Working Draft として再編集できる
- 復元が既存 LyricVersion を破壊しない

### 3.7 フェーズ 6: RevisionNote と CollectedFragment

- RevisionNote の CRUD を実装する
- CollectedFragment 一覧、作成、編集、状態更新を実装する
- `.txt` インポートダイアログを実装する
- 断片から本文またはセクションへ挿入する導線を実装する

完了条件:

- 断片を複数保持できる
- `.txt` 取込に失敗した場合、再選択導線が出る
- RevisionNote を版 + セクションへ紐付けられる

### 3.8 フェーズ 7: SongArtifact 紐付け

- 曲紐付け画面を実装する
- LyricVersion 単位で SongArtifact を登録できるようにする
- `source_url` または `source_file_path` の片方必須を UI でも担保する
- 外部 URL 表示と確認ダイアログ導線を実装する

完了条件:

- 1 つの LyricVersion に複数 SongArtifact を紐付けられる
- Working Draft は紐付け対象に出ない
- 外部 URL を開く前に必ず確認ダイアログが出る

### 3.9 フェーズ 8: 論理削除と復元 UI

- 削除済みデータ管理画面を実装する
- Project / LyricVersion の削除を `deleted_batch_id` 単位で扱う
- Project 復元時の active Draft 競合チェックを実装する
- 復元不可理由を UI に表示する

完了条件:

- Project 削除で配下データが論理削除される
- LyricVersion 削除で SongArtifact は既定で残る
- 復元成功 / 復元不可の状態が判別できる

### 3.10 フェーズ 9: エクスポート

- Project 単位 `.lyrlytic.zip` エクスポートを実装する
- JSON 正本と text 補助出力を生成する
- 論理削除データ含有オプションを実装する
- 生成ファイルパス表示を実装する

完了条件:

- 任意 Project を zip として保存できる
- app_settings が含まれない
- 生成物に必要 JSON が入っている

### 3.11 フェーズ 10: ローカル LLM 接続

- LLM 設定画面または設定パネルを実装する
- `127.0.0.1` / `localhost` 制約をバリデーションする
- 接続確認 API 呼び出しを実装する
- 頻出表現チェックと低頻出候補レコメンドの結果パースを実装する

完了条件:

- 未接続時は AI 補助を実行できない
- 接続確認成功時のみ AI 実行ボタンが有効になる
- JSON パース失敗時に明確なエラーが出る

### 3.12 フェーズ 11: OS 別 PoC 検証

- Windows 11 で主要フローを通す
- macOS 最新安定版で主要フローを通す
- ショートカット表記と保存ダイアログ挙動を確認する
- 既知の OS 差分をドキュメントへ戻す

完了条件:

- インポート、コピー、保存、差分、削除復元、エクスポートが両 OS で成立する
- OS 差に起因する破綻が残る場合は既知制約として記録される

## 4. 先に潰すべき破綻ポイント

### 4.1 Section と本文の二重管理

本文編集と section 配列編集の責務がずれると破綻しやすい。  
PoC では、`draft_sections` を正として編集画面へ反映するのか、`latest_body_text` を正として分解するのかを早期に固定する必要がある。

推奨:

- PoC では `draft_sections` を正本とし、全文表示は連結ビューとして構成する
- `latest_body_text` は全文コピー用の派生キャッシュとして扱う

### 4.2 復元と履歴の責務混同

LyricVersion 復元を既存版の上書きとして扱うと履歴整合が壊れる。  
PoC では必ず `Working Draft 再構築` に限定する。

### 4.3 論理削除と unique 制約

論理削除前提では「1 Project 1 active draft」の制約がアプリ層と DB 層の両方で必要になる。  
マイグレーション直後に partial unique index が有効かを先に確認する。

### 4.4 AI 応答フォーマット揺れ

ローカル LLM は JSON 構造を崩すことがある。  
PoC ではリトライより先に、`schema 不一致を明確に失敗表示する` 方針を取るほうが安全である。

## 5. 推奨実装順の理由

- フェーズ 0〜5 で「歌詞制作ツールとして最低限成立する骨格」を先に通す
- フェーズ 6〜9 で PoC の差別化機能を積む
- フェーズ 10 は UI 骨格と設定永続化が揃ってから入ると手戻りが少ない
- フェーズ 11 は最後にまとめて行うが、Windows / macOS 起動確認だけはフェーズ 0 時点で一度通しておく

## 6. タスク管理上の区切り

PoC 実装では、少なくとも以下の 4 マイルストーンに区切ると進めやすい。

1. 編集骨格完了
2. 履歴と比較完了
3. 管理機能完了
4. AI 補助と OS 検証完了

## 7. 要件への戻し方

実装中に以下が見つかった場合は、コード側で吸収せず `requirements.md` へ戻す。

- Windows / macOS で挙動を統一できない差分
- SQLite 制約で表現しきれない整合条件
- Monaco Editor の制約で UI 要件を変更する必要
- ローカル LLM 応答の揺れにより UI 要件を簡略化する必要

要件へ戻した変更は、`review-log.md` に Gate として追記する。
