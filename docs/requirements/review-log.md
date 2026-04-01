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

## Gate 19

実施日: 2026-04-01  
対象: `docs/implementation/test-design-v1.md`, `docs/implementation/README.md`, `HUB.codex.md`, `README.md`

### 目的

要件定義と現行仕様に従って、テスト不足を埋めるための層別テスト設計書を追加し、運用可能なチェックリストとして固定する。

### レビュー観点

- 受け入れケースが unit / command / integration / manual に分解されているか
- Blocker と優先度付きチェックリストが運用可能な粒度か
- `requirements.md` と `acceptance-test-cases-v1.md` へ逆参照できるか
- 実装入口と HUB から辿れる状態になっているか

### 反映した改善

- `docs/implementation/test-design-v1.md` を追加
- 層別テスト方針、対象マップ、優先度付きチェックリスト、非機能観点、完了条件を整理
- `docs/implementation/README.md` の読み順へ追加
- `HUB.codex.md` と `README.md` に入口を追加

### 現時点で残る未確定事項

- なし

### 判定

`実装着手入口整備済み` を維持しつつ、`テスト設計レビュー可能` まで前進。  
今後は本書を運用用チェックリストとして使い、実装と並行してチェックを埋める。

## Gate 20

実施日: 2026-04-01  
対象: `docs/requirements/frontend-design/runtime-visual-gap-review-20260401.md`, `docs/requirements/frontend-design/runtime-visual-gap-checklist-20260401.md`, `HUB.codex.md`, `README.md`, `docs/BIRDSEYE.md`

### 目的

要件定義段階の WebUI モックと現行ランタイム UI の質感差分を、単発レビューではなく運用可能な導線とチェックリストへ落とし込む。

### レビュー観点

- モックと現行 UI の差分が文書として追えるか
- 差分を埋めるための優先度付きチェックリストがあるか
- HUB / README / Birdseye から辿れるか
- 今後のフロント改善タスクに接続できるか

### 反映した改善

- `runtime-visual-gap-review-20260401.md` を追加
- `runtime-visual-gap-checklist-20260401.md` を追加
- `HUB.codex.md` にレビュー文書とチェックリストを追加
- `README.md` にフロント質感差分文書の入口を追加
- `docs/BIRDSEYE.md` に読む順とホットスポットとして追加

### 現時点で残る未確定事項

- なし

### 判定

`テスト設計レビュー可能` を維持しつつ、`フロント質感差分の運用導線整備済み` まで前進。  
今後は本チェックリストを使って、モックとの差分を段階的に潰していく。

## Gate 21

実施日: 2026-04-01  
対象: `src-tauri/src/commands/llm_runtime.rs`, `src/components/LLMSettingsPanel.tsx`, `docs/requirements/local-llm-connector-v1.md`, `docs/requirements/requirements.md`

### 目的

`LM Studio を常駐 API サーバーとして使いたくない` という運用要求に対し、`llama.cpp` に限って LyricLytic から直接起動・停止できる補助モードを追加する。

### レビュー観点

- 既存の localhost / OpenAI 互換 API 契約を壊していないか
- `llama.cpp` だけを対象に、起動責務が最小追加で閉じているか
- 実行ファイルパスとモデルパスを UI から指定できるか
- 文書上も `直起動は補助モード` として読めるか

### 反映した改善

- Tauri 側に `llama.cpp` child process の起動 / 停止 / 状態確認 command を追加
- LLM 設定 UI に `実行ファイルパス`, `モデルパス`, `起動`, `停止`, `状態表示` を追加
- GGUF ファイルだけでなくモデルフォルダ指定も許容し、配下から最初の GGUF を解決する方式を追加
- `local-llm-connector-v1.md` と `requirements.md` に `llama.cpp 直起動モード` の補足を追加

### 現時点で残る未確定事項

- 起動した `llama.cpp` プロセスの詳細ログ表示
- 高度な起動オプション（GPU layers, ctx-size など）の UI 化

### 判定

