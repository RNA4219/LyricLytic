# 要件定義レビュー・ゲートログ

## Gate 1

実施日: 2026-03-31  
対象: `docs/requirements/requirements.md`

### 目的

たたき台の要件定義を、MVP 実装判断に使える水準へ引き上げる。

### レビュー観点

- スコープの明確さ
- ドメインモデルの不足
- データ保存 / 削除 / 復元の定義
- 実装判断に必要な具体性
- 非機能要件の測定可能性
- 未確定事項の切り分け

### 反映した改善

- 文書自体のゲート条件を追加
- 前提・制約を追加
- データライフサイクル要件を追加
- インポート、エラー表示、複数 SongArtifact 紐付けなどの不足機能を追加
- 応答性の目標値を追加
- 受け入れテスト観点を追加
- 未確定事項を独立セクション化

### 現時点で残る未確定事項

- 削除を論理削除にするか物理削除にするか
- インポート対象形式の上限
- ローカル LLM 実行基盤の前提
- バックアップ / エクスポートを MVP に入れるか
- 初期サポート OS 範囲

### 判定

`たたき台` から `実装前レビュー可能` までは前進。  
ただし `実装着手確定` にするには、未確定事項の解消と SQLite スキーマへの落とし込みが必要。

## 次の Gate で見ること

- エンティティ間の cardinality と制約の明文化
- 削除 / 復元フローの UI 要件の具体化
- SQLite スキーマとの整合
- 画面遷移と主要操作フローの不足
- 設定項目一覧の具体化

## Gate 2

実施日: 2026-03-31  
対象: `docs/requirements/requirements.md`

### 目的

Gate 1 で残した未確定事項のうち、文書側で既定値を決められるものを確定させる。

### レビュー観点

- relation / cardinality の明文化
- 削除方式の既定値
- インポート形式の既定値
- 初期サポート OS の固定
- バックアップ方針の既定化
- ローカル LLM 実行前提の既定化

### 反映した改善

- エンティティ関係と制約を追加
- MVP の削除方式を論理削除既定に固定
- `.txt` を MVP 必須インポート形式に固定
- 初期サポート OS を Windows / macOS に固定
- バックアップは手動エクスポート優先に固定
- ローカル LLM は既存ローカルランタイム利用優先に固定
- 設定項目セクションを追加

### 現時点で残る未確定事項

- エクスポート形式の具体仕様
- ローカル LLM 接続方式の具体 API
- 論理削除 UI の具体フロー
- Windows / macOS 間の差分要件と Linux 対応時の差分要件

### 判定

`実装前レビュー可能` から `設計着手可能` まで前進。  
次は SQLite スキーマと画面遷移へ落とし込み、要件定義と設計の往復で破綻を探す段階に入る。

## Gate 3

実施日: 2026-03-31  
対象: `docs/requirements/requirements.md`, `docs/requirements/sqlite-schema-v1.sql`

### 目的

要件定義を SQLite スキーマへ落とし込み、永続化観点で破綻する箇所を洗い出して要件へ戻す。

### レビュー観点

- エンティティの主従関係が DB で表現できるか
- 論理削除と一意制約が両立するか
- `Section` の所有先曖昧性がないか
- `RevisionNote` の参照整合性が保てるか
- アプリ層で担保すべき制約が明確か

### 反映した改善

- SQLite スキーマ案 `sqlite-schema-v1.sql` を追加
- `Section` を `version_sections` / `draft_sections` に分離
- `RevisionNote` が同一 LyricVersion の Section を参照する前提を要件へ追記
- 論理削除と一意制約の両立を要件へ追記
- DB だけで表現しづらい制約をアプリ層でも担保する前提を要件へ追記
- 論理削除と active row の両立のため、partial unique index 前提をスキーマへ反映
- 画面遷移・操作フロー案 `screen-flow-v1.md` を追加
- 保存後も編集主体は Working Draft のままであることを要件へ追記
- 曲紐付け対象は LyricVersion のみとし、Working Draft を直接紐付けないことを要件へ追記
- ホーム画面、削除済みデータ管理画面、保存ダイアログ、インポートダイアログを主要画面へ追加

