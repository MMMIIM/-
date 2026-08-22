# Stage 17 — 企业资料库检索现状与边界

## 已有链路

当前代码已经提供以下生产形态链路，未新建第二套资料服务：

```text
企业材料上传
  → 本地文本提取
  → material_chunks（保留偏移、页码/段落、chunk_hash、chunker_version）
  → material_chunk_embeddings（model/version/dimension 与 chunk_hash 绑定）
  → EnterpriseRetrievalService
  → enterprise_retrieval_runs / enterprise_retrieval_results
  → Evidence Source Span
  → Evidence Candidate / Review
```

主要实现位置：

- `backend/src/company-material-service.js`：文件校验、提取、材料生命周期和幂等分块；
- `backend/src/pipeline/enterprise-material-chunker.js`：确定性段落分块与稳定 chunk ID；
- `backend/src/pipeline/embedding-client.js`：可替换的 OpenAI-compatible embedding client；
- `backend/src/pipeline/enterprise-retrieval-service.js`：只使用已确认 Canonical Requirement 的检索调度；
- `backend/src/db.js` 与 migrations `019/020/025`：材料、分块、索引版本、检索运行和来源范围持久化；
- `backend/src/pipeline/evidence-source-context-resolver.js`：从真实 chunk 重建可审计 Source Span；
- `frontend/src/material-processing-center.jsx` / `evidence-review.jsx`：以“企业资料库”“材料证明”“需求匹配”呈现用户工作流，技术诊断仅在高级信息中出现。

## 安全边界

- 检索查询只能来自已确认的 Canonical Requirement，客户端不能覆盖 query text；
- `material_ids` 与 `material_types` 均由后端校验，并与 Requirement 所属 project 一起过滤；
- 每个结果返回 material/document/chunk/source span lineage 和检索审计信息；
- 相关程度只用于排序，不被投影为事实可信度或 Claim permission；
- `NO_RELEVANT_EVIDENCE` 是显式结果状态；检索不会自动创建 approved Evidence、Fact、Mapping 或 Claim；
- 历史标书保留 `reference_only` 风险，不得进入正式企业能力事实；
- embedding provider 通过注入的 client 替换，当前未引入新的外部 provider。

## 评测

`backend/eval/retrieval-eval/benchmark.js` 和 `backend/test/retrieval-eval.test.js` 提供无网络确定性评测，覆盖：

1. 精确事实查找；
2. 语义改写；
3. 资质/证书；
4. 产品能力；
5. 相似但不支持；
6. 项目范围外材料；
7. 近重复材料；
8. 无答案。

运行 `npm run eval:retrieval -w backend` 输出机器可读 JSON 与摘要。评测报告至少包含 Recall@5、MRR、来源可追溯率、范围违规率、重复检索率和 no-answer 准确率。评测只使用脱敏合成 fixture，不访问网络、不调用模型。

## 尚未扩大范围

当前没有新增全文检索引擎、搜索集群、Agent 或新的外部模型。是否需要 lexical/hybrid retrieval 需以后用固定评测证据决定；在没有指标证明前保留现有可替换 embedding/index 路径。
