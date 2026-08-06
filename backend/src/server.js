import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({
  path: resolve(__dirname, '../.env')
});

const app = express();
const port = Number(process.env.PORT || 3001);
const host = process.env.HOST || '127.0.0.1';

const REQUIRED_INPUTS = ['project_name', 'project_type', 'bid_need', 'focus_points', 'output_mode'];
const DIFY_GATEWAY_TIMEOUT_MESSAGE =
  'Dify Cloud 网关超时，请稍后重试，或缩短生成内容 / 改用 streaming / 本地部署 Dify。';

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173'
}));
app.use(express.json({ limit: '2mb' }));

function normalizeBaseUrl(baseUrl) {
  return String(baseUrl || '').trim().replace(/\/+$/, '');
}

function readDifyOutput(payload) {
  const outputs = payload?.data?.outputs || payload?.outputs || {};

  for (const key of ['result', 'text', 'answer']) {
    const value = outputs[key];
    if (typeof value === 'string' && value.trim()) return value;
    if (value !== undefined && value !== null && typeof value !== 'object') return String(value);
  }

  const firstValue = Object.values(outputs).find((value) => {
    if (typeof value === 'string') return value.trim();
    return value !== undefined && value !== null;
  });

  if (typeof firstValue === 'string') return firstValue;
  if (firstValue !== undefined) return JSON.stringify(firstValue, null, 2);

  return '';
}

function looksLikeDifyGatewayTimeout(text) {
  return /<!doctype html>/i.test(text)
    || /<html[\s>]/i.test(text)
    || /504:\s*gateway time-out/i.test(text)
    || /gateway timeout/i.test(text);
}

function safeTextDetail(text) {
  if (!text || looksLikeDifyGatewayTimeout(text)) return undefined;
  return text.slice(0, 1000);
}

function extractStreamingText(payload, eventName) {
  const candidates = [
    payload?.data?.text,
    payload?.data?.answer,
    payload?.data?.message,
    payload?.text,
    payload?.answer,
    payload?.message,
    payload?.delta,
    payload?.content
  ];

  for (const value of candidates) {
    if (typeof value === 'string' && value) return value;
  }

  return '';
}

function parseSseBlock(block) {
  let eventName = '';
  const dataLines = [];

  for (const line of block.split(/\r?\n/)) {
    if (!line || line.startsWith(':')) continue;

    if (line.startsWith('event:')) {
      eventName = line.slice('event:'.length).trim();
      continue;
    }

    if (line.startsWith('data:')) {
      dataLines.push(line.slice('data:'.length).trimStart());
    }
  }

  return {
    eventName,
    dataText: dataLines.join('\n')
  };
}

async function readDifyStreamingResponse(response) {
  const decoder = new TextDecoder('utf-8');
  const reader = response.body?.getReader();

  if (!reader) {
    const text = await response.text();
    if (looksLikeDifyGatewayTimeout(text)) {
      throw new Error(DIFY_GATEWAY_TIMEOUT_MESSAGE);
    }
    return text;
  }

  let buffer = '';
  let rawText = '';
  let finalOutput = '';
  const chunks = [];

  async function consumeBlock(block) {
    const { eventName, dataText } = parseSseBlock(block);

    if (!dataText || dataText === '[DONE]') return;

    if (looksLikeDifyGatewayTimeout(dataText)) {
      throw new Error(DIFY_GATEWAY_TIMEOUT_MESSAGE);
    }

    try {
      const payload = JSON.parse(dataText);
      const currentEvent = eventName || payload?.event || '';

      if (currentEvent === 'error') {
        throw new Error(payload?.message || payload?.data?.message || 'Dify Workflow 流式生成失败');
      }

      if (currentEvent === 'workflow_finished') {
        const workflowOutput = readDifyOutput(payload) || readDifyOutput(payload?.data || {});
        if (workflowOutput) finalOutput = workflowOutput;
        return;
      }

      const text = extractStreamingText(payload, currentEvent);
      if (text) chunks.push(text);
    } catch (error) {
      if (error instanceof SyntaxError) {
        if (eventName === 'text_chunk' || eventName === 'message') {
          chunks.push(dataText);
        }
        return;
      }

      throw error;
    }
  }

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    rawText += chunk;

    if (rawText.length <= 4096 && looksLikeDifyGatewayTimeout(rawText)) {
      throw new Error(DIFY_GATEWAY_TIMEOUT_MESSAGE);
    }

    buffer += chunk;
    const blocks = buffer.split(/\r?\n\r?\n/);
    buffer = blocks.pop() || '';

    for (const block of blocks) {
      await consumeBlock(block);
    }
  }

  buffer += decoder.decode();
  if (buffer.trim()) {
    await consumeBlock(buffer);
  }

  if (!chunks.length && looksLikeDifyGatewayTimeout(rawText)) {
    throw new Error(DIFY_GATEWAY_TIMEOUT_MESSAGE);
  }

  return finalOutput || chunks.join('');
}

