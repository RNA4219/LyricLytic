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

- Blocker: 2 件 (前回 3 件 → 1 件解決)
- High: 9 件 (前回 10 件 → 1 件解決)
- Medium: 5 件 (前回 6 件 → 1 件解決)
- 要件変更の判断待ち: 2 件

## 3. Blocker

- [x] GAP-B01 検索機能が編集画面に統合されていない ✅ 解決済み
  要件: 編集画面から開く検索パネルで `本文 / 過去版 / 断片 / タグ` を切り替え、画面遷移なしで使えること。
  現状: `SearchPanel` が Editor 右ペインに統合され、draft/versions/fragments 検索が可能。
  対象: `docs/requirements/requirements.md`, `src/components/SearchPanel.tsx`, `src/pages/Editor.tsx`

- [x] GAP-B02 検索種別が要件を満たしていない ✅ 解決済み
  要件: `本文 / 過去版 / 断片 / タグ` を同一 UI で切り替えること。
  現状: `SearchPanel.tsx` に Tags タブが実装済み。backend が fragment_tags を返すよう修正。
  対象: `docs/requirements/requirements.md`, `src/components/SearchPanel.tsx`, `src-tauri/src/repositories/fragment_repo.rs`

- [x] GAP-B03 RevisionNote 登録が実質壊れている ✅ 解決済み
  要件: RevisionNote は `LyricVersion + Section` を主参照先とし、同一 Version 内 Section を参照すること。
  現状: `RevisionNotePanel.tsx` に Section 選択 UI が追加され、`version_section_id` が必須送信される。Version 作成時に `version_sections` が自動作成される。
  対象: `docs/requirements/requirements.md`, `src/components/RevisionNotePanel.tsx`, `src-tauri/src/models.rs`, `src-tauri/src/repositories/version_repo.rs`

- [x] GAP-B04 StyleProfile が編集画面に統合されていない ✅ 解決済み
  要件: StyleProfile は Project 設定または編集画面内メタ情報パネルから編集できること。
  現状: `StyleProfilePanel` が Editor 右ペインに統合された。
  対象: `docs/requirements/requirements.md`, `src/components/StyleProfilePanel.tsx`, `src/pages/Editor.tsx`

- [ ] GAP-B05 削除済みデータ管理が Project のみで、主要対象を扱えていない
  要件: Project, LyricVersion, SongArtifact, CollectedFragment, RevisionNote, StyleProfile を削除済みデータ管理画面で確認・復元できること。
  現状: `TrashPanel.tsx` は削除済み Project しか取得・表示できない。
  対象: `docs/requirements/requirements.md`, `src/components/TrashPanel.tsx`, `src/lib/api.ts`, `src-tauri/src/commands/*.rs`
  対応方針: 種別横断の deleted items API を追加し、バッチ単位表示へ再設計する。

- [x] GAP-B06 エクスポートが要件の zip package 契約を満たしていない ✅ 解決済み
  要件: Project 単位の `.lyrlytic.zip`、UTF-8 JSON 正本、保存ダイアログ方式、削除データ含有切替を持つこと。
  現状: `export_project` コマンドが zip package を生成し、Tauri 保存ダイアログで任意の場所に保存可能。
  対象: `docs/requirements/requirements.md`, `docs/requirements/export-spec-v1.md`, `src/components/ExportPanel.tsx`, `src-tauri/src/commands/export.rs`, `src-tauri/src/repositories/export_repo.rs`

- [x] GAP-B07 インポート導線が未接続で、PoC 主要フローを通せない ✅ 解決済み
  要件: `.txt` 単一ファイル選択のインポートダイアログを明示導線から実行できること。
  現状: `ImportDialog` が Editor 右ペインの "Import .txt" ボタンから開ける。
  対象: `docs/requirements/requirements.md`, `src/components/ImportDialog.tsx`, `src/pages/Editor.tsx`

- [x] GAP-B08 ビルドが通っておらず、PoC の受け入れ確認に進めない ✅ 解決済み
  要件: 受け入れテストを実施できる実装状態であること。
  現状: `npm run build` が正常に完了する。
  対象: 全コンポーネント

- [ ] GAP-B09 LLM 機能が要件の「モデル頻出表現チェック / 低頻出候補レコメンド」になっていない
  要件: ローカル LLM で N 回生成し、頻出表現可視化や低頻出候補提示を行うレビュー補助機能であること。
  現状: `LLMAssistPanel.tsx` は単発の歌詞生成補助で、レビュー支援ロジックが存在しない。
  対象: `docs/requirements/requirements.md`, `docs/requirements/acceptance-test-cases-v1.md`, `src/components/LLMAssistPanel.tsx`
  対応方針: 生成補助とレビュー補助を分離し、要件どおりのローカル分析機能を別 UI / 別 command で実装する。

## 4. High

