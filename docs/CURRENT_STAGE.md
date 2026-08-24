# Current Stage

## Stage 21-A — Runtime Connectivity Foundation

Priority: **P0 prerequisite for Stage20 completion**
Status: **PASS / FROZEN — RETURNED TO STAGE20 RE-ENTRY**

本阶段是经 sequencing decision 批准的受控前置阶段，不等同于完整 Stage 21。
目标是建立可重复的开发运行时连通性：Database、semantic_gateway、Embedding
Provider 的启动前检查、分层错误分类和最小安全观测。Stage17 Retrieval Engine
以及 Stage16–19 冻结规则不变；Stage21-A 完成后必须返回 Stage20，继续 Corpus
L3 和 Real Business E2E，不能直接进入 Release Readiness。

验收已完成：用户配置的 reusable SSH key/agent 通过 BatchMode；单一 managed SSH
session 同时承载 18080 LocalForward 和 18081 SOCKS；Gateway `/info`、SOCKS
远端 DNS/TCP/TLS/HTTPS 和 4 次串行真实 Embedding smoke 均通过，模型维度为
1024。monitor 重启验证通过且无重复监听。开发态被动预检和 degraded 启动测试仍保留。

本阶段已冻结；不新增 Provider、模型、fallback、retry 架构，不修改 Retrieval
business contract。Stage20 重新进入现有正式 Retrieval 边界，具体决策见
`docs/decisions/009-runtime-connectivity-foundation.md`。

## Stage 20 — Production Beta Hardening / Real E2E

Priority: **P0/P1**
Status: **BLOCKED — P0 EVIDENCE / REAL RETRIEVAL REGRESSION**

本阶段只验证现有产品能力能否作为一条可恢复、可追溯的完整业务流运行：
项目准备 → 招标解析 → 需求基线 → 材料检索与复核 → 生成准备 → 标书生成 →
章节复核/安全修订 → 投标检查 → Word 导出。禁止新增 AI 能力、Provider、Agent
自治或部署基础设施；外部 Provider 在本阶段默认不调用，若已有授权路径不可用则
记录为运营阻断而不改变架构。本轮只执行了既有 EmbeddingClient 的受控 Retrieval
回归，没有调用 LLM 或 Dify。

最新范围校正：正式 Stage20 路径使用 `semantic_gateway` Provider Adapter，
不依赖 Dify Workflow/App/End 状态；保留的 v4.2 Dify 路由仅作兼容，不属于当前
平台主流程。`企业资料库`按一个底层资料能力提供“通用资料 / 行业资料 / 企业资料”
三种业务范围，SSH 隧道仅是开发环境访问方式。最近一次只读网关检查已通过；
不得把手工 SSH 隧道当作正式产品运行要求。

## Stage20-S — Evidence Support Assessment Shared Core

Priority: **P0/P1**
Status: **IMPLEMENTATION COMPLETE — OFFLINE / REAL RETRIEVAL BLOCKED**

本子阶段建立 `EvidenceSupportAssessment` 共享语义边界：它只观察
Requirement 与来源之间的支持关系，不创建 Evidence、Fact、Mapping、Claim，
不改变审批、Readiness 或 Writer 状态。Raw Retrieval Candidate 与 approved
Evidence Fact 通过显式 Adapter 输入；来源片段必须可由后端从 source text
验证并带 hash；冲突只记录，不自动裁决。默认 provider-neutral evaluator
返回不可用状态，不能伪装为 capable/direct。

已有 Evidence Review 和 Requirement-Evidence-Fact Mapping 仅通过 additive
兼容投影复用共享语义，旧 `requirement_evidence_mappings` 路径保持不变。
本轮没有数据库迁移、远端发布或模型调用；本地共享 Gateway Contract 的
实现状态见下方 addendum。
详见 `docs/decisions/010-evidence-support-assessment-boundary.md`。

### Stage20-S shared Gateway contract (2026-08-24)

`evidence_support_assessment` 已完成本地 Gateway Contract、task registry、
严格 envelope/schema validator、Raw Retrieval Candidate / approved Evidence
Fact adapters 与 provider-neutral evaluator adapter。契约版本为
`4.3-evidence-support-assessment-v1`；模型只返回 source-bound semantic
observations 和 cross-source conflict observations，最终业务状态继续由后端
`aggregateEvidenceSufficiency()` 确定。严格模式只允许 BOM/外层空白规范化，
不接受 result/text/answer/message/raw_response，不做 JSON 修复。

