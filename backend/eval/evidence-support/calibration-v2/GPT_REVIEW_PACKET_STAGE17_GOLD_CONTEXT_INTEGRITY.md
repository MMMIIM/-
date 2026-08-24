# GPT REVIEW PACKET — STAGE17 GOLD CONTEXT INTEGRITY

- Source live packet: `GPT_REVIEW_PACKET_STAGE17_FINAL_LIVE_6.json`
- Immutable live evidence commit: `6e074cd`
- Audit base: `df33809`
- Dataset: `SAFE_SYNTHETIC_EVAL`
- `GPT_REVIEW_STATUS`: `PENDING_REVIEW`
- `EVAL_COMPLETE`: `NO`
- External calls in this audit: Embedding 0 / LLM 0 / Dify 0

## V2R001 candidate-level proof

### Business Gold chunk

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
| Chunk role | `BUSINESS_CONTENT` |
| Gold set type | `GOLD_EVIDENCE_SET` |
| Gold role | `DECISION_BEARING_BUSINESS_EVIDENCE` |
| Raw vector rank | 4 |
| Final evidence candidate rank | 2 |
| Requirement-relative classification | `EVIDENCE_BEARING` |
| Decision-bearing | YES |
| Source eligibility | `ELIGIBLE` |
| Source hash | `5a54f61d10c64f26414f8dcfb93f3c1eb25076f1063d97f8200f42cad981843c` |

### Performance-report heading

```text
# 数据交换平台性能测试记录
```

| Field | Value |
|---|---|
| Chunk ID | `MCH-B4FF02295DBB6DCDF6E2763F057076F6` |
| Chunk role | `HEADING` |
| Gold set type | `GOLD_CONTEXT_SET` |
| Gold role | `CONTEXT_ONLY_HEADING` |
| Raw vector rank | 1 |
| Final evidence candidate rank | NOT_IN_FINAL_EVIDENCE_LANE |
| Requirement-relative classification | `METADATA_OR_HEADER` |
| Decision-bearing | NO |
| Source hash | `b39d0175f9ba8fd41b225f5b6d7b28dc51d850f4b5e80fe6159ae1af3e4ea189` |

The heading is context for recovery and audit only. It does not contribute to Exact Gold Hit@K, Exact Gold MRR, Decision-Bearing Hit@K or Decision-Bearing MRR.

## Correct raw diagnostics

- `V2R001_EXACT_GOLD_RAW_RANK = 4`
- `V2R001_FIRST_DECISION_BEARING_RAW_RANK = 4`
- `FIRST_DECISION_BEARING_RAW_RANK <= EXACT_GOLD_RAW_RANK`: PASS

The prior `Gold raw rank = 1` was the minimum rank across a contaminated list containing the heading. It was not the rank of the frozen business Gold chunk.

## Final formal metrics

Final metrics use only `FINAL_EVIDENCE_CANDIDATE_RANK`:

- Decision Hit@1/3/5: `83.33% / 100% / 100%`
- Decision MRR: `0.9167`
- Exact Hit@1/3/5: `50% / 100% / 100%`
- Exact MRR: `0.75`
- V2R001 final Decision rank: `2`

## Root cause

Precise classification:

- `GOLD_CONTEXT_CONTAMINATION`
- `GOLD_EVIDENCE_BINDING_ERROR`

The immutable packet bound a heading and business evidence to one Gold Evidence list. This is a Gold/eval serialization defect. The production scorer’s final-lane metrics remain correct after excluding context.

Not classified as a Retrieval quality failure, and no Gold was redefined to improve metrics.

## Regression invariants

- Heading in Gold Context Set → does not count Exact Gold Hit: PASS
- Gold Evidence raw rank 4 + Heading Context raw rank 1 → Exact Gold raw rank 4: PASS
- Decision-bearing Gold raw rank 4 → first Decision raw rank ≤4: PASS
- Final Gold rank 2 → Exact Hit@3: PASS
- Final Decision rank 2 → Decision Hit@3: PASS

Targeted test: 4/4 passed (`retrieval-gold-context-integrity.test.js`).

## Safety and stage

- Retrieval changed: NO
- Embedding: 0
- LLM: 0
- Dify: 0
- Original live packet overwritten: NO
- P1-INDEX-HYGIENE-001: OPEN
- P1-REFERENCE-METADATA-HYGIENE: OPEN
- Stage17: `REOPENED_FOR_P0_FIX + METRIC_REBASE_REQUIRED + PENDING_GPT_REVIEW`
