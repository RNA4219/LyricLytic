# Contributing to LyricLytic

LyricLyticへの貢献を歓迎します。

## 開発環境

- Node.js 20.19以上または22.12以上
- Rust stable
- Windows 11またはmacOS
- curl（Sudachi辞書のbuild時取得に使用）

実行する検証:

    npm ci
    npm run build
    npm run test:run -- --maxWorkers=1
    cd src-tauri
    cargo fmt -- --check
    cargo clippy --all-targets --all-features -- -D warnings
    cargo test --all-features

初回Rust buildではSudachiDict Core v20260428を公式releaseから取得し、SHA-256を検証します。実行時のネットワーク接続やPythonは不要です。

変更は小さな単位に分け、ユーザー向け変更にはテストとCHANGELOG更新を含めてください。
