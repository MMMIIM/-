import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { marked } from 'marked';
import { Clipboard, Download, Loader2, Sparkles } from 'lucide-react';
import { generateBid } from './api.js';
import './styles.css';

const projectTypes = ['智慧城市', '数据治理', '系统集成', '园区运营', '应急管理', 'AI 应用'];
const outputModes = ['技术标初稿', '售前方案', '响应矩阵', '风险清单'];

const initialForm = {
  project_name: '',
  project_type: projectTypes[0],
  output_mode: outputModes[0],
  bid_need: '',
  focus_points: ''
};

const emptyMarkdown = `# 生成结果将在这里展示

填写左侧项目信息后，点击“生成响应内容”。

支持复制 Markdown，也可以下载为 .md 文件。`;

function sanitizeFileName(name) {
  return (name || 'AI标书技术响应')
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, '-')
    .slice(0, 60);
}

function App() {
  const [form, setForm] = useState(initialForm);
  const [markdown, setMarkdown] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copyState, setCopyState] = useState('');

  const renderedHtml = useMemo(() => {
    return marked.parse(markdown || emptyMarkdown, {
      breaks: true,
      gfm: true
    });
  }, [markdown]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setCopyState('');
    setError('');

    const missingField = Object.entries(form).find(([, value]) => !String(value).trim());
    if (missingField) {
      setError('请完整填写左侧输入区后再生成。');
      return;
    }

    setLoading(true);

    try {
      const payload = await generateBid(form);
      setMarkdown(payload.markdown || '');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '生成失败，请稍后重试。');
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!markdown) return;

    try {
      await navigator.clipboard.writeText(markdown);
      setCopyState('已复制');
    } catch (_error) {
      setCopyState('复制失败');
    }
  }

  function handleDownload() {
    if (!markdown) return;

    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `${sanitizeFileName(form.project_name)}-${form.output_mode}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <main className="workspace">
      <section className="shell">
        <header className="topbar">
          <div>
            <p className="eyebrow">政企投标辅助工作台</p>
            <h1>AI 标书技术响应助手</h1>
          </div>
          <div className="status-pill">Dify Workflow API</div>
        </header>

        <div className="layout">
          <form className="input-panel" onSubmit={handleSubmit}>
            <div className="panel-heading">
              <h2>输入信息</h2>
              <span>必填</span>
            </div>

            <label className="field">
              <span>项目名称</span>
              <input
                value={form.project_name}
                onChange={(event) => updateField('project_name', event.target.value)}
                placeholder="例如：某市智慧城市综合治理平台"
              />
            </label>

            <div className="field-grid">
              <label className="field">
                <span>项目类型</span>
                <select
                  value={form.project_type}
                  onChange={(event) => updateField('project_type', event.target.value)}
                >
                  {projectTypes.map((item) => (
                    <option value={item} key={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>输出类型</span>
                <select
                  value={form.output_mode}
                  onChange={(event) => updateField('output_mode', event.target.value)}
                >
                  {outputModes.map((item) => (
                    <option value={item} key={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="field">
              <span>招标需求</span>
              <textarea
                value={form.bid_need}
                onChange={(event) => updateField('bid_need', event.target.value)}
                placeholder="粘贴招标文件中的建设目标、技术要求、服务范围、评分点等内容。"
                rows="9"
              />
            </label>

            <label className="field">
              <span>重点响应要求</span>
              <textarea
                value={form.focus_points}
                onChange={(event) => updateField('focus_points', event.target.value)}
                placeholder="填写必须强调的方案优势、交付边界、技术路线、风险约束或客户关注点。"
                rows="6"
              />
            </label>

            {error ? <div className="error-box">{error}</div> : null}

            <button className="primary-button" type="submit" disabled={loading}>
              {loading ? <Loader2 size={18} className="spin" /> : <Sparkles size={18} />}
              <span>{loading ? '生成中...' : '生成响应内容'}</span>
            </button>
          </form>

          <section className="result-panel">
            <div className="result-toolbar">
              <div>
                <h2>生成结果</h2>
                <p>{loading ? '正在生成响应内容' : markdown ? 'Markdown 已渲染为可读预览' : '等待生成内容'}</p>
              </div>
              <div className="actions">
                <button type="button" onClick={handleCopy} disabled={!markdown || loading} title="复制 Markdown">
                  <Clipboard size={17} />
                  <span>{copyState || '复制'}</span>
                </button>
                <button type="button" onClick={handleDownload} disabled={!markdown || loading} title="下载 Markdown 文件">
                  <Download size={17} />
                  <span>下载</span>
                </button>
              </div>
            </div>

            {loading ? (
              <div className="result-loading" role="status" aria-live="polite">
                <div className="loading-ring">
                  <Loader2 size={30} className="spin" />
                </div>
                <h3>正在生成标书响应内容</h3>
                <p>AI 正在分析招标需求、重点响应要求和输出类型。</p>
                <p>根据内容复杂程度，通常需要等待 30～60s。</p>
              </div>
            ) : (
              <article
                className={`markdown-preview ${!markdown ? 'empty' : ''}`}
                dangerouslySetInnerHTML={{ __html: renderedHtml }}
              />
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
