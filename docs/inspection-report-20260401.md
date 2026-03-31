# LyricLytic 検収報告書

**検収日時**: 2026-04-01
**検収者**: Claude Code
**検収方法**: コードレビュー（静的解析）ベースの不具合検出

---

## 検出された不具合一覧

### 🔴 重大な不具合 (MVP ブロッカー)

#### BUG-009: LyricVersion 構造体のフィールド不一致によるコンパイルエラー
- **重要度**: 致命的（アプリケーションがビルドできない）
- **場所**: `src-tauri/src/repositories/version_repo.rs:42, 132`
- **エラーメッセージ**:
  ```
  error[E0063]: missing field `deleted_batch_id` in initializer of `LyricVersion`
  ```
- **原因**:
  - `models.rs` の `LyricVersion` 構造体は `deleted_batch_id: Option<String>` を持つ
  - `version_repo.rs` の SQL クエリと構造体初期化でこのフィールドが漏れている
- **修正方法**: SQL クエリに `deleted_batch_id` を追加し、構造体初期化に含める

---

#### BUG-001: 同名セクション追加時の連番付与が未実装
- **対象テストケース**: TC-02 セクション追加
- **期待結果**: 同名追加時は連番が付与される
- **実装状況**: 未実装
- **場所**: `src/pages/Editor.tsx:163-172` の `addSection` 関数
- **詳細**:
  ```typescript
  const addSection = (type: string) => {
    const newSection: Section = {
      id: crypto.randomUUID(),
      type,
      displayName: type,  // 連番処理がない
      sortOrder: sections.length,
      bodyText: '',
    };
  ```
- **影響**: Verse を2回追加しても "Verse", "Verse" となり、"Verse", "Verse 2" とならない

---

#### BUG-002: .txt インポートが Tauri 環境で動作しない可能性
- **対象テストケース**: TC-09 .txtインポート
- **期待結果**: .txt インポートが成功する
- **実装状況**: 実装不備
- **場所**: `src/components/ImportDialog.tsx:29`
- **詳細**:
  ```typescript
  const response = await fetch(`file://${filePath}`);
  ```
  `file://` プロトコルはブラウザおよび Tauri のセキュリティ制約により動作しない可能性が高い。
- **正しい実装**: Tauri の `fs` plugin または `dialog` plugin の readFile 機能を使用すべき

---

#### BUG-003: エクスポート機能が .lyrlytic.zip 形式に対応していない
- **対象テストケース**: TC-18 エクスポート
- **期待結果**: `.lyrlytic.zip` を生成できる
- **実装状況**: 未実装（簡易出力のみ）
- **場所**:
  - `src/components/ExportPanel.tsx` - 簡易出力のみ実装
  - `src-tauri/src/commands/export.rs` - バックエンド実装は存在するがフロントエンドから未使用
- **詳細**:
  - フロントエンドの ExportPanel は txt/md/json 形式の簡易出力のみ
  - Rust 側の `export_project` コマンドは `.lyrlytic.zip` 生成機能を持つが、フロントエンドの api.ts にバインディングがない

---

### 🟡 中程度の不具合 (機能不全)

#### BUG-004: 検索パネルのタグ検索が未実装
- **対象テストケース**: TC-17 検索パネル
- **期待結果**: タグ検索ができる
- **実装状況**: 未実装
- **場所**: `src/components/SearchPanel.tsx`
- **詳細**:
  ```typescript
  type SearchType = 'draft' | 'versions' | 'fragments' | 'tags';  // 'tags' が定義されているが

  // handleSearch 関数内に tags ケースの実装がない
  if (searchType === 'draft') { ... }
  else if (searchType === 'versions') { ... }
  else if (searchType === 'fragments') { ... }
  // tags ケースが存在しない
  ```

---

#### BUG-005: コピー整形設定の永続化が未実装
- **対象テストケース**: TC-10 コピー整形
- **期待結果**: 最後に使った整形設定を保持できる
- **実装状況**: 未実装
- **場所**: `src/components/CopyOptionsPanel.tsx:20-23`
- **詳細**:
  ```typescript
  const [options, setOptions] = useState<CopyOptions>({
    includeHeadings: true,
    preserveBlankLines: true,
  });
  ```
  ローカルステートのみで、localStorage 等への永続化がない

---

#### BUG-006: StyleProfile の論理削除・復元機能が未実装
- **対象テストケース**: TC-16 StyleProfile 論理削除と復元
- **期待結果**: StyleProfile を論理削除・復元できる
- **実装状況**: 未実装
- **場所**:
  - `src-tauri/src/main.rs` - `delete_style_profile` コマンドはあるが論理削除でない可能性
  - StyleProfilePanel.tsx に削除 UI がない
