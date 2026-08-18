# Dify v4.3 Requirement Extraction Workflow 配置

本文用于配置 Production-shaped Beta 的逐片需求抽取语义流程。Dify 只负责一个 chunk 的语义提取；PDF 解析、章节分类、分片调度、JSON 校验、来源定位、合并、REQ-ID、mandatory 最终判定和基线冻结均由 Node 后端负责。

禁止在本 Workflow 内加入业务 Code 节点、Iteration、REQ-ID 生成、页码/段落定位、章节路由或基线逻辑。DeepSeek 仅由 Dify 模型插件调用。v4.2 Workflow 保持冻结。

## 1. 推荐节点拓扑

```text
Start
  → LLM_招标需求提取
  → End
```

不添加 Iteration。后端已经把文件切成 chunk，并对每个 chunk 串行调用此 Workflow。

## 2. Start 输入变量

在 Start 节点创建以下三个必填变量：

| 变量名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `task_type` | String | 是 | 本 Workflow 正式调用必须为 `requirement_extraction` |
| `task_instruction` | String | 是 | 后端提供的任务边界说明 |
| `task_payload_json` | String | 是 | 后端序列化的单个 chunk JSON |

不要在 Start 节点增加文件变量、REQ-ID、页码或段落号输出变量。

## 3. LLM_招标需求提取：System Prompt

以下内容可直接复制到 System Prompt：

```text
你是“招标需求语义提取器”，是 Dify 语义执行面中的单一模型节点。你只处理后端已经解析、分类并切分好的一个招标文件 chunk。

你的唯一任务：从 task_payload_json 中的当前 chunk 原文提取候选需求，并返回严格符合指定 JSON 契约的一个 JSON 对象。

边界与职责：
1. 只提取当前 chunk 原文中明确存在的要求，不补充常识，不推测采购人意图，不新增要求。
2. 不生成、修改或合并 REQ-ID。Requirement 的稳定编号由后端生成。
3. 不做章节路由，不生成 Response Plan、Claim、评分点、正文、实施方案或企业能力描述。
4. source_text 必须逐字引用 task_payload_json 中存在的最小完整原文片段；不得改写、概括、纠错或翻译。
5. source_clause 仅在原文明确出现条款编号时填写原编号，例如“5.2.6”；不得臆造编号。没有明确编号时为 null。
6. mandatory_observed 只表示原文中是否直接观察到“★”“实质性要求”等明确标记，不是最终 mandatory 判定。章节级规则、例外传播和最终值由后端决定。
7. requires_confirmation 在语义边界、指代、范围或来源存在不确定性时设为 true；不得为了避免确认而猜测。
8. 不输出或推断 requirement_id、source_page、source_paragraph、source_hash、source_chunk_id、target_sections、mandatory 最终值。
9. 每个 requirements 项必须且只能包含：text、category、source_text、source_clause、mandatory_observed、requires_confirmation。
10. text 是忠实、简洁的候选需求表述，不得改变约束强度、责任主体、数量、期限、例外或交叉引用。
11. category 使用简短、稳定的业务类别名称；无法可靠分类时使用“未分类”，不得因此丢弃需求。
12. 同一原文若表达多个独立可验收要求，可以拆分为多项，但每项都必须保留足以证明该要求的 source_text。
13. 当前 chunk 没有可提取需求时，requirements 返回空数组。这是合法成功结果。
14. warnings 只记录本次语义提取的非致命问题；没有警告时返回空数组。
15. 只输出 JSON。禁止 Markdown 围栏、解释、前言、后记、思考过程、<think> 标签或 JSON 之外的任何字符。

输入校验：
- task_type 必须等于 requirement_extraction；否则返回 status="failed"、data.requirements=[]，并在 warnings 中说明 TASK_TYPE_UNSUPPORTED。
- task_payload_json 必须能够解析为对象，且包含当前 chunk 的 text；否则返回 status="failed"、data.requirements=[]，并在 warnings 中说明 PAYLOAD_INVALID。

成功输出必须满足：
{
  "schema_version": "4.3-requirement-extraction",
  "task_type": "requirement_extraction",
  "status": "success",
  "data": {
    "requirements": []
  },
  "warnings": []
}

绝不输出契约之外的顶层字段、data 字段或 Requirement 字段。
```

## 4. LLM_招标需求提取：User Prompt

User Prompt 只引用三个 Start 输入，不添加其他变量。可直接复制：

```text
task_type:
{{#start.task_type#}}

task_instruction:
{{#start.task_instruction#}}

task_payload_json:
{{#start.task_payload_json#}}
```

如果实际 Start 节点 ID 不是 `start`，在 Dify 变量选择器中重新选择对应变量，不要手工猜节点 ID。

## 5. 固定输出契约

成功示例：

```json
{
  "schema_version": "4.3-requirement-extraction",
  "task_type": "requirement_extraction",
  "status": "success",
  "data": {
    "requirements": [
      {
        "text": "投标人应提供审计日志能力。",
        "category": "安全审计",
        "source_text": "投标人应提供审计日志能力。",
        "source_clause": "5.2.1",
        "mandatory_observed": false,
        "requires_confirmation": false
      }
    ]
  },
  "warnings": []
}
```

推荐 Structured Output JSON Schema：

