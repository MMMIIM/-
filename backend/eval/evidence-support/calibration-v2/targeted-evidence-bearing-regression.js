import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(fs.readFileSync(path.join(HERE, 'targeted-evidence-bearing-regression.json'), 'utf8'));
const pool = JSON.parse(fs.readFileSync(path.join(HERE, 'candidate-pool-v2-remediated.json'), 'utf8'));

export function validateTargetedEvidenceBearingSet({ target = manifest, candidatePool = pool } = {}) {
  const cases = new Map((candidatePool.cases || []).map(item => [item.case_id, item]));
  const results = (target.cases || []).map(expected => {
    const actual = cases.get(expected.case_id);
    const source = actual?.sources?.find(item => item.source_span_id === expected.expected_span_id);
    const valid = Boolean(source
      && source.material_id === expected.expected_material_id
      && source.chunk_id === expected.expected_chunk_id
      && source.source_verified === true
      && source.source_span_id === expected.expected_span_id);
    return { case_id: expected.case_id, class: expected.class, gold_validated: valid };
  });
  return {
    schema_version: target.schema_version,
    case_count: results.length,
    gold_validated_count: results.filter(item => item.gold_validated).length,
    gold_invalid_count: results.filter(item => !item.gold_validated).length,
    retrieval_executed: false,
    evidence_bearing_hit_at_5: 'NOT_EXECUTED',
    qualified_span_rate: 'NOT_EXECUTED',
    metadata_header_false_evidence_rate: 'NOT_EXECUTED',
    proof_routing_precision: 'NOT_EXECUTED',
    cases: results,
    note: 'Gold contains only verified material/document/chunk/span expectations; no EvidenceSupport status is used.'
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  console.log(JSON.stringify(validateTargetedEvidenceBearingSet()));
}
