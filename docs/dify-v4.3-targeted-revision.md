# V4.3 定向修订 Workflow

> 有成本调用警告：本轮只使用 mock。真实调用必须显式配置 `V43_REVISION_GATEWAY_API_BASE`、`V43_REVISION_GATEWAY_API_KEY` 和 `V43_GATEWAY_USER`。

Start 变量：`task_type`、`task_instruction`、`task_payload_json`。System Prompt：只修订输入的单个违规段落，逐项修复 errors，严格保留 approved Claims、conditions 和责任边界；不得重写整章或全文、不得新增事实。User Prompt：`{{task_instruction}}\n{{task_payload_json}}`。

Structured Output Schema 与正文 Workflow 相同，`task_type` 为 `targeted_revision`，`data.chapter_id` 必须匹配任务。End 只输出 `response_payload_json`。建议 temperature 0.1、timeout 300 秒；最多调用一次。

发布检查：验证仅输入违规段落、错误列表、approved Claims、限制与修订指令；验证无 `result/text/answer` 回退。命令：`npm run check:targeted-revision -w backend`、`npm run smoke:targeted-revision -w backend`。
