# LyricLytic Frontend Mockup Brief

## 1. 目的

このフォルダに格納するフロントエンドモックは、LyricLytic の要件定義を踏まえた
`PoC レベルの画面体験確認用アセット` として扱う。

目的は次の 3 点とする。

- 歌詞編集画面を母艦とした 3 ペインワークスペース体験を具体化する
- Udio / Suno に近い統一感を持ちながら、LyricLytic 独自の作詞 IDE 文脈を視覚化する
- 実装前に、画面分割、導線、情報密度、文言トーンの整合をレビューできる状態にする

## 2. 前提

- 正本要件は `docs/requirements/requirements.md` とする
- フロントエンド要件は `docs/requirements/frontend-requirements-v1.md` とする
- 画面遷移の正本は `docs/requirements/screen-flow-v1.md` とする

このフォルダのモックは上記要件に従い、要件を上書きしない。

## 3. モックの設計原則

### 3.1 母艦型ワークスペース

- 歌詞編集ワークスペースを主画面とする
- 左は構造ナビゲーション、中央は編集、右はインスペクタに固定する
- 検索、断片、曲紐付け、履歴参照、StyleProfile はできる限り同一画面内で開く

### 3.2 画面を増やしすぎない

独立してよいのは次に限定する。

- ホーム / プロジェクト選択
- 歌詞編集ワークスペース
- 差分確認ビュー
- 深い階層にある削除済みデータ管理

次は独立画面にせず、パネル、インスペクタ、ダイアログで扱う。

- 保存
- インポート
- 曲紐付け
- 検索
- 断片一覧
- StyleProfile 編集

### 3.3 PoC 範囲を守る

- インポートは `.txt` を必須対象とする
- 過度な音声取り込み、PDF 解析、AI 自動分類前提の UI は出しすぎない
- ローカル LLM は補助機能として扱い、主導線に出しすぎない

## 4. このフォルダに含むべき画面

- `home_project_selection`
- `home_project_selection_updated_background`
- `lyric_editor_working_draft`
- `lyric_editor_working_draft_with_char_counts`
- `save_snapshot_dialog`
- `fragment_import_list_dialog`
- `diff_view_version_comparison`
- `deleted_data_management_archive`

## 5. ブランドと文言

- プロダクト名は `LyricLytic` に統一する
- `Digital Atelier` はトーン / サブブランドとして補助的に使ってよい
- `Verse Atelier`, `The Atelier` など別製品に見える名称は使わない

## 6. レビュー観点

- 要件どおりに `編集画面を母艦` と読めるか
- 周辺機能が `別世界` ではなく `同一文脈` で開くか
- 削除済みデータ管理が前に出すぎていないか
- PoC 範囲を超える UI を置いていないか
- ブランド、ナビゲーション、CTA の意味が揃っているか

## 7. 今回の修正方針

今回のモック修正では、次を優先する。

- Archive / Trash を主導線から下げる
- 曲紐付け、断片、履歴を母艦画面の補助面として明示する
- 差分確認を半独立ビューへ寄せる
- インポートを `.txt` 基準へ戻す
- ブランド表記を `LyricLytic` に統一する

## 8. 補足

`screen.png` は静的キャプチャであり、`code.html` を修正した後に再生成が必要になる場合がある。
レビューや実装参照時は、まず `code.html` を正本として扱う。
