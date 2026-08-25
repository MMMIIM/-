import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCase, caseMetrics, BAKEOFF_INSTRUCTION_SHA256 } from '../eval/evidence-support/run-model-bakeoff-v1.js';
import {
  EVIDENCE_SUPPORT_GATEWAY_CONTRACT_VERSION,
  EVIDENCE_SUPPORT_GATEWAY_INSTRUCTION,
  EVIDENCE_SUPPORT_PROVIDER_JSON_SCHEMA
} from '../src/pipeline/evidence-support-assessment-gateway-contract-v1.js';
import { createHash } from 'node:crypto';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PACKET = JSON.parse(fs.readFileSync(path.resolve(HERE, '../eval/evidence-support/calibration-v2/GPT_REVIEW_PACKET_EVIDENCE_SUFFICIENCY_OFFLINE_V3.json'), 'utf8'));

test('model bake-off reuses the six accepted V3.1 cases without changing their oracle', () => {
  assert.equal(PACKET.cases.length, 6);
  const caseData = buildCase(PACKET.cases[0]);
  assert.equal(caseData.caseId, 'V2R-001-PERF-DIRECT');
  assert.equal(caseData.adapters.length, PACKET.cases[0].frozen_evidence_inputs.length);
  assert.equal(caseData.oracle.status, 'EVIDENCE_REVIEW_READY');
  assert.equal(caseData.requirement.text, PACKET.cases[0].requirement.text);
});

test('model bake-off metrics keep unsafe false-supported separate from technical failure', () => {
  const caseData = buildCase(PACKET.cases[1]);
  const metrics = caseMetrics({
    caseData,
    assessments: [],
    aggregate: null,
    diagnostics: { json_parse_success: false, output_truncated: true },
    error: Object.assign(new Error('provider timeout'), { code: 'PROVIDER_TIMEOUT' })
  });
  assert.equal(metrics.technical_failure, true);
  assert.equal(metrics.unsafe_false_supported, 0);
  assert.equal(metrics.semantic_repair_fallback, false);
  assert.equal(metrics.truncation, true);
});

test('canonical provider schema is strict and derived for both assessment arrays', () => {
  assert.equal(EVIDENCE_SUPPORT_PROVIDER_JSON_SCHEMA.type, 'object');
  assert.equal(EVIDENCE_SUPPORT_PROVIDER_JSON_SCHEMA.additionalProperties, false);
  assert.deepEqual(EVIDENCE_SUPPORT_PROVIDER_JSON_SCHEMA.required, ['assessments', 'conflict_observations']);
  assert.equal(EVIDENCE_SUPPORT_PROVIDER_JSON_SCHEMA.properties.assessments.items.additionalProperties, false);
  assert.equal(EVIDENCE_SUPPORT_PROVIDER_JSON_SCHEMA.properties.conflict_observations.items.additionalProperties, false);
});

test('every bake-off case records one canonical semantic instruction hash', () => {
  const expected = createHash('sha256').update(EVIDENCE_SUPPORT_GATEWAY_INSTRUCTION).digest('hex');
  assert.equal(BAKEOFF_INSTRUCTION_SHA256, expected);
  assert.match(BAKEOFF_INSTRUCTION_SHA256, /^[0-9a-f]{64}$/);
  assert.equal(EVIDENCE_SUPPORT_GATEWAY_CONTRACT_VERSION, '4.3-evidence-support-assessment-v1');
});
