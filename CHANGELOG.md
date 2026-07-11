# Changelog

## [1.2.0] - Unreleased

### Added

- RustネイティブSudachi Core韻解析と同梱辞書
- latest-wins自動保存、保存再試行、画面離脱flush
- SQLite Backup API、外部キー整合性検査、3世代バックアップ
- Rust commandによるTXT読込、モデル走査、ZIP・簡易エクスポート
- 共通アクセシブルModal
- Windows/macOS CI、依存監査、80%カバレッジGate

### Changed

- Section IDを安定化し、削除Sectionを論理削除
- 書込み操作をSQLiteトランザクション化
- Vite 7.3.6、React Router 6.30.4、Monaco 0.55.1へ更新
- Node.js要件を20.19以上または22.12以上へ更新

### Security

- DOMPurify 3.4.11をoverride固定
- 外部参照の同一Project/Version検証を追加
