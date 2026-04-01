# LyricLytic テスト設計 v1

## 1. 目的

本書は、`requirements.md`、`acceptance-test-cases-v1.md`、`system-architecture-v1.md`、`command-contracts-v1.md` を基準に、LyricLytic のテストを `どの層で / 何を / どこまで` 検証するかを定義するための文書である。  
受け入れケースの羅列ではなく、実装者が `先に自動化すべきテスト` と `手動で最後に通すべきテスト` を判断できる状態を目指す。

本書は、テスト不足を埋めるための運用用チェックリストも兼ねる。

## 2. 正本と参照元

- 要件正本: `../requirements/requirements.md`
- 受け入れ基準正本: `../requirements/acceptance-test-cases-v1.md`
- 実装整合性チェック: `../requirements/implementation-gap-checklist-20260401.md`
- 構成正本: `system-architecture-v1.md`
- command 契約正本: `command-contracts-v1.md`

要件と本書が衝突した場合は、要件正本を優先し、本書を更新する。

## 3. 現状認識

現時点のフロントテストは `src/test/` 配下の少数ファイルに限られており、以下が大きく不足している。

- Working Draft と LyricVersion の中核フロー
- Tauri command 契約の入出力保証
- Repository 層の整合性
- 論理削除 / 復元
- Export / Import
- LLM 接続と JSON 契約
- 韻ガイドの正規化と表示契約
- Windows / macOS 差分確認

つまり、現状のテストは `見た目や一部ユーティリティ` に偏っており、PoC の主要価値を保証する層が薄い。

## 4. テスト方針

### 4.1 テストピラミッド

LyricLytic では以下の比率を目標とする。

1. Unit Test
   UI 部品、変換関数、命名規則、セクション同期、LLM 応答パーサなどを高速に検証する。
2. Command / Repository Test
   Tauri command と Rust repository で、永続化ルール、論理削除、復元、export/import を検証する。
3. Integration Test
   Frontend から command 境界までの主要フローを、モックまたはテスト DB で検証する。
4. Manual Acceptance / Runtime Check
   Monaco、Tauri、OS ダイアログ、WebView、ショートカットなど、実機依存の挙動を確認する。

### 4.2 レイヤ別の責務

| 層 | 主対象 | 目的 |
|---|---|---|
| Frontend Unit | React component, hook, formatter, section helper | 画面ロジック破壊の早期検知 |
| Rust Unit | domain/service/repository helper | 永続化ルール破壊の早期検知 |
| Command Contract | Tauri command 入出力 | UI と backend の契約固定 |
| Integration | Editor / Home / Trash / Export 主要フロー | Working Draft 主体の体験保証 |
| Manual E2E | Tauri runtime, Monaco, OS dialog | デスクトップ実動作保証 |

### 4.3 優先原則

テスト実装は以下の順で優先する。

1. データ破壊や履歴破壊を防ぐもの
2. PoC の主要価値である `編集 -> 自動保存 -> 保存 -> 比較 -> 復元` を保証するもの
3. 要件逸脱が既に判明している機能
4. OS / Tauri 依存で手動確認が必要なもの

## 5. テスト対象マップ

### 5.1 ドメイン別対象

| ドメイン | 自動テスト必須 | 手動確認必須 |
|---|---|---|
| Project | Yes | Yes |
| Working Draft | Yes | Yes |
| LyricVersion | Yes | Yes |
| Section | Yes | Yes |
| RevisionNote | Yes | Yes |
| CollectedFragment | Yes | Yes |
| SongArtifact | Yes | Yes |
| StyleProfile | Yes | Yes |
| Deleted Items | Yes | Yes |
| Export | Yes | Yes |
| Import | Yes | Yes |
| Search | Yes | Yes |
| Copy Options | Yes | Yes |
| LLM Review Assist | Yes | Yes |
| OS Shortcut / Dialog | No | Yes |

### 5.2 実装単位別対象