### 現時点で残る未確定事項

- エクスポート形式の具体仕様
- ローカル LLM 接続方式の具体 API
- 論理削除 UI の具体フロー
- Windows / macOS 間の実装差分要件

### 判定

`設計着手可能` から `永続化設計レビュー可能` まで前進。  
次は画面遷移と操作フローへ落とし込み、UI と保存モデルのズレを洗う段階。

## Gate 4

実施日: 2026-03-31  
対象: `docs/requirements/requirements.md`, `docs/requirements/screen-flow-v1.md`

### 目的

要件定義を画面遷移と主要操作フローへ落とし込み、UI と保存モデルの不整合を洗い出す。

### レビュー観点

- 起動直後導線が要件化されているか
- 保存対象と編集対象が混同されないか
- 復元フローが破壊的更新になっていないか
- 論理削除に復元導線があるか
- 曲紐付け対象が Draft と Version でぶれていないか

### 反映した改善

- `screen-flow-v1.md` を追加
- ホーム / プロジェクト選択画面を追加
- 削除済みデータ管理画面を追加
- 保存ダイアログとインポートダイアログを追加
- 保存後も編集主体は Working Draft のままであることを明記
- 過去版復元は Working Draft 再構築として明記
- SongArtifact は LyricVersion にのみ紐付けることを明記
- 文書内の見出し番号の衝突を修正

### 現時点で残る未確定事項

- エクスポート形式の具体仕様
- ローカル LLM 接続方式の具体 API
- 論理削除 UI の具体フロー詳細
- Windows / macOS 間の実装差分要件

### 判定

`永続化設計レビュー可能` から `UI/保存整合レビュー可能` まで前進。  
次は設定項目一覧またはエクスポート仕様に進むと、さらに実装判断が固まる。

## Gate 5

実施日: 2026-03-31  
対象: `docs/requirements/requirements.md`, `docs/requirements/export-spec-v1.md`

### 目的

Project 単位バックアップと将来インポート互換のため、MVP のエクスポート仕様を定義する。

### レビュー観点

- エクスポート単位が明確か
- 論理削除データの扱いが明確か
- JSON / text の役割分担が明確か
- app_settings や外部ファイル参照の境界が明確か
- UI から実行できる範囲が明確か

### 反映した改善

- `export-spec-v1.md` を追加
- Project 単位 zip パッケージを MVP 仕様として定義
- JSON 正本 + text 補助出力の方針を定義
- app_settings を Project export 対象外に固定
- 論理削除データは既定で除外、オプションで含有可能に固定
- SongArtifact のローカルファイル実体は MVP で同梱しない前提を固定
- エクスポート UI の最低要件を追加

### 現時点で残る未確定事項

- ローカル LLM との接続方式の具体 API
- Windows / macOS 間の実装差分と Linux 対応時の制約差分
- 論理削除データを UI でどう一覧・復元するか

### 判定

`UI/保存整合レビュー可能` から `バックアップ / 可搬性レビュー可能` まで前進。  
次は設定項目一覧または論理削除 UI 詳細に進むと、MVP 実装判断がさらに固まる。

## Gate 6

実施日: 2026-03-31  
対象: `docs/requirements/requirements.md`, `docs/requirements/logical-delete-ui-v1.md`, `docs/requirements/sqlite-schema-v1.sql`

### 目的

論理削除と復元の UI 詳細を定義し、削除・復元・エクスポートの整合を固める。

### レビュー観点

- 削除対象単位が明確か
- Project / Version 削除時の連鎖範囲が明確か
- 復元単位が UI で理解しやすいか
- 削除済み一覧の表示単位が妥当か
- スキーマで削除バッチを保持できるか

### 反映した改善

