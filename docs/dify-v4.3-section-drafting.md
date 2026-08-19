# Dify V4.3 Section Drafting

Start 必填 String：`task_type`、`task_instruction`、`task_payload_json`。`task_type=section_drafting`。System Prompt：仅依据当前 Batch 的 approved Claims、Plan、approved Evidence、mandatory anchors、conditions、责任边界和章节规则写作；不得新增 Requirement、事实或承诺，不得输出内部 ID、来源状态或其他章节。User Prompt：`{{#start.task_instruction#}}\n{{#start.task_payload_json#}}`。

冻结 envelope：`{"schema_version":"4.3-section-drafting","task_type":"section_drafting","status":"success","data":{"chapter_id":"chapter-05","content_markdown":""},"warnings":[]}`。`chapter_id` 和非空 `content_markdown` 必填。End 唯一 String 变量为 `response_payload_json`；禁止 `result/text/answer`。

建议 temperature 0.2、thinking 关闭、最大输出约 4k–6k 中文字符、timeout 300 秒。只读检查：`npm run check:writer-gateway -w backend`。付费 smoke：`ALLOW_LIVE_MODEL_SMOKE=true npm run smoke:writer-gateway -w backend`，默认阻断且最多调用一次。
