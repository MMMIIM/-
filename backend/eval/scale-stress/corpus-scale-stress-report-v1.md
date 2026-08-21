# Corpus Scale Stress Benchmark v1

## Frozen truth and scale design

- Positive Evidence anchors remain exactly 18; hash `8b591233a020740c0f235b4dba201533d011a26f91ea55524f9dba05f0b4e209`.
- Frozen SME Facts hash remains `9b243dd8a937a71f40d218a9ccd2eb58b7cc1f26e74208d97b19c1e2bc342517`.
- S: 60 chunks (18 positive, 42 negative).
- M: 260 chunks (18 positive, 242 negative; 200 scale-only noise chunks).
- L: 500 chunks (18 positive, 482 negative; 440 scale-only noise chunks).
- 55 pending scale materials include 25 hard-negative materials. They add no Enterprise Fact or positive coverage.
- Scale generation reads only frozen SME Profile/Facts and generic document-family templates. Probe, Gold anchor, ranking and retrieval-miss inputs are empty.

## Real embedding audit

One explicitly authorized request embedded 539 Eval inputs with `Qwen/Qwen3-Embedding-0.6B`, version 1, dimension 1024. Request hash: `244a4833d3c3b8498baa731e5975ec0a340be26366dca732d8afee71673b3c3b`; latency: 1789 ms. No vectors, credentials or raw Provider response were stored.

## K=5 comparison

| Tier | Mode | Capable Recall | Best Anchor | MRR | Wrong-role | Need Coverage | Multi-Need | Mean candidates | Reduction |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| S | A Raw | 90.48% | 90.48% | 0.7595 | 51.54% | 88% | 83.33% | 60 | 0% |
| S | C1 Hard | 100% | 95.24% | 0.4397 | 20.77% | 88% | 50% | 26.38 | 56.03% |
| S | C2 Soft | 100% | 95.24% | 0.4397 | 20.77% | 88% | 50% | 60 | 0% |
| M | A Raw | 85.71% | 80.95% | 0.6683 | 52.31% | 80% | 66.67% | 260 | 0% |
| M | C1 Hard | 76.19% | 71.43% | 0.3802 | 16.15% | 68% | 50% | 118.15 | 54.56% |
| M | C2 Soft | 76.19% | 71.43% | 0.3802 | 16.15% | 68% | 50% | 260 | 0% |
| L | A Raw | 76.19% | 71.43% | 0.6429 | 54.62% | 68% | 50% | 500 | 0% |
| L | C1 Hard | 76.19% | 71.43% | 0.3802 | 16.15% | 68% | 50% | 228.12 | 54.38% |
| L | C2 Soft | 76.19% | 71.43% | 0.3802 | 16.15% | 68% | 50% | 500 | 0% |

Full K=3/5/10/20 metrics and per-anchor ranks are frozen in `scale-stress-benchmark-v1.json`. K=20 is diagnostic only.

## Scale degradation

- Raw Recall@5 declines from 90.48% at S to 76.19% at L: −14.29 points.
- Routed Recall@5 declines from 100% to 76.19%: −23.81 points. Routing does not stabilize recall better than Raw.
- Raw MRR declines 0.7595→0.6429; C1/C2 decline 0.4397→0.3802. Routing has lower absolute ranking quality despite smaller MRR degradation.
- Raw first-capable rank maximum degrades 9→15; routed maximum degrades 3→19. Median stays 1 for Raw and 2 for routed.
- C1 consistently reduces wrong-role Top-5 results, reaching 16.15% at M/L versus 52.31%/54.62% Raw.
- C2 retains incompatible exploration candidates, producing zero hard exclusion and the same Top-20 ranking as C1 in this fixture; it does not recover the lost Gold ranks.

## Safety and error classification

- Routing False Exclusion Rate: 0% in S/M/L. `unknown` is retained by C1 and C2; C2 also retains incompatible candidates at low weight.
- `CORPUS_GAP`: 3 unchanged probes; excluded from Retriever Miss.
- `RETRIEVAL_MISS` at L/K=5: 5 positive probes under both A and routed modes.
- `ROLE_MISMATCH` at L/K=5: Raw 71/130 positions; routed 21/130.
- `MULTI_NEED_MISS`: L/K=5 covers 3/6 Gold anchors under both Raw and routed modes.
- No scale document resolves cloud, missing acceptance or other frozen gaps.

## Decision

Task 6E is corrected to **PROVEN_USEFUL_FOR_CANDIDATE_PURIFICATION**, not production-scale proof. At M/L, compatibility routing substantially purifies candidates and has zero hard false exclusion, but it does not preserve Recall, MRR, rank degradation or Multi-Need coverage better than Raw. Soft routing does not improve the observed top ranks. Therefore Semantic Routing at Scale is **NOT_PROVEN**, and Production Integration is **NOT_READY**.