- [ ] GAP-H01 StyleProfile の削除復元フローが未完成
  要件: StyleProfile は論理削除し、削除済みデータ管理から復元できること。
  現状: `delete_style_profile` はあるが、復元 API / UI が存在しない。
  対象: `docs/requirements/requirements.md`, `src/lib/api.ts`, `src-tauri/src/commands/style_profile.rs`, `src-tauri/src/repositories/style_profile_repo.rs`
  対応方針: deleted items API に StyleProfile を含め、復元 command を追加する。

- [ ] GAP-H02 CollectedFragment / SongArtifact / RevisionNote の削除復元フローが未完成
  要件: これらは論理削除を前提とし、UI から復元可能であること。
  現状: soft delete はあるが、復元 API と UI がない。
  対象: `docs/requirements/requirements.md`, `src-tauri/src/repositories/fragment_repo.rs`, `src-tauri/src/repositories/song_artifact_repo.rs`, `src-tauri/src/repositories/revision_note_repo.rs`
  対応方針: 種別別 restore command と deleted items 一覧を追加する。

- [ ] GAP-H03 LyricVersion 単体削除と復元導線が未実装
  要件: LyricVersion 単体削除は確認付き明示操作とし、バッチ単位復元できること。
  現状: Version 作成と一覧はあるが、Version 削除 API / UI / 復元 UI がない。
  対象: `docs/requirements/requirements.md`, `src/pages/Editor.tsx`, `src-tauri/src/commands/version.rs`
  対応方針: Version の soft delete / restore を Project 削除と分けて実装する。

- [ ] GAP-H04 削除済みデータ管理画面の階層が要件より前面に出ている
  要件: 削除済みデータ管理は主導線ではなく、深い階層で扱うこと。
  現状: `Home.tsx` で `TrashPanel` を常時表示しており、ホームの主要機能に見える。
  対象: `docs/requirements/frontend-requirements-v1.md`, `src/pages/Home.tsx`, `src/components/TrashPanel.tsx`
  対応方針: `More` または `Settings` 配下へ移す。

- [ ] GAP-H05 ImportDialog の実装方式が OS ネイティブ運用に十分追従していない
  要件: Windows / macOS で OS ネイティブのファイル選択ダイアログを使い、読み込み失敗時に再選択できること。
  現状: ダイアログ選択後の読み込みを `fetch(file://...)` に依存しており、ローカルデスクトップ実装として不安定。
  対象: `docs/requirements/requirements.md`, `src/components/ImportDialog.tsx`
  対応方針: Tauri の fs 読み込み command か適切な plugin API へ切り替える。

- [ ] GAP-H06 インポート時の文字コード再選択導線がない
  要件: 文字コード判定失敗時にユーザーへ再選択手段を提示できること。
  現状: 失敗時は汎用エラー文言のみ。
  対象: `docs/requirements/requirements.md`, `src/components/ImportDialog.tsx`
  対応方針: エンコーディング再試行 UI または PoC 向け限定エラーメッセージを追加する。

- [x] GAP-H07 CopyOptions が未接続で、履歴に残す copy 設定とも連動していない ✅ 解決済み
  要件: コピー設定が UI から扱え、LyricVersion 保存時の copy 条件履歴と責務分離されること。
  現状: `CopyOptionsPanel` が Editor に統合され、見出し/空行オプションが使用可能。
  対象: `docs/requirements/requirements.md`, `src/components/CopyOptionsPanel.tsx`, `src/pages/Editor.tsx`

- [ ] GAP-H08 SongArtifact の導線が「Working Draft を直接紐付けない」を十分に伝えていない
  要件: Working Draft 状態から曲紐付けを行う場合は、保存して LyricVersion を作成するか既存版を選ぶ導線を出すこと。
  現状: `SongArtifactPanel.tsx` は保存済み Version 選択のみで、未保存時の説明や保存誘導が弱い。
  対象: `docs/requirements/requirements.md`, `src/components/SongArtifactPanel.tsx`
  対応方針: Version 未作成時のガード文言と保存誘導 CTA を追加する。

- [ ] GAP-H09 LLM 設定項目が要件より不足している
  要件: `llm_enabled`, `llm_base_url`, `llm_model_name`, `llm_timeout_ms`, `llm_max_output_tokens`, `llm_temperature` を設定できること。
  現状: `runtime`, `baseUrl`, `model`, `modelPath`, `enabled` のみ。
  対象: `docs/requirements/requirements.md`, `src/components/LLMSettingsPanel.tsx`
  対応方針: 要件どおりの設定項目を追加するか、PoC 要件を実装現実に合わせて見直す。

- [ ] GAP-H10 LLM 接続確認ボタンと接続状態表示がない
  要件: PoC では AI 接続確認ボタンと接続状態表示を画面内から到達可能にすること。
  現状: 生成実行はできるが、独立した接続確認とステータス表示がない。
  対象: `docs/requirements/requirements.md`, `src/components/LLMSettingsPanel.tsx`, `src/components/LLMAssistPanel.tsx`
  対応方針: `Test Connection` と状態バッジを追加する。

