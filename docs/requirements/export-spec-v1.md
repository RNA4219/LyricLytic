# LyricLytic エクスポート仕様 v1

## 1. 目的

本書は、LyricLytic MVP における手動エクスポート仕様を定義する。  
目的は以下の 3 点である。

1. Project 単位の手動バックアップを成立させる
2. 将来のインポート / 復元に備え、構造化された可搬フォーマットを定義する
3. 論理削除、履歴、関連曲、断片を含むデータの持ち運び境界を明確にする

## 2. 基本方針

- MVP のエクスポート単位は `Project 単位` とする
- エクスポートは `手動実行` のみとし、自動同期は行わない
- 出力形式は `zip パッケージ` とする
- パッケージ内部の主データは UTF-8 JSON と UTF-8 テキストで構成する
- 将来のインポート互換のため、バージョン付き manifest を必須とする

## 3. エクスポート単位

### 3.1 対象

1 回のエクスポートで対象とするのは 1 Project とする。  
Project に紐づく以下のデータを含める。

- Project 本体
- project_tags
- style_profile
- Working Draft
- draft_sections
- LyricVersions
- version_sections
- revision_notes
- song_artifacts
- collected_fragments
- fragment_tags

### 3.2 非対象

以下は MVP の Project エクスポート対象外とする。

- アプリ全体設定 `app_settings`
- 他 Project に属するデータ
- OS 固有キャッシュ
- 一時ファイル

## 4. 既定の含有ルール

### 4.1 Active データ

通常のエクスポートでは、`deleted_at IS NULL` の active データを含める。

### 4.2 論理削除データ

MVP では、論理削除データを含めるかどうかをオプション化する。

- 既定値: `含めない`
- オプション: `含める`

理由:

- 通常バックアップでは、現行作業中データの可搬性を優先する
- 論理削除データを常に含めると、ユーザーの期待より大きい出力になる可能性がある
- ただし復元目的では削除済みデータも必要になりうるため、除外固定にはしない

### 4.3 外部参照

SongArtifact の URL は文字列として保存する。  
外部 URL 先の内容は取得せず、埋め込みもしない。  
ローカルファイル参照はパス文字列のみ保持し、元ファイルの実体コピーは MVP では行わない。

## 5. 出力形式

### 5.1 パッケージ形式

出力ファイルは以下の形式とする。

```text
<project-slug>_<yyyyMMdd-HHmmss>.lyrlytic.zip
```

`.lyrlytic.zip` は zip 形式の識別付きファイル名であり、MVP では zip として扱う。

### 5.2 内部ディレクトリ構成

```text
export/
├─ manifest.json
├─ project.json
├─ working-draft.json
├─ style-profile.json
├─ lyric-versions.json
├─ version-sections.json
├─ revision-notes.json
├─ song-artifacts.json
├─ collected-fragments.json
├─ tags.json
└─ texts/
   ├─ working-draft.txt
   └─ versions/
      ├─ <lyric-version-id>.txt
      └─ ...
```

MVP では、JSON が正本、`texts/` は人間可読な補助出力とする。

## 6. manifest.json

`manifest.json` はエクスポートパッケージの先頭メタデータとする。

### 6.1 必須項目

- `format`: `"lyrlytic-project-export"`
- `formatVersion`: `"1"`
- `exportedAt`
- `appName`: `"LyricLytic"`
- `projectId`
- `projectTitle`
- `targetOs`: 配列。例 `["windows", "macos"]`
- `includesDeleted`: boolean
- `entityCounts`: 各エンティティ件数

### 6.2 例

```json
{
  "format": "lyrlytic-project-export",
  "formatVersion": "1",
  "exportedAt": "2026-03-31T07:00:00Z",
  "appName": "LyricLytic",
  "projectId": "proj_001",
  "projectTitle": "summer-night",
  "targetOs": ["windows", "macos"],
  "includesDeleted": false,
  "entityCounts": {
    "lyricVersions": 12,
    "songArtifacts": 4,
    "collectedFragments": 18
  }
}
```

## 7. JSON データファイルの方針

### 7.1 基本ルール

- JSON は UTF-8
- 1 ファイル 1 配列または 1 オブジェクト
- DB カラム名ベースの snake_case / lowerCamelCase の混在は避け、MVP では DB に近い snake_case を優先する
- `deleted_at` は含有対象の場合のみそのまま保持する

### 7.2 日時

- すべて ISO-8601 UTC 文字列

### 7.3 NULL

- SQLite 上 NULL の値は JSON では `null` として保持する

## 8. テキスト出力方針

### 8.1 目的

JSON だけだと人間が中身を確認しづらいため、Working Draft と各 LyricVersion の本文を `.txt` でも同梱する。

### 8.2 内容

- `texts/working-draft.txt`: 現在の Working Draft 本文
- `texts/versions/<lyric-version-id>.txt`: 各 LyricVersion 本文

### 8.3 整形

- 本文は保存済み本文をそのまま出力する
- エクスポート時にコピー用整形は適用しない
- セクション見出しの補完や再構成はしない

## 9. エクスポート UI 要件

MVP の UI では、少なくとも以下を選択または確認できること。

- エクスポート対象 Project
- 出力先フォルダ
- 論理削除データを含めるか
- エクスポート実行

完了時は、生成ファイルパスを通知できること。

## 10. エラー時の扱い

- 出力先書き込み失敗時は明確なエラーを返す
- zip 作成途中に失敗した場合は、中途半端な出力を残さないか、残した場合は失敗として明示する
- 一部データのみ成功した部分エクスポートは MVP では成功扱いしない

## 11. 将来のインポート互換方針

- `manifest.format` と `manifest.formatVersion` を用いて互換性判定を行う
- 将来の importer は unknown field を無視できる設計を優先する
- v1 importer は v1 package のみ保証対象とする

## 12. 仕様化で見つかった論点

1. 論理削除データは既定で除外しないと、通常バックアップが肥大化しやすい
2. SongArtifact のローカルファイルはパスしか持たないため、完全再現バックアップではない
3. アプリ全体設定を Project export に混ぜると移植時の責務が壊れる
4. テキスト出力は補助であり、JSON が正本であることを明示しないと将来インポートで破綻しやすい
5. copy 用整形設定と export 出力は分けて扱わないと意味が混線する

## 13. 要件へ戻すべき項目

- 論理削除データのエクスポート既定値
- SongArtifact のローカルファイル実体を MVP で同梱しないこと
- AppSettings を Project export 対象外とすること
- export は JSON 正本 + text 補助であること
- export UI で必要な選択項目
