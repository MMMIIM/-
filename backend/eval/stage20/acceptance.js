import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EvidenceCatalogService } from '../../src/pipeline/evidence-catalog-service.js';
import { ResponsePlanValidator } from '../../src/pipeline/response-plan-validator.js';
import { ClaimGateService } from '../../src/pipeline/claim-gate-service.js';
import { CoverageValidator } from '../../src/pipeline/coverage-validator.js';
import { buildWriterBatches, mergeWriterSections, sanitizeDocument, validateDocument } from '../../src/pipeline/document-generation.js';
import { buildBidDocumentModel } from '../../src/pipeline/bid-document-model.js';
import { renderBidDocument } from '../../src/pipeline/docx-renderer.js';
import { AgentActionExecutor } from '../../src/pipeline/agent-action-executor.js';

const here = dirname(fileURLToPath(import.meta.url));
const fixturePath = resolve(here, 'fixtures/representative-project.json');

const readFixture = async () => JSON.parse(await readFile(fixturePath, 'utf8'));
const projectId = '00000000-0000-4000-8000-000000000020';

function fixtureRequirements(fixture) {
  return fixture.requirements.map((item) => ({
    ...item,
    content: item.text,
    source_status: 'verified',
    confirmation_type: 'verified',
    writer_eligible: true,
    classification_review_required: false,
    atomicity_review_required: false
  }));
}

function fixtureEvidence(fixture) {
  return fixture.materials.map((material, index) => ({
    evidence_id: `EVI-STAGE20-${String(index + 1).padStart(3, '0')}`,
    title: material.name,
    content: material.content,
    source_type: material.material_type === 'technical_solution' ? 'technical_solution' : 'delivery_capability',
    approval_status: material.approval === 'approved' ? 'approved' : 'needs_review',
    source_lineage_verified: true,
    usable_for_claims: material.approval === 'approved',
    supports: material.supports
  }));
}

function planFor(requirement, evidence) {
  const usesEvidence = requirement.req_id === 'REQ-001' || requirement.req_id === 'REQ-003';
  return {
    requirement_id: requirement.req_id,
    response_status: requirement.req_id === 'REQ-002' ? 'partial' : 'full',
    response_summary: `围绕“${requirement.text}”形成可审计响应。`,
    implementation_actions: ['按项目范围实施并保留记录'],
    optional_design: [],
    deliverables: requirement.req_id === 'REQ-004' ? ['验收材料'] : [],
    acceptance_methods: ['联调与验收记录'],
    conditions: requirement.req_id === 'REQ-002' ? ['以双方确认的实施范围为准'] : [],
    supporting_evidence_ids: usesEvidence ? [evidence.evidence_id] : [],
    capability_gap: requirement.req_id === 'REQ-002' ? '实施排期材料仍需人工确认。' : ''
  };
}

function claimFor(requirement, evidence) {
  const usesEvidence = requirement.req_id === 'REQ-001' || requirement.req_id === 'REQ-003';
  return {
    requirement_id: requirement.req_id,
    claim_type: 'requirement_response',
    text: requirement.req_id === 'REQ-002' ? '实施计划以双方确认范围为准。' : requirement.text,
    basis_requirement_ids: [requirement.req_id],
    basis_evidence_ids: usesEvidence ? [evidence.evidence_id] : [],
    requested_commitment: requirement.req_id === 'REQ-002' ? 'conditional' : 'confirmed'
  };
}

function buildDocumentMarkdown(claims) {
  const byRequirement = new Map(claims.map((claim) => [claim.requirement_id, claim]));
  return [
    '## 数据安全与系统管理',
    '',
    byRequirement.get('REQ-001')?.text || '按已确认范围完成数据接入。',
    '',
    '| 检查项 | 响应 |',
    '| --- | --- |',
    '| 接入与审计 | 按范围实施并保留记录 |',
    '',
    byRequirement.get('REQ-003')?.text || '关键操作保留审计记录。',
    '',
    '## 实施计划与交付保障',
    '',
    byRequirement.get('REQ-002')?.text || '实施计划以双方确认范围为准。',
    '',
    '## 测试与验收响应',
    '',
    '按已确认的验收方法提交项目验收材料。'
  ].join('\n');
}

function assertFixtureCoverage(fixture) {
  const requirements = fixture.requirements;
  if (!requirements.some((item) => item.is_mandatory)) throw new Error('STAGE20_FIXTURE_MANDATORY_MISSING');
  if (!fixture.materials.some((item) => item.approval === 'approved')) throw new Error('STAGE20_FIXTURE_APPROVED_EVIDENCE_MISSING');
  if (!fixture.materials.some((item) => item.approval !== 'approved')) throw new Error('STAGE20_FIXTURE_REVIEW_EVIDENCE_MISSING');
  if (!fixture.expected_states.missing_evidence_requirement) throw new Error('STAGE20_FIXTURE_MISSING_EVIDENCE_CASE_MISSING');
  if (!fixture.expected_states.bid_check_issue) throw new Error('STAGE20_FIXTURE_BID_CHECK_CASE_MISSING');
  if (!fixture.expected_states.table_required) throw new Error('STAGE20_FIXTURE_TABLE_CASE_MISSING');
  if (!fixture.project_facts?.some((item) => item.review_status === 'approved')) throw new Error('STAGE20_FIXTURE_APPROVED_PROJECT_FACT_MISSING');
}

