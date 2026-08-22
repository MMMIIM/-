# Current Stage

## Stage 17 — Enterprise Knowledge / RAG Productization

Priority: **P1**
Status: **IN_PROGRESS**

Stage 16 — Document Delivery & Word V1 is **PASS / FROZEN**.
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

## Stage 17 acceptance gate

- enterprise materials can be processed and indexed;
- retrieval preserves material/document/chunk/source lineage;
- project and selected-material scope filtering is enforced;
- no-answer is explicit;
- deterministic retrieval evaluation reports Recall@K and ranking quality;
- retrieval cannot bypass Evidence, Fact, Mapping, Claim Gate or Writer auth.

## Stop conditions

不修改已冻结 Word 基线；不修改 Writer、Claim Gate、Evidence/Fact/Mapping、
semantic gateway 或业务 Contract；不调用外部 AI；不开始 Agent/Permission；
不推送、不合并、不部署。
