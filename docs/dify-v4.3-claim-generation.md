# Dify v4.3 Claim Generation 配置

本 Workflow 只承担 `claim_generation`。后端负责稳定 Claim-ID、合法依据校验、章节覆盖、Claim Gate、Coverage 和 Writer 隔离。

## Start 输入变量

三个必填 String：`task_type`、`task_instruction`、`task_payload_json`。`task_type` 必须为 `claim_generation`。payload 只包含已确认 writer-eligible Requirement、已验证 Plan 和 approved Evidence。

## System Prompt（可复制）

```text
你是原子 Claim 生成器。只能使用输入 Requirement、ResponsePlan 与 approved Evidence，不得新增项目功能、产品选型、指标、SLA、工期、案例、资质、人员能力、责任范围或期限。
每个 Claim 必须归属一个 requirement_id，basis_requirement_ids 至少包含一个输入中的合法 Requirement；basis_evidence_ids 只能引用 approved Evidence。Evidence 存在不代表允许 confirmed 承诺。
待确认的范围、参数、对象或方式必须使用 conditional，并在 text 中保留关键条件。无充分依据时使用 reference_only。不同承诺必须拆成原子 Claim。
不要生成 claim_id 或 target_sections；后端会稳定生成并覆盖。不要为 commercial、qualification、context 生成技术正文 Claim。
只输出严格 JSON，不输出 Markdown、说明、think、result、text、answer 或其他字段。
```

## User Prompt

```text
task_type: {{#start.task_type#}}
task_instruction: {{#start.task_instruction#}}
task_payload_json: {{#start.task_payload_json#}}
```

## Structured Output Schema

```json
{"type":"object","additionalProperties":false,"required":["schema_version","task_type","status","data","warnings"],"properties":{"schema_version":{"const":"4.3-gateway"},"task_type":{"const":"claim_generation"},"status":{"enum":["success","failed"]},"data":{"type":"object","additionalProperties":false,"required":["claims"],"properties":{"claims":{"type":"array","items":{"type":"object","additionalProperties":false,"required":["requirement_id","claim_type","text","basis_requirement_ids","basis_evidence_ids","requested_commitment"],"properties":{"requirement_id":{"type":"string"},"claim_type":{"type":"string"},"text":{"type":"string"},"basis_requirement_ids":{"type":"array","items":{"type":"string"}},"basis_evidence_ids":{"type":"array","items":{"type":"string"}},"requested_commitment":{"enum":["confirmed","conditional","reference_only"]}}}}}},"warnings":{"type":"array"}}}
```

## End 输出与 envelope

End 只输出 String `response_payload_json`：

```json
{"schema_version":"4.3-gateway","task_type":"claim_generation","status":"success","data":{"claims":[]},"warnings":[]}
```

禁止 `result`、`text`、`answer` 回退。

## 推荐参数与发布核验

- temperature：0.1；top_p：0.8；启用严格 JSON schema。
- 检查 provisional/conditions 均保持 conditional；检查案例、资质、人员能力必须有 approved Evidence。
- 独立配置 `V43_CLAIM_GATEWAY_API_BASE`、`V43_CLAIM_GATEWAY_API_KEY`；Key 不进入前端、日志、数据库或 Git。
- 确认 rejected Claim 不进入任何 Writer 输入。

```bash
npm run check:claim-generation -w backend
npm run smoke:claim-generation -w backend
```

`check` 不访问网络；`smoke` 固定使用 mock provider，不调用真实 Dify。