| 実装単位 | テスト手段 |
|---|---|
| `src/pages/Editor.tsx` | Frontend integration + manual runtime |
| `src/components/*Panel.tsx` | Frontend unit + integration |
| `src/lib/api.ts` | Command contract test |
| `src-tauri/src/commands/*.rs` | Command contract test |
| `src-tauri/src/repositories/*.rs` | Rust unit / repository test |
| `src-tauri/src/export/*` | Rust unit + file output verification |
| `src-tauri/src/llm/*` | Rust unit + parser contract test |

## 6. テスト環境

### 6.1 必須環境

- Windows 11
- macOS 最新安定版
- SQLite テスト DB を毎回新規作成できる環境
- Node.js / npm
- Rust / cargo

### 6.2 条件付き環境

- `llama.cpp` または OpenAI 互換ローカル HTTP API
- `Ollama` を正式採用する場合は別途追記

### 6.3 テストデータ方針

- 使い捨て Project を毎テストで生成する
- fixture は `空 Draft`, `複数 Section`, `複数 Version`, `削除済み Batch`, `タグ付き Fragment`, `SongArtifact あり` を最低限持つ
- export 生成物は `tmp/` または OS 一時領域へ出力し、比較可能な JSON 正本を含める

## 7. テストレベル別設計

## 7.1 Frontend Unit

目的:

- component 単体のロジックと表示条件を壊さない
- Section 操作や表示切替の規則を関数レベルで担保する

優先対象:

- Section 追加時の連番付与
- `All Lyrics` 表示切替
- autosave 発火条件
- 保存ダイアログ入力バリデーション
- CopyOptions の整形条件反映
- SearchPanel の種別切替
- TrashPanel の種別・バッチ表示
- LLM 設定フォームのローカルホスト制約
- 韻ガイドの `ローマ字 / 母音列 / 子音列` 変換

## 7.2 Rust Unit / Repository

目的:

- DB 整合性とアプリ層ルールを壊さない

優先対象:

- Project 作成時に active Working Draft が 1 件だけ作られる
- `draft_sections` 更新時に `latest_body_text` が同期される
- Snapshot 作成時に `version_sections` が正しく複製される
- Project 更新時に `projects.updated_at` が追随する
- 論理削除時に `deleted_batch_id` が正しく付与される
- Version 削除時に `SongArtifact` が既定連鎖削除されない
- StyleProfile の active 1 件制約
- export が `app_settings` を含めない

## 7.3 Command Contract Test

目的:

- Frontend と Tauri command の I/O 契約を固定する

優先対象:

- `create_project`
- `get_working_draft`
- `save_working_draft`
- `create_snapshot`
- `get_diff_payload`
- `restore_version_to_draft`
- `list_fragments`
- `import_fragment_txt`
- `create_song_artifact`
- `list_deleted_batches` または同等 command
- `restore_deleted_batch` または種別 restore command
- `export_project_zip`
- `update_app_settings`
- `check_local_llm_connection`
- `run_phrase_repetition_check`

検証観点:

- 必須フィールド欠落時のエラーコード
- 成功レスポンス形
- `message` と `detail` の最低限の可読性
- 不正 Project / Version 参照時の失敗
- ローカルホスト以外の LLM 接続拒否

## 7.4 Frontend Integration

目的:

- `ホーム -> 編集 -> 保存 -> 比較 -> 復元` の母艦体験を保証する

優先対象:

- 新規 Project 作成で空 Draft 開始
- Section 追加 / 並べ替え / 改名 / 削除
- `All Lyrics` とセクション表示切替
- 自動保存後の再読込
- Save Snapshot 後も Working Draft 継続
- Fragment 挿入後の autosave
- SearchPanel 内の `本文 / 過去版 / 断片 / タグ`
- SongArtifact 保存ガード
- Trash / Restore の一覧反映
- ExportPanel 実行状態表示

## 7.5 Manual Acceptance / Runtime

目的:

- Tauri / Monaco / OS ネイティブ UI / 実ファイル I/O の実動作確認

優先対象:

- `Start.bat` からの起動
- dev server 再利用時の起動
- Monaco の入力感、スクロール、Diff 表示
- OS ネイティブの import/export ダイアログ
- 外部 URL オープン確認
- Windows / macOS のショートカット表記
- 実際の `.lyrlytic.zip` 出力確認
- ローカル LLM 接続確認と JSON 結果表示

