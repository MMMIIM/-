# Current Stage

## Stage 20 — Production Beta Hardening / Real E2E

Priority: **P0/P1**
Status: **PARTIAL / BLOCKED — EXTERNAL_PROVIDER_AUTHORIZATION_REQUIRED**

本阶段只验证现有产品能力能否作为一条可恢复、可追溯的完整业务流运行：
项目准备 → 招标解析 → 需求基线 → 材料检索与复核 → 生成准备 → 标书生成 →
章节复核/安全修订 → 投标检查 → Word 导出。禁止新增 AI 能力、Provider、Agent
自治或部署基础设施；外部 Provider 在本阶段默认不调用，若已有授权路径不可用则
记录为运营阻断而不改变架构。

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
