# Current Stage

## Stage 16 — Document Delivery & Word

Priority: **P1**
Status: **FREEZE_PENDING_MANUAL_ACCEPTANCE**

Stage 13 — Material Processing / Review UX, Stage 14 — Platform Shell & Core
Flow IA, and Stage 15 — Generation Workbench V1 remain frozen with acceptance
**PASS**. Word Foundation Engineering and consolidated OOXML acceptance are
**PASS**; only real Office visual acceptance remains.

## Goal

Stage 16 的 Word 基础排版工程已冻结。唯一剩余门禁是使用
`uploads/stage16-word-foundation-final.docx` 在 Microsoft Word、WPS Office
或 LibreOffice Writer 中完成一次真实视觉验收。

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

上述规则未经具体回归证据不得重新设计。

## Manual acceptance gate

- 只检查自动化无法证明的真实分页、字体回退、正文密度、表格跨页、TOC 更新
  与最终页码、封面/目录/正文 section、页眉页脚和可编辑性；
- TOC 是真实 Word 字段，最终页码必须由 Office 更新；不实现伪造页码；
- 若验收通过，更新本文件为 `PASS / FROZEN` 并返回 STATUS CHECKPOINT；
- 若发现问题，先记录 Office 引擎、页面/章节、症状、分类和严重度，不立即改码。

## Stop conditions

不修改已冻结 Word 基线，不生成 R1.4/R1.5 文件，不安装系统软件；不修改
Writer、Claim Gate、Evidence/Fact/Mapping、semantic gateway 或业务 Contract；
不调用外部 AI，不开始 Stage 17/RAG/Agent/Permission；不推送、不合并、不部署。
