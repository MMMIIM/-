# GPT Review Packet — SEM-P1-004 Option B

GPT_REVIEW_STATUS=PENDING_REVIEW  
SEM_P1_004_STATUS=PENDING_REVIEW

审查范围：代码级证据，不改变生产行为、不新增迁移、不调用外部模型。  
审查基线：branch `feat/v4.3-semantic-boundary-routing`，起始 HEAD `ef5bb89`。

## 1. Staging marker ownership

### Server-controlled assignment

| FILE | FUNCTION | ASSIGNMENT | PRODUCTION CALL SITE |
|---|---|---|---|
| `backend/src/evidence-lifecycle.js` | `PRE_REVIEW_STAGING_ROLE`, `isPreReviewStagingEvidence`, `assertFormalEvidenceEligible` | 定义并校验 `lifecycle_role=PRE_REVIEW_STAGING` 与 `canonical_review_required=true` | `EvidenceService`, `EvidenceFactService`, `DocumentGenerationService` |
| `backend/src/evidence-service.js` | `EvidenceService.create` | 仅当内部参数 `lifecycleRole === PRE_REVIEW_STAGING_ROLE` 时写入两个 marker；`metadata()` 只保留 `issuer/valid_from/valid_until/customer/product/version` | 只由 `createFromRetrieval` 传入 |
| `backend/src/evidence-service.js` | `EvidenceService.createFromRetrieval` | 生产实例开启 `requireReviewTransition=true`，调用 `create(..., { trustedSpan:true, lifecycleRole: PRE_REVIEW_STAGING_ROLE })` | `POST /api/projects/:projectId/requirements/:requirementId/evidence-candidates/from-retrieval` |
| `backend/src/server.js` | service wiring | `new EvidenceService({ repository, evidenceReviewService, requireReviewTransition:true })` | 唯一正式 Express wiring |

关键代码证据：

```js
// backend/src/evidence-service.js:57-61
const normalizedMetadata = metadata(input.metadata);
if (lifecycleRole === PRE_REVIEW_STAGING_ROLE) {
  normalizedMetadata.lifecycle_role = PRE_REVIEW_STAGING_ROLE;
  normalizedMetadata.canonical_review_required = true;
}
```

```js
// backend/src/evidence-service.js:73-85
const staging = this.requireReviewTransition && this.evidenceReviewService;
const evidence = existing || await this.create(..., {
  trustedSpan: true,
  lifecycleRole: staging ? PRE_REVIEW_STAGING_ROLE : null
});
const review = await this.evidenceReviewService.propose(...);
return { evidence, review, transition: { lifecycle_role: PRE_REVIEW_STAGING_ROLE, review_id: review.review_id } };
```

### Client mutation answers

1. **客户端省略 `lifecycle_role`**：不能使 retrieval-created Evidence 变成无标记新记录；retrieval service 从服务端配置传入 marker。
2. **客户端设置其他 `lifecycle_role`**：不能。`metadata()` 白名单会丢弃该字段；客户端也不能控制 `lifecycleRole` 参数。
3. **客户端移除 `lifecycle_role`**：没有 Evidence metadata patch/replace/merge API；不可移除。
4. **客户端设置 `canonical_review_required=false`**：不能。该字段不在 metadata 白名单，且 staging 分支始终写入 `true`。
5. **创建后 patch metadata 清除 marker**：当前生产路由只有 validity patch，没有 metadata patch；数据库更新函数也没有 metadata 更新入口。

结论：

`STAGING_MARKER_UNFORGEABLE = YES`

这是对“新 retrieval-created Evidence”的结论。普通人工 Evidence 创建入口是独立的非-retrieval入口；它没有 retrieval run/candidate 语义，也不能由客户端设置 lifecycle marker。

## 2. Historical compatibility discriminator

### Evidence creation production entry points

| Entry point | Service | Classification | Marker behavior |
|---|---|---|---|
| `POST /api/projects/:projectId/requirements/:requirementId/evidence-candidates/from-retrieval` | `EvidenceService.createFromRetrieval` | NEW RETRIEVAL-DERIVED | 必须走 `requireReviewTransition=true`，新行写 staging marker |
| `POST /api/projects/:projectId/evidences` | `EvidenceService.create` | MANUAL / MATERIAL EVIDENCE | 不接受 lifecycleRole；不是 retrieval-derived contract |
| internal repository/test fixtures | `createEvidenceRecord` | TEST/INTEGRATION ONLY | 不构成生产 HTTP 入口 |