- `logical-delete-ui-v1.md` を追加
- `deleted_batch_id` を要件とスキーマへ追加
- Project / LyricVersion 削除時の連鎖削除単位を明文化
- SongArtifact は LyricVersion 削除時に既定連鎖削除しない方針を明文化
- 削除済みデータ管理画面の既定表示をバッチ単位に固定
- Project / LyricVersion 復元をバッチ単位に固定
- 未確定事項から論理削除 UI 論点を除外

### 現時点で残る未確定事項

- ローカル LLM との接続方式の具体 API
- Windows / macOS 間の実装差分と Linux 対応時の制約差分

### 判定

`バックアップ / 可搬性レビュー可能` から `削除 / 復元整合レビュー可能` まで前進。  
次は設定項目一覧か OS 差分要件に進むと、MVP 実装の境界がさらに明確になる。

## Gate 7

実施日: 2026-03-31  
対象: `docs/requirements/requirements.md`, `docs/requirements/os-differences-v1.md`

### 目的

Windows / macOS 差分を PoC レベルの具体挙動まで固定し、OS 差による実装ぶれを減らす。

### レビュー観点

- PoC の検証対象 OS が明確か
- ショートカットと表示が OS ごとに明確か
- ファイルダイアログ方式が固定されているか
- エクスポート完了条件が OS 依存になっていないか
- URL オープン確認が安全側に倒れているか

### 反映した改善

- `os-differences-v1.md` を追加
- PoC 検証対象を Windows 11 / macOS 最新安定版に固定
- 主要ショートカットを具体的に固定
- PoC のエクスポートを保存ダイアログ方式に固定
- `.txt` 単一ファイル選択ダイアログを既定に固定
- URL オープン前の確認ダイアログを常時表示に固定
- 生成ファイルパス表示のみで完了要件を満たすことを再確認

### 現時点で残る未確定事項

- Linux 対応時の制約差分

### 判定

`削除 / 復元整合レビュー可能` から `PoC 実装レビュー可能` まで前進。  
次はローカル LLM 接続方式を詰めると、PoC の技術実装前提がほぼ出揃う。

## Gate 8

実施日: 2026-03-31  
対象: `docs/requirements/requirements.md`, `docs/requirements/local-llm-connector-v1.md`

### 目的

PoC のローカル LLM 接続方式を具体 API レベルまで固定し、AI 補助機能の実装前提を明確にする。

### レビュー観点

- 接続方式が 1 つに絞られているか
- 外部通信禁止と両立しているか
- 設定項目が実装可能な粒度で定義されているか
- 未接続時の UI 挙動が定義されているか
- モデル出力を UI へ流す形が固定されているか

### 反映した改善

- `local-llm-connector-v1.md` を追加
- PoC 接続方式を OpenAI 互換ローカル HTTP API に固定
- 接続先を `127.0.0.1` / `localhost` に限定
- LLM 設定項目を具体化
- 接続確認 UI 要件を追加
- モデル応答を JSON 構造で受ける方針を固定
- 未確定事項からローカル LLM API 論点を除外

### 現時点で残る未確定事項

- Linux 対応時の制約差分

### 判定

`PoC 実装レビュー可能` から `PoC 実装着手可能` まで前進。  
PoC 要件としては、主要な実装前提がほぼ揃った状態。

## Gate 9

実施日: 2026-03-31  
対象: `docs/requirements/requirements.md`, `docs/requirements/poc-task-breakdown-v1.md`

### 目的

PoC 要件を実装順序へ落とし込み、実装着手後に破綻しやすい論点を先回りで洗う。

### レビュー観点

- 要件から実装タスクへ自然に分解できるか
- 依存順が破綻していないか
- PoC 完了条件が確認可能な粒度か
- 先に潰すべき設計リスクが明示されているか
- 文書参照しやすさを阻害する見出し崩れがないか

### 反映した改善

- `poc-task-breakdown-v1.md` を追加
- フェーズ 0 からフェーズ 11 までの実装順序を定義
- PoC 完了条件とマイルストーンを定義
- 先に潰すべき破綻ポイントを整理
- `requirements.md` の見出し番号ずれを修正
- 次の推奨アウトプットを `PoC 実装タスク分解` 表記へ更新

