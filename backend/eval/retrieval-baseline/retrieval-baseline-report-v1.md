# Retrieval Baseline Report v1

## Dataset and isolation

- Representative SME: 20 materials and 60 deterministic `enterprise-material-v1` chunks.
- Inventory: 18 evidence-capable anchors and 42 retained negative chunks.
- Query set: 26 approved Gold queries: 10 retained real Requirements plus 16 post-freeze SME probes.
- Multi-evidence probes: 2.
- Real Public: four Neusoft materials remain a separate qualitative dataset.
- Cross-subject stress: isolated and excluded from the percentages below.
- Synthetic fixtures: excluded.

All 101 inputs used the same authorized Qwen/Qwen3-Embedding-0.6B model, version 1, dimension 1024. A/B/C reuse the same returned vectors. Vectors and Provider raw response were not persisted. The successful call occurred before audit timing/hash instrumentation, so those two values are explicitly unavailable; no second external send was made.

## Metrics

| Baseline / K | Capable Recall | Best Anchor | MRR | Wrong-role Rate | Need Coverage | No-sufficient behavior |
|---|---:|---:|---:|---:|---:|---:|
| A / 3 | 85.71% | 80.95% | 0.7381 | 39.74% | 76% | 40% |
| A / 5 | 90.48% | 90.48% | 0.7595 | 51.54% | 88% | 20% |
| A / 10 | 100% | 100% | 0.7701 | 63.46% | 100% | 0% |
| A / 20 | 100% | 100% | 0.7701 | 77.88% | 100% | 0% |
| B / 3 | 61.90% | 57.14% | 0.3492 | 44.87% | 56% | 40% |
| B / 5 | 66.67% | 61.90% | 0.3587 | 53.85% | 60% | 40% |
| B / 10 | 80.95% | 80.95% | 0.3809 | 67.31% | 80% | 40% |
| B / 20 | 80.95% | 80.95% | 0.3809 | 80.19% | 84% | 40% |
| C / 3 | 61.90% | 57.14% | 0.3492 | 8.97% | 56% | 0% |
| C / 5 | 100% | 95.24% | 0.4397 | 20.77% | 88% | 0% |
| C / 10 | 100% | 100% | 0.4450 | 49.23% | 96% | 0% |
| C / 20 | 100% | 100% | 0.4450 | 73.08% | 100% | 0% |

At K=5, A→B reduces capable recall by 23.81 points and need coverage by 28 points: Evidence Need query alone is not useful. B→C improves capable recall by 33.33 points, best-anchor recall by 33.34 points, need coverage by 28 points, and reduces wrong-role rate by 33.08 points. A→C improves capable recall by 9.52 points and reduces wrong-role rate by 30.77 points while retaining 88% need coverage. C filters the pool from 60 to 23–37 candidates (mean 26.38).

## Error classification

- `CORPUS_GAP`: 3 Gold probes: cloud capability, Project B acceptance and broad city-grid capability.
- `RETRIEVAL_MISS`: at K=5, A misses 2 positive anchors, B misses 7, C misses none at the any-anchor level.
- `ROLE_MISMATCH`: A has 67 wrong-role positions among 130 Top-5 results; C reduces this to 27.
- `SOURCE_TOO_THIN`: 42 negative chunks include labels, headings, positioning and thin references.
- `EVIDENCE_INSUFFICIENT`: 3 explicit boundaries; retrieval relevance is not Claim support.
- `MULTI_NEED_MISS`: A finds 3/4 Project A lifecycle anchors at K=5; B/C find 1/4. Service+delivery is 2/2 in all baselines.
- `SUBJECT_MISMATCH`: zero in the isolated SME benchmark. Cross-subject stress is not mixed into normal metrics.

## Boundary results

- Quantitative: both ≤2s and ≤1s probes retrieve SME-004. Only ≤2s is compatible with the frozen average 1.4s/P95 1.9s fact under matching conditions. Retrieval does not decide Claim support.
- Compatibility: tested, partially tested, not verified and unknown probes retrieve SME-005. A negative or unknown status remains retrievable Evidence; Fact/Gate determines support.
- Lifecycle: Project A has the complete chain; B lacks acceptance; C lacks contract/acceptance; D is fragmentary. C improves role precision but does not solve multi-document aggregation.

## Real Public qualitative findings

The six retained findings remain unchanged and outside SME metrics: broad positioning is insufficient; a system-integration heading is too thin for compatibility; broad data language proves neither one-second performance nor exchange mechanisms; qualifications partly support security capability but not configurable security level; an award record does not prove cloud service capability. They remain audit notes, not approved Real Gold, because reviewer identity is absent.

## Routing recommendation

Compatibility-aware routing is **proven useful for evaluation** at K=5: versus A it improves capable recall and substantially reduces wrong-role noise. Evidence Need retrieval alone is not useful. Production integration remains **NOT_READY** because the Gold set is representative synthetic, Real Public Gold is incomplete, no-sufficient behavior worsens under role filtering, and multi-evidence lifecycle coverage still needs a separately frozen aggregation policy.
