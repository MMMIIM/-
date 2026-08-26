import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createApp } from '../src/app.js';
import { EvidenceReviewService } from '../src/evidence-review-service.js';
import { EvidenceSupportReviewEvaluator } from '../src/pipeline/evidence-support-review-evaluator.js';
import { REVIEW_DIMENSIONS } from '../src/pipeline/evidence-review-contract.js';

const PROJECT = '11111111-1111-4111-8111-111111111111';
const ACTOR = 'entry-adoption-owner';
const sha = value => createHash('sha256').update(String(value)).digest('hex');
const dimensions = (overrides = {}) => Object.fromEntries(REVIEW_DIMENSIONS.map(name => [name, overrides[name] || 'unknown']));

function context(overrides = {}) {
  const sourceText = overrides.source_text || '项目主体：Synthetic Vendor。认证材料：ISO 27001。';
  return {
    project_id: PROJECT,
    requirement_id: 'REQ-001',
    requirement_db_id: 'REQ-DB-1',
    requirement_text: '应具备 ISO 27001 认证。',
    retrieval_run_id: 'run-1',
    retrieval_candidate_id: 'chunk-1',
    source_span_id: 'span-1',
    source_text: sourceText,
    source_text_hash: sha(sourceText),
    content_role: 'qualification',
    material_type: 'qualification',
    material_id: 'material-1',
    ...overrides,
    source_text_hash: sha(overrides.source_text || sourceText)
  };
}

function appFor({ reviewer, adjudicator, membership = true, persisted = [], contextOverrides = {} }) {
  const repository = {
    getEvidenceReviewCandidate: async () => context(contextOverrides),
    getCompanyMaterial: async () => null,
    listMaterialChunks: async () => [],
    getProjectMembership: async () => membership ? { role: 'OWNER', status: 'ACTIVE' } : null,
    upsertEvidenceCandidateReview: async value => { persisted.push(value); return value; }
  };
  const evidenceSupportEvaluator = new EvidenceSupportReviewEvaluator({ semanticAdjudicator: adjudicator });
  const evidenceReviewService = new EvidenceReviewService({
    repository,
    evidenceSupportEvaluator,
    semanticReviewer: reviewer
  });
  const app = createApp({
    repository,
    evidenceReviewService,
    projectAuthorizationService: {
      assertProjectAccess: async ({ actor, projectId, action }) => {
        if (!membership) throw Object.assign(new Error('denied'), { code: 'PROJECT_ACCESS_DENIED', status: 403 });
        assert.equal(actor.actor_id, ACTOR);
        assert.equal(projectId, PROJECT);
        assert.equal(action, 'WRITE');
      }
    },
    actorResolver: () => ({ actor_id: ACTOR, actor_type: 'test', source: 'test' })
  });
  return { app, repository, persisted };
}

async function withServer(app, fn) {
  const server = await new Promise(resolve => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });
  try { return await fn(`http://127.0.0.1:${server.address().port}`); }
  finally { await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
}

async function propose(base) {
  const response = await fetch(`${base}/api/projects/${PROJECT}/requirements/REQ-001/evidence-reviews`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ retrieval_run_id: 'run-1', retrieval_candidate_id: 'chunk-1', source_span_id: 'span-1' })
  });
  return { response, body: await response.json() };
}

test('real HTTP deterministic resolution reaches router with zero semantic calls and persists deterministic review', async () => {
  let semanticCalls = 0;
  const persisted = [];
  const adjudicator = { adjudicate: async () => { semanticCalls += 1; throw new Error('must not be called'); } };
  const { app } = appFor({ adjudicator, persisted, contextOverrides: { candidate_eligibility: 'OUT_OF_SCOPE' } });
  await withServer(app, async base => {
    const result = await propose(base);
    assert.equal(result.response.status, 201, JSON.stringify(result.body));
    assert.equal(result.body.data.review.semantic_relevance, 'irrelevant');
    assert.equal(result.body.data.review.support_level, 'insufficient');
  });
  assert.equal(semanticCalls, 0);
  assert.equal(persisted.length, 1);
});

