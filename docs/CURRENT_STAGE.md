# Current Stage

## Stage 16 — Document Delivery & Word V1

Priority: **P1**
Status: **ACTIVE**

Stage 13 — Material Processing / Review UX, Stage 14 — Platform Shell & Core
Flow IA, and Stage 15 — Generation Workbench V1 are frozen with acceptance
**PASS**.

## Goal

Turn a formally checked, project-associated generated version into a traceable
Word delivery artifact inside the accepted project flow:

```text
正式版本 → 文档模型 → 专业格式策略 → DOCX → 可下载 Word → 版本追溯
```

Users should be able to understand that the current checked version is ready
for delivery, download a professional Word file, and trace it back to the
project version without seeing renderer or OOXML concepts.

## Stage 16 scope

- 复用 MIT `docx` 生成真实 DOCX；
- 后端拥有 `BidDocumentModel`、格式策略、版本关联和导出审计；
- 使用真实 Heading 样式、稳定编号、可更新目录字段、段落、表格、页眉页脚和分页；
- 仅使用当前项目已经通过现有风险检查且未失效的正式版本；
- 一个内置专业默认模板；客户模板、浏览器 Word 克隆、Agent、RAG、权限和外部模型均不在本阶段。

## Acceptance status

Stage 16 implementation is complete for the local MVP. Browser acceptance
passed on the normal local app after restarting the long-running backend:
the export action is visible only in the 投标检查 context, the current
formal version is shown as `V1 · 技术响应 V1`, a single click returns a
business-readable `.docx` filename, the UI reports a user-readable success,
and refresh preserves the export entry point. The exported file was also
structurally verified (DOCX ZIP, Chinese text, Heading styles, updateable TOC
field, numbering definition, table, page break, header and PAGE footer field).
The local render helper could not complete page PNG QA because no
LibreOffice/soffice executable is installed; Stage 16 therefore remains
ACTIVE until a compatible Word processor is available for manual open and
layout acceptance. The reuse spike and architecture decision
are recorded in `docs/WORD_REUSE_SPIKE.md` and
`docs/decisions/007-document-model-docx-renderer.md`.

## Stop conditions

Stop before any external model/provider call, contract semantic change, new
formal business state, queue/worker infrastructure, destructive DB/Git action,
merge, push, or deploy.

External authorization: **none**. External AI calls: **0**. ADR: **007**.
Roadmap change: **yes**. Merge, push, and deploy: **none**.
