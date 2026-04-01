---
intent_id: LL-002
owner: lyriclytic-dev
status: active
last_reviewed_at: 2026-03-31
next_review_due: 2026-04-15
---

# LyricLytic Guardrails

本書は LyricLytic 実装時の行動指針と禁止事項を定める。
すべての実装者・エージェントは本書を遵守する。

## 1. 必須遵守事項

### 1.1 ローカル完結

- 歌詞本文、断片、履歴、曲紐付け情報はすべてローカル保存
- 外部通信を行わない（LLM接続は localhost 限定例外）
- 外部 URL は保存・表示のみ、自動取得禁止

### 1.2 Working Draft 主体

- 編集対象は常に Working Draft
- LyricVersion は不変オブジェクト扱い、直接上書き禁止
- 復元は Working Draft 再構築のみ、既存版破壊禁止

### 1.3 論理削除原則

- 削除操作は論理削除（deleted_at, deleted_batch_id）
- 物理削除はメンテナンス用途のみ、通常導線で露出禁止
- unique 制約は partial index で active データのみ担保

### 1.4 Section 正本原則

- PoC では draft_sections を正本とする
- latest_body_text は全文プレビュー/コピー用派生キャッシュ
- Section 表示名と SectionID を分離、内部処理は SectionID 基準

## 2. 禁止事項

### 2.1 外部通信禁止

- 外部 API 直接呼び出し禁止（localhost LLM は例外）
- iframe 埋め込み禁止
- remote HTML/JS 読み込み禁止

### 2.2 履歴破壊禁止

- LyricVersion 上書き禁止
- parent_lyric_version_id の同一 Project 内参照崩壊禁止
- RevisionNote の異 LyricVersion へ移動禁止

### 2.3 自動補正禁止

- AI 補助結果を自動本文置換禁止
- 品質判定を真理値として扱う禁止
- 創作を矯正・強制する機能禁止

### 2.4 権限過剰禁止

- Tauri capabilities 最小権限
- Shell / External Launcher 原則禁止（必要時ホワイトリスト）
- ファイルシステム権限は Project 範囲限定

## 3. 実装境界

### 3.1 Frontend 責務

- 画面表示、入力状態管理、エラー表示
- SQLite 直接アクセス禁止
- OS ファイル操作禁止

### 3.2 Tauri Command 責務

- 1 command = 1 ユーザー意図
- DB スキーマを UI に漏出禁止
- 例外は UI 向けエラーへ変換

### 3.3 Repository 責務

- deleted_at IS NULL を active 既定
- transaction 境界明示
- UI 層に SQL 漏出禁止

## 4. エラー処理原則

- 保存失敗時は再試行導線提示
- LLM JSON 不一致は明確失敗表示（黙除外禁止）
- 文字コード判定失敗は再選択導線提示

## 5. OS 差分対応

- Windows: Ctrl ショートカット
- macOS: Command ショートカット
- ファイルダイアログは OS ネイティブ利用
- 保存ダイアログ挙動差分は docs/requirements/os-differences-v1.md 参照

## 6. セキュリティ

- CSP: `default-src 'self';` 中心
- ローカル資産のみ読み込み
- 外部 URL を開く前は必ず確認ダイアログ
- LLM 接続先は 127.0.0.1/localhost 限定

## 7. 要件へ戻す条件

以下が起きた場合はコードで吸収せず requirements へ戻す:

- 右ペイン 1 面で情報量不足、画面責務変更必要
- Windows/macOS ファイルダイアログ差で UX 不成立
- SQLite 制約だけで担保できない整合条件増加
- LLM JSON 固定前提破綻
- Monaco Editor 制約で UI 要件変更必要

戻した変更は `docs/requirements/review-log.md` に Gate 追記。

## 8. テスト原則

- pytest Vitest で repository 層単体テスト
- E2E は主要フロー縦切り確認
- Windows/macOS 両方で PoC 検証
- カバレッジ目標: src 配下 80%

## 9. 参照

正本ガードレール源: `docs/requirements/requirements.md` 15.13-16.6, 21