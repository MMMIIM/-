# Current Stage

## Stage 16-R1 — Real Bid Formatting Baseline

Priority: **P1**
Status: **ACTIVE**

Stage 13 — Material Processing / Review UX, Stage 14 — Platform Shell & Core
Flow IA, and Stage 15 — Generation Workbench V1 are frozen with acceptance
**PASS**.

## Goal

Upgrade the existing Word delivery artifact from a technically valid DOCX to
a conservative professional Chinese government/enterprise technical-bid
baseline without changing semantic control-plane contracts:

```text
正式版本 → 文档模型 → 专业格式策略 → DOCX → 可下载 Word → 版本追溯
```

Users should be able to understand that the current checked version is ready
for delivery, download a professional Word file, and trace it back to the
project version without seeing renderer or OOXML concepts.

## Stage 16-R1 scope

- 复用现有 MIT `docx@9.6.1` renderer；
- 集中管理 A4、宋体/黑体、段落、表格、封面、目录和页码策略；
- 结构化投影 Project Fact，仅允许已知正式字段进入封面；
- 不自动输出通用技术 Project Fact 表，不输出内部/合成元数据；
- 客户模板、Tender Format Profile、Agent、RAG、权限和外部模型均不在本阶段。

## Acceptance status

Stage 16-R1 implementation is complete for the local MVP. The new
representative fixture structurally verifies a professional cover, visible
`目 录` area plus updateable TOC field, three heading levels, deterministic
numbering, Chinese fonts, body-width-bounded table and explicit cell padding,
header/footer, body page-number restart, and metadata-free formal projection.
Browser export acceptance also passes on the normal local app: the action is
visible only in 投标检查, the formal version is `V1 · 技术响应 V1`, and the
download feedback is `技术标-V1.docx` when the project has no formal display
name. No internal IDs, hashes, synthetic markers or generic Project Fact dump
are included in the formal document.

No Word/WPS/LibreOffice executable is available locally, so real Office visual
acceptance remains blocked by environment. Stage 16-R1 stays ACTIVE until a
compatible Office application is used to open the new fixture and validate
layout/editability. The reuse spike, architecture decision and default format
strategy are recorded in `docs/WORD_REUSE_SPIKE.md`,
`docs/decisions/007-document-model-docx-renderer.md` and
`docs/WORD_FORMAT_STRATEGY.md`.

## Stop conditions

Stop before any external model/provider call, contract semantic change, new
formal business state, queue/worker infrastructure, destructive DB/Git action,
merge, push, or deploy.

External authorization: **none**. External AI calls: **0**. ADR: **007**.
Roadmap change: **none in Stage 16-R1**. Merge, push, and deploy: **none**.
