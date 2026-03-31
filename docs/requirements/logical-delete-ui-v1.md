# LyricLytic 論理削除 UI 詳細 v1

## 1. 目的

本書は、LyricLytic MVP における論理削除と復元 UI の具体仕様を定義する。  
特に、Project 配下の複数エンティティをまとめて削除 / 復元する際の整合を明確にする。

## 2. 基本方針

- MVP の削除は原則として論理削除とする
- 通常一覧からは論理削除データを除外する
- 復元は専用の削除済みデータ管理画面から行う
- 物理削除は MVP の通常導線に出さない
- 同一削除操作で削除されたデータ群は、1 つの削除バッチとして扱う

## 3. 重要な用語

### 3.1 論理削除

対象レコードを消去せず、`deleted_at` を付与して通常表示から外す操作。

### 3.2 削除バッチ

1 回の削除操作でまとめて論理削除されたレコード群を表す単位。  
MVP では `deleted_batch_id` で識別する。

例:

- 1 Project を削除した時、その Project 本体、Working Draft、LyricVersions、Fragments など一式は同じ `deleted_batch_id` を持つ
- SongArtifact 単体削除は、その SongArtifact だけで 1 つの `deleted_batch_id` を持つ

## 4. 削除可能な対象

MVP で論理削除対象とするのは以下。

- Project
- LyricVersion
- SongArtifact
- CollectedFragment
- RevisionNote

Working Draft、Section、StyleProfile は、単体削除導線よりも上位エンティティの削除に追従する内部対象として扱う。

## 5. 削除導線

### 5.1 Project 削除

- 実行場所: ホーム / プロジェクト選択画面、または Project 詳細メニュー
- 確認内容:
  - Project 名
  - 削除対象件数の概算
  - `論理削除され、削除済みデータ管理画面から復元できる` 旨

### 5.2 LyricVersion 削除

- 実行場所: 履歴一覧、差分確認画面、バージョンメニュー
- 注意表示:
  - SongArtifact 参照がある場合、その件数を表示
  - 復元可能であることを表示

### 5.3 SongArtifact / Fragment / RevisionNote 削除

- 実行場所: 各一覧または詳細 UI
- 単体削除として扱う

## 6. 削除時のシステム挙動

### 6.1 Project 削除

Project 削除時は、以下を同一 `deleted_batch_id` で論理削除する。

- Project
- StyleProfile
- Working Draft
- draft_sections
- LyricVersions
- version_sections
- RevisionNotes
- SongArtifacts
- CollectedFragments

タグ系データは親データに追随するため、削除管理 UI の独立対象とはしない。

### 6.2 LyricVersion 削除

LyricVersion 削除時は、以下を同一 `deleted_batch_id` で論理削除する。

- 対象 LyricVersion
- 対象 version_sections
- 対象 RevisionNotes

SongArtifact は履歴上の意味を持つため、既定では連鎖削除しない。  
ただし UI 上では `参照切れ状態になる SongArtifact` が発生しうるため、警告表示を行う。

### 6.3 単体削除

SongArtifact、CollectedFragment、RevisionNote の単体削除は、対象行のみを論理削除する。

## 7. 削除済みデータ管理画面

### 7.1 目的

削除済みデータの一覧表示、絞り込み、復元を行う。

### 7.2 表示単位

既定表示は `削除バッチ単位` とする。  
必要に応じて、バッチ内の個別エンティティ詳細を展開表示できること。

### 7.3 一覧項目

- 削除日時
- 削除種別
- 代表名
- 含まれる件数
- 復元可能状態

### 7.4 フィルタ

- Project
- 種別
- 削除日時

### 7.5 操作

- バッチ復元
- 個別対象の確認
- エクスポート時に削除済みを含めるか判断するための参照

## 8. 復元フロー

### 8.1 Project 復元

1. 削除済みデータ管理画面で対象 Project バッチを選択
2. バッチ内対象を確認
3. `復元` 実行
4. 同一 `deleted_batch_id` を持つ一式を復元
5. ホーム画面の通常一覧へ戻す

### 8.2 LyricVersion 復元

1. 対象 LyricVersion バッチを選択
2. 関連 sections / notes をまとめて復元
3. 履歴一覧へ戻す

### 8.3 単体復元

SongArtifact、CollectedFragment、RevisionNote の単体削除は、対象行のみ復元する。

## 9. 復元時の衝突ルール

### 9.1 Active 重複

復元対象と同一親配下に active データが存在しても、ID ベースで別レコードであれば復元可能とする。

### 9.2 Working Draft

Project 復元時に同一 Project がすでに active 状態で存在する場合、MVP では復元不可とする。  
同一 Project の active Working Draft は 1 件制約であり、Draft 退避や統合は MVP 範囲外とする。

### 9.3 LyricVersion 参照切れ

SongArtifact が削除済み LyricVersion を参照する場合、Version だけ先に復元してもよい。  
SongArtifact 側は個別復元可能とする。

## 10. エクスポートとの関係

- 削除済みデータ管理画面は、エクスポート時に `削除済みを含める` を判断する前提情報として使う
- `削除済みを含める` を選んだ場合、同一 `deleted_batch_id` 情報も JSON へ含める
- これにより、将来インポート時に削除単位を保持しやすくする

## 11. 仕様化で見つかった論点

1. Project 削除と Project 復元には、削除対象群を束ねる `deleted_batch_id` が必要
2. LyricVersion 削除時に SongArtifact をどう扱うかを切り分けないと、履歴と曲参照が破綻する
3. Working Draft は単体削除より、Project 単位の内部対象として扱う方が UI が単純
4. 削除済み一覧は個別行ベースよりバッチ単位の方が理解しやすい
5. 復元衝突ルールを決めないと、active Draft 一意制約と噛み合わない

## 12. 要件へ戻すべき項目

- `deleted_batch_id` を論理削除対象へ追加
- Project / LyricVersion 削除時の連鎖対象の明文化
- SongArtifact は LyricVersion 削除で既定連鎖削除しないこと
- 削除済みデータ管理画面の既定表示をバッチ単位とすること
- Project 復元時は同一 Project が active なら復元不可とすること
