function cleanIds(values) {
  return [...new Set((values || []).filter((value) => typeof value === 'string' && value.trim()).map((value) => value.trim()))];
}

export class EvidenceCatalogService {
  constructor(evidence = []) {
    this.evidence = evidence.map((item) => ({ ...item, source_roles: cleanIds(item.source_roles) }));
    this.byId = new Map(this.evidence.map((item) => [item.evidence_id, item]));
  }

  assertExisting(ids = []) {
    const normalized = cleanIds(ids);
    const missing = normalized.filter((id) => !this.byId.has(id));
    if (missing.length) throw Object.assign(new Error(`Evidence 不存在：${missing.join(', ')}`), { code: 'EVIDENCE_NOT_FOUND', missing_ids: missing });
    return normalized;
  }

  list() { return this.evidence.map((item) => ({ ...item })); }
}
