# Dify V4.3 Claim Generation

> **Deprecated / experimental：不再是生产依赖，不发布、不配置 Key、不执行 live smoke。正式基础 Claim 由后端确定性 Builder 建立。**

Start 必填 String：`task_type`、`task_instruction`、`task_payload_json`。`task_type=claim_generation`。System Prompt：只使用输入 Requirement、validated Plan 与 approved Evidence；不得新增指标、SLA、工期、案例、资质、能力或责任范围；条件必须保留；不得输出 claim_id 和 target_sections。User Prompt：`{{#start.task_instruction#}}\n{{#start.task_payload_json#}}`。

冻结 envelope：`{"schema_version":"4.3-claim-generation","task_type":"claim_generation","status":"success","data":{"claims":[]},"warnings":[]}`。`data.claims` 必须为数组。End 唯一 String 变量为 `response_payload_json`；禁止 `result/text/answer`。

建议 temperature 0.1、thinking 关闭、timeout 300 秒。只读检查：`npm run check:claim-gateway -w backend`。付费 smoke：`ALLOW_LIVE_MODEL_SMOKE=true npm run smoke:claim-gateway -w backend`，默认阻断且最多调用一次。