`テスト設計レビュー可能` と `フロント質感差分の運用導線整備済み` を維持しつつ、`llama.cpp 直起動の PoC 実装済み` まで前進。  
LM Studio 常駐に依存せず、LyricLytic 側からローカル推論ランタイムを立ち上げる最小経路が追加された。

## Gate 22

実施日: 2026-04-01  
対象: `docs/requirements/rhyme-analysis-v1.md`, `docs/requirements/requirements.md`, `docs/requirements/frontend-requirements-v1.md`, `docs/implementation/test-design-v1.md`, `src/lib/rhyme/analysis.ts`, `src/test/rhyme-analysis.test.ts`, `src/pages/Editor.tsx`

### 目的

韻ガイド機能を、その場しのぎの UI 表示ではなく、`辞書層 / 音韻正規化層 / LLM 補正層` に責務分離された要件として定義し、実装も将来の辞書差し替えに耐える境界へ整理する。

### レビュー観点

- 韻候補検索の主処理を LLM に依存しない要件として定義できているか
- 実行時辞書、補完辞書、検証辞書の役割が文書で分離されているか
- UI 側が `原文 / ローマ字 / 母音列 / 子音列` を安定して表示できるか
- 実装が巨大なページ内ロジックではなく、独立した分析モジュールへ切り出されているか
- 最低限の自動テストが追加されているか

### 反映した改善

- `rhyme-analysis-v1.md` を追加し、`SudachiDict-core + NEologd + UniDic + LLM補正` の責務分離方針を定義
- `requirements.md` に韻ガイドを MVP 範囲として追記
- `frontend-requirements-v1.md` に編集画面下部の韻ガイド表示要件を追記
- `test-design-v1.md` に韻ガイドの正規化・表示契約テストを追記
- `src/lib/rhyme/analysis.ts` を追加し、フォールバック版のローマ字 / 母音 / 子音変換を独立モジュール化
- `src/test/rhyme-analysis.test.ts` を追加し、タグ除外・日本語変換・空行除外のテストを追加
- `Editor.tsx` のインライン変換ロジックを `buildRhymeGuideRows()` 呼び出しへ整理

### 現時点で残る未確定事項

- Sudachi / NEologd / UniDic の実導入タイミング
- 音韻インデックスと韻候補抽出 UI の詳細仕様
- 辞書ライセンス表記の最終配置先

### 判定

`llama.cpp 直起動の PoC 実装済み` を維持しつつ、`韻ガイド要件化と実装境界整理済み` まで前進。  
現段階ではフォールバック実装だが、辞書ベース実装へ差し替えるための入口とテスト足場は整った。

## Gate 23

実施日: 2026-04-01  
対象: `src-tauri/scripts/rhyme_analysis.py`, `src-tauri/src/commands/rhyme.rs`, `src/lib/rhyme/analysis.ts`, `src/lib/api/client.ts`, `src/lib/api/types.ts`, `src/pages/Editor.tsx`

### 目的

韻ガイドの実行時主辞書として `SudachiDict-core` を使う最小実装を投入し、Tauri 実行時には `SudachiPy` の読み取得結果を使い、失敗時のみ既存フォールバックへ戻る構成へ前進させる。

### レビュー観点

- Tauri 実行時にフロントが辞書層へ直接依存していないか
- `SudachiPy + SudachiDict-core` による読み取得が UI 表示用 DTO に変換されているか
- backend 失敗時に既存の韻ガイド表示が壊れないか
- build / check / 既存テストが維持されているか

### 反映した改善

- `src-tauri/scripts/rhyme_analysis.py` を追加し、`SudachiPy + SudachiDict-core` による行単位の読み取得と `ローマ字 / 母音列 / 子音列` 生成を実装
- `src-tauri/src/commands/rhyme.rs` を追加し、Python スクリプトを child process 経由で呼び出す `analyze_rhyme_text` command を実装
- `src/lib/api/client.ts` と `src/lib/api/types.ts` に韻ガイド API 契約を追加
- `src/lib/rhyme/analysis.ts` を `fallback builder + async analyzer` の二層構成へ整理
- `Editor.tsx` を `useMemo` の同期計算から、非同期で Sudachi 結果を受け取り、失敗時はフォールバックへ戻す表示に変更

