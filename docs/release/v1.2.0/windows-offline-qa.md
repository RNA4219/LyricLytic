# Windows オフライン実機QA — v1.2.0

## Intake Status

- status: `degraded`（実行手順・自動証跡は準備済み。隔離済みWindows実機での実行結果待ち）
- profile: `strict`
- environment: 新規またはスナップショット復元済みWindows 10/11、標準ユーザー、NSIS installerをローカルへ配置済み
- source refs: `AC-DATA`（保存・復元）、`AC-FS`（Import/Export）、`AC-RHYME`（Sudachi）、`AC-TRASH`、`AC-OFFLINE`、`docs/release/v1.2.0.md`
- critical prerequisite: テスト環境をネットワークから切断しても、Codex作業環境や日常利用端末は切断しない。

## 根拠付き観点とリスク

| ID | 観点 | 優先度 | 根拠 |
|---|---|---:|---|
| OBS-01 | インストール済みアプリがネットワーク・Pythonなしで起動する | P0 | ネイティブSudachi化と配布版機能が対象 |
| OBS-02 | 保存中再編集、終了、再起動、Retryで最後の状態が残る | P0 | データ消失防止の主要受入条件 |
| OBS-03 | DB書込み失敗で画面が閉じず、Retryで回復する | P0 | 書込み障害注入と終了時flushの受入条件 |
| OBS-04 | v1.1 DB/ZIPを現行版で利用でき、format v1を維持する | P0 | 後方互換の受入条件 |
| OBS-05 | 文字コード・上限・拡張子のImport境界が正しく扱われる | P1 | ファイルI/Oの入力検証 |
| OBS-06 | ZIP/TXT/Markdown/JSON exportとごみ箱が正常に動作する | P1 | データ回収・運用回帰 |
| OBS-07 | LLM、Sudachi韻解析、連続入力latest-onlyが回帰しない | P1 | 外部プロセス・解析キューの回帰 |

P0は保存不能またはオフライン配布不能へ直結するため、影響5・検出難度2以上としてstrict Gate対象とする。自動テストは補助証跡であり、P0/P1の手動実行完了なしではGoにしない。

## 実行前セットアップ

1. NSIS installerとMSIをローカルディスクへ保存し、SHA-256を `evidence/installer-sha256.txt` に記録する。
2. テスト用Windowsをネットワークから切断する。`Get-NetAdapter | Format-Table Name, Status` の出力を保存する。
3. NSISで機能QAを実施する。MSIは別のクリーン状態でインストール、起動、アンインストールのsmoke testを行う。
4. 起動するPowerShellだけでPythonを除外する。`$env:Path = (($env:Path -split ';') | Where-Object { $_ -notmatch 'Python' }) -join ';'` 実行後、`Get-Command python, py -ErrorAction SilentlyContinue` が何も返さないことを記録する。
5. v1.1互換データには `src-tauri/tests/fixtures/v1.1.0/lyriclytic-v1.1.0.db` と `project-full.lyrlytic.zip` を使う。ハッシュは同梱 `SHA256SUMS` と一致させる。

## 手動テストケース

| ID | 優先度 | 手順 | 期待結果 / Oracle | 証跡 |
|---|---:|---|---|---|
| W01 | P0 | NSISをインストールして起動する | 起動成功、クラッシュなし。指定済みinstaller | 画面・ログ |
| W02 | P0 | Style/Vocal/BPM/Sectionsを編集し、保存中に再編集、閉じて再起動する | 最後の値だけが完全復元される。`AC-DATA` | 前後画面 |
| W03 | P0 | 下記SQLで保存失敗triggerを有効化し編集・終了を試みる。trigger削除後にRetryする | 閉じずに翻訳済み失敗表示、Retry後に同一内容が保存される。`AC-DATA` | 動画/画面・ログ |
| W04 | P0 | v1.1 DBをアプリデータへコピーして起動し、編集、削除、復元、ZIP exportする | DB破損なし、全操作成功、manifest `format_version="1"`。`AC-DATA` | DBコピー・ZIP |
| W05 | P1 | UTF-8 / Shift-JIS / EUC-JP / ISO-2022-JP / Windows-1252 TXTを読み込む | 文字化けなく読み込み、置換発生時は表示される。`AC-FS` | 各画面 |
| W06 | P1 | 非TXTと10MiB超TXTを読み込む | 明示的に拒否され、既存ドラフトを変更しない。`AC-FS` | エラー画面 |
| W07 | P1 | ZIP/TXT/Markdown/JSONを各指定先へexportする | ファイルが作成され、ZIPのmanifestはformat v1。`AC-FS` | 出力一覧 |
| W08 | P1 | LLMを起動、韻解析で連続入力する | LLM起動、`source=sudachi_core`、最終入力だけが反映される。`AC-RHYME` | 画面・ログ |
| W09 | P1 | ごみ箱で削除、復元、完全削除、Unicode長文プレビューを確認する | 状態遷移が正しく、プレビューがクラッシュしない。`AC-TRASH` | 画面 |
| W10 | P1 | MSIをクリーン状態へインストール、起動、アンインストールする | install/uninstall成功、残留実行プロセスなし | PowerShell出力 |

## 保存失敗trigger（W03）

アプリを終了してから、`qa/save-failure-trigger.sql` を対象DBへ適用する。既定のDBは `%APPDATA%\com.lyriclytic.app\lyriclytic.db`。適用・削除にはローカルの `sqlite3.exe` を使う。

```powershell
sqlite3 "$env:APPDATA\com.lyriclytic.app\lyriclytic.db" ".read docs\release\v1.2.0\qa\save-failure-trigger.sql"
# Retry 前に trigger を解除する
sqlite3 "$env:APPDATA\com.lyriclytic.app\lyriclytic.db" "DROP TRIGGER lyriclytic_qa_fail_draft_save;"
```

このSQLはQA環境専用であり、製品DBや通常利用環境へ適用しない。

## 工数とGate

- preparation: 25分
- execution: 90分
- evidence整理: 30分
- retry buffer: 30分
- total: 175分

GateはP0/P1がすべてPass、重大・高障害0、CIのWindows/macOS bundleおよび自動Gate成功、証跡ファイル完備で `go`。いずれかのP0失敗、未解決の高リスク、またはオフラインSudachi未確認なら `no_go`。

## 実行結果

- decision: `pending_manual_execution`
- required evidence: `evidence/installer-sha256.txt`、スクリーンショット、アプリログ、各WケースのPass/Fail、発見障害
- release brief: 実機結果を記入するまでリリース判定を出さない。
