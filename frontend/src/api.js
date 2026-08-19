const API_BASE = import.meta.env.VITE_API_BASE || '';

export async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.body && !(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const text = await response.text();
  let payload = {};
  try {
    payload = text ? JSON.parse(text) : {};
  } catch (_error) {
    const code = response.ok ? 'API_RESPONSE_INVALID' : `HTTP_${response.status}`;
    const message = response.ok
      ? '服务响应格式无效，请确认前后端接口版本一致。'
      : `后端接口不可用（HTTP ${response.status}），请确认前后端版本和 API 地址。`;
    const error = new Error(message);
    error.code = code;
    error.status = response.status;
    throw error;
  }
  if (!response.ok || payload.ok === false) {
    const detail = payload.error && typeof payload.error === 'object' ? payload.error : payload;
    const error = new Error(detail.message || '请求失败，请稍后重试。');
    error.code = detail.code || `HTTP_${response.status}`;
    error.status = response.status;
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
  startTenderParse(projectId, tenderFileId) {
    return request(`/api/projects/${projectId}/tender-parse-jobs`, {
      method: 'POST', body: JSON.stringify({ tender_file_id: tenderFileId })
    });
  },
  getTenderParseJob(jobId) {
    return request(`/api/tender-parse-jobs/${jobId}`);
  },
  confirmRequirementBaseline(jobId, confirmedBy = 'current_user') {
    return request(`/api/tender-parse-jobs/${jobId}/confirm`, { method: 'POST', body: JSON.stringify({ confirmed_by: confirmedBy }) });
  },
  includeProvisionalBatch(jobId, confirmedBy = 'current_user') {
    return request(`/api/tender-parse-jobs/${jobId}/provisional-decisions`, { method: 'POST', body: JSON.stringify({ confirmed_by: confirmedBy }) });
  },
  getCandidateSourceReview(candidateId) {
    return request(`/api/requirement-candidates/${candidateId}/source-review`);
  },
  decideCandidateSource(candidateId, decision) {
    return request(`/api/requirement-candidates/${candidateId}/source-decision`, {
      method: 'POST', body: JSON.stringify(decision)
    });
  },
  getProductionBeta(projectId) {
    return request(`/api/projects/${projectId}/production-beta`);
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
