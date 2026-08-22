# Word Format Strategy

Stage 16-R1.1 defines one product-owned fallback profile:
`SYSTEM_DEFAULT_TECHNICAL_BID_V1`.

Format priority is:

```text
Tender explicit rule > Enterprise/customer template > System default format
```

There is no universal Chinese bid format. The system default is a conservative
technical-bid baseline and must yield to an explicit tender rule or an approved
enterprise template when those are introduced.

The default profile uses A4 portrait, 2.5 cm top/right/bottom margins and a
3.0 cm left margin, 宋体 12 pt body text, 黑体 16/14/12 pt Heading 1/2/3,
two-Chinese-character first-line indentation, 1.5 line spacing, and zero
paragraph before/after spacing. Tables use 宋体 10.5 pt, explicit padding and
the usable body width. Cover, TOC, header/footer and body page-number behavior
are explicit policy sections rather than renderer constants.

Format inventory: `document-format-policy.js` owns page geometry, type scale,
semantic spacing, numbering tokens, table geometry, TOC, section and page
furniture values; `docx-renderer.js` only maps those values to DOCX/OOXML. The
Bid Document Model supplies content and formal field projection, not visual
format decisions.

These are verified reference patterns, not universal truths: 宋体/黑体,
小四/四号/三号, two-character indentation, zero paragraph spacing, 1.5x or
fixed-point line spacing, and tender-specific TOC/header/footer requirements
all occur in real bid documents. Unknown requirements remain unknown.

Future `TenderFormatProfile` and enterprise-template support may override page
geometry, fonts, spacing, heading tiers, tables, TOC/header/footer and page
number rules. Such overrides must be traceable to explicit source text,
source clause/location and a deterministic or reviewed interpretation. No
automatic tender-format extraction or template UI is implemented here.