function buildInputs(body) {
  return REQUIRED_INPUTS.reduce((inputs, key) => {
    inputs[key] = body[key];
    return inputs;
  }, {});
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/generate-bid', async (req, res) => {
  const missingInputs = REQUIRED_INPUTS.filter((key) => !String(req.body?.[key] || '').trim());

  if (missingInputs.length > 0) {
    return res.status(400).json({
      message: `缺少必要字段：${missingInputs.join('、')}`
    });
  }

  const difyApiBase = normalizeBaseUrl(process.env.DIFY_API_BASE);
  const difyApiKey = process.env.DIFY_API_KEY;

  if (!difyApiBase || !difyApiKey) {
    return res.status(500).json({
      message: '后端未配置 DIFY_API_BASE 或 DIFY_API_KEY，请检查 backend/.env'
    });
  }

  try {
    const difyResponse = await fetch(`${difyApiBase}/workflows/run`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${difyApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: buildInputs(req.body),
        response_mode: 'streaming',
        user: req.body.user || 'bid-assistant-local'
      })
    });

    const contentType = difyResponse.headers.get('content-type') || '';

    if (!difyResponse.ok) {
      const errorText = await difyResponse.text();

      if (looksLikeDifyGatewayTimeout(errorText)) {
        return res.status(504).json({
          message: DIFY_GATEWAY_TIMEOUT_MESSAGE
        });
      }

      let errorPayload = {};
      try {
        errorPayload = contentType.includes('application/json') ? JSON.parse(errorText) : {};
      } catch (_error) {
        errorPayload = {};
      }

      return res.status(difyResponse.status).json({
        message: errorPayload?.message || errorPayload?.error || safeTextDetail(errorText) || 'Dify Workflow 调用失败',
        detail: errorPayload
      });
    }

    if (contentType.includes('text/html')) {
      const htmlText = await difyResponse.text();
      if (looksLikeDifyGatewayTimeout(htmlText)) {
        return res.status(504).json({
          message: DIFY_GATEWAY_TIMEOUT_MESSAGE
        });
      }
      return res.status(502).json({
        message: 'Dify Workflow 返回了非预期的 HTML 响应'
      });
    }

    let finalMarkdown = '';

    if (contentType.includes('text/event-stream')) {
      finalMarkdown = await readDifyStreamingResponse(difyResponse);
    } else if (contentType.includes('application/json')) {
      const difyPayload = await difyResponse.json();
      finalMarkdown = readDifyOutput(difyPayload);
    } else {
      const text = await difyResponse.text();

      if (looksLikeDifyGatewayTimeout(text)) {
        return res.status(504).json({
          message: DIFY_GATEWAY_TIMEOUT_MESSAGE
        });
      }

      return res.status(502).json({
        message: 'Dify Workflow 返回了非预期的响应格式'
      });
    }

    if (!finalMarkdown) {
      return res.status(502).json({
        message: 'Dify Workflow 流式响应未返回可展示文本'
      });
    }

    return res.json({
      markdown: finalMarkdown,
      response_mode: 'streaming'
    });
  } catch (error) {
    if (error instanceof Error && error.message === DIFY_GATEWAY_TIMEOUT_MESSAGE) {
      return res.status(504).json({
        message: DIFY_GATEWAY_TIMEOUT_MESSAGE
      });
    }

    return res.status(502).json({
      message: '无法连接 Dify Workflow API',
      detail: error instanceof Error ? error.message : String(error)
    });
  }
});

app.listen(port, host, () => {
  console.log(`Backend listening on http://${host}:${port}`);
});
