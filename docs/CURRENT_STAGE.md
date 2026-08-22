# Current Stage

## Stage 16-R2 — Word Foundation Baseline Hardening

Priority: **P1**
Status: **ACTIVE**

Stage 13 — Material Processing / Review UX, Stage 14 — Platform Shell & Core
Flow IA, and Stage 15 — Generation Workbench V1 remain frozen with acceptance
**PASS**. Stage 16-R1 format policy and browser export remain valid; real Office
visual acceptance is still pending.

## Goal

建立并验证 Word 基础排版基线，停止按单个视觉症状逐项修补。基础规则由
`docs/WORD_FOUNDATION_BASELINE.md` 集中说明，正式链路仍为：

```text
Bid Document Model → Format Policy → DOCX Renderer
```

## Scope

- 连续 H1/H2/H3、重复章节和非法内容块的确定性预检；
- Word 自动多级编号与 SPACE 后缀；
- 默认自然分页、标题 keep-with-next/keep-lines、正文 widow/orphan；
- 中文 EastAsia 字体映射、段落基础、表格宽度/内边距/表头/行拆分；
- cover/TOC/body section、正文页码从 1 开始、元数据 allow-list；
- 真实 TOC 字段及其 Word/WPS 更新限制；
- 一套集中 OOXML 结构验收和一个最终代表性 DOCX。

## Acceptance status

- `backend/test/word-foundation-acceptance.test.js` 与全量回归通过；
- 导出 `uploads/stage16-word-foundation-final.docx`；
- 自动验收覆盖结构、编号、分页策略、字体、段落、表格、section、页码、TOC
  字段和元数据安全；
- 真实 Office 的分页、字体回退、目录页码和表格视觉仍需一次人工验收。

## Stop conditions

不修改 Writer、Claim Gate、Evidence/Fact/Mapping、semantic gateway 或业务
Contract；不安装 Office，不调用外部 AI，不开始 RAG/Agent/Permission；不推送、
不合并、不部署。无 ADR 或 roadmap 变更。
