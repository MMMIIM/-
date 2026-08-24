# P0 FULL FRAMEWORK CONSISTENCY AUDIT

审计模式：READ-ONLY。审计时间：2026-08-24（Asia/Shanghai）。

本文件保留 2026-08-24 的原始只读观察；本次 GPT 决策后的 Batch 1 修复与状态见文末 remediation addendum。原始观察不被改写，现行结论以 addendum 和 `P0_FRAMEWORK_REMEDIATION_BATCH1.*` 为准。未调用 Embedding、LLM、Dify 或任何 Provider。

## 1. 基线与范围

- Branch: `feat/v4.3-semantic-boundary-routing`
- HEAD: `d16be0ab995ae908203308e3d3fc44d749a8f4e4` (`d16be0a eval: audit evidence source leakage`)
- 审计开始时 `git status --short --branch` 仅显示分支行，无修改或未跟踪文件；因此基线可复现。
- 盘点范围：105 个 `backend/src` 文件、44 个 migration、84 个 backend unit/test 文件、5 个 PostgreSQL integration 文件、11 个 frontend test 文件、257 个 backend/eval 文件、19 个 frontend source 文件、2 个 shared package 文件、services/semantic-gateway 及其测试。
- 文档：`AGENTS.md`、`ARCHITECTURE.md`、`docs/EVAL_POLICY.md`、`docs/ROADMAP.md`、`docs/CURRENT_STAGE.md`、`docs/AI_HANDOFF.md`、ADR 001–011 以及直接相关 Stage 17/20 文档。

## 2. 结论摘要

原始审计发现 13 项；经 GPT 决策校正后，现行清单为 14 项：P0 4 项、P1 8 项、P2 2 项。P0 均为真实生产可达的边界缺陷，Batch 1 只处理授权的四项：

1. 旧 Dify 兼容解析器在 `data.outputs` 之外接受顶层 `outputs`，与冻结的单一输出路径冲突。
2. 一个正式文档版本确认路由只阻止 `critical`，绕过了 `warning` 必须填写确认说明的服务门禁。

没有证据表明当前 source-eligibility 修复本身需要回滚；它在现有离线测试中保持 `UNKNOWN`/derived/internal/eval 候选为不可用。不要把测试 PASS 或当前指标当作 Stage20 已完成证明。

### Remediation Batch 1 现行状态（2026-08-24）

- `P0-TRUST-001`：已修复；正式读取路径仅为 `data.outputs.response_payload_json`。
- `P0-LIFE-001`：已修复；确认 HTTP 入口统一调用 `GenerationService.confirmVersion`。
- `P0-LEGACY-BYPASS-001`：由原 `P1-LEGACY-001` 升级；旧生成路由由显式 `V43_LEGACY_GENERATION_COMPAT` 控制，默认关闭。
- `P0-SEC-ACTOR-001`：由原 `P1-SEC-001` 升级；正式审核使用服务端 actor resolver，未配置可信 actor 时安全拒绝。
- 新增 `P1-INDEX-HYGIENE-001`：开放；本批不修复 raw index/candidate-pool crowding。
- `I06 Unknown != Confirmed` 恢复为 `ENFORCED`；新增 `I16 Warning != Confirmed without Explicit Acknowledgement`，状态 `CONTRADICTED`。
- `DOCUMENT_VERSION_CONFIRMATION` 的 owning service、DB/API、状态门禁和审计要求见概念矩阵及 remediation packet。

## 3. Findings

每项均包含要求的 ID、严重性、类别、概念、预期不变量、实际行为、精确位置、可达性、后果、测试缺口、责任层和修复方向。修复方向仅供 GPT 决策，不在本轮执行。

### P0-TRUST-001 — Dify response envelope 有顶层 outputs 兜底

