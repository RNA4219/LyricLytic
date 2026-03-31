# LyricLytic フロント質感ギャップ対応チェックリスト

更新日: 2026-04-01

## 1. 目的

本チェックリストは、`runtime-visual-gap-review-20260401.md` で洗い出した  
`要件定義段階のモックと現行ランタイム UI の質感差分` を、実装修正ベースで順番に潰すための運用用ドキュメントである。

## 2. 運用ルール

- 未着手: `- [ ]`
- 対応済み: `- [x]`
- 要件変更で吸収する場合も、関連文書更新までは未着手のままとする
- 1 項目ごとに `対象`, `期待状態`, `確認方法` を満たした時点で完了とする

## 3. 優先度サマリ

- P1: 0 件 (全件解決済み)
- P2: 0 件 (全件解決済み)
- P3: 0 件 (全件解決済み)

**🎉 UI質感ギャップ対応完了 - 全 11 項目解決済み**

## 4. P1

- [x] VG-P1-01 右ペインを `アクション倉庫` から `インスペクタ` へ戻す ✅ 解決済み
  対象: `src/pages/editor/ActionPane.tsx`, `src/styles/editor/workspace.css`
  期待状態: 常時縦積みではなく、主題を絞った表示になる。少なくとも `Search / Fragments / Song / History` のような文脈切替か、同等の情報整理がある。
  確認方法: 右ペインを見たときに、同時表示される主題が 1 つまたは少数に整理されていること。
  現状: タブ切り替え形式のインスペクタペインを実装。Search / Fragments / Song / History の4タブ構成。

- [x] VG-P1-02 中央ヘッダの説明量を減らし、本文主役の構図へ戻す ✅ 解決済み
  対象: `src/pages/Editor.tsx`, `src/styles/editor/workspace.css`
  期待状態: `Working Draft` 識別は維持しつつ、長い説明文が常時表示されない。見出しと本文の余白が増え、中央本文が主役に見える。
  確認方法: エディタを開いた第一印象が `説明` より `本文` に向くこと。
  現状: 大きなヘッドラインとシンプルなバッジ形式に変更。長文の説明を削除。

- [x] VG-P1-03 左ペインを履歴管理 UI から構造ナビ寄りへ再調整する ✅ 解決済み
  対象: `src/pages/editor/VersionPane.tsx`, `src/styles/editor/workspace.css`
  期待状態: バージョン管理は残しつつ、左が `ワークスペースの構造ナビ` として読める。破壊的操作ボタンが主役に見えない。
  確認方法: 左ペインが `管理ツール` ではなく `創作ナビ` に見えること。
  現状: プロジェクトタイトル、Current/Historyセクション、Quick Panelsに再構成。削除ボタンを削除しタイムライン形式を採用。

## 5. P2

- [x] VG-P2-01 セクション一覧の常時操作密度を下げる ✅ 解決済み
  対象: `src/styles/editor/section-tabs.css`, `src/pages/Editor.tsx`
  期待状態: 移動 / 削除 / 編集操作が常時前面に出すぎない。読む面としてのカード性が上がる。
  確認方法: セクション一覧を見たときに、まず `構造` が見え、次に `操作` が見える順序になっていること。
  現状: 操作ボタンをホバー時のみ表示（opacity: 0 → 0.6）に変更。カード形式のスタイルを採用。

- [x] VG-P2-02 セクション追加導線を `常時並列` から `整理された導線` に寄せる ✅ 解決済み
  対象: `src/pages/Editor.tsx`, `src/styles/editor/section-tabs.css`
  期待状態: `+Intro` などが便利さを損なわずに整理され、常時露出しすぎない。
  確認方法: Sections 領域が操作パレットではなく、構造一覧として保たれていること。
  現状: 「+ Add Section」トグルボタンで展開/折りたたみ可能に変更。

- [x] VG-P2-03 文言トーンを統一する ✅ 解決済み
  対象: `src/pages/editor/ActionPane.tsx`, `src/pages/editor/VersionPane.tsx`, 関連コンポーネント全般
  期待状態: 絵文字、日本語ラベル、英語ラベル、説明口調が混在しない。ブランドトーンが統一される。
  確認方法: 同一画面内に `💾`, `📤`, `📥`, `🎵` などの混在がなく、ラベル粒度も揃っていること。
  現状: 英語ラベルで統一。絵文字アイコンは最小限に抑制。

- [x] VG-P2-04 右ペインと中央ペインの余白設計を見直す ✅ 解決済み
  対象: `src/styles/editor/workspace.css`, `src/styles/editor/section-tabs.css`
  期待状態: 右ペインのカード間、中央本文上下、ヘッダ周辺に余白が戻り、画面が詰まりすぎない。
  確認方法: モックと比較したときに、情報密度の差が一段縮まっていること。
  現状: ヘッダーに十分な余白（padding: 1.8rem 3rem）を確保。セクション一覧に適切なgapを設定。

## 6. P3

- [x] VG-P3-01 ホーム画面のブランド感をモックへ寄せる ✅ 解決済み
  対象: `src/pages/Home.tsx` と関連スタイル
  期待状態: 単なるフォームではなく、LyricLytic の最初の世界観が見える構図になる。
  確認方法: `home_project_selection_updated_background` モックと比較して、第一印象が近づいていること。
  現状: グラデーション背景、ガラスパネル、サイドバー/メイン領域の分離、プロジェクトカード等のブランド要素を実装済み。

- [x] VG-P3-02 SongArtifact の見せ方をカードベースへ寄せる ✅ 解決済み
  対象: `src/components/SongArtifactPanel.tsx`
  期待状態: 単なるフォームや一覧ではなく、`artifact card` 的なまとまりが見える。
  確認方法: モックの `Linked Artifact` に近い見せ方になっていること。
  現状: service-badge、version-badge、artifact-linksを含むカード形式で実装済み。

- [x] VG-P3-03 バージョン履歴の見せ方を timeline / snapshot card 寄りへ寄せる ✅ 解決済み
  対象: `src/pages/editor/VersionPane.tsx` または履歴関連 UI
  期待状態: 履歴が `復元 / 削除ボタンの列` ではなく、保存版の流れとして読める。
  確認方法: 版一覧の視認性が改善し、比較 / 復元導線が自然になること。
  現状: タイムライン形式（timeline-dot + timeline-content）を採用。削除ボタンを削除し、クリックで復元可能に。

- [x] VG-P3-04 Fragment / Search の質感をモックの `Suggested Fragments` 文脈へ寄せる ✅ 解決済み
  対象: `src/components/FragmentPanel.tsx`, `src/components/SearchPanel.tsx`
  期待状態: 単なる検索結果一覧ではなく、創作支援面としてカードや抜粋の見せ方が整理される。
  確認方法: モックの右ペインと比較して、支援情報の見え方が近づいていること。
  現状: インスペクタペイン内でタブ切り替え形式で統合。Fragmentカードはホバー時にInsertボタン表示。

## 7. 完了条件

以下を満たした時点で、本チェックリストは一巡完了とみなす。

- P1 の全項目が完了している
- P2 のうち少なくとも 3 件が完了している
- 実行時キャプチャを撮り直し、`runtime-visual-gap-review-20260401.md` の主要差分が縮小している
- HUB / README / Birdseye から本チェックリストへ辿れる

## 8. 関連文書

- `runtime-visual-gap-review-20260401.md`
- `../frontend-requirements-v1.md`
- `../requirements.md`
- `../../implementation/test-design-v1.md`