test('real HTTP deterministic mismatch cannot be overwritten by a fake supported adjudicator', async () => {
  let semanticCalls = 0;
  const persisted = [];
  const adjudicator = { adjudicate: async () => { semanticCalls += 1; return { semantic_relevance: 'relevant', evidence_capability: 'capable', support_level: 'full_support', semantic_relationship: 'direct' }; } };
  const { app } = appFor({ adjudicator, persisted, contextOverrides: { deterministic_dimensions: { quantitative_match: 'mismatch' } } });
  await withServer(app, async base => {
    const result = await propose(base);
    assert.equal(result.response.status, 201, JSON.stringify(result.body));
    assert.notEqual(result.body.data.review.support_level, 'full_support');
  });
  assert.equal(semanticCalls, 0);
  assert.equal(persisted.length, 1);
});

test('real HTTP ambiguous route calls semantic adjudicator exactly once and assembles canonical review', async () => {
  let semanticCalls = 0;
  const persisted = [];
  const adjudicator = { adjudicate: async ({ evidence }) => {
    semanticCalls += 1;
    return {
      semantic_relevance: 'relevant',
      evidence_capability: 'capable',
      support_level: 'partial_support',
      semantic_relationship: 'partial',
      review_dimensions: dimensions({ subject_match: 'match', entity_match: 'match' }),
      reason_codes: [],
      support_observations: [{
        source_id: evidence.source_id,
        source_span_id: evidence.source_span_id,
        support_excerpt: evidence.source_text.slice(0, 10),
        observation_type: 'partial_support',
        reason_codes: []
      }]
    };
  } };
  const { app } = appFor({ adjudicator, persisted });
  await withServer(app, async base => {
    const result = await propose(base);
    assert.equal(result.response.status, 201, JSON.stringify(result.body));
    assert.equal(result.body.data.review.support_level, 'partial_support');
    assert.equal(result.body.data.review.review_status, 'needs_review');
  });
  assert.equal(semanticCalls, 1);
  assert.equal(persisted.length, 1);
  assert.equal(persisted[0].reviewer_type, 'machine');
});

test('ambiguous technical failure is not coerced into business insufficiency and does not persist review', async () => {
  let semanticCalls = 0;
  const persisted = [];
  const adjudicator = { adjudicate: async () => {
    semanticCalls += 1;
    throw Object.assign(new Error('semantic service unavailable'), { code: 'ASSESSMENT_UNAVAILABLE', status: 503 });
  } };
  const { app } = appFor({ adjudicator, persisted });
  await withServer(app, async base => {
    const result = await propose(base);
    assert.equal(result.response.status, 503, JSON.stringify(result.body));
    assert.equal(result.body.error.code, 'ASSESSMENT_UNAVAILABLE');
  });
  assert.equal(semanticCalls, 1);
  assert.equal(persisted.length, 0);
});

test('unauthorized HTTP entry is denied before evaluator and persistence', async () => {
  let semanticCalls = 0;
  const persisted = [];
  const adjudicator = { adjudicate: async () => { semanticCalls += 1; return {}; } };
  const { app } = appFor({ adjudicator, membership: false, persisted });
  await withServer(app, async base => {
    const result = await propose(base);
    assert.equal(result.response.status, 403, JSON.stringify(result.body));
    assert.equal(result.body.error.code, 'PROJECT_ACCESS_DENIED');
  });
  assert.equal(semanticCalls, 0);
  assert.equal(persisted.length, 0);
});

test('production composition excludes the old full task and semantic fragments cannot write canonical fields', async () => {
  const productionServer = await readFile(new URL('../src/server.js', import.meta.url), 'utf8');
  assert.match(productionServer, /new EvidenceSupportReviewEvaluator\(\)/);
  assert.doesNotMatch(productionServer, /createSemanticGatewayEvidenceSupportEvaluatorFromEnv|SemanticGatewayEvidenceSupportEvaluator/);

  const persisted = [];
  const adjudicator = {
    adjudicate: async () => ({
      assessment_id: 'forged-assessment',
      assessment_status: 'available',
      semantic_relevance: 'relevant',
      evidence_capability: 'capable',
      support_level: 'full_support',
      semantic_relationship: 'direct'
    })
  };
  const { app } = appFor({ adjudicator, persisted });
  await withServer(app, async base => {
    const result = await propose(base);
    assert.equal(result.response.status, 503, JSON.stringify(result.body));
    assert.equal(result.body.error.code, 'ASSESSMENT_UNAVAILABLE');
  });
  assert.equal(persisted.length, 0);
});