- **Severity / Category / Concept:** P0 / trust-boundary / `response_payload_json`。
- **Expected invariant:** 后端只能读取 `data.outputs.response_payload_json`；缺失即 CONTRACT_INVALID；不得从其他位置猜取。
- **Actual behavior:** `extractResponsePayload()` 使用 `difyPayload?.data?.outputs ?? difyPayload?.outputs`，因此顶层 `outputs.response_payload_json` 会被接受。
- **Files / Functions / Lines:** `backend/src/contract.js:85-96`, `extractResponsePayload`; 生产调用来自 `backend/src/dify.js:27-37, 86-93`、`backend/src/service.js:15-59`、`backend/src/app.js:83-98,435-439`。
- **Reachability:** `PRODUCTION`，旧 GenerationService 的 `/api/projects/:projectId/generation-jobs` 和 `/api/generate-bid` 可达。
- **Data consequence:** 非冻结 envelope 可进入 parse/validation/Generation 审计，破坏 Provider 输出边界和外层 lineage。
- **User consequence:** 用户可能看到来自不符合正式 contract 的正文，审计无法区分合法外层结构。
- **Why tests missed it:** 现有负向测试证明 `result/text/answer` 不回退，但没有断言“顶层 outputs 也必须拒绝”；兼容路径保留了该未声明行为。
- **Owning layer / fix direction:** semantic response contract boundary；收紧为单一 `data.outputs` 读取并补充顶层 outputs negative control，保留原始审计。不要在本轮修复。

### P0-LIFE-001 — warning 风险确认路由绕过服务门禁

- **Severity / Category / Concept:** P0 / lifecycle / DocumentVersion confirmation。
- **Expected invariant:** `pass` 可确认；`warning` 必须有非空确认文字；`critical` 禁止确认；所有正式状态变更经过 owning service。
- **Actual behavior:** `POST /api/document-versions/:versionId/confirm` 直接读取版本、只检查 `critical`，然后调用 `repository.confirmVersion`；它没有调用 `assertVersionCanBeConfirmed`。
- **Files / Functions / Lines:** `backend/src/app.js:333-335`; 对比 `backend/src/service.js:63-68` (`GenerationService.confirmVersion`) 与 `backend/src/contract.js:99-105` (`assertVersionCanBeConfirmed`)。
- **Reachability:** `PRODUCTION`，前一条 route 在后一条同语义 route 之前注册并命中。
- **Data consequence:** warning 版本可能在没有确认理由时被写入 `review_decisions`、更新 `document_versions/projects`，形成非法 lifecycle transition。
- **User consequence:** 风险未被明确确认仍可能变成“已确认版本”，削弱风险门禁和审计可信度。
- **Why tests missed it:** 现有 `critical` route/service 测试覆盖禁止严重风险；warning 测试只覆盖 service path，未通过实际 Express route 断言。
- **Owning layer / fix direction:** DocumentVersion owning service + route consolidation；所有入口调用同一 confirmation service，添加 warning HTTP integration test。不要在本轮修复。

### P1-API-001 — document versions route 重复且响应形状不同

- **Severity / Category / Concept:** P1 / source-of-truth / document-version API。
- **Expected invariant:** 一个 URL 一个 canonical response contract。
- **Actual behavior:** `GET /api/projects/:projectId/document-versions` 在 `app.js:333` 返回 `{ok:true,data:{versions,generations}}`，又在 `app.js:423-425` 返回 `{versions}`；前者先注册并遮蔽后者。
- **Reachability:** `PRODUCTION`（shadowed duplicate 仍会误导维护者和客户端契约）。
- **Data/user consequence:** 版本页可能依赖未文档化的 `generations`，客户端/测试对 envelope 的假设会漂移；不直接改变业务真值。
- **Why tests missed it:** frontend tests mock API and do not inspect duplicate Express registration or both response shapes。
- **Owning layer / fix direction:** API route registry/contract tests；删除重复定义并固定 envelope。不要在本轮修复。

### P0-SEC-ACTOR-001（原 P1-SEC-001）— HTTP 复核身份没有可信来源

