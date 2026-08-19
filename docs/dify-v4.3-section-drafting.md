# V4.3 分组章节正文 Workflow

> 有成本调用警告：check/smoke 默认固定使用 mock；发布前人工切换 `GENERATION_PROVIDER=semantic_gateway`，本地验收不得调用真实 Workflow。

Start 变量：`task_type`、`task_instruction`、`task_payload_json`。System Prompt：仅依据当前 Batch 的 approved Claims、ResponsePlan、approved Evidence、mandatory anchors、conditions、责任边界和章节规则写作；不得新增 Requirement、事实或承诺，不得输出内部 ID/来源状态或其他章节。User Prompt：`{{task_instruction}}\n{{task_payload_json}}`。

Structured Output Schema：`{"schema_version":"4.3-section-drafting","task_type":"section_drafting","status":"success","data":{"chapter_id":"chapter-05","content_markdown":""},"warnings":[]}`。End 节点只映射 `response_payload_json`，禁止 `result/text/answer`。建议 temperature 0.2、单次输出约 4k–6k 中文字符、timeout 300 秒。

发布检查：变量名、schema、End 字段、禁用字段、空正文和错误 chapter_id 校验全部通过后再发布。命令：`npm run check:section-drafting -w backend`、`npm run smoke:section-drafting -w backend`。
