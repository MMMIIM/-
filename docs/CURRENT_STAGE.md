# Current Stage

## Stage 16-R1.3 — Chapter Pagination Fix

Priority: **P1**
Status: **ACTIVE**

Stage 13 — Material Processing / Review UX, Stage 14 — Platform Shell & Core
Flow IA, and Stage 15 — Generation Workbench V1 remain frozen with acceptance
**PASS**. Stage 16-R1.1 format policy and browser export remain valid; real
Office visual acceptance is still pending.

## Goal

Ensure the document model handed to the DOCX renderer has a continuous heading
hierarchy and that top-level chapters begin with their Heading 1. Standalone
page-break blocks must not strand a normal paragraph before the next chapter.

```text
Chapter (H1) → Section (H2) → Subsection (H3)
```

## Scope

- normalize and validate heading levels in the Bid Document Model;
- use a normal-space numbering suffix with restrained H1/H2/H3 indentation;
- bind default chapter pagination to `Heading1` with `pageBreakBefore`;
- preserve paragraph ownership and avoid standalone rendered page breaks;
- preserve renderer-owned deterministic numbering, TOC behavior, typography,
  table layout, cover, page numbering and metadata projection;
- keep the fix independent from Requirement, Evidence, Fact, Mapping, Claim
  Gate, Writer and Generation semantics.

## Acceptance status

Heading, numbering and pagination tests plus representative DOCX structural
validation must pass. Browser export remains covered by the existing Stage 16
flow. Real Office visual acceptance remains required in Microsoft Word, WPS
Office or LibreOffice Writer; do not claim final freeze without that check.

## Stop conditions

No external AI calls, Office installation, merge, push or deploy. Do not start
Stage 17. No ADR or roadmap change is required.