- **Severity / Category / Concept:** P1 / provider/security / reviewer identity。
- **Expected invariant:** 正式审核/确认应使用受信任的 authenticated actor，不能由客户端伪造。
- **Actual behavior:** `app.js:294,296,298,300-301` 使用 `req.body?.reviewer || 'current_user'`，编辑者同样从 body/default 取得；全局 app 只配置 CORS/JSON，没有认证中间件。
- **Reachability:** `PRODUCTION`，所有审核与 Project Fact edit API。
- **Data consequence:** 审计 actor 可伪造或同名，无法证明谁执行了正式决策；当前没有证据显示跨项目授权被绕过，但身份可信度不足。
- **User consequence:** 管理员无法可靠追责或区分审核人。
- **Why tests missed it:** tests assert lifecycle/status and default placeholder, not authenticated identity or tenant authorization。
- **Owning layer / fix direction:** platform identity/RBAC boundary；引入现有成熟认证集成后由 request context 注入 actor，同时补 authorization tests。属于后续决策范围。

### P0-LEGACY-BYPASS-001（原 P1-LEGACY-001）— Legacy Dify generation path 仍生产可达

- **Severity / Category / Concept:** P1 / provider boundary / Dify legacy shim。
- **Expected invariant:** 正式 4.3 semantic tasks 走 Backend → standalone semantic gateway → adapter；Dify 仅 `LEGACY_DIFY_PROVIDER_SHIM`，不成为主流程依赖。
- **Actual behavior:** `server.js:45-50` always wires `createDifyClient` + `GenerationService`; old generation routes remain reachable (`app.js:83-98,435-439`). Requirement extraction and document-generation paths use newer adapters, but compatibility endpoint can still be called.
- **Reachability:** `PRODUCTION` compatibility path, not the current Stage20 semantic path。
- **Data consequence:** callers can receive v4.2-shaped Generation records alongside 4.3 records, increasing contract/version drift risk。
- **User consequence:** old UI/caller may bypass current review/retrieval gates or observe inconsistent errors。
- **Why tests missed it:** tests correctly protect legacy behavior and do not prove it is unreachable from deployed routing。
- **Owning layer / fix direction:** explicit compatibility boundary/route policy; either isolate/label legacy routes or retire them after migration decision. Do not remove in audit。

### P1-STATE-001 — Pipeline/task/database status vocabularies are not one registry

- **Severity / Category / Concept:** P1 / state-machine / generation lifecycle。
- **Expected invariant:** states defined once, legal transitions explicit, API/UI/DB values identical。
- **Actual behavior:** `GenerationAudit.PIPELINE_STATES` is `backend/src/pipeline/generation-audit.js:11-14`; DB checks independently repeat generation/task states in `backend/migrations/014_document_generation_loop.sql:6-7`; parse/retrieval/review/fact/mapping states are separately literal in migrations and services.
- **Reachability:** `PRODUCTION` maintenance and cross-layer integration。
- **Data consequence:** adding/renaming a state in one layer can create rows the other layer cannot advance or render; failure/terminal semantics may diverge.
- **User consequence:** a task may appear stuck or display an unmapped status.
- **Why tests missed it:** tests cover known paths, not a generated cross-layer registry equivalence check.
- **Owning layer / fix direction:** shared domain-state registry plus migration/API/UI compatibility matrix; no broad refactor in this audit。

### P1-CONTRACT-001 — Domain enums are duplicated across contract, migration, service, UI and eval

- **Severity / Category / Concept:** P1 / source-of-truth / support, mapping, eligibility and status enums。
- **Expected invariant:** one canonical contract imported by every consumer。
- **Actual behavior:** semantic task contracts are centralized in `packages/semantic-contracts/index.js:26-79`, but Evidence Review (`backend/src/pipeline/evidence-review-contract.js:4-10`), Mapping (`backend/src/pipeline/requirement-evidence-mapping-contract-v1.js:7`), source eligibility (`retrieval-source-eligibility.js:3-14`), DB checks/defaults (migrations 010/011/014/021/026/044), frontend labels and eval expectations independently repeat values。
- **Reachability:** `PRODUCTION` and `EVAL`.
- **Data consequence:** semantic drift can accept a value in one layer and reject/rename it in another; current tests show compatibility, not permanent single-source enforcement。
- **User consequence:** labels or filters can hide a valid backend state.
- **Why tests missed it:** contract tests focus on allowed values and behavior, not duplicate-definition detection.
- **Owning layer / fix direction:** domain contracts/shared constants with DB compatibility snapshots; prioritize high-risk approval/eligibility states。

