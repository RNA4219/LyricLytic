# code-to-gate Analysis Report

**Generated**: 2026-07-02T21:55:06.399Z
**Run ID**: ctg-202607022155-local
Repository: .
**Tool**: code-to-gate v1.5.0

---

## Summary

### Raw Findings (All Detections)

| Metric | Count |
|--------|-------|
| Total Raw Findings | 15 |
| Critical | 0 |
| High | 0 |
| Medium | 15 |
| Low | 0 |

### Effective Findings (After Suppression)

| Metric | Count |
|--------|-------|
| Effective Findings | 15 |
| Critical | 0 |
| High | 0 |
| Medium | 15 |
| Low | 0 |

### Accepted Exceptions (Suppressed)

| Metric | Count |
|--------|-------|
| Suppressed Findings | 0 |
| Critical | 0 |
| High | 0 |
| Medium | 0 |
| Low | 0 |

#### Exception Classification Breakdown

| Class | Count | Description |
|-------|-------|-------------|
| self-reference | 0 | Rule implementation files |
| fixture-intentional | 0 | Test fixtures |
| generated-artifact | 0 | Compiled output |
| accepted-design | 0 | Architecture decisions |
| temporary-debt | 0 | Needs repayment |

### Known Debt

| Debt Type | Count | Critical | High | Medium | Low |
|-----------|-------|----------|------|--------|-----|
| Suppression Debt | 0 | 0 | 0 | 0 | 0 |
| Explicit Debt Markers | 0 | 0 | 0 | 0 | 0 |

## Domain Context

| Domain | Findings | High/Critical | Evidence Paths |
|--------|----------|---------------|----------------|
| Code health and maintainability | 14 | 0 | scripts/enrich-suno-important-sections.mjs, scripts/enrich-suno-prompt-catalog.mjs, src/components/LLMAssistPanel.tsx |
| API boundary | 1 | 0 | src/lib/api/client.ts |

## All Findings

| ID | Rule | Category | Domain | Severity | Title | Evidence | Review Flags | LLM |
|----|------|----------|--------|----------|-------|----------|--------------|-----|
| finding-TRY_CATCH_SWALLOW-000 | TRY_CATCH_SWALLOW | maintainability | Code health and maintainability | *MEDIUM* | Catch block returns null without logging | scripts/enrich-suno-important-sections.mjs | evidence-linked | not-used |
| finding-TRY_CATCH_SWALLOW-001 | TRY_CATCH_SWALLOW | maintainability | Code health and maintainability | *MEDIUM* | Catch block returns null without logging | scripts/enrich-suno-prompt-catalog.mjs | evidence-linked | not-used |
| finding-LARGE_MODULE-002 | LARGE_MODULE | maintainability | Code health and maintainability | *MEDIUM* | Module has too many functions (25) | scripts/enrich-suno-important-sections.mjs | evidence-linked | not-used |
| finding-LARGE_MODULE-003 | LARGE_MODULE | maintainability | Code health and maintainability | *MEDIUM* | Module has too many functions (29) | scripts/enrich-suno-prompt-catalog.mjs | evidence-linked | not-used |
| finding-LARGE_MODULE-004 | LARGE_MODULE | maintainability | Code health and maintainability | *MEDIUM* | Module exceeds line count threshold (614 lines) | src/components/LLMAssistPanel.tsx | evidence-linked | not-used |
| finding-LARGE_MODULE-005 | LARGE_MODULE | maintainability | Code health and maintainability | *MEDIUM* | Module exceeds line count threshold (565 lines) | src/components/LLMReviewPanel.tsx | evidence-linked | not-used |
| finding-LARGE_MODULE-006 | LARGE_MODULE | maintainability | Code health and maintainability | *MEDIUM* | Module exceeds line count threshold (555 lines) | src/components/LLMSettingsPanel.tsx | evidence-linked | not-used |
| finding-LARGE_MODULE-007 | LARGE_MODULE | maintainability | API boundary | *MEDIUM* | Module has too many functions (47) | src/lib/api/client.ts | evidence-linked | not-used |
| finding-LARGE_MODULE-008 | LARGE_MODULE | maintainability | Code health and maintainability | *MEDIUM* | Module has too many functions (35) | src/lib/llm/sunoPromptCatalog.ts | evidence-linked | not-used |
| finding-LARGE_MODULE-009 | LARGE_MODULE | maintainability | Code health and maintainability | *MEDIUM* | Module has too many functions (30) | src/lib/llm/utils.ts | evidence-linked | not-used |
| finding-LARGE_MODULE-010 | LARGE_MODULE | maintainability | Code health and maintainability | *MEDIUM* | Module has too many functions (39) | src/lib/rhyme/analysis.ts | evidence-linked | not-used |
| finding-LARGE_MODULE-011 | LARGE_MODULE | maintainability | Code health and maintainability | *MEDIUM* | Module exceeds line count threshold (966 lines) | src/pages/Editor.tsx | evidence-linked | not-used |
| finding-LARGE_MODULE-012 | LARGE_MODULE | maintainability | Code health and maintainability | *MEDIUM* | Module has too many functions (24) | src/pages/Home.tsx | evidence-linked | not-used |
| finding-LARGE_MODULE-013 | LARGE_MODULE | maintainability | Code health and maintainability | *MEDIUM* | Module has too many functions (22) | src-tauri/src/commands/llm_runtime.rs | evidence-linked | not-used |
| finding-DEPRECATED_API_USAGE-014 | DEPRECATED_API_USAGE | maintainability | Code health and maintainability | *MEDIUM* | Deprecated API: window.confirm | src/lib/useProjectData.ts | evidence-linked | not-used |

