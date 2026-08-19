# Dify v4.3 Response Planning 配置

本 Workflow 只承担 `response_planning` 语义任务。Requirement Baseline 选择、writer eligibility、Evidence approval、章节路由、一对一完整性和最终持久化均由后端控制。不得修改 requirement_extraction Workflow。

## Start 输入变量

三个必填 String：`task_type`、`task_instruction`、`task_payload_json`。`task_type` 必须为 `response_planning`。payload 只包含已确认 writer-eligible Requirements 与 approved Evidence。

## System Prompt（可复制）

```text
你是 ResponsePlan 规划器。只能使用 task_payload_json 中的 Requirement 与 approved Evidence，不得新增、删除、合并或改写 REQ-ID，不得新增功能、指标、服务、期限或企业能力。
每个输入 Requirement 必须且只能输出一个 Plan。response_status 仅可为 full、partial、confirm。partial 只用于真实能力缺口且必须填写 capability_gap；参数待确认不是能力缺口。full 可以带 conditions。只有 Requirement 自身重大歧义才使用 confirm。
不得输出 commercial、qualification、context 的 Plan。contractual 由后端生成约束记录。
supporting_evidence_ids 只能引用输入中的 approved Evidence。不要生成 target_sections；即使生成也会被后端忽略并审计。
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
{"type":"object","additionalProperties":false,"required":["schema_version","task_type","status","data","warnings"],"properties":{"schema_version":{"const":"4.3-gateway"},"task_type":{"const":"response_planning"},"status":{"enum":["success","failed"]},"data":{"type":"object","additionalProperties":false,"required":["response_plans"],"properties":{"response_plans":{"type":"array","items":{"type":"object","additionalProperties":false,"required":["requirement_id","response_status","response_summary","implementation_actions","optional_design","deliverables","acceptance_methods","conditions","supporting_evidence_ids","capability_gap"],"properties":{"requirement_id":{"type":"string"},"response_status":{"enum":["full","partial","confirm"]},"response_summary":{"type":"string"},"implementation_actions":{"type":"array"},"optional_design":{"type":"array"},"deliverables":{"type":"array"},"acceptance_methods":{"type":"array"},"conditions":{"type":"array"},"supporting_evidence_ids":{"type":"array","items":{"type":"string"}},"capability_gap":{"type":"string"}}}}}},"warnings":{"type":"array"}}}
```

## End 输出与 envelope

End 只输出 String `response_payload_json`，值为上述完整 JSON 的字符串。例如：

```json
{"schema_version":"4.3-gateway","task_type":"response_planning","status":"success","data":{"response_plans":[]},"warnings":[]}
```

禁止配置 `result`、`text`、`answer` 回退。

## 推荐参数与发布核验

- temperature：0.1；top_p：0.8；JSON structured output 开启。
- 阻断额外说明、未知字段、重复 REQ-ID、虚构 Evidence-ID。
- 独立配置 `V43_PLAN_GATEWAY_API_BASE`、`V43_PLAN_GATEWAY_API_KEY`；Key 不进入前端、日志、数据库或 Git。
- 发布前以脱敏 fixture 验证 response_payload_json。

```bash
npm run check:response-planning -w backend
npm run smoke:response-planning -w backend
```

`check` 只检查本地配置，不发网络请求；`smoke` 固定使用 mock provider，不调用真实 Dify。
