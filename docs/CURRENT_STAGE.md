# Current Stage

## Stage 16 — Word Foundation Final Defect Closure

Priority: **P1**
Status: **DEFECT_CLOSURE_PENDING_OFFICE_ACCEPTANCE**

Stage 13 — Material Processing / Review UX, Stage 14 — Platform Shell & Core
Flow IA, and Stage 15 — Generation Workbench V1 remain frozen with acceptance
**PASS**. LibreOffice evidence exposed an empty TOC and over-broad table header
semantics; both deterministic fixes are implemented and require v2 Office
re-render confirmation.

## Goal

仅关闭已证实的两个交付缺陷：使用 `cachedEntries` 让一个真实 TOC 字段在
首次打开即可显示标题条目，并让 `tblHeader` 只出现在结构化语义表头行。
其他 Word 基线继续冻结。

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

## Acceptance gate

- OOXML acceptance 必须确认缓存条目、无占位提示、恰好一个 semantic `tblHeader`；
- 使用 `uploads/stage16-word-foundation-final-v2.docx` 在 LibreOffice、Word 或 WPS
  中重渲染，确认目录可见且更新后页码正常；
- 若 v2 验收通过，更新本文件为 `PASS / FROZEN` 并返回 STATUS CHECKPOINT；
- 若发现问题，先记录 Office 引擎、页面/章节、症状、分类和严重度，不立即改码。

## Stop conditions

不修改已冻结 Word 基线，不生成 R1.4/R1.5 文件，不安装系统软件；不修改
Writer、Claim Gate、Evidence/Fact/Mapping、semantic gateway 或业务 Contract；
不调用外部 AI，不开始 Stage 17/RAG/Agent/Permission；不推送、不合并、不部署。
