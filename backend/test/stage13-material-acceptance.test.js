import test from 'node:test';
import assert from 'node:assert/strict';
import { EvidenceSourceFactService } from '../src/evidence-source-fact-service.js';
import { RequirementEvidenceFactMappingService } from '../src/requirement-evidence-fact-mapping-service.js';
import { EvidenceReadinessService } from '../src/evidence-readiness-service.js';
import { createStage13AcceptanceFixture } from './fixtures/stage13-material-acceptance.js';

test('Stage 13 acceptance fixture closes the stale-proof → re-confirm → readiness loop', async () => {
  const fixture = createStage13AcceptanceFixture();
  const oldFact = fixture.makeOldFact();
  const factService = new EvidenceSourceFactService({ repository: fixture.repository, projectAuthorizationService: fixture.projectAuthorizationService, extractor: fixture.extractor });
  await assert.rejects(() => factService.decide(oldFact.fact_id, 'approve', { reviewer: 'acceptance-user' }), error => error.code === 'EVIDENCE_FACT_INVALIDATED');
  assert.equal(fixture.state.facts.get(oldFact.fact_id).review_status, 'invalidated');

  const extracted = await factService.extract({ projectId: fixture.projectId, reviewId: fixture.review.review_id, actor: { actor_id: 'acceptance-user', actor_type: 'test', source: 'test' } });
  assert.equal(extracted.facts.length, 1);
  assert.equal(extracted.facts[0].review_status, 'draft');
  assert.equal(extracted.facts[0].quantities[0].value, '50');
  const approvedFact = await factService.decide(extracted.facts[0].fact_id, 'approve', { reviewer: 'acceptance-user' });
  assert.equal(approvedFact.review_status, 'approved');

  const mappingService = new RequirementEvidenceFactMappingService({ repository: fixture.repository, evaluator: fixture.mappingEvaluator });
  const proposed = await mappingService.propose({ projectId: fixture.projectId, requirementId: fixture.requirementId, factId: approvedFact.fact_id, sourceType: 'manual' });
  assert.equal(proposed.review_status, 'proposed');
  const approvedMapping = await mappingService.decide(proposed.mapping_id, 'approve', { reviewer: 'acceptance-user' });
  assert.equal(approvedMapping.review_status, 'approved');

  const readiness = await new EvidenceReadinessService({ repository: fixture.repository }).get(fixture.projectId);
  assert.equal(readiness.requirements[0].readiness, 'SUPPORTED');
  assert.equal(readiness.generation_readiness.status, 'READY_TO_GENERATE');
  assert.equal(readiness.requirements[0].approved_fact_count, 1);
  assert.equal(readiness.requirements[0].approved_mapping_count, 1);
  assert.equal([...fixture.state.facts.values()].filter(item => item.review_status === 'approved').length, 1);
});