### 現時点で残る未確定事項

- `NEologd` 補完の組み込み方法
- `UniDic` を使った検証ジョブの具体形
- Python 依存を Rust ネイティブ実装へ寄せるかどうか

### 判定

`韻ガイド要件化と実装境界整理済み` を維持しつつ、`SudachiDict-core を使う実行時解析の PoC 実装済み` まで前進。  
フロントの UI 契約は維持したまま、Tauri 実行時に辞書ベース解析へ切り替わる構造が入った。

## Gate 24

実施日: 2026-04-01  
対象: `docs/implementation/rhyme-implementation-checklist-v1.md`, `README.md`, `HUB.codex.md`, `src/pages/Editor.tsx`, `src/styles/editor/workspace.css`, `src/lib/i18n.ts`

### 目的

韻ガイド実装を場当たりで増やさず、段階的に前進させるための運用チェックリストを作成し、あわせて最初の UX 改善として「どの解析系で動いているか」が UI から分かるようにする。

### レビュー観点

- 要件から実装への分解がチェックリストで追えるか
- README / HUB から辿れるか
- 現在の PoC 実装状態がチェックリストに反映されているか
- Sudachi / Fallback の解析ソースが UI から分かるか

### 反映した改善

- `rhyme-implementation-checklist-v1.md` を追加
- `README.md` と `HUB.codex.md` に入口を追加
- 韻ガイドヘッダに `解析ソース: Sudachi Core / Fallback` を表示
- 翻訳キーと表示スタイルを追加

### 現時点で残る未確定事項

- Sudachi の split mode 最終決定
- NEologd の導入方式
- UniDic 検証ジョブ

### 判定

`SudachiDict-core を使う実行時解析の PoC 実装済み` を維持しつつ、`韻ガイド実装の運用チェックリスト整備済み` まで前進。  
今後は本チェックリストを使って、辞書拡張・候補抽出・LLM補正を段階的に積み上げる。

## Gate 25

実施日: 2026-04-01  
対象: `src/lib/rhyme/analysis.ts`, `src/test/rhyme-analysis.test.ts`, `src/pages/Editor.tsx`, `src/styles/editor/workspace.css`, `docs/implementation/rhyme-implementation-checklist-v1.md`

### 目的

韻ガイドを「表示しているだけ」の状態から一歩進めて、連続する行の末尾一致を視覚的に追えるようにし、あわせて正規化テストを拡充する。

### レビュー観点

- 末尾一致の抽出ロジックが UI 依存ではなく関数として切り出されているか
- 既存の `RhymeGuideRow[]` 契約を崩していないか
- 強調表示が過剰ではなく、補助情報として自然か
- 正規化ロジックの追加テストが build / test を維持しているか

### 反映した改善

- `getGuideHighlightParts()` を追加し、ガイド値同士の共通 suffix を抽出可能にした
- `rhyme-analysis.test.ts` に `長音 / 促音` の smoke と末尾一致抽出テストを追加
- `Editor.tsx` で前行との共通 suffix を `ローマ字 / 母音 / 子音` に対して強調表示
- `workspace.css` に一致部分のハイライトスタイルを追加
- `rhyme-implementation-checklist-v1.md` の Phase B / Phase E を更新

### 現時点で残る未確定事項

- 末尾一致の強調粒度を token 単位で十分とするか、モーラ単位へ寄せるか
- 韻ガイド行の本文コピー導線
- 英字 / 数字混在時の正規化基準

### 判定

`韻ガイド実装の運用チェックリスト整備済み` を維持しつつ、`末尾一致の可視化と正規化テスト拡張済み` まで前進。  
次は split mode の最終決定か、本文コピー導線のどちらかを進めるとバランスがよい。

## Gate 26

