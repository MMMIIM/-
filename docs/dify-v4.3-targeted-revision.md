# V4.3 定向修订 Workflow

> 有成本调用警告：`check` 只调用 `/info`。live smoke 默认阻断，仅当显式设置 `ALLOW_LIVE_MODEL_SMOKE=true` 时发起一次付费 Workflow 调用。

Start 三个必填 String：`task_type`、`task_instruction`、`task_payload_json`。System Prompt：只修订输入的单个违规段落，逐项修复 errors，严格保留 approved Claims、conditions 和责任边界；不得重写整章或全文、不得新增事实。User Prompt：`{{#start.task_instruction#}}\n{{#start.task_payload_json#}}`。

Structured Output Schema：`{"schema_version":"4.3-targeted-revision","task_type":"targeted_revision","status":"success","data":{"revised_text":""},"warnings":[]}`。`data.revised_text` 必须为非空字符串。End 只输出 String `response_payload_json`，禁止 `result/text/answer`。建议 temperature 0.1、thinking 关闭、timeout 300 秒、最多修订一次。

发布检查：确认输入仅含违规段落、确切错误、approved Claims、限制与修订指令；确认 End 绑定 Structured Output 节点的完整 JSON 字符串。命令：`npm run check:revision-gateway -w backend`、`ALLOW_LIVE_MODEL_SMOKE=true npm run smoke:revision-gateway -w backend`。