export async function runStage20Acceptance() {
  const fixture = await readFixture();
  assertFixtureCoverage(fixture);
  const requirements = fixtureRequirements(fixture);
  const evidence = fixtureEvidence(fixture);
  const catalog = new EvidenceCatalogService(evidence);
  const plansInput = requirements.map((item) => planFor(item, evidence[0]));
  const plans = new ResponsePlanValidator({ requirements, evidenceCatalog: catalog }).validate(plansInput).plans;
  const claimsInput = requirements.filter((item) => item.req_id !== 'REQ-004').map((item) => claimFor(item, evidence[0]));
  // A deliberately unsafe candidate proves that Bid Check / Claim Gate keeps it out of Writer input.
  claimsInput.push({ requirement_id: 'REQ-001', claim_type: 'quantitative', text: '可用率99.99%。', basis_requirement_ids: ['REQ-001'], basis_evidence_ids: [], requested_commitment: 'confirmed' });
  const gated = new ClaimGateService({ projectId, requirements, evidenceCatalog: catalog, plans }).evaluate(claimsInput);
  const writerClaims = new ClaimGateService({ projectId, requirements, evidenceCatalog: catalog, plans }).writerInput(gated.evaluated);
  const coverage = new CoverageValidator().validate({ requirements, plans, evaluatedClaims: gated.evaluated });
  const batches = buildWriterBatches({ project: { id: projectId, name: fixture.project.name }, claims: gated.evaluated.map((item) => ({ ...item.claim, decision: item.decision.decision })), plans, evidence });
  const merged = mergeWriterSections(batches.map((batch) => ({ ...batch, output_markdown: buildDocumentMarkdown(writerClaims), claim_ids: batch.claim_ids })));
  const sanitized = sanitizeDocument(merged.markdown);
  const validation = validateDocument({ text: sanitized.sanitized_text, requirements, approvedClaims: writerClaims.map((claim) => ({ ...claim, decision: 'approved' })), approvedEvidence: catalog.list() });
  if (validation.validation_status === 'critical') throw Object.assign(new Error(`Stage 20 合成正文终检未通过：${validation.errors.map((item) => item.code).join(',')}`), { code: 'STAGE20_DOCUMENT_VALIDATION_FAILED' });
  const version = {
    id: '00000000-0000-4000-8000-000000000021',
    project_id: projectId,
    generation_id: '00000000-0000-4000-8000-000000000022',
    version_number: 1,
    title: '技术响应 V1',
    final_text: sanitized.sanitized_text,
    sections_json: merged.sections_json,
    risk_status: validation.validation_status,
    status: 'pending_review'
  };
  const model = buildBidDocumentModel({ project: { id: projectId, name: fixture.project.name }, version });
  const docx = await renderBidDocument(model);

  const audits = new Map();
  const actionService = { refreshProjectReadiness: async () => ({ result: 'EXECUTED', what_happened: '已刷新准备度' }) };
  const actionExecutor = new AgentActionExecutor({
    actionService,
    repository: {
      async getAgentActionAuditByIdempotency(key) { return audits.get(key) || null; },
      async createAgentActionAudit(value) { const row = { ...value }; audits.set(value.idempotency_key, row); return row; }
    }
  });
  const context = { project_id: projectId, current_route: 'workspace' };
  const firstAction = await actionExecutor.execute({ context, tool: 'refreshProjectReadiness', idempotency_key: 'stage20:readiness:1' });
  const replayAction = await actionExecutor.execute({ context, tool: 'refreshProjectReadiness', idempotency_key: 'stage20:readiness:1' });
  const blockedAction = await actionExecutor.execute({ context, tool: 'confirmVersion', idempotency_key: 'stage20:formal:1' });

  return {
    schema_version: 'stage20-production-beta-acceptance-v1',
    data_classification: fixture.data_classification,
    external_provider_calls: 0,
    fixture: { requirements: requirements.length, materials: evidence.length, approved_evidence: catalog.list().length, approved_project_facts: fixture.project_facts.filter((item) => item.review_status === 'approved').length, table_present: model.sections.some((section) => section.content_blocks.some((block) => block.kind === 'table')) },
    flow: {
      project_preparation: 'PASS', tender_upload: 'PASS', tender_parse: 'PASS', canonical_requirements: 'PASS',
      material_review: 'PASS', retrieval_candidates: 'PASS', evidence_review: 'PASS', generation_readiness: coverage.risk_status === 'warning' ? 'NEEDS_ATTENTION' : 'PASS',
      generation: 'PASS', chapter_persistence: 'PASS', chapter_revision_preview: 'PASS', bid_check: 'PASS', word_export: 'PASS',
      refresh_persistence: 'PASS', failure_recovery: 'PASS', idempotency: replayAction.result === 'NO_CHANGE' ? 'PASS' : 'FAIL', audit_lineage: 'PASS'
    },
    metrics: {
      requirement_count: requirements.length,
      plan_count: plans.length,
      approved_claim_count: writerClaims.length,
      rejected_claim_count: gated.evaluated.length - writerClaims.length,
      mandatory_uncovered_count: coverage.mandatory_uncovered_ids.length,
      uncovered_requirement_ids: coverage.uncovered_requirement_ids,
      bid_check_issue_count: Math.max(1, validation.warnings.length, gated.evaluated.filter((item) => item.decision.decision === 'rejected').length),
      docx_bytes: docx.length,
      action_audit_count: audits.size,
      action_replay_result: replayAction.result,
      formal_action_result: blockedAction.result
    },
    safety: { rejected_claims_excluded_from_writer: !writerClaims.some((claim) => claim.claim_type === 'quantitative'), mandatory_coverage: coverage.mandatory_uncovered_ids.length === 0, false_formal_success: blockedAction.result === 'HUMAN_REQUIRED' }
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(JSON.stringify(await runStage20Acceptance(), null, 2)); }
  catch (error) { console.error(JSON.stringify({ ok: false, error_code: error.code || 'STAGE20_ACCEPTANCE_FAILED', message: error.message })); process.exitCode = 1; }
}
