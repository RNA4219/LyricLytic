# LyricLytic Tauri Command 契約 v1

## 1. 目的

本書は、フロントエンドと Tauri 側の境界で使う command の暫定契約を定義する。  
実装中に調整はありうるが、`命名`, `入力`, `戻り値`, `エラー` の基準を先に固定する。

## 2. 共通ルール

- command 名は `verb_noun` 形式
- 返却値は JSON object を基本とする
- 成功時は `ok: true` を含めてもよいが、必須ではない
- 失敗時は Tauri 側で文字列例外にせず、`code`, `message`, `detail` を持つ構造へ寄せる

想定エラー形:

```json
{
  "code": "IMPORT_DECODE_FAILED",
  "message": "テキストの読み込みに失敗しました。",
  "detail": "UTF-8 として解釈できませんでした。"
}
```

## 3. Project / Draft 系

### `list_projects`

用途:

- ホーム画面初期表示

返却イメージ:

```json
{
  "projects": [
    {
      "projectId": "prj_001",
      "title": "Neon Solitude",
      "updatedAt": "2026-03-31T10:00:00Z",
      "hasActiveDraft": true
    }
  ]
}
```

### `create_project`

入力:

```json
{
  "title": "Neon Solitude"
}
```

返却:

- `project`
- 自動生成された `workingDraft`

### `get_working_draft`

入力:

```json
{
  "projectId": "prj_001"
}
```

返却:

- `project`
- `workingDraft`
- `draftSections`
- `styleProfile`

### `save_working_draft`

用途:

- 自動保存

入力:

- `workingDraftId`
- `draftSections`
- `latestBodyText`

## 4. Version 系

### `create_snapshot`

入力:

```json
{
  "workingDraftId": "wd_001",
  "snapshotName": "Draft 2",
  "note": "B メロの語感を調整"
}
```

返却:

- 作成された `lyricVersion`
- 更新後 `workingDraftSummary`

### `list_lyric_versions`

入力:

```json
{
  "projectId": "prj_001"
}
```

### `get_diff_payload`

入力:

```json
{
  "leftVersionId": "lv_001",
  "rightVersionId": "lv_002"
}
```

返却:

- 左右版の本文
- 表示用メタ情報
- 差分サマリー

### `restore_version_to_draft`

入力:

```json
{
  "sourceVersionId": "lv_001",
  "targetProjectId": "prj_001"
}
```

返却:

- 再構築後 `workingDraft`
- 復元元版メタ情報

## 5. Fragment 系

### `list_fragments`

入力:

```json
{
  "projectId": "prj_001",
  "status": "unused"
}
```

### `import_fragment_txt`

入力:

```json
{
  "projectId": "prj_001",
  "filePath": "C:/example/input.txt"
}
```

返却:

- 作成された fragment 一覧
- 読み取り件数

### `insert_fragment_into_draft`

入力:

```json
{
  "workingDraftId": "wd_001",
  "fragmentId": "fg_001",
  "targetSectionId": "ds_002",
  "insertMode": "append"
}
```

## 6. SongArtifact 系

### `list_song_artifacts`

入力:

```json
{
  "lyricVersionId": "lv_001"
}
```

### `create_song_artifact`

入力:

```json
{
  "projectId": "prj_001",
  "lyricVersionId": "lv_001",
  "serviceName": "Suno",
  "songTitle": "Electric Haze",
  "sourceUrl": "https://example.com/song"
}
```

### `open_external_url_with_confirmation`

用途:

- UI 側は確認ダイアログ表示後、この command を呼ぶ

## 7. Deleted Items 系

### `list_deleted_batches`

入力:

```json
{
  "projectId": "prj_001"
}
```

### `restore_deleted_batch`

入力:

```json
{
  "deletedBatchId": "db_001"
}
```

返却:

- `restored: true | false`
- `reason` が必要なら含める

## 8. Export / Settings / LLM 系

### `export_project_zip`

入力:

```json
{
  "projectId": "prj_001",
  "destinationPath": "C:/exports/neon.lyrlytic.zip",
  "includeDeleted": false
}
```

### `get_app_settings`

用途:

- 起動時ロード

### `update_app_settings`

用途:

- LLM 設定やコピー設定の保存

### `check_local_llm_connection`

入力:

```json
{
  "baseUrl": "http://127.0.0.1:1234/v1",
  "model": "local-model"
}
```

### `run_phrase_repetition_check`

入力:

```json
{
  "workingDraftId": "wd_001"
}
```

返却:

- 頻出表現
- 低頻出候補
- パース結果の妥当性

## 9. 初期実装で作らなくてよい command

以下は最初の縦切りでは不要とする。

- 高度な一括検索
- StyleProfile 詳細編集
- SongArtifact 一括インポート
- 複数 Project 同時エクスポート
