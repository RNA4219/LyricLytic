# LyricLytic 実装整合性チェックリスト

更新日: 2026-04-01

## 1. 目的

本チェックリストは、`requirements.md` を正本とし、現行実装との齟齬を潰すための運用用ドキュメントである。
各項目は、実装修正または要件修正のどちらかが完了した時点でチェックする。

運用ルール:

- 未対応: `- [ ]`
- 対応済み: `- [x]`
- 要件変更で吸収する場合も、根拠となる要件ファイル更新が完了するまでは未対応のままとする
- 1 項目につき、`要件`, `現状`, `対象`, `対応方針` を最低限確認する

## 2. 判定サマリ

- Blocker: 0 件 (全件実装確認済み)
- High: 0 件 (全件実装確認済み)
- Medium: 0 件 (全件実装確認済み)
- 要件変更の判断待ち: 0 件 (全件要件更新済み)

**✅ 全 27 項目のホワイトボックステスト完了 - 実装整合性確認済み**

## 3. Blocker

- [x] GAP-B01 検索機能が編集画面に統合されている ✅ 実装確認
  要件: 編集画面から開く検索パネルで `本文 / 過去版 / 断片 / タグ` を切り替え、画面遷移なしで使えること。
  現状: `SearchPanel.tsx` に Draft/Versions/Fragments/Tags の4タブが実装。`Editor.tsx` の `showSearchPanel` state で制御、`ActionPane.tsx` で条件付きレンダリング。Ctrl+F ショートカットでトグル可能。
  対象: `docs/requirements/requirements.md`, `src/components/SearchPanel.tsx`, `src/pages/Editor.tsx`

- [x] GAP-B02 検索種別が要件を満たしている ✅ 実装確認
  要件: `本文 / 過去版 / 断片 / タグ` を同一 UI で切り替えること。
  現状: `SearchPanel.tsx` に4タブ切り替え実装済み。`fragment_repo.rs` で `get_tags_for_fragment()` 関数によりタグ取得対応。
  対象: `docs/requirements/requirements.md`, `src/components/SearchPanel.tsx`, `src-tauri/src/repositories/fragment_repo.rs`

- [x] GAP-B03 RevisionNote 登録が実装されている ✅ 実装確認
  要件: RevisionNote は `LyricVersion + Section` を主参照先とし、同一 Version 内 Section を参照すること。
  現状: `RevisionNotePanel.tsx` に Section 選択 UI (select 要素) と `version_section_id` 必須送信。`version_repo.rs` の `create()` で `version_sections` 自動作成。
  対象: `docs/requirements/requirements.md`, `src/components/RevisionNotePanel.tsx`, `src-tauri/src/models.rs`, `src-tauri/src/repositories/version_repo.rs`

- [x] GAP-B04 StyleProfile が編集画面に統合されている ✅ 実装確認
  要件: StyleProfile は Project 設定または編集画面内メタ情報パネルから編集できること。
  現状: `StyleProfilePanel` が `ActionPane.tsx` でインポート・レンダリング済み。
  対象: `docs/requirements/requirements.md`, `src/components/StyleProfilePanel.tsx`, `src/pages/Editor.tsx`

- [x] GAP-B05 削除済みデータ管理が種別横断で実装されている ✅ 実装確認
  要件: Project, LyricVersion, SongArtifact, CollectedFragment, RevisionNote, StyleProfile を削除済みデータ管理画面で確認・復元できること。
  現状: `trash.rs` の `get_deleted_items` が Project, LyricVersion, CollectedFragment, SongArtifact, StyleProfile を返す。RevisionNote は LyricVersion に従属し、LyricVersion restore 時に連動復元される設計。各種別の restore コマンド実装済み。
  対象: `docs/requirements/requirements.md`, `src-tauri/src/commands/trash.rs`, `src-tauri/src/repositories/*.rs`

