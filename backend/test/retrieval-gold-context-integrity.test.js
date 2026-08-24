import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  finalHitAtK,
  firstDecisionBearingRawRank,
  firstRankForChunkIds,
  splitGoldEvidenceAndContext
} from '../eval/evidence-support/calibration-v2/gold-context-integrity.js';

const PACKET = new URL('../eval/evidence-support/calibration-v2/GPT_REVIEW_PACKET_STAGE17_FINAL_LIVE_6.json', import.meta.url);

test('Gold context heading never counts as Exact Gold Evidence', () => {
  const rawCandidates = [
    { chunk_id: 'HEADING', raw_rank: 1, chunk_role: 'HEADING', candidate_eligibility: 'CONTEXT_ONLY', source_eligibility: 'ELIGIBLE', requirement_relative_classification: 'METADATA_OR_HEADER' },
    { chunk_id: 'BUSINESS', raw_rank: 4, chunk_role: 'BUSINESS_CONTENT', candidate_eligibility: 'EVIDENCE_ELIGIBLE', source_eligibility: 'ELIGIBLE', requirement_relative_classification: 'EVIDENCE_BEARING', final_phase_rank: 2 }
  ];
  const sets = splitGoldEvidenceAndContext({ goldChunkIds: ['HEADING', 'BUSINESS'], rawCandidates });
  assert.deepEqual(sets, { goldEvidenceChunkIds: ['BUSINESS'], goldContextChunkIds: ['HEADING'] });
  assert.equal(firstRankForChunkIds(rawCandidates, sets.goldEvidenceChunkIds), 4);
  assert.equal(firstDecisionBearingRawRank(rawCandidates), 4);
  assert.equal(finalHitAtK(rawCandidates, sets.goldEvidenceChunkIds, 3), true);
});

test('V2R001 frozen Gold separates heading context from business evidence', () => {
  const packet = JSON.parse(fs.readFileSync(PACKET, 'utf8'));
  const current = packet.cases.find((item) => item.case_id === 'V2R-001-PERF-DIRECT');
  const sets = splitGoldEvidenceAndContext({ goldChunkIds: current.gold.gold_evidence_chunk_ids, rawCandidates: current.raw_candidate_pool });
  assert.deepEqual(sets.goldEvidenceChunkIds, ['MCH-0FBD3599DAF932016F62EB9634B997AF']);
  assert.deepEqual(sets.goldContextChunkIds, ['MCH-B4FF02295DBB6DCDF6E2763F057076F6']);
  assert.equal(firstRankForChunkIds(current.raw_candidate_pool, sets.goldEvidenceChunkIds), 4);
  assert.equal(firstDecisionBearingRawRank(current.raw_candidate_pool), 4);
  assert.equal(firstRankForChunkIds(current.final_candidates, sets.goldEvidenceChunkIds, 'final_phase_rank'), 2);
  assert.equal(finalHitAtK(current.final_candidates, sets.goldEvidenceChunkIds, 3), true);
});

test('Gold Evidence and Decision-Bearing ranks share one raw rank space', () => {
  const rawCandidates = [
    { chunk_id: 'CONTEXT', raw_rank: 1, chunk_role: 'HEADING', candidate_eligibility: 'CONTEXT_ONLY', source_eligibility: 'ELIGIBLE', requirement_relative_classification: 'METADATA_OR_HEADER' },
    { chunk_id: 'EVIDENCE', raw_rank: 4, chunk_role: 'BUSINESS_CONTENT', candidate_eligibility: 'EVIDENCE_ELIGIBLE', source_eligibility: 'ELIGIBLE', requirement_relative_classification: 'EVIDENCE_BEARING' }
  ];
  const sets = splitGoldEvidenceAndContext({ goldChunkIds: ['CONTEXT', 'EVIDENCE'], rawCandidates });
  const exactRank = firstRankForChunkIds(rawCandidates, sets.goldEvidenceChunkIds);
  const decisionRank = firstDecisionBearingRawRank(rawCandidates);
  assert.equal(exactRank, 4);
  assert.ok(decisionRank <= exactRank);
});

test('Final Gold rank 2 satisfies Exact Hit@3 and Decision Hit@3', () => {
  const finalCandidates = [
    { chunk_id: 'EVIDENCE', final_phase_rank: 2, chunk_role: 'BUSINESS_CONTENT', candidate_eligibility: 'EVIDENCE_ELIGIBLE', source_eligibility: 'ELIGIBLE', requirement_relative_classification: 'EVIDENCE_BEARING' }
  ];
  assert.equal(finalHitAtK(finalCandidates, ['EVIDENCE'], 3), true);
  assert.equal(finalHitAtK(finalCandidates.filter((candidate) => candidate.requirement_relative_classification === 'EVIDENCE_BEARING'), ['EVIDENCE'], 3), true);
});