```json
{
  "type": "object",
  "additionalProperties": false,
  "required": ["schema_version", "task_type", "status", "data", "warnings"],
  "properties": {
    "schema_version": { "const": "4.3-requirement-extraction" },
    "task_type": { "const": "requirement_extraction" },
    "status": { "type": "string", "enum": ["success", "failed"] },
    "data": {
      "type": "object",
      "additionalProperties": false,
      "required": ["requirements"],
      "properties": {
        "requirements": {
          "type": "array",
          "items": {
            "type": "object",
            "additionalProperties": false,
            "required": [
              "text",
              "category",
              "source_text",
              "source_clause",
              "mandatory_observed",
              "requires_confirmation"
            ],
            "properties": {
              "text": { "type": "string", "minLength": 1 },
              "category": { "type": "string", "minLength": 1 },
              "source_text": { "type": "string", "minLength": 1 },
              "source_clause": { "type": ["string", "null"] },
              "mandatory_observed": { "type": "boolean" },
              "requires_confirmation": { "type": "boolean" }
            }
          }
        }
      }
    },
    "warnings": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["code", "message"],
        "properties": {
          "code": { "type": "string", "minLength": 1 },
          "message": { "type": "string", "minLength": 1 }
        }
      }
    }
  }
}
```

Requirement 允许字段只有：

- `text`
- `category`
- `source_text`
- `source_clause`
- `mandatory_observed`
- `requires_confirmation`

明确禁止：

- `requirement_id`、`req_id`
- `source_page`
- `source_paragraph`
- `source_hash`
- `source_chunk_id`
- `target_sections`
- `mandatory`、`is_mandatory` 等最终 mandatory 值
- 评分点、Response Plan、Claim、章节路由或正文

## 6. 推荐模型配置

| 配置 | 建议值 |
| --- | --- |
| 模型 | 通过 Dify DeepSeek 插件选择已验证可用的非 thinking 对话模型 |
| Temperature | `0.1` |
| Thinking / Reasoning | 关闭 |
| JSON mode / Structured output | 模型节点支持时开启，并粘贴上方 JSON Schema |
| 最大输出 Token | 建议先设 `8192`；若受插件上限限制，使用插件允许的最大稳定值并监控截断 |
| 重试 | Workflow 内关闭自动业务重试；重试策略由后端任务控制面决定 |

不得通过提高 temperature、开启 thinking、添加 Code 节点或截取首尾大括号来修复 JSON。

## 7. End 节点

End 节点只配置一个输出字段：

| 字段名 | 类型 | 绑定值 |
| --- | --- | --- |
| `response_payload_json` | String | `{{#LLM_招标需求提取.text#}}` |

必须确认最终 Workflow API 外层结构为：

```text
data.outputs.response_payload_json
```

字段名必须精确为 `response_payload_json`。不得同时提供或依赖 `result`、`text`、`answer` 等替代输出字段。若启用 Structured Output 后 Dify 暴露的模型文本变量名称不同，应使用变量选择器选择“完整 JSON 文本”对应变量，但 End 字段名仍保持不变。

## 8. 后端调用链静态核验

当前调用链：

```text
RequirementParseService
  → createRequirementExtractionGateway
  → SemanticGatewayClient.run
  → POST {V43_GATEWAY_API_BASE}/workflows/run
  → Dify Workflow
  → Dify DeepSeek LLM 插件
  → End.response_payload_json
  → HTTP data.outputs.response_payload_json
  → 后端 transport normalizer / envelope validator / requirement adapter
  → SourceLocationResolver / aggregate / REQ-ID
```

后端没有直接调用 `api.deepseek.com`。仓库静态检索 `api.deepseek.com|deepseek` 在 `backend/src`、`backend/scripts` 和 package 配置中均无匹配。语义网关客户端唯一模型方向的 HTTP POST 位于 `backend/src/pipeline/semantic-gateway-client.js`，目标是配置的 Dify `/workflows/run`。旧的 `backend/src/dify.js` 同样只调用 Dify Workflow API，用于冻结的 v4.2 兼容路径，不直接访问 DeepSeek。

## 9. 健康检查与 smoke 边界

当前 `npm run smoke:gateway -w backend` 不是只读检查。它调用 `SemanticGatewayClient.run()`，向 `/workflows/run` 发送 `task_type=healthcheck`，因此会实际创建 Workflow run；如果该 Workflow 连接了 DeepSeek LLM，也会调用 DeepSeek 插件。

建议后续拆分为：

- `gateway:check`：只读检查 Dify HTTP 服务、应用可访问性、鉴权、已发布应用元数据和 End 输出字段；不得调用 `/workflows/run`。
- `smoke:gateway`：明确标记为有成本的真实 LLM smoke，调用专用 healthcheck Workflow 或支持 `healthcheck` 的语义网关应用。

本 requirement-only Workflow 的正式 `task_type` 是 `requirement_extraction`。现有 smoke 期待 `healthcheck` 且 `data.message=gateway_contract_ok`，与本文的固定 `data.requirements` 契约不同。发布前必须选择其一：为 smoke 使用独立 healthcheck 应用，或在后续代码任务中调整 smoke；不要在 requirement extraction Workflow 中混入业务分支 Code 节点。

## 10. 发布前人工核验清单

- [ ] 修改的是 v4.3 requirement extraction 应用，不是冻结的 v4.2。
- [ ] 节点只有 Start → LLM_招标需求提取 → End。
- [ ] Start 三个变量均为必填 String。
- [ ] Thinking 已关闭，temperature 为 0.1。
- [ ] Structured output/JSON mode 已按模型能力开启。
- [ ] End 只有 `response_payload_json`，绑定 LLM 完整文本。
- [ ] 测试输出没有 Markdown 围栏、`<think>` 或额外说明。
- [ ] Requirement 没有任何后端所有权字段。
- [ ] 空需求返回 `requirements: []`，而不是伪造需求。
- [ ] 发布后记录应用 ID、Workflow ID 和发布版本，但不要写入 API Key。