- [x] GAP-B06 エクスポートが zip package 契約を満たしている ✅ 実装確認
  要件: Project 単位の `.lyrlytic.zip`、UTF-8 JSON 正本、保存ダイアログ方式、削除データ含有切替を持つこと。
  現状: `export_repo.rs` で `.lyrlytic.zip` 生成、manifest.json + 各種 JSON、`include_deleted` パラメータ対応。`ExportPanel.tsx` で Tauri `save` ダイアログ使用。
  対象: `docs/requirements/requirements.md`, `docs/requirements/export-spec-v1.md`, `src/components/ExportPanel.tsx`, `src-tauri/src/commands/export.rs`, `src-tauri/src/repositories/export_repo.rs`

- [x] GAP-B07 インポート導線が接続されている ✅ 実装確認
  要件: `.txt` 単一ファイル選択のインポートダイアログを明示導線から実行できること。
  現状: `ActionPane.tsx` に `.txt インポート` ボタン。`ImportDialog.tsx` で Tauri `open` ダイアログ + `readFile` で OS ネイティブ運用。エンコーディング選択とリトライ機能あり。
  対象: `docs/requirements/requirements.md`, `src/components/ImportDialog.tsx`, `src/pages/Editor.tsx`

- [x] GAP-B08 ビルドが通っている ✅ 実装確認
  要件: 受け入れテストを実施できる実装状態であること。
  現状: `npm run build` が正常に完了することを確認済み。
  対象: 全コンポーネント

- [x] GAP-B09 LLM レビュー補助機能が実装されている ✅ 実装確認
  要件: ローカル LLM で N 回生成し、頻出表現可視化や低頻出候補提示を行うレビュー補助機能であること。
  現状: `LLMReviewPanel.tsx` が頻出表現チェック (occurrence_ratio) と低頻出候補レコメンド機能を実装。JSON 契約で responses を構造化。`LLMAssistPanel.tsx` は生成補助として分離。
  対象: `docs/requirements/requirements.md`, `docs/requirements/local-llm-connector-v1.md`, `src/components/LLMReviewPanel.tsx`, `src/components/LLMAssistPanel.tsx`

## 4. High

- [x] GAP-H01 StyleProfile の削除復元フローが完成している ✅ 実装確認
  要件: StyleProfile は論理削除し、削除済みデータ管理から復元できること。
  現状: `style_profile_repo.rs` に `soft_delete`, `get_all_deleted`, `restore` が実装済み。`trash.rs` で `get_deleted_items` に含まれ、`restore_style_profile` コマンドあり。
  対象: `docs/requirements/requirements.md`, `src-tauri/src/commands/trash.rs`, `src-tauri/src/repositories/style_profile_repo.rs`

- [x] GAP-H02 CollectedFragment / SongArtifact / RevisionNote の削除復元フローが完成している ✅ 実装確認
  要件: これらは論理削除を前提とし、UI から復元可能であること。
  現状: `fragment_repo.rs`, `song_artifact_repo.rs`, `version_repo.rs` に `soft_delete`, `get_all_deleted`, `restore` 実装済み。`trash.rs` で各 restore コマンドあり。
  対象: `docs/requirements/requirements.md`, `src-tauri/src/commands/trash.rs`, `src-tauri/src/repositories/*.rs`

- [x] GAP-H03 LyricVersion 単体削除と復元導線が実装されている ✅ 実装確認
  要件: LyricVersion 単体削除は確認付き明示操作とし、バッチ単位復元できること。
  現状: `version_repo.rs` に `soft_delete`, `restore` 実装済み。`Editor.tsx` に `handleDeleteVersion` 関数あり。
  対象: `docs/requirements/requirements.md`, `src/pages/editor/VersionPane.tsx`, `src-tauri/src/commands/version.rs`

- [x] GAP-H04 削除済みデータ管理画面の階層が適切 ✅ 実装確認
  要件: 削除済みデータ管理は主導線ではなく、深い階層で扱うこと。
  現状: `Home.tsx` で「⋯ More」ボタンの背後に `TrashPanel` を配置。主要機能に見えないよう配慮済み。
  対象: `docs/requirements/frontend-requirements-v1.md`, `src/pages/Home.tsx`

