# ADR 007：文档模型与 DOCX 渲染器分离

状态：Accepted（Stage 16）

## 背景

正式正文已经由现有生成、内容检查和风险复核流程产生。Word 交付需要稳定章节身份、可追溯版本和可重复格式，同时不能让 OOXML 细节进入业务规则或形成第二套正文事实。

## 决策

新增 `BidDocumentModel`、`DocumentFormatPolicy` 和 `DocxRenderer` 三个边界。后端先从正式 `DocumentVersion.final_text`/`sections_json` 构建模型，再由单一内置格式策略渲染。渲染器使用 MIT 许可的 `docx` 库；它不读取 Requirement、Evidence、Claim 或外部模型，也不决定风险门禁。

Word 标题使用真实 Heading 样式和 Word 目录字段，编号由模型/渲染策略稳定生成，导出审计保存项目、版本、渲染器、策略和内容哈希。导出只能使用项目关联、未失效且通过现有风险检查的版本。

## 后果

- UI、API、未来 Agent 可共享同一个文档模型和导出服务；
- 后续可以替换渲染器或增加客户模板，而不改变业务模型；
- 需在升级 `docx` 或格式策略后重新做真实 Word 打开和页面渲染验收；
- 本阶段不提供浏览器 Word 编辑、客户模板和自动分页承诺。