## 8. 優先度付きテストチェックリスト

運用ルール:

- 未着手: `- [ ]`
- 設計済み / ケース作成済み: `- [/]`
- 実装済み / 継続実行中: `- [x]`

## 8.1 Blocker

- [ ] TD-B01 Project 作成時に空の Working Draft が生成されることを自動テスト化する
- [ ] TD-B02 Section 追加、連番付与、改名、並べ替え、削除が autosave と両立することを自動テスト化する
- [ ] TD-B03 `create_snapshot` が Working Draft を壊さず LyricVersion を追加することを自動テスト化する
- [ ] TD-B04 過去版復元が `Working Draft 再構築` であり、既存 LyricVersion を上書きしないことを自動テスト化する
- [ ] TD-B05 `draft_sections` を正本とした全文再構成を自動テスト化する
- [ ] TD-B06 論理削除と復元の batch 挙動を repository / command テストで固定する
- [ ] TD-B07 `.lyrlytic.zip` export の JSON 正本と除外対象を自動テスト化する
- [ ] TD-B08 `npm test` または同等のフロントテスト実行で主要失敗を検出できる状態にする
- [ ] TD-B09 `cargo test` で repository / command の主要フローを検出できる状態にする

## 8.2 High

- [ ] TD-H01 SearchPanel の `本文 / 過去版 / 断片 / タグ` 切替を integration test 化する
- [ ] TD-H02 Fragment の手動登録、`.txt` import、本文挿入、`used` 更新を一連で検証する
- [ ] TD-H03 SongArtifact が未保存 Draft へ直接紐付かないことを UI テストで固定する
- [ ] TD-H04 StyleProfile の active 1 件制約、論理削除、復元を repository test 化する
- [ ] TD-H05 CopyOptions の `見出し込み / 空行保持 / セクション選択` を unit + integration で固定する
- [ ] TD-H06 TrashPanel で Project / LyricVersion / SongArtifact / Fragment / RevisionNote / StyleProfile が見えることを integration test 化する
- [ ] TD-H07 Import 失敗時の再選択導線を UI テストで固定する
- [ ] TD-H08 Export 完了後の生成パス表示を integration test 化する
- [ ] TD-H09 `projects.updated_at` が Draft / Version / Fragment / SongArtifact 更新で追随することを repository test 化する
- [ ] TD-H10 LLM 設定画面の `enabled / baseUrl / model / timeout / max tokens / temperature` を unit test 化する

## 8.3 Medium

- [ ] TD-M01 `All Lyrics` ビューの全文プレビューとセクションビュー切替を UI テストで固定する
- [ ] TD-M02 差分確認ビューの比較対象表示、変更件数、復元導線を integration test 化する
- [ ] TD-M03 ホーム画面の最近更新順、Resume 導線、深い階層の Trash 導線を UI テストで固定する
- [ ] TD-M04 `Start.bat` の `dev server 再利用 / 重複起動抑止` を手動ランタイム手順に追加する
- [ ] TD-M05 グローバルショートカットの Windows / macOS 表記差分を手動テストへ追加する
- [ ] TD-M06 スクロール、レスポンシブ、3 ペイン追従を手動 UI チェックへ追加する

## 8.4 条件付き

- [ ] TD-C01 ローカル LLM 接続確認 command の成功 / 失敗 / localhost 制限を自動テスト化する
- [ ] TD-C02 モデル頻出表現チェックの JSON 応答パースを unit test 化する
- [ ] TD-C03 低頻出候補レコメンドの JSON 応答パースを unit test 化する
- [ ] TD-C04 実ランタイムで `llama.cpp` 接続を手動確認する
- [ ] TD-C05 実ランタイムで `Ollama` 接続を手動確認する

## 9. テストケース設計マトリクス

