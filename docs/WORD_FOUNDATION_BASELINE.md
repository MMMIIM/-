# Word Foundation Baseline

状态：Stage 16-R2，工程基线（真实 Office 视觉验收仍需人工完成）。

本文件是 Word 基础行为的单一说明入口。业务语义仍由 Bid Document Model
和正式生成流程负责；本文件只约束 `Bid Document Model → Format Policy →
DOCX Renderer` 的结构、排版和 OOXML 安全边界。

## 1. Foundation invariants

- 正式文档只能有连续的 H1 → H2 → H3 层级；模型在渲染前确定性归一化并验证。
- 章节标题只由正式章节树投影一次；重复章节标题、非法内容块和空文本块在渲染前拒绝。
- 标题使用 Word 自动多级编号 `1 / 1.1 / 1.1.1`，编号与标题之间使用普通空格，不把可见编号写入标题正文。
- 系统默认不强制每个顶层章节换页；H1/H2/H3 使用 `keepNext` 和 `keepLines`，正文使用 widow/orphan control。
- 表格宽度不得超过正文可用宽度；只有结构化标记的 semantic header row 可跨页重复；普通短行禁止被拆开。超长行由 Office 处理，不由产品计算分页。
- 中文字体同时写入 ASCII/hAnsi/EastAsia 映射：正文与表格为 SimSun（宋体），标题为 SimHei（黑体）。
- 封面、目录、正文为显式 section；正文页码从 1 开始，封面和目录不显示页码。
- 正式文档只允许业务字段投影；对象 ID、hash、provider、debug、`e2e.*`、`synthetic.*` 和内部生命周期信息不得进入可见文档。
- 目录使用真实 Word TOC 字段，单一来源是规范化标题树，不另建第二套层级模型。

确定性入口：`backend/src/pipeline/document-structure-validator.js`。它在
`buildBidDocumentModel()` 返回模型前执行；renderer 不负责修复业务结构。

## 2. System default profile

`SYSTEM_DEFAULT_TECHNICAL_BID_V1` 是保守的系统兜底，不代表所有招标文件的
强制规范。当前版本由 `document-format-policy.js` 集中表达：

| 项目 | 默认值 |
| --- | --- |
| 纸张 / 方向 | A4 / 纵向 |
| 页边距 | 上右下 2.5 cm，左 3.0 cm |
| 正文 | 宋体 12 pt，小四，黑色，两端对齐 |
| 正文段落 | 首行 2 个汉字，1.5 倍行距，段前/段后 0 |
| 一级标题 | 黑体 16 pt |
| 二级标题 | 黑体 14 pt |
| 三级标题 | 黑体 12 pt |
| 表格 | 宋体 10.5 pt，显式宽度和内边距 |
| 编号 | `1 / 1.1 / 1.1.1`，SPACE 后缀，保守缩进 |
| 分页 | 不强制顶层章节换页；可由未来 Tender Format Profile 覆盖 |
| 目录 | 带缓存条目的可更新 TOC 字段；最终页码需 Word/WPS 更新 |

## 3. Tender-overridable rules

以下规则属于未来的 Tender Format Profile 或 Enterprise Template，不能被当作
不可逆的全局假设：纸张、页边距、字体、字号、粗体、行距、段落间距、首行
缩进、目录开关、页眉页脚、页码起始值、章节强制换页、表格样式、颜色限制、
最大页数和横纵向。覆盖必须携带来源条款/位置并可审计；本阶段不自动抽取这些
覆盖项。

## 4. Office-only behavior

OOXML 可以确定地验证结构、样式、字段和几何边界，但不能在没有 Office 排版
引擎时证明最终分页、字体回退、目录页码、表格视觉平衡和 Word/WPS 兼容性。
当前 renderer 写入一个带确定性 `cachedEntries` 的可更新 TOC 字段
（`render_mode=field_cached_entries`）。首次打开即可看到标题条目；缓存不包含
伪造页码，Word/WPS/LibreOffice 仍可更新字段并计算最终页码。不再输出“请更新
目录”的技术占位提示，也不生成第二份静态目录。

## 5. Reference assessment

公开资料仅用于确认 API 能力与成熟格式概念，不复制外部业务架构或项目数据。