### 現時点で残る未確定事項

- Linux 対応時の制約差分

### 判定

`PoC 実装着手可能` を維持しつつ、`PoC 実装計画レビュー可能` まで前進。  
次は実装骨格へ入り、永続化基盤と編集画面の最小縦切りを作る段階。

## Gate 10

実施日: 2026-03-31  
対象: `README.md`, `docs/requirements/requirements.md`, `docs/requirements/review-log.md`

### 目的

作業方針を実装先行ではなく要件ベースへ戻し、repo の現在地と文書の記述を一致させる。

### レビュー観点

- README が要件中心の repo であることを正しく示しているか
- review-log が存在しない実装物を前提にしていないか
- 実装に由来する判断のうち、要件として有効なものだけが残っているか
- 次アクションが文書レビュー起点に戻っているか

### 反映した改善

- 実装関連ファイルと依存物を repo から除去
- README を要件定義中心の説明へ戻した
- Gate 10 を実装完了ログではなく、要件ベース運用への整理ログへ差し替えた
- 次の着手ポイントを文書レビュー中心へ戻した

### 現時点で残る未確定事項

- Linux 対応時の制約差分

### 判定

`PoC 実装計画レビュー可能` を維持しつつ、repo の状態を `要件ベース` に再整列した。  
次は `requirements.md`、`sqlite-schema-v1.sql`、`screen-flow-v1.md` の往復レビューを継続する段階。

## Gate 11

実施日: 2026-03-31  
対象: `docs/requirements/requirements.md`, `docs/requirements/sqlite-schema-v1.sql`, `docs/requirements/screen-flow-v1.md`

### 目的

要件本文、スキーマ案、画面フロー案の間で解釈が割れる箇所を減らし、実装前レビューの手戻りを防ぐ。

### レビュー観点

- 新規 Project 作成時の Draft 初期状態が一意に読めるか
- 過去版復元の着地点が文書間で一致しているか
- LyricVersion の copy 設定がスキーマと要件で整合しているか
- 削除済みデータ管理の対象が要件と画面で一致しているか

### 反映した改善

- 新規 Project 作成直後は空の Working Draft を許容し、セクションプリセットは自動挿入ではなく追加候補とする方針を明文化
- 過去版からの再編集は `Working Draft 再構築` に統一
- LyricVersion の copy 設定を `copyIncludeHeadings` / `copyPreserveBlankLines` に明文化
- 削除済みデータ管理の対象に LyricVersion を明示追加
- 画面フロー側にも空 Draft とプリセット追加候補の関係を反映

### 現時点で残る未確定事項

- Linux 対応時の制約差分
- 過去版横断検索の対象粒度を `本文全文のみ` にするか `RevisionNote` を含めるか

### 判定

`要件ベース` を維持しつつ、`要件・スキーマ・UI フロー整合レビュー可能` まで前進。  
次は検索要件、StyleProfile の実体、app_settings の責務境界を詰める段階。

## Gate 12

実施日: 2026-03-31  
対象: `docs/requirements/requirements.md`, `docs/requirements/sqlite-schema-v1.sql`

### 目的

検索仕様、StyleProfile の所属先、app_settings の責務境界を明文化し、スキーマ案の読み方が割れないようにする。

### レビュー観点

- 検索対象が実装可能な粒度で定義されているか
- StyleProfile が Project 所属なのか LyricVersion 所属なのかが一意に読めるか
- `style_profiles` の一意制約と要件本文が一致しているか
- `app_settings` と LyricVersion 内 copy 設定の責務が分かれているか

### 反映した改善

- MVP の過去版横断検索対象を `LyricVersion 本文 + version_sections` に限定し、RevisionNote を除外
- 断片検索とタグ検索の対象列を具体化
- StyleProfile を MVP では Project 所属、active 1 件上限に統一
- StyleProfile の属性表現を `tags` 前提に修正
- `app_settings` をアプリ全体設定専用とし、Project / LyricVersion 固有データを持たないことを明記
- 最後に使った copy 整形設定は `app_settings`、保存時の copy 条件履歴は LyricVersion 側という責務分離を明記