`server.js` 是唯一正式 EvidenceService wiring，生产 retrieval route 不存在一个未开启 transition 的第二实例。  
历史 approved legacy row 通过 marker 缺失保持 READ_COMPATIBILITY；新 retrieval entry 不依赖“marker 缺失即新记录”的推断，而由新写入路径强制 marker。

`NEW_UNMARKED_RETRIEVAL_EVIDENCE_REACHABLE = NO`

## 3. Canonical positive authorization audit

| Domain | AUTHORIZATION_SOURCE | POSITIVE_LINEAGE_REQUIRED? | STAGING_FILTER_ONLY? | Result |
|---|---|---:|---:|---|
| Fact | `EvidenceSourceFactService.extract` 使用 `getApprovedReviewForFact(reviewId)`；legacy Fact service 另有 `assertFormalEvidenceEligible` | YES（规范 source Fact） | legacy path 另有 marker filter | PARTIAL：缺少本任务新增的完整 HTTP+PostgreSQL cross-project/stale negative matrix |
| Mapping | `RequirementEvidenceFactMappingService` 使用 approved Fact、Requirement hash/contract、Fact payload/contract；legacy `EvidenceService.proposeMapping` 拒绝 staging | YES（canonical Fact Mapping） | legacy mapping 仍存在 | PARTIAL：生产入口矩阵尚未完整证明 |
| Claim Gate | `ProductionBetaService.generateClaims` 读取 `listApprovedEvidence`、`listEnterpriseEvidenceBindings`、approved current Facts，并过滤 staging | NO（当前主路径仍可消费非-staging legacy binding） | YES | PARTIAL / lifecycle risk |
| Writer | `DocumentGenerationService.gate` 要求 approved Claims，并拒绝 staging evidence；`getDocumentGenerationInput` 来自 approved evidence | 部分要求；Claim lineage 未由本 patch重新闭合 | YES + Claim approval | PARTIAL |

未修复的明确风险：`ProductionBetaService.generateClaims` 的正式消费仍包含 `listEnterpriseEvidenceBindings()` 返回的 legacy `requirement_evidence_mappings`。当前 patch 只阻断 staging，不把 canonical `requirement_evidence_fact_mappings` 变成 Claim 唯一输入。因此不能宣称全链路 positive canonical lineage 已 enforced。

## 4. Proposal HTTP entry

```text
POST /api/projects/:projectId/requirements/:requirementId/evidence-reviews
  → app.js handler
  → evidenceReviewService.propose({ projectId, requirementId,
      retrievalRunId, retrievalCandidateId, sourceSpanId })
  → EvidenceReviewService.propose()
  → createEvidenceReviewContract()
  → repository.upsertEvidenceCandidateReview()
  → evidence_candidate_reviews
```

生产 handler 只组装 route/body 参数，不复制 assessment、source span、lineage、idempotency 或 stale 校验。

Repository `getEvidenceReviewCandidate()` 的 SQL 同时约束：

- Requirement `r.project_id = projectId`；
- Retrieval run 属于该 Requirement 且 `status='succeeded'`；
- Candidate 属于该 run；
- Source Span 属于项目且 `anchor_chunk_id = retrieval_candidate_id`；
- Material 属于项目。

`createEvidenceReviewContract()` 以 Requirement ID、Source Span ID、contract/reviewer version、Requirement hash、Source hash 生成稳定 Review ID；`upsertEvidenceCandidateReview()` 使用 `ON CONFLICT(review_id)`，保证相同输入幂等。  
`EvidenceReviewService.decide()` 比较 contract、Requirement hash、current source hash；过期时写入 `invalidated` 并拒绝旧决定。

## 5. Proposal entry negative controls

本次代码级 review 没有新增测试，以下是当前证据状态：

| Control | Expected behavior | Current evidence | Status |
|---|---|---|---|
| NC-P1 wrong project candidate | DENY | SQL project/run/material ownership predicates | PARTIAL（无专门生产入口测试） |
| NC-P2 wrong requirement | DENY | Requirement/run join and `r.project_id` predicate | PARTIAL（无专门生产入口测试） |
| NC-P3 candidate/span lineage mismatch | DENY | `s.anchor_chunk_id=rr.chunk_id` | PARTIAL（无专门生产入口测试） |
| NC-P4 missing/invalid exact span | DENY | `s.span_id` join plus `EvidenceReviewService` null rejection | PARTIAL（无专门生产入口测试） |
| NC-P5 duplicate proposal | IDEMPOTENT | deterministic review ID + repository upsert; existing integration coverage for duplicate proposal | PARTIAL（未在 `sem-p1-004-canonical-entrypoint.test.js` 以 HTTP entry 独立覆盖） |
| NC-P6 stale lineage | DENY / invalidate | `EvidenceReviewService.decide` stale check + `invalidateEvidenceCandidateReview` | PARTIAL（无专门生产入口测试） |