### P1-DB-001 — Retrieval rank has raw/reranked/audit fallback semantics

- **Severity / Category / Concept:** P1 / DB/service / retrieval audit rank。
- **Expected invariant:** persisted rank has one declared meaning and is reproducible from the ranking contract。
- **Actual behavior:** `backend/src/db.js:200` writes `audit_rank ?? reranked_rank ?? raw_vector_rank ?? rank` into DB `rank`, while `reranked_rank` may remain null; reads reconstruct raw and final ordering with separate fallbacks (`db.js:202`).
- **Reachability:** `PRODUCTION` retrieval persistence/read path。
- **Data consequence:** historical `rank` can mean raw rank or audit/rerank fallback; metric consumers may compare unlike ranks even though raw audit is retained.
- **User consequence:** displayed “#rank” and audit explanations can differ across runs.
- **Why tests missed it:** current tests assert ordering and retention, not a schema-level rank semantic invariant over every fallback combination。
- **Owning layer / fix direction:** Retrieval result schema/contract; name and persist raw/reranked/audit ranks explicitly, then migrate readers. Do not change ranking here。

### P1-RETRY-001 — Document batch service has implicit transient retry

- **Severity / Category / Concept:** P1 / default/retry / generation task。
- **Expected invariant:** retry policy is task-specific, explicit, auditable, and never mistaken for a second user request。
- **Actual behavior:** `backend/src/pipeline/document-generation-service.js:11-12` loops `attempt < 2` and retries `GATEWAY_NETWORK_ERROR`/`GATEWAY_TIMEOUT`; explicit retry endpoint also resets failed tasks.
- **Reachability:** `PRODUCTION` semantic section drafting path。
- **Data consequence:** external provider request count and latency can exceed a caller’s assumed single-attempt budget; `attempt` is persisted but policy is not shared with all task types。
- **User consequence:** longer/duplicate provider work may be surprising and can complicate incident diagnosis。
- **Why tests missed it:** tests verify retry success/failure mechanics but not a repository-wide retry contract or external-request budget.
- **Owning layer / fix direction:** centralized per-task execution policy and audit; preserve safety/no infinite retry.

### P1-EVAL-001 — Evaluation evidence is not eligible for freeze yet

- **Severity / Category / Concept:** P1 / eval leakage/metric integrity / GPT-reviewed expectation。
- **Expected invariant:** case-level truth → validation → aggregation → decision; no `EVAL_COMPLETE` until packet and independent review are complete。
- **Actual behavior:** current source-eligibility and substantive packets explicitly report `GPT_REVIEW_STATUS=PENDING_REVIEW`, `EVAL_COMPLETE=NO`; Human Gold remains zero for the active calibration packet。
- **Reachability:** `EVAL_ONLY`, but it gates Stage20 decisions。
- **Data consequence:** declaring PASS from current counts would contaminate formal evaluation truth。
- **User consequence:** product readiness could be overstated.
- **Why tests missed it:** tests intentionally assert the pending state; no test can replace independent GPT/human review。
- **Owning layer / fix direction:** evaluation governance/review process, not production code. Keep pending until packet review.

### P1-API-002 — Response envelope is inconsistent across routes

- **Severity / Category / Concept:** P1 / API contract / frontend state。
- **Expected invariant:** all API responses expose one documented success/error envelope and consistent nullability.
- **Actual behavior:** `sendData()` (`app.js:15-17`) returns `{ok:true,data}`, while project/parse/job/version routes also use raw `{project,...}`, `{jobs}`, `{versions}` (`app.js:33-65,111-115,353-355,423-425`); `frontend/src/api.js` normalizes only some paths.
- **Reachability:** `PRODUCTION`.
- **Data/user consequence:** new UI consumers can silently ignore safety fields or mis-handle errors; not currently observed as a truth mutation。
- **Why tests missed it:** route tests cover selected endpoint shapes, not a complete API contract snapshot。
- **Owning layer / fix direction:** API DTO layer and contract tests; additive normalization only after decision。