| Capability | Reference | Reuse decision | Current support | Action |
| --- | --- | --- | --- | --- |
| 段落分页、keepNext、keepLines、widowControl、pageBreakBefore | [docx paragraph API](https://github.com/dolanmiu/docx/blob/master/docs/usage/paragraph.md)；[Microsoft pagination](https://support.microsoft.com/en-us/word/line-and-page-breaks) | ADAPT | PASS | 使用 renderer 显式映射，默认不强制章节换页 |
| 多级编号和 SPACE/TAB 后缀 | [docx LevelSuffix](https://docx.js.org/api/variables/LevelSuffix.html) | REUSE | PASS | 使用 `LevelSuffix.SPACE` 和参数化缩进 |
| 表格宽度、语义表头重复、cantSplit | [docx tables API](https://github.com/dolanmiu/docx/blob/master/docs/usage/tables.md) | ADAPT | PASS | 显式 DXA 宽度、cell margins；只有 `header_row_index` 行写入 `tblHeader` |
| 页面/段落/标题参数化 | [sikenali/bid-typesetting](https://github.com/sikenali/bid-typesetting)（MIT） | REFERENCE_ONLY | PASS | 吸收参数化排版思想，不复制其 SPA/Go 架构 |
| 中文四槽字体映射 | [sikenali/bid-typesetting README](https://github.com/sikenali/bid-typesetting/blob/main/README.md) | ADAPT | PASS | SimSun/SimHei 写入 `eastAsia` 与 hAnsi |
| TOC 缓存条目和刷新 | [docx TableOfContents cachedEntries](https://github.com/dolanmiu/docx/blob/master/docs/usage/table-of-contents.md) + Word/WPS/LibreOffice | ADAPT | PASS + OFFICE_ONLY 页码 | 单一真实字段带缓存标题条目；Office 负责最终页码 |
| 页眉/页脚/页码 section | docx section API | ALREADY_SUPPORTED | PASS | cover/TOC/body 显式 section，body 从 1 起页码 |
| 自定义分页计算 | 内部约束 | NOT_NEEDED | PASS | 交由 Office layout engine，不建分页引擎 |

参考项目说明其排版工具采用“解析 → 参数化 → 重建”并将中文字体映射到
`ascii/hAnsi/eastAsia/cs` 四槽；本项目仅采用其中可验证的格式化思路，仍由
本仓库的 Bid Document Model、Format Policy 和 Renderer 负责最终规则。

## 6. Current implementation audit

| Area | Status | Evidence |
| --- | --- | --- |
| 文档结构 / 连续标题层级 | PASS | model normalization + structure validator + OOXML suite |
| 自动编号 / SPACE 后缀 | PASS | numbering XML checks |
| 自然分页 / 标题粘连 | PASS | default `chapter_page_break=none`, keepNext/keepLines |
| 中文字体 EastAsia | PASS | styles/document XML checks |
| 正文段落基础 | PASS | Normal style + body paragraph checks |
| 表格宽度 / 内边距 / 语义表头 / 行拆分 | PASS | fixture table XML checks，精确断言仅一行 `tblHeader` |
| 图片 | NOT_APPLICABLE | 当前 foundation fixture 没有正式图片输入 |
| section / 页码起始 | PASS | section and `pgNumType start=1` checks |
| 元数据安全 | PASS | allow-list projection and leakage checks |
| TOC 首次打开可见条目 | PASS | `cachedEntries` 条目结构验收 |
| TOC 可更新字段 / 最终页码 | OFFICE_ONLY | Office 负责更新字段和最终页码 |
| 最终视觉分页 / 字体回退 | OFFICE_ONLY | 需真实 Office 引擎人工确认 |

自动验收位于 `backend/test/word-foundation-acceptance.test.js`，覆盖代表性
文档的封面、目录、三层标题、正文、两章、表头多行表格、页码和元数据安全。

## 7. Acceptance artifact

当前缺陷闭环的人工验收只使用：`uploads/stage16-word-foundation-final-v2.docx`。

自动结构验收通过后，再由 Word、WPS Office 或 LibreOffice Writer 完成一次
视觉验收：打开无修复提示、检查真实分页/字体回退/目录页码/表格视觉宽度，
并更新目录确认标题和页码。未完成该步骤前，Stage 16 只能标记为
`MANUAL_OFFICE_ACCEPTANCE_REQUIRED`。