### 現時点で残る未確定事項

- Linux 対応時の制約差分
- 検索 UI を専用画面にするか編集画面内パネルにするか

### 判定

`要件・スキーマ・UI フロー整合レビュー可能` を維持しつつ、`検索・設定責務レビュー可能` まで前進。  
次は検索 UI の導線、StyleProfile の編集フロー、論理削除対象に StyleProfile を含めるかを詰める段階。

## Gate 13

実施日: 2026-03-31  
対象: `docs/requirements/requirements.md`, `docs/requirements/screen-flow-v1.md`, `docs/requirements/os-differences-v1.md`

### 目的

残論点として残っていた検索 UI 導線、StyleProfile の編集 / 削除フロー、Linux 将来対応の扱いを既定値まで落とし込む。

### レビュー観点

- 検索 UI が専用画面なのか編集画面内導線なのか一意に読めるか
- StyleProfile の編集導線と削除 / 復元フローが明示されているか
- Linux 差分が現行スコープの未確定事項として残っていないか

### 反映した改善

- 検索 UI は専用画面ではなく歌詞編集画面内パネル / ドロワー導線に固定
- 検索フローを `screen-flow-v1.md` に追加
- StyleProfile を Project 配下の論理削除対象に追加し、削除済みデータ管理から復元可能と明記
- 歌詞編集画面の右ペイン要件に StyleProfile と検索導線を追加
- Linux 将来対応メモを `os-differences-v1.md` に追加し、未確定事項から外した
- `requirements.md` の未確定事項を `現時点ではなし` に更新

### 現時点で残る未確定事項

- なし

### 判定

`検索・設定責務レビュー可能` から `要件レビュー一巡完了` まで前進。  
次は必要に応じて受け入れ基準のテストケース粒度をさらに細かくする段階。

## Gate 14

実施日: 2026-03-31  
対象: `docs/requirements/requirements.md`, `docs/requirements/acceptance-test-cases-v1.md`

### 目的

受け入れ基準を、実装前レビューだけでなく実際の判定作業に使えるテストケース粒度へ落とし込む。

### レビュー観点

- 受け入れ基準が手順と期待結果に分かれているか
- MVP / PoC の最小合格ラインが読めるか
- 必須ケースと条件付きケースが区別されているか
- Windows / macOS の確認観点が落ちていないか

### 反映した改善

- `acceptance-test-cases-v1.md` を追加
- Project、保存、差分、断片、削除復元、StyleProfile、検索、エクスポート、AI 補助までの個別テストケースを定義
- `requirements.md` に `24.2 詳細テストケース` を追加
- 次の推奨アウトプットに `受け入れテストケース` を追加
- 最小合格ラインを明文化

### 現時点で残る未確定事項

- なし

### 判定

`要件レビュー一巡完了` を維持しつつ、`受け入れ判定レビュー可能` まで前進。  
要件定義は、PoC / MVP の実装着手と受け入れ判定の両方に使える状態に近づいた。

## Gate 15

実施日: 2026-03-31  
対象: `docs/requirements/frontend-requirements-v1.md`

### 目的

既存要件からフロントエンド実装に必要な内容だけを抜き出し、UI 実装担当へ渡しやすい形へ整理する。

### レビュー観点

- 画面一覧、画面責務、導線が一箇所で追えるか
- 編集画面中心の UI 方針が明確か
- 検索、StyleProfile、削除復元、OS 差分がフロントエンド観点で読めるか
- フロントエンド側の状態管理責務が整理されているか

### 反映した改善

- `frontend-requirements-v1.md` を追加
- 画面別要件、共通 UI 要件、状態管理前提、コンポーネント責務を整理
- 編集画面中心の非遷移 UI 方針を明文化
- Windows / macOS 差分のうちフロントエンドが意識すべき範囲を整理
- README から新文書へ辿れるようにした

