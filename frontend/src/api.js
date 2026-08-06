const API_BASE = import.meta.env.VITE_API_BASE || '';
const GATEWAY_TIMEOUT_MESSAGE =
  'Dify Cloud 网关超时，请稍后重试，或缩短生成内容 / 改用 streaming / 本地部署 Dify。';

function looksLikeHtmlError(text) {
  return /<!doctype html>/i.test(text)
    || /<html[\s>]/i.test(text)
    || /504:\s*gateway time-out/i.test(text)
    || /gateway timeout/i.test(text);
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });

  const responseText = await response.text();

  if (looksLikeHtmlError(responseText)) {
    throw new Error(GATEWAY_TIMEOUT_MESSAGE);
  }

  let payload = {};

  try {
    payload = responseText ? JSON.parse(responseText) : {};
  } catch (_error) {
    throw new Error('服务返回了非预期响应，请稍后重试。');
  }

  if (!response.ok) {
    throw new Error(payload.message || '请求失败，请稍后重试');
  }

  return payload;
}

export function generateBid(inputs) {
  return request('/api/generate-bid', {
    method: 'POST',
    body: JSON.stringify(inputs)
  });
}