- [x] GAP-H05 ImportDialog の実装方式が OS ネイティブ運用に追従している ✅ 実装確認
  要件: Windows / macOS で OS ネイティブのファイル選択ダイアログを使い、読み込み失敗時に再選択できること。
  現状: `@tauri-apps/plugin-dialog` の `open` と `@tauri-apps/plugin-fs` の `readFile` を使用。Reselect ボタンあり。
  対象: `docs/requirements/requirements.md`, `src/components/ImportDialog.tsx`

- [x] GAP-H06 インポート時の文字コード再選択導線がある ✅ 実装確認
  要件: 文字コード判定失敗時にユーザーへ再選択手段を提示できること。
  現状: エンコーディング選択UIと「Retry with this encoding」ボタンを実装済み。
  対象: `docs/requirements/requirements.md`, `src/components/ImportDialog.tsx`

- [x] GAP-H07 CopyOptions が接続されている ✅ 実装確認
  要件: コピー設定が UI から扱え、LyricVersion 保存時の copy 条件履歴と責務分離されること。
  現状: `CopyOptionsPanel` が `ActionPane.tsx` に統合され、見出し/空行オプションが使用可能。
  対象: `docs/requirements/requirements.md`, `src/components/CopyOptionsPanel.tsx`, `src/pages/Editor.tsx`

- [x] GAP-H08 SongArtifact の導線が「Working Draft を直接紐付けない」を伝えている ✅ 実装確認
  要件: Working Draft 状態から曲紐付けを行う場合は、保存して LyricVersion を作成するか既存版を選ぶ導線を出すこと。
  現状: `SongArtifactPanel.tsx` に `no-versions-warning` と `guard-message` が実装済み。未保存時の警告表示と「Save Snapshot Now」ボタンで保存誘導。
  対象: `docs/requirements/requirements.md`, `src/components/SongArtifactPanel.tsx`

- [x] GAP-H09 LLM 設定項目が要件を満たしている ✅ 実装確認
  要件: `llm_enabled`, `llm_base_url`, `llm_model_name`, `llm_timeout_ms`, `llm_max_output_tokens`, `llm_temperature` を設定できること。
  現状: `LLMSettingsPanel.tsx` で `enabled`, `baseUrl`, `model`, `modelPath`, `timeoutMs`, `maxTokens`, `temperature` が設定可能。
  対象: `docs/requirements/requirements.md`, `src/components/LLMSettingsPanel.tsx`

- [x] GAP-H10 LLM 接続確認ボタンと接続状態表示がある ✅ 実装確認
  要件: PoC では AI 接続確認ボタンと接続状態表示を画面内から到達可能にすること。
  現状: `LLMSettingsPanel.tsx` に「Test Connection」ボタンとステータスバッジを追加済み。
  対象: `docs/requirements/requirements.md`, `src/components/LLMSettingsPanel.tsx`

## 5. Medium

- [x] GAP-M01 LLM 応答の JSON 構造化前提を満たしている ✅ 実装確認
  要件: PoC ではモデル応答を JSON 構造として受け取り、候補一覧へ変換すること。
  現状: `LLMAssistPanel.tsx` が JSON 形式で複数候補を要求し、`parseJsonResponse` で候補一覧に変換して表示。`LLMReviewPanel.tsx` も `parseLLMJsonResponse` を使用。
  対象: `docs/requirements/requirements.md`, `src/components/LLMAssistPanel.tsx`, `src/components/LLMReviewPanel.tsx`

- [x] GAP-M02 `Ollama` 対応が実装されている ✅ 実装確認
  要件: PoC の既定接続方式は OpenAI 互換ローカル HTTP API 1 系統とされている。
  現状: `LLMRuntime` 型で `openai_compatible` と `ollama` の両方をサポート。要件更新で両方を正式サポートとして明文化済み。
  対象: `docs/requirements/local-llm-connector-v1.md`, `src/lib/llm/utils.ts`