当前状态：**LOCAL IMPLEMENTED / NOT REMOTELY PUBLISHED — NO LIVE MODEL CALL**。
没有数据库迁移、Evidence/Fact/Mapping/Claim/Writer 生命周期写入或 Retrieval/MMR
变更；Stage20 仍为 `BLOCKED`（等待正式 live evidence sufficiency validation），
Corpus L3 仍为 `IN_PROGRESS`。

### P0 Evidence Context / Real Retrieval regression (2026-08-24)

Bounded context recovery and enterprise-proof source routing are implemented and
covered by offline tests. The 36 active calibration cases were re-audited:
3 `EVIDENCE_REVIEW_READY`, 32 `INSUFFICIENT_EVIDENCE`, 1
`NO_RELEVANT_EVIDENCE`, 0 `CONFLICTING_EVIDENCE`; Human Gold remains 0 and
Human Review remains paused.

Three distinct real Retrieval cases were attempted once through the formal
EnterpriseRetrievalService. All stopped at the existing EmbeddingClient with
`EMBEDDING_NETWORK_ERROR`; Top-K, Evidence Span and downstream semantic
assessment were not reached. No LLM/Dify call or retry occurred. The only next
P0 action is to restore the existing Embedding network path and rerun the same
controlled regression; do not change Retrieval ranking, chunking, topK, model,
Provider or retry architecture.

### Standalone Semantic Gateway foundation (2026-08-24)

本地已实现独立无状态 Node Gateway：`services/semantic-gateway`。共享语义
Contract 唯一来源为 `packages/semantic-contracts`，Backend task registry 通过
该路径消费；服务提供 `/health`、`/ready` 与兼容 `POST /workflows/run`，支持
六类正式 Task，另保留 `draft_sections` 兼容入口。当前仅使用注入式 mock
Provider，OpenAI-compatible adapter 只完成本地严格 JSON 路径；不调用真实模型，
不连接业务数据库，不写 Evidence/Fact/Mapping/Review/Readiness/Claim/Writer。

当前 Backend 默认仍指向 Legacy Dify-compatible runtime，未执行 cutover。远端
Dify 不修改、不部署；下一步需单独决定本地 cutover 与真实 Provider 验证。

### Stage20 parallel acceptance tracks

- Track A — Corpus Readiness L3：`IN_PROGRESS`。当前真实公共资料为通用 10、政企 15、医疗 15，
  合成企业基线 17；17 份合成企业资料已通过 `CompanyMaterialService` 实际导入并索引（51 chunks），
  正式生产检索夹具另保留 21 份材料、329 个 chunk。Golden V2 共 139 个领域问题，业务覆盖 96.8%，
  4 个范围边界缺口已记录为 non-critical；冻结检索基线 Recall@5 仍为 90%。
- Track B — Real Provider E2E：`BLOCKED — EMBEDDING_NETWORK_ERROR`。已使用公开的
  江阴市国有企业集中采购 PDF 完成实际上传、解析、4 个网关分片和需求基线确认；
  140 条需求、17 份合成企业材料已通过正式服务落库。首次真实检索调用在现有
  `V43_EMBEDDING_API_BASE` 上失败；本轮 3 个正式 Retrieval 回归案例均在 Embedding
  层失败，未进入 Evidence、正文生成、章节修订、Copilot 或 Word，且未重试。
- Track C — Deterministic / Offline Product Acceptance：`PASS`（已达到范围内）。

Stage20 当前并行推进 Corpus Readiness L3：以业务问题覆盖、来源权威性、有效期、
使用许可、可追溯性和人工审核覆盖衡量语料是否可支撑投标业务，不以文档数量替代
验收。当前 L3 为 `IN_PROGRESS`；Stage17 检索架构保持冻结，详见
`docs/RAG_CORPUS_L3_PLAN.md` 与 `npm run eval:corpus-l3 -w backend`。
已完成真实官方摘录扩展入库：通用资料 10 份、政企平台 15 份、医疗行业 15 份，
共 40 份 ACTIVE_EXCERPT，预计 120 个 chunk，全部经过来源复核、处理、索引和脱敏摘录审计。
真实公共语料离线评测：业务问题覆盖 100%、Recall@5 100%、MRR 1.000、来源可追溯
100%、范围违规 0%、无答案准确率 100%。整体 L3 仍为 `IN_PROGRESS`：官方语料数量
已达到各范围的下限，合成企业基线仍单独保留；更广泛的问题覆盖和冻结的检索基线仍未达标，
未以摘录评测替代完整正文授权。

