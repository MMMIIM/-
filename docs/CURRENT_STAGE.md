# Current Stage

## Stage 18 — Bid Copilot / Agent Foundation

Priority: **P1**
Status: **PASS / FROZEN**

Stage 18 is a contextual orchestration layer over the formal Control Plane.
It may read, explain, prioritize and navigate through existing authoritative
services, but it never becomes a second source of truth, bypasses Claim Gate,
or makes formal approvals.

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
data scope, push, merge or deployment were used. The next stage requires a new
GPT Decision.

## Stop conditions

不修改已冻结 Word 基线；不修改 Writer、Claim Gate、Evidence/Fact/Mapping、
semantic gateway 或业务 Contract；不调用外部 AI；不新增 Provider/私有数据
范围；不自动批准、不绕过正式门禁；不推送、不合并、不部署。
