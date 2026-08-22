# Word V1 复用评估

日期：2026-08-22

## 目标

为 Stage 16 选择一个可维护、许可清晰、能生成真实 Word 结构的最小 DOCX 基础。业务模型、格式策略、版本关联和审计仍由后端拥有；第三方库只负责 OOXML 文件组装。

## 候选结论

| 候选 | 许可/定位 | 评估 | 结论 |
| --- | --- | --- | --- |
| [`docx`](https://github.com/dolanmiu/docx) | MIT，TypeScript/JavaScript，Node 与浏览器 | 声明式生成 OOXML，支持 Heading 样式、编号、目录字段、表格、页眉页脚、分页和图片 | **采用** |
| [`docx-templates`](https://www.npmjs.com/package/docx-templates) | MIT，模板驱动 | 适合客户模板和复杂模板占位符；当前内置专业模板不需要引入第二套模板语言 | 参考/后续适配 |
| AGPL 文档组件 | AGPL 或不兼容许可 | 会扩大分发与合规边界 | 仅参考，不进入产品依赖 |

## 最小基础

已将 `docx` 作为 backend 运行时依赖。产品代码新增三层：

1. `BidDocumentModel`：稳定的项目、版本、章节和内容块模型；
2. `DocumentFormatPolicy`：内置专业默认格式、页边距、字体、段落和表格规则；
3. `DocxRenderer`：把模型和策略转换为真实 Word OOXML，并保留 Heading 样式与可更新目录字段。

导出审计记录渲染器、策略版本、来源文档版本和内容哈希。客户模板、浏览器 Word 克隆、分页算法和在线协同不在本阶段。

## 许可证与风险

`docx` 为 MIT 许可，适合本仓库当前的服务端分发方式。版本锁定在 `backend/package.json`，升级需重新运行 DOCX fixture 渲染和打开验证。业务字段不能直接暴露给渲染器之外的第二套规则。