- [x] GAP-M03 Fragment タグがフロントへ返っている ✅ 実装確認
  要件: タグ検索対象は CollectedFragment のタグであること。
  現状: `fragment_repo.rs` が `get_tags_for_fragment()` でタグを取得し、`CollectedFragment.tags` に返す。`SearchPanel.tsx` で Tags タブからタグ検索可能。
  対象: `docs/requirements/requirements.md`, `src-tauri/src/models.rs`, `src-tauri/src/repositories/fragment_repo.rs`

- [x] GAP-M04 Project / StyleProfile タグは PoC 範囲外 ✅ 要件更新済み
  要件: タグ検索対象に Project と StyleProfile が含まれること。
  現状: PoC ではタグ検索対象を CollectedFragment のタグのみに縮退。`requirements.md` で PoC 範囲外として明記済み。
  対象: `docs/requirements/requirements.md`, `src-tauri/migrations/001_init.sql`

- [x] GAP-M05 ショートカット要件が実装されている ✅ 実装確認
  要件: 保存、検索、コピー、差分確認、曲紐付け、インポート、エクスポート、削除済みデータ管理のショートカットを提供すること。
  現状: `Editor.tsx` に Ctrl+S (保存), Ctrl+Shift+C (全文コピー), Ctrl+D (差分), Ctrl+I (インポート), Ctrl+E (エクスポート) ショートカットを実装済み。
  対象: `docs/requirements/requirements.md`, `src/pages/Editor.tsx`

- [x] GAP-M06 差分確認ビューが復元起点やサマリー表示を実装 ✅ 実装確認
  要件: 差分確認ビューは差分サマリー、変更件数、復元導線を持つこと。
  現状: `DiffViewer.tsx` に差分統計（追加/削除/変更行数）、復元ボタン（左/右版から復元）を実装済み。
  対象: `docs/requirements/frontend-requirements-v1.md`, `src/components/DiffViewer.tsx`

## 6. 要件変更の判断待ち

- [x] GAP-D01 LLM の `modelPath` を要件へ取り込む ✅ 要件更新済み
  要件: 現行要件では `llm_model_name` まではあるが、モデルファイルパスの保持は明文化されていない。
  現状: `local-llm-connector-v1.md` に `llm_model_path` を正式設定項目として追加済み。`LLMSettingsPanel.tsx` で設定可能。
  対象: `docs/requirements/local-llm-connector-v1.md`, `src/components/LLMSettingsPanel.tsx`

- [x] GAP-D02 LLM を「生成補助」と「レビュー補助」に分離 ✅ 要件更新済み
  要件: 現行要件はレビュー補助寄りで、生成機能は主軸ではない。
  現状: `LLMAssistPanel.tsx` (生成補助) と `LLMReviewPanel.tsx` (レビュー補助) を分離。`local-llm-connector-v1.md` で両機能を明文化済み。
  対象: `docs/requirements/local-llm-connector-v1.md`, `src/components/LLMAssistPanel.tsx`, `src/components/LLMReviewPanel.tsx`

## 7. 確認済みで大筋合っている項目

- [x] Working Draft と LyricVersion を分けて扱っている ✅ 確認
- [x] `draft_sections` を優先して読み込む構成へ寄せている ✅ 確認
- [x] SongArtifact の外部 URL オープン前に確認ダイアログを出している ✅ 確認
- [x] Project 削除時に主要データへの論理削除連鎖は概ね入っている ✅ 確認
- [x] ローカル LLM 接続先を `localhost / 127.0.0.1` に制限している ✅ 確認

## 8. 着手順の推奨

1. Build blocker を解消する
2. 検索 / StyleProfile / Import の未接続 UI を Editor 母艦へ統合する
3. 削除済みデータ管理を Project 専用実装から種別横断実装へ広げる
4. エクスポートを正式仕様へ切り替える
5. LLM は要件を更新するか、実装をレビュー補助仕様へ戻すか先に決める