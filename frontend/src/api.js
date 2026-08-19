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
  return payload.ok === true && payload.data && typeof payload.data === 'object' ? payload.data : payload;
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
  listRequirementCandidates(jobId, sourceStatus = '') {
    const query = sourceStatus ? `?source_status=${encodeURIComponent(sourceStatus)}` : '';
    return request(`/api/tender-parse-jobs/${jobId}/requirement-candidates${query}`);
  },
  getRequirementConfirmationRisk(jobId) {
    return request(`/api/tender-parse-jobs/${jobId}/confirmation-risk`);
  },
  confirmRequirementBaseline(jobId, confirmedBy = 'current_user') {
    return request(`/api/tender-parse-jobs/${jobId}/confirm`, { method: 'POST', body: JSON.stringify({ confirmed_by: confirmedBy }) });
  },
  includeProvisionalBatch(jobId, confirmedBy = 'current_user') {
    return request(`/api/tender-parse-jobs/${jobId}/confirm-provisional`, { method: 'POST', body: JSON.stringify({ confirmed_by: confirmedBy }) });
  },
  confirmProvisionalCandidate(candidateId, confirmedBy = 'current_user') {
    return request(`/api/requirement-candidates/${candidateId}/confirm-provisional`, { method: 'POST', body: JSON.stringify({ confirmed_by: confirmedBy }) });
  },
  excludeRequirementCandidate(candidateId, confirmedBy = 'current_user') {
    return request(`/api/requirement-candidates/${candidateId}/exclude`, { method: 'POST', body: JSON.stringify({ confirmed_by: confirmedBy }) });
  },
  restoreRequirementCandidate(candidateId) {
    return request(`/api/requirement-candidates/${candidateId}/restore`, { method: 'POST', body: '{}' });
  },
  setRequirementSourceStatus(candidateId, sourceStatus, confirmedBy = 'current_user') {
    return request(`/api/requirement-candidates/${candidateId}/source-status`, { method: 'PATCH', body: JSON.stringify({ source_status: sourceStatus, confirmed_by: confirmedBy }) });
  },
  updateRequirementClassification(candidateId, requirementCategory) {
    return request(`/api/requirement-candidates/${candidateId}/classification`, { method: 'PATCH', body: JSON.stringify({ requirement_category: requirementCategory }) });
  },
  listCompanyMaterials(projectId) {
    return request(`/api/projects/${projectId}/company-materials`);
  },
  uploadCompanyMaterial(projectId, file, materialType) {
    const body = new FormData(); body.append('file', file); body.append('material_type', materialType);
    return request(`/api/projects/${projectId}/company-materials`, { method:'POST', body });
  },
  listEvidences(projectId) {
    return request(`/api/projects/${projectId}/evidences`);
  },
  createEvidence(projectId, input) {
    return request(`/api/projects/${projectId}/evidences`, { method:'POST', body:JSON.stringify(input) });
  },
  decideEvidence(evidenceId, decision, decidedBy = 'current_user') {
    return request(`/api/evidences/${evidenceId}/${decision}`, { method:'POST', body:JSON.stringify({ decided_by:decidedBy }) });
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