### P2-DATA-001 — Material and parsed Document identity are compressed in Source Span schema

- **Severity / Category / Concept:** P2 / source-of-truth / Material vs Document。
- **Expected invariant:** Material → Parsed Document → Chunk lineage remains explicit。
- **Actual behavior:** migration `025_evidence_source_span_v1.sql:3-7,22` requires `source_document_id = material_id`; current repository reads use the same company material as document source.
- **Reachability:** `PRODUCTION` source-span persistence。
- **Data consequence:** multi-document materials or re-parsed document versions would need an extension; current single-file path remains traceable。
- **User consequence:** advanced provenance cannot distinguish document revisions inside one Material。
- **Why tests missed it:** tests use one document per material and validate equality as the existing contract。
- **Owning layer / fix direction:** source lineage model if future multi-document evidence is required; no change justified by this audit alone。

### P2-DOC-001 — Stage status wording has a review ambiguity

- **Severity / Category / Concept:** P2 / documentation drift / Stage17/20 status。
- **Expected invariant:** `CURRENT_STAGE.md` is the operational source, and handoff/roadmap wording should not imply conflicting freeze states。
- **Actual behavior:** `CURRENT_STAGE.md` describes Stage17 retrieval architecture frozen while Stage20 remains blocked/partial; `AI_HANDOFF.md` also says Stage17 reopened for P0 fix and GPT review pending. Both explain different scopes, but the distinction is not expressed in one compact status phrase。
- **Reachability:** `DOC_ONLY`.
- **Data/user consequence:** no runtime change; reviewers may misread whether Stage17 or Stage20 is authorized。
- **Why tests missed it:** documentation consistency is not covered by automated tests。
- **Owning layer / fix direction:** governance docs; reconcile “architecture frozen / evidence track reopened” wording after GPT review。

## 4. Data origin and trust-level audit

`INDEX PRESENCE` 与 `FORMAL EVIDENCE ELIGIBILITY` 是两个不同维度。内部/系统派生/eval 类文本当前可能出现在 raw indexed candidate pool；source-eligibility gate 只负责阻止其进入最终正式 Evidence lane，不宣称它们无法被索引或嵌入。该 raw-pool hygiene 风险登记为 `P1-INDEX-HYGIENE-001`，本批不修复。

| Origin | Material/Document/Chunk | Embedding | Formal Evidence Retrieval | Context-only | Evidence Fact | Result |
|---|---|---|---|---|---|---|
| USER_UPLOADED_BUSINESS_SOURCE | `CompanyMaterialService` → local storage → parsed chunks | yes after processing | yes, if scope/source eligibility passes | yes | only after Review + Fact service | ENFORCED/PARTIAL |
| USER_UPLOADED_REFERENCE_SOURCE | same shared infrastructure, material type/provenance required | yes | reference-only or eligible according to source class; never enterprise proof by default | yes | constrained by review/capability | ENFORCED |
| AUTHORITATIVE_EXTERNAL_SOURCE | curated corpus ingestion / public library | yes when ACTIVE | yes as authoritative reference, not enterprise-owned capability | yes | review required | ENFORCED |
| SYSTEM_DERIVED_ARTIFACT | may appear in raw indexed candidate pool | may be present in raw index; source gate is downstream | no formal Evidence eligibility (`SYSTEM_DERIVED_ARTIFACT`) | audit/context only | no | source gate ENFORCED; raw-pool hygiene OPEN P1 |
| LLM_GENERATED_ARTIFACT / WRITER_OUTPUT | provider output is transient/draft | no corpus re-entry path found | no | no | no | ENFORCED by writer/Fact contracts |
| EVAL_FIXTURE / TEST_FIXTURE | eval loaders and fixtures only | offline fixture vectors/embeddings only | no production source | eval only | no | ENFORCED; leakage negatives pass |
| INTERNAL_PROCESS_NOTE / CONTROL_PLANE_DATA | may be visible in raw audit | no | no | audit only | no | ENFORCED by source classes |
| UNKNOWN | retained with `UNKNOWN`, ineligible | no formal proof | no | may remain in candidate audit | no | ENFORCED conservative default |

