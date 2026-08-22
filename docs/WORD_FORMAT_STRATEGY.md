# Word Format Strategy

Stage 16-R1 implements one conservative system-default Chinese technical-bid
format. It is intentionally separate from tender semantics and from the
semantic control plane.

Priority for future profiles:

```text
Tender-specific explicit format requirements
  > Enterprise/customer template
  > System default format
```

The current default uses A4, 宋体 body text, 黑体 headings, deterministic
heading numbering, a dedicated visible `目 录` area backed by a real
Word-updateable TOC field, body-width-bounded tables, explicit cell padding,
and a cover page without a visible page number. The body section starts page
numbering at 1. Word/WPS may require the user to choose “更新目录/更新域” to
resolve final page references; the exported file still contains a visible TOC
title and explanatory placeholder before that refresh.

Formal Project Facts are projected only into known display fields such as
项目名称、项目编号、投标人 and 项目周期. Unknown, technical, object-valued,
synthetic or audit fields are not dumped into the formal document.

Future `TenderFormatProfile` / enterprise-template support may override:

- font family and size;
- line and paragraph spacing;
- page margins and paper size;
- TOC/header/footer requirements;
- cover and page-number rules;
- table style and page limits.

Automatic tender-format extraction, template management UI and custom renderer
implementations are out of scope for Stage 16-R1.

