# v1.2.0 release evidence

Store only release evidence here:

- `installer-sha256.txt`: Windows MSI/NSIS filename, SHA-256, size, UTC creation time.
- `windows-offline-qa.md`: W01–W10 Pass/Fail, tester, device and date.
- `screenshots/`: screenshots referenced by the QA record.
- `logs/`: redacted application logs.

Do not store personal lyrics, production databases, credentials, or unredacted logs. The CI workflow uploads generated bundles, Playwright diagnostics, and cargo-audit JSON separately.
