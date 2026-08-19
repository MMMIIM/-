# Dify V4.3 Response Planning

> **Deprecated / experimental：不再是生产依赖，不发布、不配置 Key、不执行 live smoke。正式 ResponsePlan 由后端确定性 Builder 建立。**

Start 必填 String：`task_type`、`task_instruction`、`task_payload_json`。`task_type=response_planning`。System Prompt：只使用输入的 confirmed、writer-eligible Requirement 与 approved Evidence；每个 Requirement 恰好一个 Plan；不得新增或改写 REQ-ID、事实、指标、期限和能力；不得输出 target_sections。User Prompt：`{{#start.task_instruction#}}\n{{#start.task_payload_json#}}`。

冻结 envelope：`{"schema_version":"4.3-response-planning","task_type":"response_planning","status":"success","data":{"response_plans":[]},"warnings":[]}`。`data.response_plans` 必须为数组。End 唯一 String 变量为 `response_payload_json`，绑定 Structured Output 的完整 JSON；禁止 `result/text/answer`。

建议 temperature 0.1、thinking 关闭、timeout 300 秒。只读检查：`npm run check:plan-gateway -w backend`。付费 smoke：`ALLOW_LIVE_MODEL_SMOKE=true npm run smoke:plan-gateway -w backend`，默认阻断且最多调用一次。
