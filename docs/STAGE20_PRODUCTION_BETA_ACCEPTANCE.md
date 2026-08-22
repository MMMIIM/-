# Stage 20 Production Beta Acceptance

## Scope and boundary

This checkpoint validates the existing product as one production-shaped flow. It
does not add a Provider, call Dify/DeepSeek, change a frozen contract, or start
new RAG/Agent/Word architecture. The new fixture is synthetic and contains no
customer or private data.

Representative fixture: `backend/eval/stage20/fixtures/representative-project.json`.
The machine-readable offline run is `npm run eval:stage20 -w backend`.

## Acceptance evidence

| Area | Result | Evidence |
| --- | --- | --- |
| Project/tender/parse/baseline contracts | PASS | Existing HTTP and PostgreSQL suites; canonical baseline remains immutable |
| Enterprise material/retrieval boundary | PASS | Retrieval Eval: Recall@5 90%, MRR 1.000, source traceability 100%, scope violations 0%, no-answer 100% |
| Evidence review/readiness | PASS | Existing readiness/review suites; synthetic fixture keeps one approved material and one needs-review material |
| Response Plan / Claim Gate / coverage | PASS | Synthetic fixture: 4 Plans, 3 approved Claims, 1 rejected high-risk Claim, mandatory uncovered 0 |
| Generation and chapter isolation | PASS (deterministic) | Writer batch, sanitization, validation and chapter-preview contracts exercised offline; rejected Claim is excluded from Writer input |
| Bid Check boundary | PASS (deterministic) | Synthetic fixture preserves one attributable check issue; no unsafe Claim reaches Writer |
| Word export | PASS (deterministic) | Frozen renderer produced a non-empty DOCX (about 14 KB) with a table, headings and formal version inputs |
| Agent real-state safety | PASS | Agent Eval V1: 10/10; Agent Eval V2: 12/12, safety violations 0, unauthorized mutations 0, stale prevention 100%, idempotency 100% |
| Refresh/re-entry | PASS | Existing browser project workbench reloaded persisted project, task, version and risk state; HTTP/browser tests cover the same read models |
| Failure/recovery and idempotency | PASS (offline) | Fixture checks mandatory validation failure, human-only formal action, bounded action replay (`NO_CHANGE`) and rejected Claim isolation |
| Browser main path | PASS (read-only) | Local `http://127.0.0.1:5173/`: platform shell, 投标项目, 项目准备 → 审核与补充 → 标书生成 → 投标检查 all rendered; `/api/health` returned 200/database connected |
| Fresh migration replay | PASS | PostgreSQL migration replay/fresh-install coverage passed in the 40-test PostgreSQL suite |

## Offline fixture result

The fixture contains 4 functional/technical requirements, 2 enterprise
materials, 1 approved project fact, one approved evidence source, one material
requiring human review, one requirement with no evidence, one multi-requirement
chapter, one rejected quantitative Claim, and one generated table.

`eval:stage20` reports:

- external provider calls: **0**;
- Plans: **4**;
- approved Claims: **3**;
- rejected Claims: **1** (never enters Writer input);
- mandatory uncovered: **0**;
- remaining ordinary gap: **REQ-004** (readiness is correctly `NEEDS_ATTENTION`);
- DOCX bytes: non-zero;
- repeated safe action: `NO_CHANGE`;
- formal confirmation action: `HUMAN_REQUIRED`.

## Full regression run

- `npm test`: **PASS** (backend 505, frontend suite passed; Stage20 test included).
- `npm run test:postgres -w backend`: **PASS, 40/40**.
- `npm run eval:requirements -w backend`: **PASS** (all fixed Beta thresholds).
- `npm run eval:retrieval -w backend`: **PASS** (Recall@5 90%, traceability 100%).
- `npm run eval:agent -w backend`: **PASS** (10/10, safety violations 0).
- `npm run eval:agent-v2 -w backend`: **PASS** (12/12, safety violations 0).
- `npm run eval:stage20 -w backend`: **PASS** (synthetic deterministic flow).
- `npm run build`: **PASS**.
- `npm run lint`: **PASS**.
- `git diff --check`: **PASS** (only normal line-ending warnings from the existing corpus on Windows).

## Real-provider status

**NOT_RUN.** No new external authorization was supplied for this checkpoint and
no project/private data was sent outside the repository. The deterministic
production-shaped path is validated independently. A later explicitly
authorized run may classify the already-configured provider as `PASS` or
`OPERATIONAL_BLOCKED`; this checkpoint does not infer either result.

## Remaining production risks / manual items

1. A fresh project created through the browser and its complete side-effecting
   path (upload, parse, review decisions, generation and export) still requires
   an operator-controlled acceptance run; the browser check above was read-only
   against the existing synthetic project.
2. Real Office visual acceptance remains the frozen Stage 16 gate and must be
   performed in Word/WPS/LibreOffice before customer delivery.
3. Stage20 failure injections were validated offline and in targeted
   PostgreSQL contracts; a live operator run should exercise retry buttons and
   confirm no duplicate formal records.

## Stage decision

Engineering changes for this checkpoint are limited to the reusable synthetic
fixture, deterministic acceptance runner/test, and stage documentation. No
P0/P1 safety defect was found. Stage 20 is **PARTIAL / PENDING SIDE-EFFECTING
MANUAL ACCEPTANCE**, not frozen solely from offline evidence.