### Stage20 public E2E evidence (2026-08-22)

- Representative tender: public 江阴市国有企业集中采购 PDF (政企/智慧城市项目)，
  project `91ab7f01-2bfb-4d49-8a81-ddfcb20ee903`。
- Tender parse job `1e5d7007-ad2d-4121-8929-2257d7a95dd6` succeeded in 122,728 ms;
  4/4 chunks, 144 candidates, 140 mandatory, 0 parse warnings, 130 verified / 10 suggested /
  4 unresolved source locations. After explicit review decisions, 140 requirements were frozen
  in the confirmed baseline; no requirement text or ID was changed.
- 17 fictional `杭州景云数科有限公司` materials were imported through
  `CompanyMaterialService` into the project and indexed. The first retrieval call used
  GENERAL + GOVERNMENT_ENTERPRISE + ENTERPRISE_PRIVATE scope with the existing embedding
  configuration, but failed with safe code `EMBEDDING_NETWORK_ERROR` after 67 ms.
- No real Writer/Provider generation, Copilot, Bid Check, or Word export was started after
  the retrieval blocker; no automatic retry was performed. The remaining action is to restore
  the existing Embedding endpoint/network, then rerun the explicitly authorized E2E once.

验收产物：`docs/STAGE20_PRODUCTION_BETA_ACCEPTANCE.md` 与离线合成 E2E 夹具。
Stage 19 及之前的冻结规则继续有效。

## Stage 19 — Bid Copilot Guided Actions / Safe Execution

Priority: **P1**
Status: **PASS / FROZEN**

Stage 18 remains **PASS / FROZEN** below.

Stage 19 extends the contextual assistant with bounded, reversible actions over
existing formal services. Every action is context-bound, risk-classified,
idempotent where needed, validated after execution, and auditable. Formal
business decisions remain human-only. Engineering acceptance is complete;
manual formal decisions remain in the existing workbench.

Stage 16 — Document Delivery & Word V1 is **PASS / FROZEN**.
Manual TOC Acceptance: **PASS**
System Default Page Policy: **PASS**
The system default page policy is frozen: the cover hides its page number,
the TOC starts visible numbering at 1, and the body inherits the TOC sequence
without restarting. The representative DOCX contains a real updateable TOC
field with cached entries and native section numbering.

Stage 13 — Material Processing / Review UX, Stage 14 — Platform Shell & Core
Flow IA, and Stage 15 — Generation Workbench V1 remain frozen with acceptance
**PASS**. Stage 16 Word Foundation and the page-number calibration are frozen
after consolidated OOXML, backend, frontend, PostgreSQL, build, lint and diff
checks passed.

## Stage 17 goal

将企业资料库从材料存储与处理能力推进为可追溯、可评测、受项目范围约束
的检索能力。检索只产生候选证据，不产生正式事实或承诺。

```text
Bid Document Model → Format Policy → DOCX Renderer
```

## Frozen foundation

- valid heading hierarchy / duplicate-heading prevention；
- Word automatic numbering with SPACE suffix；
- natural pagination, heading keepNext/keepLines, body widow/orphan；
- Chinese EastAsia font mapping and centralized paragraph policy；
- table width/padding/repeated headers/cantSplit；
- section/page numbering, metadata allow-list and document structure validation；
- formal version linkage。
- TOC 缓存条目不包含伪造页码；Word/WPS/LibreOffice 仍负责最终页码更新；
- 表格只有 `header_row_index` 指定的行可重复，其他行不写入 `tblHeader`。

上述规则未经具体回归证据不得重新设计。

## Frozen Stage 16 acceptance

