# Five Tool Validation Gate Report: 歌詞感情インサイト v2

## Chain Status

| Step | Status | Artifact | Notes |
| --- | --- | --- | --- |
| RanD | degraded | `rand/requirements-packet.json` | RanD CLI は未実行。仕様書から deterministic handoff を作成 |
| Code-to-gate | ran | `code-to-gate/analysis-report.md` | Critical 0 / High 0 / risks 0 / Medium 17 |
| HATE | ran | `hate/real-repo/real-repo-evaluation-run-report.json` | `npm test -- --run --reporter=dot` を実行し 1356 件 pass |
| manual-bb | ran | `manual-bb/execution-evidence.json` | TC-AFFECT-001..003 を Playwright system-chrome で実行し pass |
| QEG | degraded | `qeg/gate-record.json` | QEG CLI health は positive fixture で pass。LyricLytic bundle は local gate record として保存 |

## Evidence Map

- Requirements:
  - `docs/requirements/lyric-affect-insight-v2.md`
  - `docs/implementation/lyric-affect-insight-v2.md`
  - `docs/requirements/requirements.md#17A.3`
- Static analysis:
  - `.five-tool-validation/affect-insight-v2/code-to-gate/analysis-report.md`
  - `.five-tool-validation/affect-insight-v2/code-to-gate/risk-register.yaml`
- Auto-test evidence:
  - `.five-tool-validation/affect-insight-v2/hate/vitest-results.json`
  - `.five-tool-validation/affect-insight-v2/hate/real-repo/real-repo-LyricLytic.json`
- Manual QA:
  - `.five-tool-validation/affect-insight-v2/manual-bb/manual-bb-report.md`
  - `.five-tool-validation/affect-insight-v2/manual-bb/manual-bb-artifact.json`
  - `.five-tool-validation/affect-insight-v2/manual-bb/execution-evidence.json`
  - `.five-tool-validation/affect-insight-v2/manual-bb/screenshots/TC-AFFECT-001-003-affect-panel.png`
  - `.five-tool-validation/affect-insight-v2/manual-bb/screenshots/TC-AFFECT-002-diff-viewer.png`
- QEG gate:
  - `.five-tool-validation/affect-insight-v2/qeg/gate-input.json`
  - `.five-tool-validation/affect-insight-v2/qeg/gate-record.json`

## Findings And Risks

- P0: なし
- P1: なし
- Residual:
  - P2: 独自セクション名は `custom` 扱いになる

## Manual BB Execution

- TC-AFFECT-001: Verse / Chorus を含む歌詞でセクション別メトリクスを確認 -> pass
- TC-AFFECT-002: DiffViewer で明るい版と暗い版の感情差分を確認 -> pass
- TC-AFFECT-003: 根拠と制作メモが採点ではなく参考情報として読めることを確認 -> pass
- Command: `MANUAL_BB_EXTERNAL_SERVER=1 npx playwright test -c playwright.manual-bb.config.ts e2e/affect-insight.manual.spec.ts --global-timeout=120000 --timeout=60000`

## QEG Gate Package

- `qeg/gate-input.json`: sourceRefs、claims、自動証跡、manual-bb 参照を集約
- `qeg/gate-record.json`: `go`
- QEG native CLI health:
  - `npm run build`: pass
  - `node dist/cli.js validate fixtures/positive-release-go`: pass
  - `node dist/cli.js gate fixtures/positive-release-go`: go
  - `node dist/cli.js record fixtures/positive-release-go`: own-output validation pass

## Verdict

`go`

理由:

- 実装、ビルド、自動テスト、HATE real-repo、code-to-gate は pass。
- 手動 BB は TC-AFFECT-001..003 を Playwright system-chrome で実行し pass。
- P0/P1 blocker と critical unresolved assumption は残っていない。

## Next Commands

```powershell
npm test -- --run
npm run build
npx playwright test -c playwright.manual-bb.config.ts e2e/affect-insight.manual.spec.ts
node C:\Users\ryo-n\Codex_dev\code-to-gate\dist\cli.js analyze C:\Users\ryo-n\Codex_dev\LyricLytic --emit all --out C:\Users\ryo-n\Codex_dev\LyricLytic\.five-tool-validation\affect-insight-v2\code-to-gate --ignore node_modules,dist,coverage,.git,.five-tool-validation,src-tauri/target
uv run python -m hate real-repo run --roster C:\Users\ryo-n\Codex_dev\LyricLytic\.five-tool-validation\affect-insight-v2\hate\real-repo-roster.json --out C:\Users\ryo-n\Codex_dev\LyricLytic\.five-tool-validation\affect-insight-v2\hate\real-repo --source-version lyric-affect-insight-v2
```
