# LyricLytic ローカル LLM 接続要件 v1

## 1. 目的

本書は、LyricLytic PoC におけるローカル LLM 接続方式を定義する。
対象機能は以下である。

- **LLM Review Assist**: モデル頻出表現チェック、低頻出候補レコメンド（レビュー補助）
- **LLM Generate Assist**: 歌詞生成補助（生成補助）

PoC ではレビュー補助を主軸とし、生成補助は補助的な別機能として提供する。

目的は、PoC 実装時に「どのランタイムに、どの API で、どの粒度の入出力を渡すか」を固定し、AI 補助機能の実装ブレを減らすことにある。

## 2. PoC の基本方針

- PoC ではアプリ同梱モデルを前提にしない
- ユーザー環境上で起動済みのローカル LLM ランタイムへ接続する
- 接続方式は `OpenAI 互換 HTTP API` を既定とする
- 外部クラウド API には接続しない
- モデルの選定責任はユーザーまたは PoC 設定に置き、アプリ本体は接続先を抽象化する

### 2.1 実装補足

PoC 実装では、`llama.cpp` に限って以下の補助モードを許可する。

- アプリが `llama-server` を直接起動する
- 起動対象はローカルファイルシステム上の `llama-server` 実行ファイルと GGUF モデル
- 起動後の推論呼び出し自体は従来どおり `localhost` の OpenAI 互換 HTTP API を使う

つまり、通信契約は `OpenAI 互換 localhost API` のまま維持し、ランタイム起動責務だけを LyricLytic 側へ拡張する。

## 3. PoC 既定接続方式

### 3.1 必須前提

PoC では、以下を既定前提とする。

- ローカルホスト上で OpenAI 互換 API が起動済みである
- 接続先は `http://127.0.0.1:<port>` とする
- 既定ポートは `1234` を優先候補とする
- モデル名は設定値で指定する

### 3.2 許容ランタイム

PoC では以下のランタイムを正式にサポートする。

- **OpenAI 互換 HTTP API** (既定): llama.cpp server, LM Studio, koboldcpp 等
- **Ollama**: Ollama 統合 API (`/api/chat` endpoint)

両ランタイムは設定で切り替え可能とする。共通条件:

- ローカルホストから HTTP で到達可能
- 外部クラウドへ中継しない

## 4. 接続設定

PoC で最低限必要な設定項目は以下。

- `llm_runtime`: `openai_compatible` | `ollama` (ランタイム種別)
- `llm_base_url`: 例 `http://127.0.0.1:1234`
- `llm_model_name`: モデル名 (例 `local-model`)
- `llm_executable_path`: `llama-server` 実行ファイルパス（`llama.cpp` 直起動時のみ）
- `llm_model_path`: モデルファイルパス (llama.cpp 等で使用、例 `C:\Users\...\model.gguf`)
- `llm_timeout_ms`
- `llm_max_output_tokens`
- `llm_temperature`
- `llm_enabled`

### 4.1 既定値

- `llm_enabled = false`
- `llm_base_url = http://127.0.0.1:1234`
- `llm_timeout_ms = 30000`
- `llm_max_output_tokens = 512`
- `llm_temperature = 0.7`

PoC では、接続設定が未完了なら AI 補助機能は無効状態で開始してよい。

## 5. 接続確認フロー

### 5.1 PoC 必須フロー

1. ユーザーが設定画面で `接続確認` を実行
2. アプリが `base_url` と `model_name` を使って簡易リクエストを送る
3. 応答が正常なら `接続可能` と表示
4. 失敗時は原因候補を表示

`llama.cpp` 直起動モードでは、接続確認の前に以下を持ってよい。

1. ユーザーが `実行ファイルパス` と `モデルパス` を指定
2. アプリが `llama-server --model ... --host ... --port ...` を起動
3. ローカルポート待受を確認
4. その後に通常の `接続確認` を行う

### 5.2 エラー候補

- ランタイム未起動
- ポート不一致
- モデル名不一致
- タイムアウト
- OpenAI 互換でないレスポンス

## 6. API 方針

### 6.1 既定

PoC では `OpenAI 互換 Chat Completions API` を既定とする。  
将来、Responses API 互換へ切り替える余地は残すが、PoC では 1 つに絞る。

### 6.2 リクエスト形

最低限、以下の情報を送れること。

- system 指示
- user 指示
- 対象セクション本文
- 実行パラメータ

### 6.3 レスポンス形

PoC では、応答本文を JSON 文字列として返させ、アプリ側でパースする。

理由:

- モデル頻出表現チェックと低頻出候補レコメンドで、構造化結果が必要
- 自然文だけだと後段 UI で解釈がぶれやすい

## 7. 機能別入出力

### 7.1 モデル頻出表現チェック

入力:

- project_id
- lyric_version_id または working_draft_id
- section_id
- section_text
- sample_count
- threshold

出力:

- `expressions`: 配列
- 各要素に
  - `text`
  - `occurrence_ratio`
  - `reason`

### 7.2 低頻出候補レコメンド

入力:

- section_text
- high_frequency_expressions
- desired_candidate_count

出力:

- `candidates`: 配列
- 各要素に
  - `text`
  - `rationale`

## 8. キャッシュ / 保存方針

- PoC では LLM 生レスポンスを DB へ永続保存しない
- UI 表示に必要な結果のみ一時保持してよい
- 将来キャッシュを入れる場合は別テーブル化を検討する

## 9. セキュリティ / 通信境界

- 接続先はローカルホストに限定する
- PoC では `127.0.0.1` と `localhost` のみ許可してよい
- 外部 IP や外部ドメインは受け付けないこと
- HTTP 接続でよいが、ローカル以外を許可しないこと

## 10. UI 要件

PoC で最低限必要な UI は以下。

- LLM 有効 / 無効トグル
- base_url 入力
- model_name 入力
- 接続確認ボタン
- 接続状態表示

AI 補助機能が無効または未接続の場合は、該当機能の実行ボタンを無効化するか、設定誘導を表示する。

## 11. 仕様化で見つかった論点

1. OpenAI 互換 API に固定しないと PoC 接続実装が膨らみやすい
2. 外部通信禁止要件があるため、接続先はローカルホスト限定にする必要がある
3. 生レスポンス保存まで入れると DB 設計が増え、PoC の目的から外れやすい
4. AI 機能は設定未完了時に無理に動かすより、無効化状態で始める方が破綻しにくい

## 12. 要件へ戻すべき項目

- PoC の接続方式を OpenAI 互換ローカル HTTP API に固定すること
- 接続先をローカルホストのみに限定すること
- `llm_enabled`, `llm_base_url`, `llm_model_name` などの設定項目を明文化すること
- 接続確認 UI を持つこと
- AI 補助未接続時の無効化導線を持つこと
