# System Architecture

This is the repository architecture source of truth. The V4.3-specific
semantic routing supplement is maintained in
[`docs/v4.3-semantic-architecture.md`](docs/v4.3-semantic-architecture.md).

## Formal production chain

```text
Canonical Requirement
→ Production Retrieval
→ Evidence Source Span
→ Evidence Review
→ Evidence Fact
→ Requirement-Evidence Mapping
→ Claim Assertion
→ Claim Gate
→ Project Fact
→ Propagation
→ Writer Authorization
→ Writer Safe Context
→ Writer
→ Mention Ledger
→ Critical Guard
→ Coverage Verification
```

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