## False-Positive Review

| Finding | Checkpoint |
|---------|------------|
| finding-TRY_CATCH_SWALLOW-000 | domain=Code health and maintainability; evidence=scripts/enrich-suno-important-sections.mjs; confidence=0.85; flags=evidence-linked |
| finding-TRY_CATCH_SWALLOW-001 | domain=Code health and maintainability; evidence=scripts/enrich-suno-prompt-catalog.mjs; confidence=0.85; flags=evidence-linked |
| finding-LARGE_MODULE-002 | domain=Code health and maintainability; evidence=scripts/enrich-suno-important-sections.mjs; confidence=0.85; flags=evidence-linked |
| finding-LARGE_MODULE-003 | domain=Code health and maintainability; evidence=scripts/enrich-suno-prompt-catalog.mjs; confidence=0.85; flags=evidence-linked |
| finding-LARGE_MODULE-004 | domain=Code health and maintainability; evidence=src/components/LLMAssistPanel.tsx; confidence=0.90; flags=evidence-linked |
| finding-LARGE_MODULE-005 | domain=Code health and maintainability; evidence=src/components/LLMReviewPanel.tsx; confidence=0.90; flags=evidence-linked |
| finding-LARGE_MODULE-006 | domain=Code health and maintainability; evidence=src/components/LLMSettingsPanel.tsx; confidence=0.90; flags=evidence-linked |
| finding-LARGE_MODULE-007 | domain=API boundary; evidence=src/lib/api/client.ts; confidence=0.85; flags=evidence-linked |
| finding-LARGE_MODULE-008 | domain=Code health and maintainability; evidence=src/lib/llm/sunoPromptCatalog.ts; confidence=0.85; flags=evidence-linked |
| finding-LARGE_MODULE-009 | domain=Code health and maintainability; evidence=src/lib/llm/utils.ts; confidence=0.85; flags=evidence-linked |
| finding-LARGE_MODULE-010 | domain=Code health and maintainability; evidence=src/lib/rhyme/analysis.ts; confidence=0.85; flags=evidence-linked |
| finding-LARGE_MODULE-011 | domain=Code health and maintainability; evidence=src/pages/Editor.tsx; confidence=0.90; flags=evidence-linked |
| finding-LARGE_MODULE-012 | domain=Code health and maintainability; evidence=src/pages/Home.tsx; confidence=0.85; flags=evidence-linked |
| finding-LARGE_MODULE-013 | domain=Code health and maintainability; evidence=src-tauri/src/commands/llm_runtime.rs; confidence=0.85; flags=evidence-linked |
| finding-DEPRECATED_API_USAGE-014 | domain=Code health and maintainability; evidence=src/lib/useProjectData.ts; confidence=0.90; flags=evidence-linked |

## Recommended Actions Summary

---

*This report was generated by code-to-gate. Findings are based on static analysis of the repository.*