## 5. Medium

- [ ] GAP-M01 LLM 応答の JSON 構造化前提を満たしていない
  要件: PoC ではモデル応答を JSON 構造として受け取り、候補一覧へ変換すること。
  現状: `LLMAssistPanel.tsx` は自由文をそのまま表示する。
  対象: `docs/requirements/requirements.md`, `src/components/LLMAssistPanel.tsx`
  対応方針: prompt と response parser を JSON 契約へ切り替える。

- [ ] GAP-M02 `Ollama` 対応が現行要件とずれている
  要件: PoC の既定接続方式は OpenAI 互換ローカル HTTP API 1 系統とされている。
  現状: 実装は `openai_compatible` と `ollama` の 2 系統を持つ。
  対象: `docs/requirements/requirements.md`, `docs/requirements/local-llm-connector-v1.md`, `src/components/LLMSettingsPanel.tsx`, `src/components/LLMAssistPanel.tsx`
  対応方針: 実装を戻すか、要件を更新して `Ollama` を正式に PoC 範囲へ含める。

- [x] GAP-M03 Fragment タグがフロントへ返っておらず、タグ検索要件に繋がらない ✅ 解決済み
  要件: タグ検索対象は Project, CollectedFragment, StyleProfile のタグであること。
  現状: `fragment_repo.rs` が `fragment_tags` を取得して `CollectedFragment.tags` に返すよう修正済み。
  対象: `docs/requirements/requirements.md`, `src-tauri/src/models.rs`, `src-tauri/src/repositories/fragment_repo.rs`

- [ ] GAP-M04 Project / StyleProfile タグ運用が未実装
  要件: タグ検索対象に Project と StyleProfile が含まれること。
  現状: DB テーブルはあるが API / UI / repository で扱っていない。
  対象: `docs/requirements/requirements.md`, `src-tauri/migrations/001_init.sql`, `src/lib/api.ts`
  対応方針: タグ CRUD を段階実装するか、PoC のタグ対象を Fragment のみに縮退する要件変更を判断する。

- [ ] GAP-M05 ショートカット要件が未着手
  要件: 保存、検索、コピー、差分確認、曲紐付け、インポート、エクスポート、削除済みデータ管理のショートカットを提供すること。
  現状: キーボードショートカット実装が見当たらない。
  対象: `docs/requirements/requirements.md`, `src/pages/Editor.tsx`, `src/pages/Home.tsx`
  対応方針: 最低限のコマンドショートカットを定義し、OS 表記差分も含めて実装する。

- [ ] GAP-M06 差分確認ビューが復元起点やサマリー表示まで届いていない
  要件: 差分確認ビューは差分サマリー、変更件数、復元導線を持つこと。
  現状: `DiffViewer.tsx` は 2 版の比較表示のみ。
  対象: `docs/requirements/frontend-requirements-v1.md`, `src/components/DiffViewer.tsx`
  対応方針: 比較対象情報、変更件数、復元導線を追加する。

## 6. 要件変更の判断待ち

- [ ] GAP-D01 LLM の `modelPath` を要件へ取り込むか判断する
  要件: 現行要件では `llm_model_name` まではあるが、モデルファイルパスの保持は明文化されていない。
  現状: 実装では `modelPath` を追加済み。
  対象: `docs/requirements/requirements.md`, `docs/requirements/local-llm-connector-v1.md`, `src/components/LLMSettingsPanel.tsx`
  対応方針: `llama.cpp` 運用前提として正式要件へ追加するか、実装補助設定として README レベルに留めるか決める。

- [ ] GAP-D02 LLM を「生成補助」にするのか「レビュー補助」に絞るのか判断する
  要件: 現行要件はレビュー補助寄りで、生成機能は主軸ではない。
  現状: 実装は生成補助寄りで UI も `Generate lyrics` になっている。
  対象: `docs/requirements/requirements.md`, `src/components/LLMAssistPanel.tsx`
  対応方針: 要件を守るならレビュー補助へ戻す。生成補助も欲しいなら別機能として明文化する。

## 7. 確認済みで大筋合っている項目

- [x] Working Draft と LyricVersion を分けて扱っている
- [x] `draft_sections` を優先して読み込む構成へ寄せている
- [x] SongArtifact の外部 URL オープン前に確認ダイアログを出している
- [x] Project 削除時に主要データへの論理削除連鎖は概ね入っている
- [x] ローカル LLM 接続先を `localhost / 127.0.0.1` に制限している

## 8. 着手順の推奨

1. Build blocker を解消する
2. 検索 / StyleProfile / Import の未接続 UI を Editor 母艦へ統合する
3. 削除済みデータ管理を Project 専用実装から種別横断実装へ広げる
4. エクスポートを正式仕様へ切り替える
5. LLM は要件を更新するか、実装をレビュー補助仕様へ戻すか先に決める
