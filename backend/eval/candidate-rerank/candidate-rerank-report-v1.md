# Broad Recall + Deterministic Candidate Rerank Benchmark v1

## Architecture evaluated

`Original Requirement → Raw Vector candidate_k → deterministic rerank → review_k`.

No Role or Evidence Need removes a candidate before Raw retrieval. D0 is Raw order; D1 adds role prior, authority and deterministic field-density signals; D2 adds Requirement-specific Need/Role compatibility; D3 applies D2 plus per-Need buckets. No Gold identity, expected rank, Claim decision or LLM is used by scoring.

One authorized request embedded 526 inputs with Qwen/Qwen3-Embedding-0.6B, version 1, dimension 1024. Request hash `7625e41827b2194e31fa12a913f50e3013a17892f626d675377274c1c4b926e3`; latency 2192 ms. D0–D3 reuse the same vectors. No vectors or raw Provider response were persisted.

## L-tier broad candidate recall

| candidate_k | Any-Gold Recall | Gold Anchor Coverage |
|---:|---:|---:|
| 10 | 80.95% | 80% |
| 20 | 90.48% | 92% |
| 30 | 90.48% | 92% |
| 50 | 90.48% | 92% |

Candidate recall saturates at 20; 30/50 add cost without recovering another Gold anchor. Recommended `candidate_k=20`.

## L-tier, candidate_k=20, review_k=5

| Mode | Final Recall | Best Anchor | MRR | Wrong-role | Need Coverage | Multi-Need | Gold Retention | False Exclusion | Candidate Precision |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| D0 Raw | 76.19% | 71.43% | 0.6429 | 54.62% | 68% | 50% | 73.91% | 26.09% | 32.31% |
| D1 Role | 80.95% | 80.95% | 0.6548 | 48.46% | 80% | 83.33% | 86.96% | 13.04% | 42.31% |
| D2 Role+Need | 85.71% | 85.71% | 0.7262 | 27.69% | 84% | 83.33% | 91.30% | 8.70% | 29.23% |
| D3 bucket p1 | 85.71% | 85.71% | 0.7500 | 27.69% | 84% | 83.33% | 91.30% | 8.70% | 29.23% |
| D3 bucket p2 | 85.71% | 85.71% | 0.7540 | 27.69% | 84% | 83.33% | 91.30% | 8.70% | 29.23% |

At review_k=5, D2/D3 improve Final Recall by 9.52 points, MRR, Need Coverage and wrong-role purity, but retain only 91.3% of Gold already present in the broad pool. That is not a sufficiently safe review width.

## L-tier, candidate_k=20, review_k=8

| Mode | Final Recall | Best Anchor | MRR | Wrong-role | Need Coverage | Multi-Need | Gold Retention | False Exclusion | Candidate Precision |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| D0 Raw | 80.95% | 76.19% | 0.6508 | 61.54% | 76% | 66.67% | 82.61% | 17.39% | 24.04% |
| D1 Role | 85.71% | 85.71% | 0.6627 | 55.77% | 88% | 100% | 95.65% | 4.35% | 31.25% |
| D2 Role+Need | 90.48% | 90.48% | 0.7341 | 42.31% | 92% | 100% | 100% | 0% | 25.00% |
| D3 bucket p1 | 90.48% | 90.48% | 0.7579 | 42.31% | 92% | 100% | 100% | 0% | 25.00% |
| D3 bucket p2 | 90.48% | 90.48% | 0.7619 | 42.31% | 92% | 100% | 100% | 0% | 25.00% |

With review_k=8, D2/D3 preserve every Gold candidate present in candidate_k=20, match Broad Recall, reduce wrong-role rate by 19.23 points versus D0, and raise Multi-Need Coverage from 66.67% to 100%. Recommended `review_k=8`.

## Need bucket diagnosis

D3 improves MRR slightly but does not improve Final Recall, Need Coverage, Multi-Need Coverage, Gold Retention or Candidate Precision over D2 at the recommended configuration. `per_need_k=2` also offers no coverage benefit over 1. Therefore Need Bucketing is not independently proven useful. If retained for future diagnostics, use `per_need_k=1`; do not add it to Production Design yet.

## S/M regression reference

The complete JSON includes every S/M/L × candidate_k × review_k × strategy combination. No scale noise or hard negative was removed. The design decision is based on L=500.

## Recommendation

- Broad Vector Recall Layer: candidate_k=20. Raising to 30/50 does not improve Gold recall.
- Deterministic Candidate Rerank: D2 is useful; retain every Raw candidate and rerank only after broad retrieval.
- Human Review width: review_k=8. review_k=5 has 8.7% Gold loss after rerank.
- Need Bucketing: not proven beyond D2; do not include in initial Production Design.
- This result supports **READY_FOR_DESIGN**, not implementation or deployment. Production contracts, observability, data policy, fallback and a Real Public/Customer-safe validation set remain prerequisites.
