# code-to-gate Analysis Report

**Generated**: 2026-07-02T21:47:21.408Z
**Run ID**: ctg-202607022147-local
Repository: .
**Tool**: code-to-gate v1.5.0

---

## Summary

### Raw Findings (All Detections)

| Metric | Count |
|--------|-------|
| Total Raw Findings | 16 |
| Critical | 0 |
| High | 3 |
| Medium | 13 |
| Low | 0 |

### Effective Findings (After Suppression)

| Metric | Count |
|--------|-------|
| Effective Findings | 16 |
| Critical | 0 |
| High | 3 |
| Medium | 13 |
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
| Code health and maintainability | 13 | 1 | scripts/enrich-suno-important-sections.mjs, scripts/enrich-suno-prompt-catalog.mjs, src/components/LLMAssistPanel.tsx |
| API boundary | 2 | 1 | src/lib/api/client.ts, src/lib/api.ts |
| Data access or persistence | 1 | 1 | src/lib/useProjectData.ts |

## High-Priority Risks

| Risk ID | Title | Severity | Likelihood | Source Findings |
|---------|-------|----------|------------|-----------------|
| risk-RAW_SQL-002 | Raw SQL query detected - potential SQL injection vulnerability | **HIGH** | medium | finding-RAW_SQL-002 |
| risk-LARGE_MODULE-012 | Module exceeds line count threshold (1054 lines) | **HIGH** | medium | finding-LARGE_MODULE-012 |
| risk-CIRCULAR_DEPENDENCY-015 | Circular dependency detected (2 files in cycle) | **HIGH** | medium | finding-CIRCULAR_DEPENDENCY-015 |

## All Findings

| ID | Rule | Category | Domain | Severity | Title | Evidence | Review Flags | LLM |
|----|------|----------|--------|----------|-------|----------|--------------|-----|
| finding-TRY_CATCH_SWALLOW-000 | TRY_CATCH_SWALLOW | maintainability | Code health and maintainability | *MEDIUM* | Catch block returns null without logging | scripts/enrich-suno-important-sections.mjs | evidence-linked | not-used |
| finding-TRY_CATCH_SWALLOW-001 | TRY_CATCH_SWALLOW | maintainability | Code health and maintainability | *MEDIUM* | Catch block returns null without logging | scripts/enrich-suno-prompt-catalog.mjs | evidence-linked | not-used |
| finding-RAW_SQL-002 | RAW_SQL | data | Data access or persistence | **HIGH** | Raw SQL query detected - potential SQL injection vulnerability | src/lib/useProjectData.ts | evidence-linked | not-used |
| finding-LARGE_MODULE-003 | LARGE_MODULE | maintainability | Code health and maintainability | *MEDIUM* | Module has too many functions (25) | scripts/enrich-suno-important-sections.mjs | evidence-linked | not-used |
| finding-LARGE_MODULE-004 | LARGE_MODULE | maintainability | Code health and maintainability | *MEDIUM* | Module has too many functions (29) | scripts/enrich-suno-prompt-catalog.mjs | evidence-linked | not-used |
| finding-LARGE_MODULE-005 | LARGE_MODULE | maintainability | Code health and maintainability | *MEDIUM* | Module exceeds line count threshold (614 lines) | src/components/LLMAssistPanel.tsx | evidence-linked | not-used |
| finding-LARGE_MODULE-006 | LARGE_MODULE | maintainability | Code health and maintainability | *MEDIUM* | Module exceeds line count threshold (565 lines) | src/components/LLMReviewPanel.tsx | evidence-linked | not-used |
| finding-LARGE_MODULE-007 | LARGE_MODULE | maintainability | Code health and maintainability | *MEDIUM* | Module exceeds line count threshold (555 lines) | src/components/LLMSettingsPanel.tsx | evidence-linked | not-used |
| finding-LARGE_MODULE-008 | LARGE_MODULE | maintainability | API boundary | *MEDIUM* | Module has too many functions (47) | src/lib/api/client.ts | evidence-linked | not-used |
| finding-LARGE_MODULE-009 | LARGE_MODULE | maintainability | Code health and maintainability | *MEDIUM* | Module has too many functions (35) | src/lib/llm/sunoPromptCatalog.ts | evidence-linked | not-used |
| finding-LARGE_MODULE-010 | LARGE_MODULE | maintainability | Code health and maintainability | *MEDIUM* | Module has too many functions (30) | src/lib/llm/utils.ts | evidence-linked | not-used |
| finding-LARGE_MODULE-011 | LARGE_MODULE | maintainability | Code health and maintainability | *MEDIUM* | Module has too many functions (39) | src/lib/rhyme/analysis.ts | evidence-linked | not-used |
| finding-LARGE_MODULE-012 | LARGE_MODULE | maintainability | Code health and maintainability | **HIGH** | Module exceeds line count threshold (1054 lines) | src/pages/Editor.tsx | evidence-linked | not-used |
| finding-LARGE_MODULE-013 | LARGE_MODULE | maintainability | Code health and maintainability | *MEDIUM* | Module has too many functions (24) | src/pages/Home.tsx | evidence-linked | not-used |
| finding-LARGE_MODULE-014 | LARGE_MODULE | maintainability | Code health and maintainability | *MEDIUM* | Module has too many functions (22) | src-tauri/src/commands/llm_runtime.rs | evidence-linked | not-used |
| finding-CIRCULAR_DEPENDENCY-015 | CIRCULAR_DEPENDENCY | maintainability | API boundary | **HIGH** | Circular dependency detected (2 files in cycle) | src/lib/api.ts | evidence-linked | not-used |

