import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export const BETA_THRESHOLDS = Object.freeze({
  schema_pass_rate: 1, mandatory_recall: 1, false_positive_count: 0,
  expected_requirement_recall: 0.85, precision: 0.9, duplicate_rate: 0.05,
  source_verified_rate: 0.9, mandatory_source_verified_rate: 1,
  unsupported_document_block_rate: 1, baseline_created_on_failure: 0
});

const normalized = (value) => String(value || '').normalize('NFKC').replace(/\s+/g, '').toLowerCase();

function matches(candidate, expected) {
  const content = normalized(candidate.text || candidate.content);
  const source = normalized(candidate.source_text || candidate.source_excerpt);
  return (!expected.semantic_label || candidate.category === expected.semantic_label)
    && (!expected.source_contains || source.includes(normalized(expected.source_contains)))
    && (!expected.text_contains || content.includes(normalized(expected.text_contains)));
}

function schemaValid(fixture) {
  if (fixture.blocked === true) return !fixture.gateway_envelope;
  const envelope = fixture.gateway_envelope;
  if (!envelope || envelope.schema_version !== '4.3-requirement-extraction'
    || envelope.task_type !== 'requirement_extraction' || envelope.status !== 'success'
    || !envelope.data || Object.keys(envelope.data).some((key) => key !== 'requirements')
    || !Array.isArray(envelope.data.requirements) || !Array.isArray(envelope.warnings)) return false;
  const allowed = new Set(['text', 'category', 'source_text', 'source_clause', 'mandatory_observed', 'requires_confirmation']);
  return envelope.data.requirements.every((item) => item && typeof item === 'object'
    && Object.keys(item).every((key) => allowed.has(key))
    && typeof item.text === 'string' && item.text.trim()
    && typeof item.source_text === 'string' && item.source_text.trim());
}

function evaluateCase(testCase) {
  const candidates = testCase.fixture.requirements || [];
  const expected = testCase.gold.expected_requirements || [];
  const matchedExpected = expected.filter((item) => candidates.some((candidate) => matches(candidate, item)));
  const matchedCandidates = candidates.filter((candidate) => expected.some((item) => matches(candidate, item)));
  const forbidden = testCase.gold.forbidden_extractions || [];
  const falsePositive = candidates.filter((candidate) =>
    forbidden.some((item) => matches(candidate, item)) || !matchedCandidates.includes(candidate));
  const mandatory = expected.filter((item) => item.mandatory);
  const mandatoryMatched = mandatory.filter((item) => candidates.some((candidate) => matches(candidate, item) && candidate.is_mandatory));
  const unique = new Set(candidates.map((candidate) => normalized(candidate.source_text || candidate.text)));
  const unsupported = testCase.gold.expected_document_capability?.supported === false;
  return {
    id: testCase.id, schema_pass: schemaValid(testCase.fixture),
    expected: expected.length, matched: matchedExpected.length, extracted: candidates.length,
    matched_extracted: matchedCandidates.length, false_positive_count: falsePositive.length,
    mandatory_expected: mandatory.length, mandatory_matched: mandatoryMatched.length,
    duplicate_count: Math.max(0, candidates.length - unique.size),
    source_verified: candidates.filter((item) => item.source_verified).length,
    mandatory_source_verified: candidates.filter((item) => item.is_mandatory && item.source_verified).length,
    mandatory_extracted: candidates.filter((item) => item.is_mandatory).length,
    unsupported, unsupported_blocked: !unsupported || (testCase.fixture.blocked === true && candidates.length === 0),
    unsupported_content_count: unsupported ? candidates.length : 0,
    baseline_created_on_failure: testCase.fixture.failed && testCase.fixture.baseline_created ? 1 : 0,
    runtime_ms: Number(testCase.fixture.runtime_ms || 0)
  };
}

const ratio = (left, right, empty = 1) => right ? left / right : empty;

export class RequirementExtractionEvaluator {
  evaluate(cases) {
    const results = cases.map(evaluateCase);
    const sum = (field) => results.reduce((total, item) => total + item[field], 0);
    const supportedCandidates = results.filter((item) => !item.unsupported);
    const metrics = {
      schema_pass_rate: ratio(results.filter((item) => item.schema_pass).length, results.length),
      expected_requirement_recall: ratio(sum('matched'), sum('expected')),
      precision: ratio(sum('matched_extracted'), sum('extracted')),
      false_positive_count: sum('false_positive_count'),
      mandatory_recall: ratio(sum('mandatory_matched'), sum('mandatory_expected')),
      unsupported_content_count: sum('unsupported_content_count'),
      duplicate_rate: ratio(sum('duplicate_count'), sum('extracted'), 0),
      source_verified_rate: ratio(sum('source_verified'), supportedCandidates.reduce((n, item) => n + item.extracted, 0)),
      mandatory_source_verified_rate: ratio(sum('mandatory_source_verified'), sum('mandatory_extracted')),
      unresolved_count: sum('extracted') - sum('source_verified'),
      unsupported_document_block_rate: ratio(results.filter((item) => item.unsupported && item.unsupported_blocked).length, results.filter((item) => item.unsupported).length),
      baseline_created_on_failure: sum('baseline_created_on_failure'),
      runtime_ms: sum('runtime_ms')
    };
    const checks = Object.fromEntries(Object.entries(BETA_THRESHOLDS).map(([key, threshold]) => {
      const upperBound = ['false_positive_count', 'duplicate_rate', 'baseline_created_on_failure'].includes(key);
      return [key, { value: metrics[key], threshold, pass: upperBound ? metrics[key] <= threshold : metrics[key] >= threshold }];
    }));
    checks.unsupported_content_count = { value: metrics.unsupported_content_count, threshold: 0, pass: metrics.unsupported_content_count === 0 };
    return { suite: 'v4.3-requirement-extraction', generated_at: new Date().toISOString(), metrics, checks, passed: Object.values(checks).every((item) => item.pass), cases: results };
  }
}

export async function loadEvaluationCases(baseDirectory, manifestName = 'requirements.json') {
  const manifest = JSON.parse(await readFile(resolve(baseDirectory, 'manifests', manifestName), 'utf8'));
  return Promise.all(manifest.cases.map(async (item) => ({
    id: item.id,
    fixture: JSON.parse(await readFile(resolve(baseDirectory, item.fixture), 'utf8')),
    gold: JSON.parse(await readFile(resolve(baseDirectory, item.gold), 'utf8'))
  })));
}
