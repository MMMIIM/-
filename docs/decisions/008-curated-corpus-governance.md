# ADR 008：Curated Corpus Scope and Governance

状态：Accepted（Stage 20）

## Context

企业资料库需要同时承载通用法规/政策、行业资料和企业私有材料。检索基础设施
应保持统一，但来源权威性、使用范围、当前性和企业能力证明边界不能混在一起。
仅有资料数量或检索相关性，不能证明知识库已经可用于投标。

## Decision

- 资料库固定提供三个业务范围：`GENERAL`、`INDUSTRY`、`ENTERPRISE_PRIVATE`。
- 首批行业范围为 `GOVERNMENT_ENTERPRISE` 和 `HEALTHCARE`。
- 三个范围共用一套 Material、Parsed Document、Chunk、Search Index 和 Retrieval
  基础设施，不创建三套独立 RAG 系统。
- 公共语料使用受控激活生命周期：
  `DISCOVERED → SCREENED → APPROVED_FOR_PROCESSING → PROCESSED → EVAL_PASSED → ACTIVE`。
- 只有 `ACTIVE` 内容进入正式 Production Retrieval；`REFERENCE_ONLY`、`REJECTED`、
  `SUPERSEDED`、`EXPIRED` 不参与正常检索。
- Corpus Readiness L3 是知识库达到可用于投标的成熟度目标，按业务覆盖、检索质量、
  来源可追溯性、范围安全、当前性、无答案行为和审核/使用状态完整性评估。
- 官方权威资料优先用于法规和行业知识；企业私有材料仍是企业能力证据的主要来源。
- 开源内容只能作为补充技术参考，不能自动成为权威合规知识。
- 相关性、候选证据、已审核事实和安全 Claim 继续分层管理，通用/行业资料不得静默
  升级为企业能力或 Approved Claim。

## Consequences

- 资料库 UI 可以用通用资料、行业资料、企业资料表达范围，而不暴露检索实现细节。
- 公共语料入库必须保留来源、版本、使用状态和评测血缘；权利不清时只能使用摘录或
  参考记录，不能冒充可再分发全文。
- Retrieval Engine 与 Corpus Readiness 独立验收；引入新资料优先解决已证实的业务覆盖缺口，
  不因语料不足而直接重构检索架构。
- 企业材料、Evidence、Fact、Mapping 和 Claim 的正式审批边界保持不变。
