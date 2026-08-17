const API_BASE = import.meta.env.VITE_API_BASE || '';

async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.body && !(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const text = await response.text();
  let payload = {};
  try { payload = text ? JSON.parse(text) : {}; }
  catch (_error) { throw new Error('服务返回了非预期响应，请稍后重试。'); }
  if (!response.ok) {
    const error = new Error(payload.message || '请求失败，请稍后重试。');
    error.code = payload.code;
    throw error;
  }
  return payload;
}

export const api = {
  listProjects: () => request('/api/projects'),
  getProject: (id) => request(`/api/projects/${id}`),
  createProject(data) {
    const body = new FormData();
    body.append('name', data.name);
    if (data.deadline) body.append('deadline', data.deadline);
    if (data.file) body.append('tender_file', data.file);
    return request('/api/projects', { method: 'POST', body });
  },
  uploadTenderFile(projectId, file) {
    const body = new FormData();
    body.append('file', file);
    return request(`/api/projects/${projectId}/tender-files`, { method: 'POST', body });
  },
  generate(projectId, inputs) {
    return request(`/api/projects/${projectId}/generation-jobs`, { method: 'POST', body: JSON.stringify(inputs) });
  },
  confirmVersion(versionId, confirmationText) {
    return request(`/api/document-versions/${versionId}/review-decisions`, {
      method: 'POST', body: JSON.stringify({ decision: 'confirmed', confirmation_text: confirmationText })
    });
  },
  generateBid(inputs) {
    return request('/api/generate-bid', { method: 'POST', body: JSON.stringify(inputs) });
  }
};

export const generateBid = api.generateBid;
