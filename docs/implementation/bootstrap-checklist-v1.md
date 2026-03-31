# LyricLytic 実装開始チェックリスト v1

## 1. 目的

本書は、PoC 実装を始めるときに `順番を間違えずに最初の縦切りへ到達する` ための実務チェックリストである。

## 2. 開始前チェック

- [ ] `requirements/requirements.md` を読む
- [ ] `requirements/frontend-requirements-v1.md` を読む
- [ ] `requirements/poc-task-breakdown-v1.md` を読む
- [ ] `implementation/system-architecture-v1.md` を読む
- [ ] `implementation/command-contracts-v1.md` を読む

## 3. repo 初期化

- [ ] Tauri プロジェクトを初期化する
- [ ] フロントエンドの使用ライブラリを決める
- [ ] Monaco Editor 導入可否を早めに確認する
- [ ] SQLite 初期ファイルの配置場所を決める
- [ ] `.env` やローカル設定が必要なら扱い方を決める

## 4. 推奨初期構成

- [ ] `src/pages`
- [ ] `src/features`
- [ ] `src/components`
- [ ] `src/lib`
- [ ] `src-tauri/src/commands`
- [ ] `src-tauri/src/application`
- [ ] `src-tauri/src/repositories`
- [ ] `src-tauri/src/db`
- [ ] `src-tauri/migrations`

## 5. 最初の縦切りで作るもの

- [ ] HomePage
- [ ] EditorPage
- [ ] SaveSnapshotDialog
- [ ] `list_projects`
- [ ] `create_project`
- [ ] `get_working_draft`
- [ ] `save_working_draft`
- [ ] `create_snapshot`

## 6. DB 初期化チェック

- [ ] `sqlite-schema-v1.sql` を migration へ落とす
- [ ] `projects`
- [ ] `working_drafts`
- [ ] `draft_sections`
- [ ] `lyric_versions`
- [ ] `app_settings`
- [ ] partial unique index が有効か確認する

## 7. UI で最初に通すべき確認

- [ ] Project を 1 件作れる
- [ ] 空 Draft へ遷移できる
- [ ] Section を追加できる
- [ ] 編集内容が自動保存される
- [ ] Save Snapshot で履歴を増やせる
- [ ] 保存後も Working Draft のまま編集できる

## 8. エラー処理の最低ライン

- [ ] DB 初期化失敗
- [ ] 自動保存失敗
- [ ] Snapshot 保存失敗
- [ ] TXT 読み込み失敗
- [ ] LLM 接続失敗

上記は少なくとも区別できるメッセージにする。

## 9. 実装中の禁止事項

- [ ] Working Draft と LyricVersion を同じ編集対象として扱わない
- [ ] 削除を物理削除前提で作らない
- [ ] Working Draft へ SongArtifact を直接紐付けない
- [ ] `.txt` 以外のインポートを PoC の既定にしない
- [ ] LLM の曖昧な文字列応答をそのまま UI へ流さない

## 10. 最初の完了条件

以下を満たしたら、実装準備フェーズは完了とみなしてよい。

- [ ] Home -> Editor の縦切りが動く
- [ ] DB 初期化と再起動復元が通る
- [ ] Save Snapshot が履歴として成立する
- [ ] 今後の command 追加先と repository 追加先が明確である

## 11. 要件へ戻すとき

- [ ] 仕様で迷ったら `requirements/` 側へ戻す
- [ ] 変更したら `review-log.md` に Gate を追記する
- [ ] 実装都合で要件を暗黙変更しない