## 6. Staging/proposal failure atomicity

当前 PATH A 顺序是：

```text
validate retrieval source
→ resolve exact span
→ create staging Evidence
→ upsert source span
→ EvidenceReviewService.propose
```

这几个写入没有一个显式数据库事务包裹。因此当 staging Evidence 成功而 Proposal 失败时，孤儿 staging 可能存在：

`ORPHAN_STAGING_POSSIBLE = YES`

孤儿 staging 的下游能力：

- legacy approve：NO，`EVIDENCE_REVIEW_REQUIRED`；
- Evidence Fact：NO；
- Mapping：NO；
- Claim：NO；
- Writer：NO。

原因是 `assertFormalEvidenceEligible`、approved list filters、Claim filtering 和 Writer gate 都将 marker 视为正式链路阻断。

重试行为：

- 相同 source span：`findEvidenceBySourceSpan` 复用相同 staging identity；
- 相同 Review 输入：Review ID 确定性生成，repository upsert 幂等；
- proposal 失败后的跨写入恢复：没有事务/状态协调保证。

`RETRY_IDEMPOTENT = PARTIAL`

## 7. Review → Fact

### Production path

```text
POST /api/projects/:projectId/requirements/:requirementId/evidence-reviews
  → EvidenceReviewService.propose
  → evidence_candidate_reviews
  → POST /api/evidence-reviews/:reviewId/approve
  → EvidenceReviewService.decide
  → POST /api/evidence-reviews/:reviewId/facts
  → EvidenceSourceFactService.extract
  → getApprovedReviewForFact
  → createEvidenceFactContract
  → evidence_source_facts
```

`EvidenceSourceFactService.extract()` 只有 `getApprovedReviewForFact()` 返回 approved review 才继续；reference-only / historical bid 也会被拒绝。  
当前 `sem-p1-004-canonical-entrypoint.test.js` 的 **NC6** 验证了 HTTP Proposal → trusted human approve → Fact route；**NC2** 验证 staging legacy Fact entry 被拒绝。

未在本次 patch 中单独覆盖：未批准 Review、错误项目 Review、stale Review 的完整生产入口负向测试。因此：

`REVIEW_TO_FACT = PARTIAL`

## 8. Fact → Mapping

### Production path

```text
POST /api/projects/:projectId/requirement-evidence-fact-mappings
  → RequirementEvidenceFactMappingService.propose
  → getRequirementEvidenceFactMappingContext(project, requirement, fact)
  → createRequirementEvidenceMapping
  → requirement_evidence_fact_mappings
  → POST /api/requirement-evidence-fact-mappings/:mappingId/approve
  → RequirementEvidenceFactMappingService.decide
```

Mapping context 使用同项目 Requirement、confirmed baseline、Fact；`isStale()` 检查 Fact approved、Requirement valid、hash/contract version 和 mapping evaluator version。  
NC6 验证了规范入口正向链路；NC3 验证 legacy staging Mapping 被拒绝。

当前没有独立 production-entry negative controls 覆盖 draft/rejected/invalidated/cross-project Fact 的四种情况：

`FACT_TO_MAPPING = PARTIAL`

## 9. Mapping → Claim

当前 Stage20 Claim 入口：

```text
POST /api/projects/:projectId/claims/generate
  → ProductionBetaService.generateClaims
  → listApprovedEvidence
  → listEnterpriseEvidenceBindings (legacy requirement_evidence_mappings)
  → filter PRE_REVIEW_STAGING
  → ClaimBuilder / ClaimGateService
  → claims + coverage persistence
```

Canonical `requirement_evidence_fact_mappings` 已有独立 service/contract，但本次没有把它接成 `ProductionBetaService.generateClaims` 的唯一 authority。  
因此：

- 新 staging Evidence 不能通过 legacy approved mapping 进入当前 filtered input；
- 但非-staging legacy Mapping 仍是当前 Claim path 的输入；
- `Approved Fact Mapping` 不是当前 Claim path 的唯一强制来源。

`MAPPING_TO_CLAIM = PARTIAL`

## 10. Claim → Writer

```text
POST /api/projects/:projectId/document-generations
  → DocumentGenerationService.generate
  → DocumentGenerationService.gate
  → getDocumentGenerationInput
  → approved Claims + coverage + approved Evidence
  → createDocumentGeneration
  → Writer batch/provider
```

