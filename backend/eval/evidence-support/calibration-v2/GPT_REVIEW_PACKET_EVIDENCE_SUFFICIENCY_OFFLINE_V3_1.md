# GPT Review Packet — Evidence Sufficiency Offline V3.1 Closure

- GPT_REVIEW_STATUS: **PENDING_REVIEW**
- EVAL_COMPLETE: **NO**
- Scope: offline negative-control contract closure only; no production architecture change.

## NEG-SUBJECT-001

- Source: 认证主体：ENTITY_B / 名称：ISO/IEC 27001 / 状态：active / 有效至：2027-11-30
- Requirement subject: **ENTITY_A**
- Evidence subject: **ENTITY_B**
- subject_match: **mismatch**
- entity_match: **unknown**
- support_level: **insufficient**
- support_sufficiency: **mismatch**
- reason_codes: SUBJECT_MISMATCH, SUPPORT_INSUFFICIENT
- aggregate: **INSUFFICIENT_EVIDENCE**
- root cause: **FIXTURE_ONLY**
- semantic ownership: {"subject_match":"requirement-designated subject compared with the source-declared subject","entity_match":"independent entity/product identity dimension; not grounded by this fixture and therefore unknown"}

## NEG-CONFLICT-001

- A: 1.4秒 → match / full_support
- B: 2.1秒 → mismatch / insufficient; QUANTITATIVE_MISMATCH, SUPPORT_INSUFFICIENT
- Aggregate: **CONFLICTING_EVIDENCE**

## NEG-TECHNICAL-001

- PROVIDER_TIMEOUT → unavailable → ASSESSMENT_UNAVAILABLE

## Metrics and validation

```json
{
  "metrics": {
    "automated_required": {
      "correct": 25,
      "total": 25,
      "rate": 1
    },
    "automated_unresolved": {
      "correct": 6,
      "total": 6,
      "rate": 1
    },
    "gpt_reviewed_required": {
      "correct": 9,
      "total": 9,
      "rate": 1
    },
    "gpt_reviewed_unresolved": {
      "correct": 6,
      "total": 6,
      "rate": 1
    },
    "business_status": {
      "correct": 6,
      "total": 6,
      "rate": 1
    },
    "unsafe_false_supported": 0,
    "pending_field_count": 32
  },
  "side_effects": {
    "evidence_support_assessment": 0,
    "evidence_review": 0,
    "evidence": 0,
    "evidence_fact": 0,
    "mapping": 0,
    "claim": 0,
    "writer": 0,
    "readiness": 0
  },
  "external_calls": {
    "embedding": 0,
    "llm": 0,
    "dify": 0
  },
  "validation": {
    "offline_eval": "PASS",
    "targeted_sufficiency_tests": "PASS (4/4)",
    "full_regression": "PASS (backend 663/663, frontend 50/50)",
    "build": "PASS",
    "lint": "PASS",
    "diff_check": "PASS",
    "postgres": "BLOCKED_ENVIRONMENT (127.0.0.1:5432 unavailable; not required for this fixture closure)"
  }
}
```
