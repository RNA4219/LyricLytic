# LyricLytic Frontend Constants 仕様 v1

**最終更新**: 2026-04-03
**状態**: 実装準拠

## 1. 目的

本書は `src/lib/config.ts` で定義される frontend 定数値を記録する。
実機の挙動を正とし、テスト・実装の整合性を担保する。

## 2. Layout Constants

| 定数 | 値 | 単位 | 説明 |
|---|---|---|---|
| `LAYOUT.LEFT_PANE.MIN_WIDTH` | 240 | px | 左ペイン最小幅 |
| `LAYOUT.LEFT_PANE.MAX_WIDTH` | 420 | px | 左ペイン最大幅 |
| `LAYOUT.LEFT_PANE.DEFAULT_WIDTH` | 296 | px | 左ペイン初期幅 |
| `LAYOUT.RIGHT_PANE.MIN_WIDTH` | 280 | px | 右ペイン最小幅 |
| `LAYOUT.RIGHT_PANE.MAX_WIDTH` | 520 | px | 右ペイン最大幅 |
| `LAYOUT.RIGHT_PANE.DEFAULT_WIDTH` | 320 | px | 右ペイン初期幅 |
| `LAYOUT.SECTION_PANE.MIN_HEIGHT_PERCENT` | 20 | % | セクションペイン最小高さ |
| `LAYOUT.SECTION_PANE.MAX_HEIGHT_PERCENT` | 80 | % | セクションペイン最大高さ |
| `LAYOUT.SECTION_PANE.DEFAULT_HEIGHT_PERCENT` | 50 | % | セクションペイン初期高さ |

## 3. Editor Constants

| 定数 | 値 | 説明 |
|---|---|---|
| `EDITOR.ALL_SECTIONS_ID` | `'__all__'` | 全セクション選択時のID |
| `EDITOR.AUTO_SAVE_DEBOUNCE_MS` | 1000 | 自動保存デバウンス時間 (ms) |

## 4. Section Presets

```typescript
SECTION_PRESETS = ['Intro', 'Verse', 'Pre-Chorus', 'Chorus', 'Bridge', 'Outro']
```

- 曲構成の標準セクション名
- 表示順は曲進行順

## 5. Copy Options Defaults

| 定数 | 値 | 説明 |
|---|---|---|
| `COPY_OPTIONS.DEFAULT_INCLUDE_HEADINGS` | `true` | 見出し付与の初期値 |
| `COPY_OPTIONS.DEFAULT_PRESERVE_BLANK_LINES` | `true` | 空行保持の初期値 |
| `COPY_OPTIONS.STORAGE_KEY` | `'lyriclytic_copy_options'` | localStorage キー |

## 6. LLM Defaults

**重要**: LyricLytic PoC は `openai_compatible` ランタイムのみサポートする。
Ollama / LM Studio 固有処理は実装されていない。

| 定数 | 値 | 説明 |
|---|---|---|
| `LLM_DEFAULTS.RUNTIME` | `'openai_compatible'` | サポートするランタイム型 |
| `LLM_DEFAULTS.BASE_URL_OPENAI` | `'http://127.0.0.1:8080'` | OpenAI 互換 API ベース URL |
| `LLM_DEFAULTS.MODEL_OPENAI` | `'local-model'` | デフォルトモデル名 |
| `LLM_DEFAULTS.EXECUTABLE_PATH` | `''` | 実行パス（未使用） |
| `LLM_DEFAULTS.TIMEOUT_MS` | 300000 | リクエストタイムアウト (5分) |
| `LLM_DEFAULTS.MAX_TOKENS` | 262144 | 最大トークン数 (大規模コンテキスト対応) |
| `LLM_DEFAULTS.TEMPERATURE` | 0.7 | 生成温度 |

### 6.1 LLM Runtime 型

```typescript
export type LLMRuntime = 'openai_compatible';
```

**制約**:
- セキュリティのため `127.0.0.1` / `localhost` のみ許可
- 外部 URL は拒否

### 6.2 API Endpoint 生成

```
BASE_URL + /v1/chat/completions
```

例: `http://127.0.0.1:8080/v1/chat/completions`

### 6.3 Request Body 形式

```json
{
  "model": "local-model",
  "max_tokens": 262144,
  "temperature": 0.7,
  "messages": [{ "role": "user", "content": "..." }],
  "chat_template_kwargs": { "enable_thinking": false }
}
```

## 7. Export Settings

| 定数 | 値 | 説明 |
|---|---|---|
| `EXPORT.FILE_EXTENSION` | `'.lyrlytic.zip'` | エクスポートファイル拡張子 |
| `EXPORT.FILE_FILTER_NAME` | `'LyricLytic Export'` | ファイルダイアログフィルタ名 |

## 8. Storage Keys

| 定数 | 値 | 用途 |
|---|---|---|
| `STORAGE_KEYS.LANGUAGE` | `'lyriclytic_language'` | UI言語設定 |
| `STORAGE_KEYS.LLM_SETTINGS` | `'lyriclytic_llm_settings'` | LLM接続設定 |
| `STORAGE_KEYS.COPY_OPTIONS` | `'lyriclytic_copy_options'` | コピー設定 |

## 9. 変更履歴

| 日付 | 変更内容 |
|---|---|
| 2026-04-03 | 初版作成（実装値を記録） |