`gate()` 在创建 generation 前：

- 遍历 Evidence 并拒绝 staging marker；
- 只保留 `decision='approved'` Claims；
- mandatory Requirement 必须被 approved Claim 覆盖。

NC5 是真实 HTTP negative-control，断言返回 `EVIDENCE_REVIEW_REQUIRED` 且 `createDocumentGeneration` 未被调用。  
由于 Claim 仍可能来自 legacy binding，canonical support lineage 尚未成为 Writer 唯一来源：

`CLAIM_TO_WRITER = PARTIAL`

## 11. Legacy read compatibility

`READ_COMPATIBILITY != WRITE_COMPATIBILITY`。

- 历史 legacy approved records：仍可通过 catalog/list API 读取；未执行回填或全局失效。
- 新 retrieval staging：marker 被排除在 approved evidence/current fact/formal downstream lists 之外；旧 approve、Fact、Mapping、Claim、Writer 入口均不能赋予等价正式权力。

## 12. I19

`I19 = PARTIAL`。

不能因为 Option B staging block 已存在，就宣称所有 legacy write-capable paths 都无法削弱 canonical contract。

## 13. Regression evidence

| Command | Result |
|---|---|
| `npm test` | PASS — Backend `671/671`; Frontend `51/51` |
| `npm run test:postgres -w backend` | PASS — `42/42` |
| `npm run eval:sufficiency-offline -w backend` | PASS / accepted V3.1 baseline remains `PASS`, `EVAL_COMPLETE=YES` |
| `npm run build` | PASS |
| `npm run lint` | PASS |
| `git diff --check` | PASS，只有 LF/CRLF warning，无 diff error |

No external calls: Embedding `0`; LLM `0`; Dify `0`; Provider `0`; Live Retrieval `0`。

## 14. Required test evidence index

| Evidence | FILE | FUNCTION / ENTRY POINT | PERSISTENCE | TEST / NEGATIVE CONTROL |
|---|---|---|---|---|
| Marker assignment | `backend/src/evidence-service.js` | `create`, `createFromRetrieval` | `evidences.metadata` | `retrieval transition marks new evidence as staging...` |
| Legacy approval block | `backend/src/evidence-service.js`, `backend/src/app.js` | `decide`, `/api/evidences/:id/approve` | no `decideEvidence` call | `NC1 production Evidence approval...` |
| Legacy Fact block | `backend/src/evidence-fact-service.js` | `create` | no Fact write | `NC2 production legacy Evidence Fact entry...` |
| Legacy Mapping block | `backend/src/evidence-service.js` | `proposeMapping` | no mapping write | `NC3 production legacy Mapping entry...` |
| Claim isolation | `backend/src/pipeline/production-beta-service.js` | `generateClaims` | claims/coverage receive empty staging input | `NC4 Claim Gate receives no authorized support...` |
| Writer isolation | `backend/src/pipeline/document-generation-service.js` | `gate`, `generate` | generation write count stays 0 | `NC5 production Writer entry...` |
| Canonical proposal | `backend/src/app.js`, `backend/src/evidence-review-service.js` | Review proposal route / `propose` | `evidence_candidate_reviews` | `NC6 canonical Review proposal...` |
| Historical read/project isolation | `backend/src/db.js`, `backend/src/evidence-service.js` | list/read and project predicates | no historical mutation | `NC7 ... NC8 ...` |
| PostgreSQL staging audit | `backend/integration/postgres.integration.js` | metadata + legacy approval | `evidences` row remains draft | `OPTION B staging metadata persists...` |

## 15. Final review fields

```text
STAGING_MARKER_UNFORGEABLE = YES
NEW_UNMARKED_RETRIEVAL_EVIDENCE_REACHABLE = NO
CANONICAL_POSITIVE_LINEAGE_ENFORCED = PARTIAL
PROPOSAL_ENTRY_ENFORCED = PARTIAL
REVIEW_TO_FACT = PARTIAL
FACT_TO_MAPPING = PARTIAL
MAPPING_TO_CLAIM = PARTIAL
CLAIM_TO_WRITER = PARTIAL
SEM_P1_004_READY_FOR_FINAL_GPT_CLOSURE = YES
```

本包结论是“已完成代码级证据收集，等待独立 GPT Closure Review”，不是把仍存在的 orphan atomicity、Proposal negative-control coverage 或 legacy Mapping → Claim 风险标记为已解决。
