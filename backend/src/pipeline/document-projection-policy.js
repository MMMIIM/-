/**
 * Deterministic projection from approved Project Facts to formal document
 * fields. Approval makes a fact usable by the control plane; it does not make
 * every key or value suitable for a customer-facing document.
 */

export const DOCUMENT_PROJECTION_POLICY_VERSION = 'document-projection-v1';

const FORMAL_FIELDS = Object.freeze({
  project_name: { field: 'project_name', label: '项目名称' },
  project_name_formal: { field: 'project_name', label: '项目名称' },
  '项目名称': { field: 'project_name', label: '项目名称' },
  project_number: { field: 'project_number', label: '项目编号' },
  tender_number: { field: 'project_number', label: '项目编号' },
  bid_number: { field: 'project_number', label: '项目编号' },
  '项目编号': { field: 'project_number', label: '项目编号' },
  bidder: { field: 'bidder', label: '投标人' },
  bidder_name: { field: 'bidder', label: '投标人' },
  enterprise_name: { field: 'bidder', label: '投标人' },
  '投标人': { field: 'bidder', label: '投标人' },
  project_duration: { field: 'project_duration', label: '项目周期' },
  delivery_period: { field: 'project_duration', label: '项目周期' },
  project_period: { field: 'project_duration', label: '项目周期' },
  '项目周期': { field: 'project_duration', label: '项目周期' },
  export_date: { field: 'date', label: '日期' },
  '日期': { field: 'date', label: '日期' }
});

function keyOf(value) {
  return String(value ?? '').trim().toLowerCase();
}

function isTechnicalKey(key) {
  return !key || key.includes('.') || /(?:^|[_-])(id|hash|debug|audit|metadata|classification)(?:$|[_-])/i.test(key)
    || /^(?:e2e|synthetic|internal)(?:$|[_-])/.test(key);
}

function scalarDisplayValue(value) {
  if (value === null || value === undefined || typeof value === 'object' || typeof value === 'function') return null;
  const result = String(value).trim();
  if (!result || result === '[object Object]' || /(?:data_classification|synthetic|e2e\.)/i.test(result)) return null;
  return result;
}

/** Remove only known internal metadata suffixes from a project display name. */
export function projectNameForDocument(project = {}) {
  const candidate = project.formal_name || project.document_name || project.name || '';
  const cleaned = String(candidate)
    .replace(/\s*\[(?:data_classification|classification)\s*=\s*[^\]]+\]/gi, '')
    .replace(/\s*\[(?:representative[_ -]?synthetic|synthetic)\]/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  // Known fixture/debug project names are not formal document names. Omit
  // them rather than leaking synthetic or engineering labels into a bid.
  if (!project.formal_name && !project.document_name && /^(?:e2e|stage\d+|batch\s+mode|plan\s+edit)(?:[-_\s]|$)/i.test(cleaned)) return '';
  return cleaned;
}

/**
 * Return only approved, scalar facts whose keys map to a known formal field.
 * Unknown/technical/object-valued facts are intentionally omitted.
 */
export function projectFactsForDocument(facts = []) {
  const fields = new Map();
  for (const fact of Array.isArray(facts) ? facts : []) {
    const key = keyOf(fact.key ?? fact.fact_key);
    if (isTechnicalKey(key)) continue;
    const mapping = FORMAL_FIELDS[key];
    if (!mapping) continue;
    const value = scalarDisplayValue(fact.value ?? fact.value_payload);
    if (!value) continue;
    if (!fields.has(mapping.field)) fields.set(mapping.field, { field: mapping.field, label: mapping.label, value });
  }
  return [...fields.values()];
}

export function projectDocumentFields({ project = {}, approvedProjectFacts = [] } = {}) {
  const factFields = projectFactsForDocument(approvedProjectFacts);
  const byField = new Map(factFields.map((item) => [item.field, item.value]));
  const projectName = byField.get('project_name') || projectNameForDocument(project);
  return {
    project_name: projectName || null,
    project_number: byField.get('project_number') || scalarDisplayValue(project.formal_project_number),
    bidder: byField.get('bidder') || scalarDisplayValue(project.formal_bidder_name),
    project_duration: byField.get('project_duration') || null,
    date: byField.get('date') || scalarDisplayValue(project.formal_date) || null
  };
}

export function displayEligibleProjectFactCount(facts = []) {
  return projectFactsForDocument(facts).length;
}
