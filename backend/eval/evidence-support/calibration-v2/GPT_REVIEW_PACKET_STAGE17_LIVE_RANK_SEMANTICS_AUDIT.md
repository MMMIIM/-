# GPT REVIEW PACKET — STAGE17 LIVE RANK SEMANTICS AUDIT

- Source live packet: `GPT_REVIEW_PACKET_STAGE17_FINAL_LIVE_6.json`
- Immutable live evidence commit: `6e074cd`
- Dataset: `SAFE_SYNTHETIC_EVAL`
- `GPT_REVIEW_STATUS`: `PENDING_REVIEW`
- `EVAL_COMPLETE`: `NO`
- This audit made zero Embedding, LLM or Dify calls.

## Conclusion

The contradiction is an eval/report labeling defect, not proven Retrieval quality failure.

`V2R-001` has:

- Gold raw-vector rank: **1** because the frozen Gold Evidence Set includes the heading chunk.
- Decision-bearing performance chunk raw-vector rank: **4**.
- Decision-bearing performance chunk final evidence rank: **2**.
- Final Decision Hit@3: **1**.

The original generic `first_decision_rank=4` was a raw diagnostic rank, while Hit@K/MRR were calculated from the formal final lane. The missing rank-space qualifier caused the apparent contradiction.

## Canonical rank taxonomy

| Rank space | Definition |
|---|---|
| `RAW_VECTOR_RANK` | `raw_candidate_pool[].raw_rank`; diagnostic vector order only |
| `POST_STRUCTURAL_RANK` | Audit ordinal after explicit heading/metadata/front-matter context exclusion |
| `POST_SUBSTANTIVE_RANK` | Audit ordinal among `substantive_candidate=true` candidates |
| `POST_SOURCE_ELIGIBILITY_RANK` | Audit ordinal among substantive, source-eligible candidates |
| `REQUIREMENT_RELATIVE_LANE` | Requirement-relative classification annotation; does not redefine raw order |
| `FINAL_EVIDENCE_CANDIDATE_RANK` | `final_candidates[].final_phase_rank`; formal acceptance lane |

The live packet did not persist independent post-stage rank fields. The three post-stage values in the JSON packet are deterministic audit reconstructions from captured fields, not production fields.

## V2R-001 forensic trace

Frozen Gold Evidence Set:

- `MCH-B4FF02295DBB6DCDF6E2763F057076F6` — `HEADING`, source hash `b39d0175f9ba8fd41b225f5b6d7b28dc51d850f4b5e80fe6159ae1af3e4ea189`
- `MCH-0FBD3599DAF932016F62EB9634B997AF` — `BUSINESS_CONTENT`, source hash `5a54f61d10c64f26414f8dcfb93f3c1eb25076f1063d97f8200f42cad981843c`

Frozen decision-bearing Gold chunk:

```text
产品：澄明数据交换平台 V3.2
环境：8 vCPU、32 GB 内存、PostgreSQL 14、千兆局域网
条件：50 并发、100 万条基准数据、缓存预热后执行 30 分钟
指标：数据目录查询平均响应时间
结果：平均 1.4 秒，P95 1.9 秒。
日期：2025-05-16。
```

| Field | Value |
|---|---|
| Chunk ID | `MCH-0FBD3599DAF932016F62EB9634B997AF` |
| `RAW_VECTOR_RANK` | 4 |
| Chunk role | `BUSINESS_CONTENT` |
| Candidate eligibility | `EVIDENCE_ELIGIBLE` |
| Substantive | `true / SUBSTANTIVE_CANDIDATE` |
| Source eligibility | `ELIGIBLE / ORIGINAL_TECHNICAL_FACT` |
| Requirement-relative classification | `EVIDENCE_BEARING` |
| Decision-bearing | `true` |
| `POST_STRUCTURAL_RANK` | 2 |
| `POST_SUBSTANTIVE_RANK` | 4 |
| `POST_SOURCE_ELIGIBILITY_RANK` | 4 |
| `FINAL_EVIDENCE_CANDIDATE_RANK` | 2 |

Therefore:

- `FIRST_DECISION_BEARING_RAW_RANK = 4`
- `FIRST_DECISION_BEARING_FINAL_RANK = 2`

Gold identity and Decision-Bearing expectation both remain unchanged and pass integrity checks.

## All six cases — recomputed canonical ranks

`old_reported_first_decision_rank` is `NOT_REPORTED` where the original packet did not expose a per-case value.

| Case | Old Gold raw | Gold raw | Gold final | Decision raw | Decision final | Final count | Gold outside raw | Ineligible before Gold |
|---|---:|---:|---:|---:|---:|---:|---|---:|
| V2R-001-PERF-DIRECT | 1 | 1 | 2 | 4 | 2 | 4 | NO | 0 |
| V2R-002-PERF-PARTIAL | 1 | 1 | 1 | 1 | 1 | 3 | NO | 0 |
| V2R-003-COMP-DIRECT | 1 | 1 | 1 | 1 | 1 | 2 | NO | 0 |
| V2R-004-COMP-PARTIAL | 1 | 1 | 1 | 1 | 1 | 4 | NO | 0 |
| V2R-005-ISO-DIRECT | 2 | 2 | 2 | 1 | 1 | 3 | NO | 0 |
| V2R-006-ISO-SCOPE | 2 | 2 | 2 | 1 | 1 | 3 | NO | 0 |

## Canonical metric semantics

```text
Exact Gold Hit@K
= exact Gold Evidence candidate appears within FINAL_EVIDENCE_CANDIDATE_RANK <= K

Decision-Bearing Hit@K
= Decision-Bearing candidate appears within FINAL_EVIDENCE_CANDIDATE_RANK <= K

MRR
= mean(1 / first rank) within the same final rank space

RAW_VECTOR_RANK is diagnostic only and is never used for final Hit@K acceptance.
```

Corrected final-lane metrics:

- Decision-Bearing Hit@1/3/5: `83.33% / 100% / 100%`
- Decision-Bearing MRR: `0.9167`
- Exact Gold Hit@1/3/5: `50% / 100% / 100%`
- Exact Gold MRR: `0.75`

Metric invariants:

- Gold Decision-Bearing first rank ≤ Gold rank in the same rank space: PASS.
- Decision final rank > K implies Decision Hit@K = 0: PASS.
- `V2R001_FINAL_DECISION_RANK = 2`: acceptance criterion `<=2` PASS.

## Root cause classification

- Root cause: `MIXED_RANK_SPACES`
- Scorer bug: NO
- Aggregation bug: NO
- Report-label bug: YES
- Metric serialization/qualification bug: YES
- Production Retrieval defect proven: NO

No `EnterpriseRetrievalService`, `EmbeddingClient`, vector query, source gate, MMR, ranking or production contract was changed.

## Stage and safety

- P1-INDEX-HYGIENE-001: OPEN
- P1-REFERENCE-METADATA-HYGIENE: OPEN
- Index hygiene escalation: NO
- Embedding calls in this audit: 0
- LLM calls: 0
- Dify calls: 0
- Original six-call packet overwritten: NO
- Gold redefined: NO
- Stage17: `REOPENED_FOR_P0_FIX + METRIC_REBASE_REQUIRED + PENDING_GPT_REVIEW`
- `EVAL_COMPLETE`: `NO`