- **詳細**: TC-16 は必須テストケースのため、この機能不足は MVP ブロッカーになり得る

---

### 🟢 軽微な問題 (改善推奨)

#### BUG-007: revision_notes テーブルとモデルの型不一致
- **対象テストケース**: TC-07 RevisionNote登録
- **場所**:
  - `src-tauri/migrations/001_init.sql:111` - `version_section_id TEXT NOT NULL`
  - `src-tauri/src/models.rs:153` - `version_section_id: Option<String>`
- **詳細**:
  - スキーマでは NOT NULL だが、モデルでは Optional
  - 現状、フロントエンド側で必須チェックされているため実害はない
  - ただし、将来的に version_section_id を省略した場合 INSERT が失敗する

---

#### BUG-008: 未使用インポートによるコンパイル警告
- **場所**: `src-tauri/src/repositories/export_repo.rs:5`
- **詳細**:
  ```
  warning: unused import: `FileOptions`
  ```
  動作には影響しないが、コード品質の観点から削除推奨

---

## 未確認事項

以下は静的解析では確認できず、実際の動作確認が必要な項目：

1. **TC-03: Working Draft 自動保存** - 自動保存タイマーが正しく動作するか
2. **TC-05: 差分比較** - Monaco DiffEditor が正しく差分を表示するか
3. **TC-06: 過去版からの再開** - restoreVersion が正しく動作するか
4. **TC-12: 外部 URL オープン** - 確認ダイアログが正しく表示されるか
5. **TC-13/14: 論理削除・復元** - Project の削除・復元が正しく動作するか
6. **TC-19: ローカル完結** - ネットワーク切断時の動作確認

---

## 推奨アクション

### 即時対応 (MVP ブロッカー)
0. **BUG-009: コンパイルエラー修正（最優先）** - deleted_batch_id フィールドを追加
1. BUG-001: 同名セクションの連番付与を実装
2. BUG-002: Tauri fs API を使用したファイル読み込みに修正
3. BUG-003: .lyrlytic.zip エクスポート機能のフロントエンド統合
4. BUG-006: StyleProfile の論理削除・復元機能実装

### 次優先
5. BUG-004: タグ検索機能の実装
6. BUG-005: コピー整形設定の永続化

### 保守性改善
7. BUG-007: スキーマとモデルの型整合性確保
8. BUG-008: 未使用インポートの削除

---

## テストケース網羅状況

| テストケース | ステータス | 備考 |
|---|---|---|
| TC-01 | ✅ OK | 新規Project作成は実装済み |
| TC-02 | ❌ NG | BUG-001: 連番付与未実装 |
| TC-03 | ⏳ 未確認 | 動作確認必要 |
| TC-04 | ⚠️ 要確認 | version_sections 保存の確認必要 |
| TC-05 | ⏳ 未確認 | 動作確認必要 |
| TC-06 | ⏳ 未確認 | 動作確認必要 |
| TC-07 | ⚠️ 注意 | BUG-007: 型不一致あり |
| TC-08 | ✅ OK | 断片管理は実装済み |
| TC-09 | ❌ NG | BUG-002: file:// が動作しない可能性 |
| TC-10 | ⚠️ 部分NG | BUG-005: 設定永続化未実装 |
| TC-11 | ✅ OK | SongArtifact は実装済み |
| TC-12 | ✅ OK | 確認ダイアログ実装済み |
| TC-13 | ⏳ 未確認 | 動作確認必要 |
| TC-14 | ⏳ 未確認 | 動作確認必要 |
| TC-15 | ✅ OK | StyleProfile 編集は実装済み |
| TC-16 | ❌ NG | BUG-006: 削除・復元未実装 |
| TC-17 | ❌ NG | BUG-004: タグ検索未実装 |
| TC-18 | ❌ NG | BUG-003: .lyrlytic.zip 未実装 |
| TC-19 | ⏳ 未確認 | 動作確認必要 |
| TC-20 | ⏳ 条件付き | ローカルLLM設定必要 |
| TC-21 | ⏳ 条件付き | ローカルLLM設定必要 |
| TC-22 | ⏳ 未確認 | 両OSで動作確認必要 |

---

## 総評

**ビルド不能な状態です。** BUG-009 のコンパイルエラーにより、現状アプリケーションが起動できません。

MVP として必須のテストケース (TC-01 〜 TC-19, TC-22) のうち、静的解析で明確な不具合が検出されたのは **6件** です。特に BUG-002 (インポート) と BUG-003 (エクスポート) は主要機能の不全であり、優先的な対応が必要です。

動作確認が必要な項目については、実際にアプリケーションを起動しての手動テストを推奨します。