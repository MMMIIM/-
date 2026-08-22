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