No reachable production path was found that promotes a `SYSTEM_DERIVED_ARTIFACT`, `EVAL_ARTIFACT`, `INTERNAL_PROCESS_ARTIFACT` or `CONTROL_PLANE_ARTIFACT` into formal Evidence. The source-eligibility gate is additive; Raw Candidate remains distinct from Evidence/Fact.

## 5. Forward/reverse flow and layer audit

The intended forward flow is implemented as separate services: material ingestion → chunks/embeddings → `EnterpriseRetrievalService` → source span/review → Evidence Fact → `RequirementEvidenceFactMappingService` → Claim Gate → Writer Authorization/Generation. Unit and PostgreSQL tests cover the positive path and adversarial negatives.

No production reverse flow was found from Writer output, Claim result, Mapping result, or eval Gold back into Material/Evidence/Fact. `DocumentGenerationService` snapshots approved inputs and `writer-execution-contract-v1` only consumes authorized refs. The main architectural exceptions are the P0 Dify envelope fallback and P1 legacy route/actor/API issues above.

Layer verdicts: Retrieval finds candidates (`enterprise-retrieval-service.js`); substantive and source eligibility are independent gates; Evidence Support aggregates observations but does not write lifecycle; Review/Fact/Mapping services own approvals; Claim Gate owns authorization; Writer/validator do not create source facts. `packages/semantic-contracts` is the strongest shared boundary.

## 6. State machines, defaults and UNKNOWN

- `GenerationAudit` enforces the sequential 4.3 pipeline and terminal `failed` in `generation-audit.js:11-46`; DB generation/task checks independently enumerate statuses (P1-STATE-001).
- Parse jobs, retrieval runs, Evidence Review/Fact/Mapping, Document Version and Agent Action have persisted statuses and guarded service transitions. No direct path was found that turns `UNKNOWN`, `pending`, `needs_review`, `unavailable`, `draft` or `proposed` into approved/supported/eligible without the owning decision method. The warning confirmation route is the confirmed exception for document lifecycle.
- Safe defaults observed: missing source provenance → `UNKNOWN`/ineligible; missing support dimensions → `unknown`; missing human approval → pending/needs review; missing `human_approved` is `false`; empty scope returns no-answer. These are `SAFE_CONSERVATIVE`.
- UX/default-only values include `current_user` placeholder, default response labels and API `null`/empty arrays. They are not formal approval but actor default is an audit weakness (P1-SEC-001).
- No `catch` block was found that converts technical provider/network/schema failure to business insufficiency in the shared Evidence Support path; unavailable is distinct and preserves technical code.

## 7. Database/service/API consistency

Migrations 001–044 were inspected, including requirements, parse jobs/chunks, materials/chunks/embeddings, retrieval runs/results, source spans, review/facts/mappings, plans/claims/coverage, document generation/version, writer authorization, Agent actions and corpus metadata. Raw SQL is concentrated in `backend/src/db.js`; routes mostly call services. The warning confirmation route is the confirmed `DIRECT_FORMAL_DB_WRITE` finding. Other direct repository reads are read-only or owning-service calls.

The frontend has 19 source files and 11 test files. It consumes parse, review, readiness, mapping, generation, document delivery and Copilot routes. Safety-critical fields such as status/reason/source location are present in review/readiness views, but API envelope duplication means new consumers can drift (P1-API-002).

## 8. Provider and semantic boundary

`backend/src/pipeline/semantic-gateway-client.js:192-260` uses only `/workflows/run`, sends `task_type/task_instruction/task_payload_json`, and reads the registered response contract. Strict Evidence Support uses `packages/semantic-contracts` and rejects `result`, `text`, `answer`, `message`, raw response fields and JSON repair. `services/semantic-gateway` exposes the same `data.outputs.response_payload_json` shape.

