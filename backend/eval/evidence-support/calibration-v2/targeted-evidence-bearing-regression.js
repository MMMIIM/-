import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(fs.readFileSync(path.join(HERE, 'targeted-evidence-bearing-regression.json'), 'utf8'));
const pool = JSON.parse(fs.readFileSync(path.join(HERE, 'candidate-pool-v2-remediated.json'), 'utf8'));
const mapping = JSON.parse(fs.readFileSync(path.join(HERE, 'targeted-evidence-bearing-regression-v2.json'), 'utf8'));
import { isMetadataOrHeader } from '../../../src/pipeline/evidence-bearing-classifier.js';

export function validateTargetedEvidenceBearingSet({ target = manifest, candidatePool = pool } = {}) {
  const cases = new Map((candidatePool.cases || []).map(item => [item.case_id, item]));
  const results = (target.cases || []).map(expected => {
    const actual = cases.get(expected.case_id);
    const source = actual?.sources?.find(item => item.source_span_id === expected.expected_span_id);
    const metadataExpected = isMetadataOrHeader(source?.source_text);
    const valid = Boolean(source
      && source.material_id === expected.expected_material_id
      && source.chunk_id === expected.expected_chunk_id
      && source.source_verified === true
      && source.source_span_id === expected.expected_span_id
      && !metadataExpected);
    return { case_id: expected.case_id, class: expected.class, gold_validated: valid, invalid_reason: metadataExpected ? 'EXPECTED_SOURCE_IS_METADATA_OR_HEADER' : (valid ? null : 'EXPECTED_SOURCE_NOT_VERIFIED') };
  });
  const mapped = (mapping.cases || []).map(item => ({
    case_id: item.case_id,
    mapping_status: item.mapping_status,
    formal_requirement_id: item.formal_requirement_id,
    verified_span_id: item.verified_span_id,
    invalid_reasons: item.invalid_reasons || []
  }));
  return {
    schema_version: target.schema_version,
    model_calls: 0,
    provider_calls: 0,
    embedding_calls: 0,
    case_count: results.length,
    legacy_pool_gold_validated_count: results.filter(item => item.gold_validated).length,
    legacy_pool_gold_invalid_count: results.filter(item => !item.gold_validated).length,
    requirement_relative_mapping_count: mapped.length,
    gold_validated_count: mapped.filter(item => item.formal_requirement_id && item.mapping_status === 'VALID').length,
    gold_invalid_count: mapped.filter(item => !(item.formal_requirement_id && item.mapping_status === 'VALID')).length,
    executable_case_count: mapped.filter(item => item.formal_requirement_id && item.mapping_status === 'VALID').length,
    mapped_gold_invalid_count: mapped.filter(item => !(item.formal_requirement_id && item.mapping_status === 'VALID')).length,
    retrieval_executed: false,
    evidence_bearing_hit_at_5: 'NOT_EXECUTED',
    qualified_span_rate: 'NOT_EXECUTED',
    metadata_header_false_evidence_rate: 'NOT_EXECUTED',
    proof_routing_precision: 'NOT_EXECUTED',
    cases: results,
    mapping: mapped,
    note: 'Gold contains only Requirement-relative verified material/document/chunk/span expectations; metadata/title chunks and missing formal Requirement IDs are invalid and never counted.'
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  console.log(JSON.stringify(validateTargetedEvidenceBearingSet()));
}