## False-Positive Review

| Finding | Checkpoint |
|---------|------------|
| finding-TRY_CATCH_SWALLOW-000 | domain=Code health and maintainability; evidence=scripts/enrich-suno-important-sections.mjs; confidence=0.85; flags=evidence-linked |
| finding-TRY_CATCH_SWALLOW-001 | domain=Code health and maintainability; evidence=scripts/enrich-suno-prompt-catalog.mjs; confidence=0.85; flags=evidence-linked |
| finding-RAW_SQL-002 | domain=Data access or persistence; evidence=src/lib/useProjectData.ts; confidence=0.85; flags=evidence-linked |
| finding-LARGE_MODULE-003 | domain=Code health and maintainability; evidence=scripts/enrich-suno-important-sections.mjs; confidence=0.85; flags=evidence-linked |
| finding-LARGE_MODULE-004 | domain=Code health and maintainability; evidence=scripts/enrich-suno-prompt-catalog.mjs; confidence=0.85; flags=evidence-linked |
| finding-LARGE_MODULE-005 | domain=Code health and maintainability; evidence=src/components/LLMAssistPanel.tsx; confidence=0.90; flags=evidence-linked |
| finding-LARGE_MODULE-006 | domain=Code health and maintainability; evidence=src/components/LLMReviewPanel.tsx; confidence=0.90; flags=evidence-linked |
| finding-LARGE_MODULE-007 | domain=Code health and maintainability; evidence=src/components/LLMSettingsPanel.tsx; confidence=0.90; flags=evidence-linked |
| finding-LARGE_MODULE-008 | domain=API boundary; evidence=src/lib/api/client.ts; confidence=0.85; flags=evidence-linked |
| finding-LARGE_MODULE-009 | domain=Code health and maintainability; evidence=src/lib/llm/sunoPromptCatalog.ts; confidence=0.85; flags=evidence-linked |
| finding-LARGE_MODULE-010 | domain=Code health and maintainability; evidence=src/lib/llm/utils.ts; confidence=0.85; flags=evidence-linked |
| finding-LARGE_MODULE-011 | domain=Code health and maintainability; evidence=src/lib/rhyme/analysis.ts; confidence=0.85; flags=evidence-linked |
| finding-LARGE_MODULE-012 | domain=Code health and maintainability; evidence=src/pages/Editor.tsx; confidence=0.90; flags=evidence-linked |
| finding-LARGE_MODULE-013 | domain=Code health and maintainability; evidence=src/pages/Home.tsx; confidence=0.85; flags=evidence-linked |
| finding-LARGE_MODULE-014 | domain=Code health and maintainability; evidence=src-tauri/src/commands/llm_runtime.rs; confidence=0.85; flags=evidence-linked |
| finding-CIRCULAR_DEPENDENCY-015 | domain=API boundary; evidence=src/lib/api.ts; confidence=0.95; flags=evidence-linked |

## Risk Narratives

### risk-RAW_SQL-002: Raw SQL query detected - potential SQL injection vulnerability

**Severity**: **HIGH**
**Likelihood**: medium
**Confidence**: 0.85

**Impact**:
- A raw SQL query is constructed using string concatenation or template literals, which can allow SQL injection if user input is incorporated. Use parameterized queries, prepared statements, or an ORM instead.

**Recommended Actions**:
- Address finding finding-RAW_SQL-002: RAW_SQL

---

### risk-LARGE_MODULE-012: Module exceeds line count threshold (1054 lines)

**Severity**: **HIGH**
**Likelihood**: medium
**Confidence**: 0.90

**Impact**:
- This file has 1054 lines, exceeding the 500 line threshold. Large files are hard to maintain, test, and understand. Consider splitting into smaller, focused modules.

**Recommended Actions**:
- Address finding finding-LARGE_MODULE-012: LARGE_MODULE

---

### risk-CIRCULAR_DEPENDENCY-015: Circular dependency detected (2 files in cycle)

**Severity**: **HIGH**
**Likelihood**: medium
**Confidence**: 0.95

**Impact**:
- Import cycle: src/lib/api.ts → src/lib/useProjectData.ts → src/lib/api.ts. Circular dependencies can cause "Cannot access before initialization" errors and make the code harder to maintain.

**Recommended Actions**:
- Address finding finding-CIRCULAR_DEPENDENCY-015: CIRCULAR_DEPENDENCY

---

## Recommended Actions Summary

### Priority Order

1. **[HIGH]** Address finding finding-RAW_SQL-002: RAW_SQL
2. **[HIGH]** Address finding finding-LARGE_MODULE-012: LARGE_MODULE
3. **[HIGH]** Address finding finding-CIRCULAR_DEPENDENCY-015: CIRCULAR_DEPENDENCY

---

*This report was generated by code-to-gate. Findings are based on static analysis of the repository.*

