import fs from 'node:fs/promises';
import path from 'node:path';
import { buildBidDocumentModel } from '../src/pipeline/bid-document-model.js';
import { renderBidDocument } from '../src/pipeline/docx-renderer.js';

const project = { id: 'word-foundation-project', name: '示例技术标项目' };
const version = {
  id: 'word-foundation-version', project_id: project.id, generation_id: 'word-foundation-generation',
  version_number: 1, title: '示例技术响应', status: 'confirmed', risk_status: 'pass',
  final_text: '# 项目理解\n\n正文。',
  sections_json: [
    {
      chapter_id: 'chapter-01', title: '项目理解', order: 1,
      content_markdown: [
        '## 建设目标', '', '本项目围绕稳定交付和可验证成果展开，正文用于结构验收。', '',
        '### 建设原则', '', '采用可追溯、可编辑、可复核的实施原则。', '',
        '| 交付项 | 验收方式 |', '| --- | --- |', '| 实施方案 | 文档审查 |', '| 培训材料 | 现场确认 |', '',
        '补充说明。'
      ].join('\n')
    },
    {
      chapter_id: 'chapter-02', title: '实施方案', order: 2,
      content_markdown: '## 实施路径\n\n项目按阶段推进，完成后形成正式交付物。'
    }
  ]
};

const model = buildBidDocumentModel({ project, version });
const buffer = await renderBidDocument(model);
const outputName = process.argv[2] || 'stage16-word-foundation-final-v2.docx';
const outputPath = path.resolve('uploads', outputName);
await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, buffer);
console.log(JSON.stringify({ output: outputPath, bytes: buffer.length, model_version: model.model_version }));
