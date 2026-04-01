# llama.cpp Runtime Memo

更新日: 2026-04-01

## 現在の方針

- LyricLytic の LLM ランタイムは `llama.cpp` のみを前提にする
- 他ランタイム分岐は UI 上から外し、`GGUF ファイルを直接選んで起動` する
- `llama-server.exe` は LyricLytic から直接起動する
- 既定では `localhost / 127.0.0.1` のみを使用する

## 今回入れた変更

- `llama-server.exe` の自動検出
  - WinGet 導入先と `PATH` を探索
- LLM 設定画面を `llama.cpp` 専用に整理
  - ランタイム切替 UI を撤去
  - モデルは `GGUF ファイル` を直接選択する前提に変更
- `llama-server` 起動時に以下を付与
  - `--ctx-size 8192`
  - `--n-gpu-layers 999`
- Qwen 系モデルの `thinking` を無効化
  - `chat_template_kwargs.enable_thinking = false`
- `Qwen3.5-27B-GGUF` 配下では `mmproj-F32.gguf` ではなく、本体 GGUF を優先する

## 検出・確認できた実行ファイル

- `C:\Users\ryo-n\AppData\Local\Microsoft\WinGet\Packages\ggml.llamacpp_Microsoft.Winget.Source_8wekyb3d8bbwe\llama-server.exe`

## 確認したモデル

### 4B

- ファイル:
  - `C:\Users\ryo-n\Qwen3.5-4B-Q4_K_M.gguf`
- 確認内容:
  - `llama-server` 起動成功
  - `http://127.0.0.1:8080/v1/models` 応答成功
  - `Lyrics / Style / Vocal` 系の生成リクエストに対して `content` が返ることを確認

### 27B

- フォルダ:
  - `C:\Users\ryo-n\LLM model\unsloth\Qwen3.5-27B-GGUF`
- 実際に使われる本体:
  - `C:\Users\ryo-n\LLM model\unsloth\Qwen3.5-27B-GGUF\Qwen3.5-27B-UD-Q5_K_XL.gguf`
- 確認内容:
  - `llama-server` 起動成功
  - `http://127.0.0.1:8080/v1/models` 応答成功
  - 短めの `Lyrics / Style / Vocal` 生成で応答取得成功

## 27B で確認した生成例

### Lyrics

```json
{"candidates":[{"id":1,"title":"春の夜行列車","text":"春の雨\n窓を叩く\n夜行列車\n君を想う"}]}
```

### Style

```json
{"candidates":[{"id":1,"title":"Spring Rain Commute","text":"Blend shimmering neon synth pads with a bouncy bassline to mimic the rhythm of falling rain. Layer smooth, breathy vocals over a crisp drum machine groove that evokes the solitude of a late-night train ride. Add subtle chime effects to capture the fresh, melancholic atmosphere of a spring evening."}]}
```

### Vocal

```json
{"candidates":[{"id":1,"title":"Spring Rain Nocturne","text":"Sing with a soft, breathy tone to evoke the gentle rhythm of spring rain tapping against the train window. Let your voice carry a sense of wistful nostalgia as the city lights blur in the background. Fade out slowly on the final note to mimic the train disappearing into the night."}]}
```

## 体感メモ

- 4B は実用速度に近い
- 27B は生成品質は高いがかなり重い
- 27B は 1 リクエストずつ短く使うほうが扱いやすい
- `3 candidates + 長文` にすると時間がかかりやすい

## 次に見るとよい場所

- 設定 UI:
  - `C:\Users\ryo-n\Codex_dev\LyricLytic\src\components\LLMSettingsPanel.tsx`
- 生成 UI:
  - `C:\Users\ryo-n\Codex_dev\LyricLytic\src\components\LLMAssistPanel.tsx`
- LLM API 共通処理:
  - `C:\Users\ryo-n\Codex_dev\LyricLytic\src\lib\llm\utils.ts`
- ランタイム起動 command:
  - `C:\Users\ryo-n\Codex_dev\LyricLytic\src-tauri\src\commands\llm_runtime.rs`

## もし次回うまく起動しない場合の確認手順

1. `LLM補助を有効にする`
2. `llama.cpp 実行ファイルパス` が自動検出されているか見る
3. `モデルファイルパス` に GGUF を直接指定する
4. `起動` を押す
5. `接続確認` を押す
6. `モデル一覧更新` でモデル名が入るか確認する

## 権限や起動制約で詰まった場合の手動確認

### 実行ファイル

```powershell
Get-Process llama-server -ErrorAction SilentlyContinue | Select-Object Id,ProcessName,Path
```

### API 応答

```powershell
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:8080/v1/models
```

### 27B ログ

```powershell
Get-Content C:\Users\ryo-n\Codex_dev\LyricLytic\tmp\llama-server-27b.err.log -Tail 120
```