### 現時点で残る未確定事項

- なし

### 判定

`受け入れ判定レビュー可能` を維持しつつ、`フロントエンド実装レビュー可能` まで前進。  
画面設計と UI 実装の入口として使える粒度に近づいた。

## Gate 16

実施日: 2026-03-31  
対象: `docs/requirements/requirements.md`, `docs/requirements/screen-flow-v1.md`

### 目的

最終レビューとして、既にスコープ内へ入れた機能が弱い表現のまま残っていないかを点検し、受け入れ基準とのズレをなくす。

### レビュー観点

- 復元要件が `Working Draft 再構築` に統一されているか
- エクスポートが `検討対象` ではなく `MVP 要件` として読めるか
- 削除 / 復元フローの対象に抜けがないか
- 受け入れ基準に検索、StyleProfile、削除復元、エクスポートが反映されているか

### 反映した改善

- 復元要件を `Working Draft 再構築` の強い表現に統一
- StyleProfile を復元対象へ追加
- 手動エクスポートを `MVP で持つこと` に修正
- 受け入れ基準に検索、StyleProfile、エクスポート、削除復元を追加
- 論理削除フローの対象に LyricVersion を明示追加

### 現時点で残る未確定事項

- なし

### 判定

`フロントエンド実装レビュー可能` を維持しつつ、`最終要件レビュー完了` まで前進。  
要件文書群は、実装着手前の最終参照として使える状態にかなり近い。

## Gate 17

実施日: 2026-03-31  
対象: `docs/requirements/screen-flow-v1.md`, `docs/requirements/frontend-requirements-v1.md`, `docs/requirements/requirements.md`

### 目的

外部フィードバックを反映し、画面の切り方を `統一された創作ワークスペース` 寄りに再調整する。

### レビュー観点

- 歌詞編集画面が母艦として十分に強く定義されているか
- 曲紐付けが独立画面ではなくインスペクタとして読めるか
- 差分確認が半独立ビューとして扱われているか
- 削除済みデータ管理が主作業導線の手前に出すぎていないか

### 反映した改善

- 歌詞編集画面を 3 ペイン常駐ワークスペースとして明文化
- 曲紐付けを独立画面から右サイドインスペクタへ再定義
- 差分確認を `差分確認ビュー` として再定義し、完全遷移を必須にしない方針を追加
- 削除済みデータ管理を Settings / More 配下などの深い階層へ置く方針を追加
- フロントエンド要件のページ / パネル責務も同じ切り方へ揃えた

### 現時点で残る未確定事項

- なし

### 判定

`最終要件レビュー完了` を維持しつつ、`フロント体験の統一感レビュー反映済み` まで前進。  
独立画面を減らし、同一文脈内で補助機能を開く方向へ寄せた状態になった。

---

## Gate 18: 実装準備パッケージ追加

実施日: 2026-03-31  
対象: `docs/implementation/README.md`, `docs/implementation/implementation-prep-v1.md`, `docs/implementation/system-architecture-v1.md`, `docs/implementation/command-contracts-v1.md`, `docs/implementation/bootstrap-checklist-v1.md`, `README.md`

### 目的

要件定義を実装へ渡すための入口を追加し、PoC 着手時に迷いやすい責務境界、command 契約、初期作業順を明文化する。

### レビュー観点

- 要件の正本を壊さずに実装入口が追加されているか
- Frontend / Tauri / Rust / SQLite の責務境界が明確か
- 最初の縦切りへ入るための command と初期チェックがそろっているか
- Agent_tools のハブを入口にしつつ、作業成果が LyricLytic repo に閉じているか

### 反映した改善

- `docs/implementation/` を追加し、実装準備の読み順を定義
- システム構成、Tauri command 契約、bootstrap checklist を追加
- README に実装準備パッケージへの入口を追加

### 現時点で残る未確定事項

- なし

### 判定

`要件整理完了` から `実装着手入口整備済み` へ前進。  
PoC 実装は、要件文書だけでなく `implementation/` を起点に開始できる状態になった。