- Cover page number hidden;
- TOC visible page number starts at 1;
- Body inherits numbering and does not restart;
- TOC cached entries and updateable field are present;
- heading hierarchy, numbering, pagination, tables and metadata allow-list
  remain covered by the consolidated OOXML acceptance.

## Stage 17 acceptance result

- enterprise materials can be processed and indexed;
- retrieval preserves material/document/chunk/source lineage;
- project and selected-material scope filtering is enforced;
- no-answer is explicit;
- deterministic retrieval evaluation reports Recall@5 **90%**, MRR **1.000**,
  source traceability **100%**, scope violation **0%**, duplicate retrieval
  **0%**, and no-answer accuracy **100%**;
- retrieval cannot bypass Evidence, Fact, Mapping, Claim Gate or Writer auth;
- backend, frontend, PostgreSQL, build, lint and diff checks all pass.

## Stage 19 goal

让用户可以安全执行可逆的准备和检查动作，并对章节修订先预览差异、再由
正式服务应用；Agent 不直接写数据库、不覆盖旧版本、不把检索候选升级为
正式事实或 Claim。

## Stage 19 acceptance target

- safe action tools and centralized L0–L4 execution authorization;
- bounded multi-step execution with exact partial-failure reporting;
- chapter revision preview/diff, validation and stale-preview protection;
- idempotent action execution and post-action authoritative re-read;
- structured human decisions for L4 blockers;
- Agent Eval V2 and prompt-injection action safety tests;
- full backend/frontend/PostgreSQL/retrieval/eval/build/lint regression.

## Stage 19 acceptance result

- Safe L0/L1 refresh, retrieval and bid-check actions execute only through
  formal services; L2 actions prepare/validate without mutation;
- L3 chapter changes require a persisted preview, current-version hash match
  and explicit human approval, then create a new version through the formal
  document service;
- L4 approvals, rejections, overrides and Claim Gate bypasses remain
  `HUMAN_REQUIRED` and are audited without execution;
- action previews expose business-readable Original / Proposed / Diff, with
  stale-preview protection, bounded eight-step plans and idempotent replay;
- migration 040 persists previews and action audits, and project-scoped HTTP
  endpoints expose only safe preview fields;
- Agent Eval V2: 12/12 cases, pass rate 100%, stale prevention 100%,
  idempotency 100%, unauthorized mutation 0, prompt-injection action
  violation 0, partial-failure reporting 100%;
- backend 502 tests, frontend 47 tests, PostgreSQL 40 tests, retrieval eval,
  build, lint and diff checks pass. No external AI calls, push, merge or
  deployment were used.

## Stage 18 goal

让普通投标人员可以在项目上下文中询问“还缺什么、为什么不能生成、哪些材料
可以证明”，并得到基于正式服务的可追溯解释、待办和导航动作。初期仅提供
只读工具、上下文解析、动作风险门禁、执行审计和确定性评测；不新增 AI
提供商、不自动确认 Evidence/Mapping/Claim/Project Fact/Writer。

## Stage 18 acceptance target

- explicit project context resolver and authoritative read tools;
- deterministic L0–L4 action policy with formal decisions requiring humans;
- primary next-step, generation-blocker and requirement-material scenarios;
- candidate material results remain distinct from confirmed proof;
- prompt injection content remains data and cannot alter policy;
- execution trace, ten-case deterministic eval and full regression pass.

## Stage 18 acceptance result

- explicit context, read-only formal tools and safe navigation are available;
- L0–L4 action policy blocks automatic formal decisions and Claim Gate bypass;
- next-step, generation-blocker and requirement-material scenarios are covered;
- retrieval candidates remain distinct from confirmed proof;
- prompt-injection and context-mismatch tests pass;
- execution audit migration 039 and ten-case offline evaluation pass;
- backend 497 tests, frontend 45 tests, PostgreSQL 39 tests, build, lint and
  diff checks pass.

Stage 18 is **PASS / FROZEN**. No external AI calls, new providers, private
data scope, push, merge or deployment were used.

## Stop conditions

不修改已冻结 Word 基线；不修改 Writer、Claim Gate、Evidence/Fact/Mapping、
semantic gateway 或业务 Contract；不调用外部 AI；不新增 Provider/私有数据
范围；不自动批准、不绕过正式门禁；不直接数据库写入；不推送、不合并、
不部署。
