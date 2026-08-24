# System Architecture

This is the repository architecture source of truth. The V4.3-specific
semantic routing supplement is maintained in
[`docs/v4.3-semantic-architecture.md`](docs/v4.3-semantic-architecture.md).
Evaluation governance is maintained separately in
[`docs/EVAL_POLICY.md`](docs/EVAL_POLICY.md).

## Formal production chain

```text
Canonical Requirement
→ Retrieval Intent / Evidence Scope
→ Retrieval Candidate
→ Evidence-Bearing Chunk
→ Exact Candidate Evidence Span
→ Bounded Evidence Context Recovery
→ Evidence Span Qualification
→ EvidenceSupportAssessment
→ Human Evidence Review
→ Approved Evidence Fact
→ Formal Requirement ↔ Evidence Fact Mapping
→ Claim Gate
→ Writer Authorization
→ Generated Response
→ Grounding / Bid Check
```

The downstream document path remains responsible for the approved response,
Mention Ledger, Critical Guard and Coverage Verification. Retrieval and
assessment never grant those permissions implicitly.

## Evidence semantics and bounded recovery

Retrieval relevance is not evidence. A Retrieval Candidate is not an Evidence
Fact, an Evidence Fact is not a Formal Mapping, a Formal Mapping is not a Safe
Claim, and a Safe Claim is not a correct final document. An Evidence-Bearing
Chunk is a retrievable unit that contains a usable source; it is still subject
to span qualification and human review.

An **Evidence Span** is the smallest complete semantic unit that can support a
verifiable fact judgment. Keywords, titles, front matter, metadata, IDs,
subject headers, isolated numbers, certification names or project names do not
qualify by themselves. There is no minimum-length shortcut: a semantically
complete table row such as `PostgreSQL | 支持` may qualify.

`EXACT_EVIDENCE_SPAN` is the auditable citation used for hashes, traceability
and support observations. `EVIDENCE_CONTEXT_WINDOW` supplies subject, entity,
scope, status, validity, unit, table-header and section meaning. Context never
silently replaces or enlarges the exact citation, and every recovered
dimension retains provenance.

When a span is incomplete, the control plane performs bounded recovery before
classifying a gap: same sentence/table row, same paragraph/table, section
heading, same chunk, adjacent chunk in the same document, authoritative
material metadata, and only then a same-scope retrieval expansion. It never
crosses material or document boundaries without explicit lineage. Internal
recovery states are `RESOLVED_BY_CONTEXT`,
`RESOLVED_BY_RETRIEVAL_EXPANSION`, `UNRESOLVED_AFTER_CONTEXT` and
`UNRESOLVED_AFTER_RETRIEVAL`; these are not replacements for user-facing
business statuses.

Evidence relevance and evidence capability are separate dimensions. Industry
reference, government standards and third-party capability may be relevant
context, but enterprise capability, qualification, project-experience and
product-capability proof must come from an allowed enterprise-owned scope.

Missing evidence is not adverse evidence. A missing value remains an evidence
gap; an observed quantitative, status or categorical mismatch is an adverse
fact. Universal requirements (`all`, `全部`, `均`, `所有`) cannot be supported
when evidence contains failed, incomplete, unverified, unknown or mismatching
values. `CONFLICTING_EVIDENCE` requires the same fact dimension to have two
observed, unequal values; a missing second value is not a conflict.

Technical failures such as provider timeout, network failure, invalid output
schema or invalid support span are never converted into business truth. They
remain `ASSESSMENT_UNAVAILABLE` with the technical error code preserved.

## Knowledge & material architecture

用户在“企业资料库”中看到三个业务范围：

- `GENERAL` → 通用资料
- `INDUSTRY` → 行业资料（首批：`GOVERNMENT_ENTERPRISE` 政企平台、`HEALTHCARE` 医疗行业）
- `ENTERPRISE_PRIVATE` → 企业资料

三个范围共用一套资料与检索基础设施：

```text
Material → Parsed Document → Chunk → Search Index → Retrieval → Evidence Candidate
```

候选证据仍必须进入正式控制面：

```text
Evidence Candidate → Evidence Review → Evidence Fact
→ Requirement-Evidence Mapping → Claim Gate → Writer Authorization
```

`Relevant` 不等于 `Evidence`，`Evidence` 不等于 `Approved Fact`，
`Approved Fact` 也不等于 `Safe Claim`。通用或行业资料只能提供受范围约束的候选依据，
不得静默升级为企业能力或批准的 Claim。

## Corpus governance and readiness

公共语料遵循受控生命周期：

```text
DISCOVERED → SCREENED → APPROVED_FOR_PROCESSING → PROCESSED → EVAL_PASSED → ACTIVE
```

只有 `ACTIVE` 内容进入正式 Production Retrieval。`REFERENCE_ONLY`、`REJECTED`、
`SUPERSEDED` 和 `EXPIRED` 是非活动分类，不参与正常检索。

Stage 17 的 Retrieval Engine 已冻结；它与 Corpus Readiness 分开验收。当前目标是
Corpus Readiness `L3 — BID-USABLE`，由业务覆盖、检索质量、来源可追溯性、范围安全、
当前性、无答案行为以及审核/使用状态完整性衡量，而不是由文档数量决定。详细阈值和
评测方法见 [`docs/RAG_CORPUS_L3_PLAN.md`](docs/RAG_CORPUS_L3_PLAN.md)。

## Responsibilities

- **Canonical Requirement** is the frozen scope baseline and source of coverage.
- **Production Retrieval** finds candidate material; retrieval is not evidence.
- **Evidence Source Span** preserves the exact material location and lineage.
- **Evidence Review** records a human decision about whether a source is usable.
- **Evidence Fact** is the reviewed, bounded statement supported by material.
- **Requirement-Evidence Mapping** records how a requirement is supported,
  partially supported, or left unsupported.
- **Claim Assertion** is a proposed bid statement with explicit requirement and
  evidence basis.
- **Claim Gate** rejects unsupported, unsafe, or out-of-scope commitments.
- **Project Fact** is an approved project-level value used consistently across
  downstream outputs.
- **Propagation** invalidates affected downstream results after fact changes.
- **Writer Authorization** limits what a writer may consume and assert.
- **Writer Safe Context** is the bounded, hashed input context for a writer run.
- **Writer** produces a candidate document response; it does not finalize state.
- **Mention Ledger** records where approved material is cited in the document.
- **Critical Guard** blocks unauthorized or unsupported critical assertions.
- **Coverage Verification** checks that required approved content is represented.

## Control-plane boundaries

Backend is the formal Control Plane. It owns state, validation, authorization,
lineage, audit, versioning, and deterministic propagation. LLMs and providers
are replaceable execution resources that may discover or draft uncertain
content, but their output cannot directly become formal business state.

Prompts are backend-owned business instructions and are versioned independently
of models. Provider adapters contain only provider/model capability differences;
they do not define business rules or bypass validation.

The verified architectural invariants are: facts remain traceable to sources;
model output is never itself formal approval; changing a fact invalidates
affected downstream results; propagation is deterministic; and Writer cannot
bypass Claim Gate or authorization.

## Semantic execution boundary

The semantic execution topology is:

```text
Backend Control Plane → Standalone Semantic Gateway → Provider Adapter → Model
```

The Backend owns task selection, validation, lineage and lifecycle state.
Provider and model choices remain adapter concerns. Dify is a
`LEGACY_DIFY_PROVIDER_SHIM` only; the compatibility `/workflows/run` transport
does not make Dify a core runtime dependency. No semantic task may bypass the
Backend Control Plane or create Evidence, Fact, Mapping, Claim, Readiness or
Writer state directly.
