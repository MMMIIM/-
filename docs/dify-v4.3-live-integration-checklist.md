# V4.3 四个 Dify Workflow 人工配置清单

> 架构更新：生产只配置 Section Drafting 和可选 Targeted Revision。Response Planning、Claim Generation 以下内容仅作 deprecated/experimental 历史参考，不发布、不配置 Key、不执行其 check/smoke。

## 统一规则与顺序

建议依次配置：Response Planning → Claim Generation → Section Drafting → Targeted Revision。每个应用都创建独立 Workflow API Key；Start 统一创建三个必填 String：`task_type`、`task_instruction`、`task_payload_json`。User Prompt 可直接复制：

```text
任务类型：{{#start.task_type#}}
任务指令：{{#start.task_instruction#}}
任务数据（JSON 字符串）：
{{#start.task_payload_json#}}
```

End 只创建 String `response_payload_json`，绑定 LLM Structured Output 节点产生的完整 JSON 字符串。不得创建或绑定 `result`、`text`、`answer`。每个 Key 只填写到 `backend/.env`，不得写入 Git、前端或截图。

## 1. Response Planning

- 应用名称建议：`V43 Response Planning Production Beta`
- `task_type` 固定：`response_planning`
- System Prompt（复制）：`你是响应规划器。只能使用 task_payload_json 中已确认且 writer-eligible 的 Requirement 和 approved Evidence。每个 Requirement 必须且只能输出一个 Plan。不得新增、删除、合并或改写 REQ-ID，不得新增事实、功能、指标、期限、服务或企业能力。不得输出 target_sections。只输出符合 Structured Output Schema 的 JSON。`
- Schema（复制）：

```json
{"type":"object","additionalProperties":false,"required":["schema_version","task_type","status","data","warnings"],"properties":{"schema_version":{"const":"4.3-response-planning"},"task_type":{"const":"response_planning"},"status":{"const":"success"},"data":{"type":"object","required":["response_plans"],"properties":{"response_plans":{"type":"array"}}},"warnings":{"type":"array"}}}
```

- 参数：temperature 0.1；thinking 关闭；最大输出按 Requirement 数量设置但避免无界输出。
- 发布：保存 → 校验 Schema → 确认 End 绑定 → 发布 → 创建专用 Key → 填写 `V43_PLAN_GATEWAY_*`。
- 检查：`npm run check:plan-gateway -w backend`
- 付费 smoke：`ALLOW_LIVE_MODEL_SMOKE=true npm run smoke:plan-gateway -w backend`
- 通过：schema 为 `4.3-response-planning`、status 为 success、`response_plans` 为数组且摘要不泄露正文。

## 2. Claim Generation

- 应用名称建议：`V43 Claim Generation Production Beta`
- `task_type` 固定：`claim_generation`
- System Prompt（复制）：`你是原子 Claim 生成器。只能使用输入 Requirement、validated ResponsePlan 与 approved Evidence。不得新增指标、SLA、工期、案例、资质、人员能力、产品选型或责任范围。条件必须保留。不得生成 claim_id 或 target_sections。只输出符合 Structured Output Schema 的 JSON。`
- Schema（复制）：

```json
{"type":"object","additionalProperties":false,"required":["schema_version","task_type","status","data","warnings"],"properties":{"schema_version":{"const":"4.3-claim-generation"},"task_type":{"const":"claim_generation"},"status":{"const":"success"},"data":{"type":"object","required":["claims"],"properties":{"claims":{"type":"array"}}},"warnings":{"type":"array"}}}
```

- 参数：temperature 0.1；thinking 关闭；最大输出按最小原子 Claim 数控制。
- 发布后创建独立 Key，填写 `V43_CLAIM_GATEWAY_*`。
- 检查：`npm run check:claim-gateway -w backend`
- 付费 smoke：`ALLOW_LIVE_MODEL_SMOKE=true npm run smoke:claim-gateway -w backend`
- 通过：schema 为 `4.3-claim-generation`、status success、`claims` 为数组。

## 3. Section Drafting

- 应用名称建议：`V43 Section Drafting Production Beta`
- `task_type` 固定：`section_drafting`
- System Prompt（复制）：`你是技术标章节 Writer。仅依据当前 Batch 的 approved Claims、对应 Plan、approved Evidence 摘要、mandatory anchors、conditions、责任边界和章节规则写作。不得新增事实或承诺，不得输出内部 ID、来源状态、JSON 说明或其他章节标题。`
- Schema（复制）：

```json
{"type":"object","additionalProperties":false,"required":["schema_version","task_type","status","data","warnings"],"properties":{"schema_version":{"const":"4.3-section-drafting"},"task_type":{"const":"section_drafting"},"status":{"const":"success"},"data":{"type":"object","required":["chapter_id","content_markdown"],"properties":{"chapter_id":{"type":"string"},"content_markdown":{"type":"string","minLength":1}}},"warnings":{"type":"array"}}}
```

- 参数：temperature 0.2；thinking 关闭；最大输出约 4k–6k 中文字符。
- 发布后创建独立 Key，填写 `V43_WRITER_GATEWAY_*`。
- 检查：`npm run check:writer-gateway -w backend`
- 付费 smoke：`ALLOW_LIVE_MODEL_SMOKE=true npm run smoke:writer-gateway -w backend`
- 通过：chapter_id 与输入一致，content_markdown 非空，输出不含内部标识。

## 4. Targeted Revision

- 应用名称建议：`V43 Targeted Revision Production Beta`
- `task_type` 固定：`targeted_revision`
- System Prompt（复制）：`你是定向修订器。只能修订输入的单个违规段落，逐项修复 errors，保留 approved Claims、条件和责任边界。不得重写整章或全文，不得新增事实、能力或承诺。只返回 revised_text。`
- Schema（复制）：

```json
{"type":"object","additionalProperties":false,"required":["schema_version","task_type","status","data","warnings"],"properties":{"schema_version":{"const":"4.3-targeted-revision"},"task_type":{"const":"targeted_revision"},"status":{"const":"success"},"data":{"type":"object","required":["revised_text"],"properties":{"revised_text":{"type":"string","minLength":1}}},"warnings":{"type":"array"}}}
```

- 参数：temperature 0.1；thinking 关闭；最大输出仅覆盖单段修订。
- 发布后创建独立 Key，填写 `V43_REVISION_GATEWAY_*`。
- 检查：`npm run check:revision-gateway -w backend`
- 付费 smoke：`ALLOW_LIVE_MODEL_SMOKE=true npm run smoke:revision-gateway -w backend`
- 通过：schema 为 `4.3-targeted-revision`、revised_text 非空且没有扩写全文。

## 常见错误分类

- `GATEWAY_NOT_CONFIGURED`：独立地址或 Key 缺失。
- `GATEWAY_NETWORK_ERROR` / `GATEWAY_TIMEOUT`：网络失败与超时分别处理。
- `GATEWAY_RESPONSE_PAYLOAD_MISSING`：End 未输出 `response_payload_json`。
- `GATEWAY_INVALID_JSON` / `GATEWAY_TRUNCATED_JSON`：JSON 非法或被截断。
- `GATEWAY_ENVELOPE_INVALID` / `SMOKE_SCHEMA_MISMATCH`：schema、task_type、status 或 data 不符合冻结契约。
- `LIVE_MODEL_SMOKE_NOT_ALLOWED`：未显式授权付费 smoke。

PowerShell 授权示例：`$env:ALLOW_LIVE_MODEL_SMOKE='true'; npm run smoke:plan-gateway -w backend`。每次 smoke 最多调用一次 Workflow；执行前确认费用、应用和专用 Key 均正确。