| ID | 機能 | レベル | 自動化優先度 | 要件参照 |
|---|---|---|---|---|
| T-01 | Project 作成 / 空 Draft | Integration + Repo | 最優先 | requirements 12.1, 15.1 |
| T-02 | Section 管理 | Unit + Integration | 最優先 | requirements 13.x, 15.2 |
| T-03 | 自動保存 | Integration + Repo | 最優先 | requirements 14.1 |
| T-04 | Save Snapshot | Command + Repo + Integration | 最優先 | requirements 14.2, 14.3 |
| T-05 | 差分比較 | Integration + Manual | 高 | requirements 19.3 |
| T-06 | 復元 | Command + Integration | 最優先 | requirements 12.4, 14.3 |
| T-07 | RevisionNote | Repo + Integration | 高 | requirements 10.5, 15.x |
| T-08 | Fragment 手動登録 / 挿入 | Integration | 高 | requirements 15.6 |
| T-09 | `.txt` Import | Command + Integration + Manual | 高 | requirements 15.12 |
| T-10 | Copy 整形 | Unit + Integration | 高 | requirements 15.8 |
| T-11 | SongArtifact | Repo + Integration | 高 | requirements 15.9 |
| T-12 | 外部 URL 確認 | Manual + Integration | 高 | requirements 21.1 |
| T-13 | 論理削除 | Repo + Command | 最優先 | requirements 12.3, 15.15 |
| T-14 | 復元 | Repo + Command + Integration | 最優先 | requirements 12.4, 15.15 |
| T-15 | StyleProfile | Repo + Integration | 高 | requirements 15.10 |
| T-16 | 検索パネル | Integration | 高 | requirements 15.7 |
| T-17 | エクスポート | Repo + Command + Manual | 最優先 | requirements 15.16 |
| T-18 | ローカル完結 | Manual | 高 | requirements 5.1, 22.4 |
| T-19 | LLM 接続確認 | Command + Manual | 条件付き | requirements 16.x |
| T-20 | 頻出表現チェック | Unit + Command + Manual | 条件付き | requirements 16.x |
| T-21 | 低頻出候補 | Unit + Command + Manual | 条件付き | requirements 17.x |
| T-22 | Windows / macOS | Manual | 高 | acceptance TC-22 |

## 10. 非機能テスト観点

- 応答性
  - [ ] NF-01 通常入力が 100ms 未満で応答する
  - [ ] NF-02 Project 切替と履歴一覧が 1 秒以内で開く
  - [ ] NF-03 全文コピーが 1 秒以内に完了する
- 安全性
  - [ ] NF-04 外部 URL は自動で開かれない
  - [ ] NF-05 LLM 接続先は `localhost / 127.0.0.1` 以外を拒否する
  - [ ] NF-06 export に `app_settings` が含まれない
- 可逆性
  - [ ] NF-07 再起動後に Working Draft を復元できる
  - [ ] NF-08 論理削除後に batch 単位で復元できる
- OS 差分
  - [ ] NF-09 Windows / macOS 両方で import/export/copy が通る
  - [ ] NF-10 ショートカット表記が OS ごとに切り替わる

## 11. 実施順

### 11.1 まず作る自動テスト

1. Project / Draft / Snapshot / Restore
2. Section / autosave / copy
3. 論理削除 / 復元 / export
4. Fragment / Search / SongArtifact / StyleProfile
5. LLM 契約

### 11.2 毎回手動で通す最小ランタイム確認

1. `Start.bat` で起動
2. 新規 Project 作成
3. Section 追加
4. 本文編集と autosave
5. Save Snapshot
6. 差分確認
7. Fragment import / insert
8. SongArtifact 登録
9. Trash から復元
10. export 実行

## 12. 完了条件

以下を満たした時点で、`テスト設計が運用できる状態` とみなす。

- Blocker の全項目に担当と実施レベルが割り当てられている
- `T-01` から `T-17` に対応する自動テストまたは手動ケースの置き場が確定している
- `npm test` と `cargo test` の責務範囲が分かれている
- Manual ランタイム確認の最小手順が固定されている
- 新規要件追加時に、本書へ追記する運用が開始されている

## 13. 要件へ戻す条件

以下が起きた場合は、テストだけで吸収せず要件文書へ戻す。

- 同じ機能で Frontend と command 契約の期待結果が食い違う
- Windows と macOS で合格条件が変わる
- LLM 応答を JSON 固定で扱えない
- `Working Draft` と `LyricVersion` の責務がテスト設計上も曖昧になる
- export / import の入出力契約が一意に定まらない