`backend/src/dify.js:1-101` is a legacy adapter and calls `extractResponsePayload`; it does not read `result/text/answer`, but it inherits the top-level `outputs` fallback (P0-TRUST-001). `server.js:45-50` wires it for compatibility routes; the formal requirement/retrieval/writer path is separately wired. No direct `api.deepseek.com` call was found in the inspected source; provider calls are through adapters.

## 9. Evaluation, metrics and security

Evaluation tooling separates raw pools, Gold, human-review packets and production service calls. Current packets retain every case and report `PENDING_REVIEW`/`EVAL_COMPLETE=NO`; no runtime classifier was found used as the sole truth for the source-eligibility replay. Metrics are calculated from independent expected IDs/statuses in the eval files, with exclusions visible in packet/report fields. The audit nevertheless records P1-EVAL-001 because no GPT/human review has frozen the current packet.

Metric inventory reviewed: Recall@K, Material/Document/Chunk Hit@K, Expected-source Recall, Evidence-Bearing rate, Qualified Span rate, Context Recovery, Evidence Support status accuracy, Mapping/Claim safety, Grounding, metadata/substantive/source-eligibility rates, MRR, no-answer accuracy, coverage/readiness. `docs/EVAL_POLICY.md` requires separate denominators, no guessed zeros, case-level packets and manual samples. Current metrics are evidence, not a release decision.

External call inventory: Embedding via `createEmbeddingClientFromEnv`/SiliconFlow with managed SOCKS only in ignored local env; semantic gateway/Dify via adapters; External Writer via explicit authorization service. This audit made zero calls. Keys are read from environment and never printed; no key/token/secret appears in this packet.

## 10. Test oracle quality

The existing tests include strong negative controls for Unknown, partial/insufficient support, wrong fact type, system/process/eval artifacts, metadata-only fragments, short valid facts, multi-chunk spans, conflicts, technical failures, strict response fields, Claim Gate and Writer authorization. The two P0s escaped because route-level tests do not test the duplicate confirmation endpoint and contract tests did not include a top-level `outputs` negative case. The audit classification is therefore:

- Tautological tests found: **0 confirmed** (some deterministic helpers mirror expected values, but no release decision is based on them alone).
- Weak-oracle tests: **2 confirmed gaps**, corresponding to the two missing P0 negative controls above.
- Missing negative controls: **2 confirmed**; top-level Dify `outputs`, and warning confirmation through `/confirm` route.

## 11. Invariant and concept matrices

See [FRAMEWORK_INVARIANT_MATRIX.md](FRAMEWORK_INVARIANT_MATRIX.md) and [CONCEPT_OWNERSHIP_MATRIX.md](CONCEPT_OWNERSHIP_MATRIX.md). Matrix status is intentionally conservative: `PARTIAL` means current code/tests cover a path but no single cross-layer registry or independent acceptance proof exists; it is not a proposed fix.

## 12. Requested checkpoint (1–50)

### BASELINE

1. **Branch:** `feat/v4.3-semantic-boundary-routing`。
2. **HEAD:** `d16be0ab995ae908203308e3d3fc44d749a8f4e4`。
3. **Clean:** YES at audit start; final tree has only the four requested untracked audit documents。

### SCOPE

4. **Source files inspected:** 105 backend source, 19 frontend source, 2 shared package, semantic-gateway source/tests, plus direct route/service/provider files。
5. **Migrations inspected:** all 44 migrations (001–044)。
6. **Tests inspected:** 84 backend unit/test files, 5 PostgreSQL integration files, 11 frontend test files; targeted source/eval tests included。
7. **Eval files inspected:** 257 backend/eval files, including corpus L3, retrieval, evidence-support calibration V2, source/substantive hygiene, Gold packets and Stage20 acceptance。
8. **Docs/ADRs inspected:** AGENTS, ARCHITECTURE, EVAL_POLICY, ROADMAP, CURRENT_STAGE, AI_HANDOFF, relevant Stage20/RAG docs, ADR 001–011。

### FINDINGS