実施日: 2026-04-01  
対象: `src/pages/Editor.tsx`, `src/styles/editor/workspace.css`, `src/lib/i18n.ts`, `docs/implementation/rhyme-implementation-checklist-v1.md`

### 目的

韻ガイドを比較専用の補助 UI として保ち、歌詞挿入のような別責務を混ぜない方針を確認する。

### レビュー観点

- 韻ガイドの責務が `比較` に保たれているか
- 本文操作導線を混ぜず、読みやすさを優先できているか
- 実装チェックリストの状態が実態と一致しているか

### 反映した改善

- 韻ガイド行への `歌詞へ挿入` 導線は採用しない判断に戻した
- 比較専用 UI として、末尾一致強調と解析ソース表示に集中させた
- 実装チェックリストの `韻ガイド行から本文へコピーできる` を未着手へ戻した

### 現時点で残る未確定事項

- 韻ガイド表示密度の切り替え
- 大量行時の負荷評価
- split mode の最終決定

### 判定

`末尾一致の可視化と正規化テスト拡張済み` を維持しつつ、`韻ガイドは比較専用 UI として維持` を再確認。  
次は split mode の最終決定か、韻ガイドの表示密度切り替えが自然な次手になる。

## Gate 27

実施日: 2026-04-01  
対象: `src/components/LLMReviewPanel.tsx`, `src/pages/editor/ActionPane.tsx`, `docs/requirements/requirements.md`, `docs/requirements/acceptance-test-cases-v1.md`

### 目的

`AIレビュー補助` が実態として要件とズレていたため、`AIモデル頻出表現チェック` として名称・対象・結果表示の正本を揃える。

### レビュー観点

- 対象が `選択セクション` ではなく `入力フレーズ + 歌詞全文` になっているか
- 閾値未満除外と出現件数降順が要件に明記されているか
- ボタンの無効化条件が、全文があるのに押せない状態を作っていないか

### 反映した改善

- UI 名称を `AIモデル頻出表現チェック` に変更した
- 入力フレーズ用 textarea を追加し、歌詞全文を解析対象として渡す形へ補正した
- 要件と受け入れケースへ `閾値未満除外 + 出現件数降順表示` を追記した

### 現時点で残る未確定事項

- 頻出表現 JSON 契約に `hit_count` を必須化するか
- 低頻出候補レコメンド側で `凡庸な方向 / 奇抜な方向` を UI パラメータ化するか
- 長文歌詞時の最大トークン見積もり

### 判定

`AIモデル頻出表現チェック` の名称と基本挙動は正本に戻せた。  
次は `hit_count` の JSON 契約固定と、凡庸な方向 / 奇抜な方向の切替 UI を詰めるのが自然。

## Gate 28

実施日: 2026-04-01  
対象: `src/components/LLMReviewPanel.tsx`, `src/lib/rhyme/analysis.ts`, `docs/requirements/requirements.md`, `docs/requirements/acceptance-test-cases-v1.md`

### 目的

モデル頻出表現チェックを、`凡庸` / `奇抜` の両方向で扱えるようにし、候補に韻判断のための音韻メタ情報を追加する。

### レビュー観点

- `凡庸` / `奇抜` の切替が threshold 解釈に反映されているか
- サンプル数が PoC に見合う大きめレンジを取れているか
- 候補表示にローマ字 / 母音 / 子音 / 韻の近さが含まれているか

### 反映した改善

- レビューモードを `凡庸` / `奇抜` の 2 タブに分けた
- サンプル数プリセットを 500 以上へ引き上げた
- 結果と代替候補に音韻メタと韻の近さを追加した

### 現時点で残る未確定事項

- `hit_count` を必須 JSON 契約として厳密化するか
- 代替候補を 1 回の大きな prompt で作るか、段階生成に分けるか
- 韻の近さを suffix token 数以外のスコアへ広げるか

### 判定

モデル頻出表現チェックは、`出やすい / 出にくい` の両方向を扱える段階まで前進。  
次は `hit_count` 契約の厳密化か、代替候補生成の実サンプル感を高める方針の確定が自然。