9. **Total findings:** 13。
10. **P0:** 2。
11. **P1:** 9。
12. **P2:** 2。

### P0 CATEGORIES

13. **Trust-boundary:** 1 (P0-TRUST-001)。
14. **Lifecycle:** 1 (P0-LIFE-001)。
15. **Source-of-truth:** 0 P0; P1 API/enum/rank duplication recorded。
16. **Eval leakage:** 0 P0; evaluation remains pending by policy。
17. **Default/fallback:** 0 additional P0; the contract fallback is counted under trust-boundary。
18. **State-machine:** 0 P0; P1 duplicated vocabularies recorded。
19. **DB/service:** 0 P0 beyond the lifecycle route bypass; P1 rank semantics recorded。
20. **Provider/security:** 0 P0; Dify boundary is P0 trust, actor identity is P1 security。

### INVARIANTS

21. **ENFORCED:** 9 (I01, I03, I04, I05, I07, I08, I09, I12, I15)。
22. **PARTIAL:** 5 (I02, I10, I11, I13, I14)。
23. **MISSING:** 0 confirmed invariant-wide; cross-layer registry/route controls are partial rather than absent。
24. **CONTRADICTED:** 1 (warning confirmation lifecycle in I06/lifecycle enforcement)。

### DUPLICATION

25. **Duplicated enums/contracts:** generation states, Evidence Review, Mapping, source eligibility and frontend labels are independently repeated; semantic task contracts are centralized in `packages/semantic-contracts`.
26. **Duplicate source-of-truth:** confirmation route, document-version route, rank meaning and actor identity are the material duplicates (P0-LIFE-001, P1-API-001, P1-DB-001, P1-SEC-001)。
27. **Legacy production-reachable paths:** Dify GenerationService routes are `LEGACY_COMPAT` and production-reachable (P1-LEGACY-001)。

### EVAL

28. **Self-grading findings:** 0 confirmed; independent expected labels are used, but review remains pending。
29. **Gold leakage:** 0 production leakage found; Gold IDs remain evaluator-only in inspected paths。
30. **Denominator/metric drift:** 1 governance risk: current packets use multiple historical baselines/metric names and must remain explicitly scoped; no new production metric was created。

### TEST QUALITY

31. **Tautological tests:** 0 confirmed。
32. **Weak oracle tests:** 2 gaps (route warning gate, top-level outputs)。
33. **Missing negative controls:** 2 corresponding controls。

### OUTPUTS

34. **Audit packet:** `docs/audits/P0_FRAMEWORK_CONSISTENCY_AUDIT.md` and `.json`。
35. **Invariant matrix:** `docs/audits/FRAMEWORK_INVARIANT_MATRIX.md`。
36. **Concept ownership matrix:** `docs/audits/CONCEPT_OWNERSHIP_MATRIX.md`。

### VALIDATION

37. **Backend:** PASS — 642/642。
38. **Frontend:** PASS — 50/50 across 11 files。
39. **PostgreSQL:** PASS — 41/41。
40. **Build:** PASS — Vite production build。
41. **Lint:** PASS — backend/frontend lint commands completed without errors。
42. **Diff-check:** PASS — `git diff --check`; Git emitted existing LF→CRLF advisory warnings for fixture files, with no whitespace error。

### EXTERNAL

43. **Embedding:** 0 calls。
44. **LLM:** 0 calls。
45. **Dify:** 0 calls。

### GIT

46. **Commits:** 0 audit commits; current HEAD remains `d16be0a`。
47. **Push:** NO。
48. **Merge:** NO。
49. **Deploy:** NO。

### DECISION

50. **DO NOT FIX YET.** P0 FULL FRAMEWORK CONSISTENCY AUDIT is complete as an evidence packet and requires GPT review before any remediation. Findings are not authorization to modify frozen contracts or production paths.

## Final audit disposition

`REMEDIATION_BATCH1_IMPLEMENTED_PENDING_GPT_REVIEW`

原始审计保持历史证据；当前实施细节与测试证据见 `P0_FRAMEWORK_REMEDIATION_BATCH1.md/.json`。
