import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID, createHash } from 'node:crypto';
import { createStandaloneGatewayServer } from '../../services/semantic-gateway/src/gateway.js';
import { createBackendRuntime } from '../src/backend-runtime.js';
import { adaptRetrievalCandidate, aggregateEvidenceSufficiency } from '../src/pipeline/evidence-support-assessment-contract-v1.js';
import { createSemanticGatewayEvidenceSupportEvaluatorFromEnv } from '../src/pipeline/semantic-gateway-evidence-support-evaluator.js';
import { EVIDENCE_SUPPORT_GATEWAY_CONTRACT_VERSION } from '../src/pipeline/evidence-support-assessment-gateway-contract-v1.js';

const directory = path.dirname(fileURLToPath(import.meta.url));
const packetPath = path.resolve(directory, '../eval/evidence-support/calibration-v2/GPT_REVIEW_PACKET_EVIDENCE_SUFFICIENCY_OFFLINE_V3.json');
const sha256 = value => createHash('sha256').update(String(value)).digest('hex');

function providerConfig(env) {
  const baseUrl = String(env.SEMANTIC_GATEWAY_PROVIDER_API_BASE || env.EXTERNAL_WRITER_API_BASE || '').trim().replace(/\/+$/, '');
  const apiKey = String(env.SEMANTIC_GATEWAY_PROVIDER_API_KEY || env.EXTERNAL_WRITER_API_KEY || '').trim();
  const model = String(env.SEMANTIC_GATEWAY_MODEL || env.EXTERNAL_WRITER_MODEL || '').trim();
  if (!baseUrl || !apiKey || !model) throw new Error('DIRECT_PROVIDER_NOT_CONFIGURED');
  const target = new URL(baseUrl);
  if (target.hostname !== 'api.siliconflow.cn') throw new Error('PROVIDER_HOST_NOT_ALLOWLISTED');
  return { baseUrl, apiKey, model, host: target.hostname, port: target.port || '443' };
}

function buildCase() {
  const packet = JSON.parse(fs.readFileSync(packetPath, 'utf8'));
  const item = packet.cases.find(candidate => candidate.case_id === 'V2R-001-PERF-DIRECT') || packet.cases[0];
  const requirement = { req_id: item.requirement.requirement_id, text: item.requirement.text };
  const adapters = item.frozen_evidence_inputs.map((source, index) => adaptRetrievalCandidate({
    requirement,
    candidate: { candidate_id: source.candidate_id, metadata: { raw_rank: source.raw_rank, source_eligibility: source.source_eligibility } },
    sourceSpan: {
      source_span_id: `PROBE-SPAN-${source.candidate_id}-${index + 1}`,
      source_text: source.source_text,
      source_text_hash: source.source_text_hash
    },
    material: { material_id: source.lineage.material_id, document_id: source.lineage.document_id },
    lineage: { ...source.lineage, project_id: 'STAGE20-S-SYNTHETIC-PROBE' }
  }));
  return { caseId: item.case_id, requirement, adapters };
}

async function listen(server) {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  return server.address().port;
}

async function main() {
  if (process.env.ALLOW_LIVE_PROVIDER_PROBE !== 'true') {
    throw new Error('LIVE_PROVIDER_PROBE_NOT_AUTHORIZED');
  }
  const runtime = createBackendRuntime();
  const provider = providerConfig(runtime.env);
  const serviceKey = `stage20-probe-${randomUUID()}`;
  const server = createStandaloneGatewayServer({
    env: {
      SEMANTIC_GATEWAY_PROVIDER: 'openai_compatible',
      SEMANTIC_GATEWAY_API_KEY: serviceKey,
      SEMANTIC_GATEWAY_MODEL: provider.model,
      SEMANTIC_GATEWAY_PROVIDER_API_BASE: provider.baseUrl,
      SEMANTIC_GATEWAY_PROVIDER_API_KEY: provider.apiKey,
      SEMANTIC_GATEWAY_TIMEOUT_MS: '120000'
    }
  });
  const port = await listen(server);
  const gatewayEnv = {
    SEMANTIC_GATEWAY_API_BASE: `http://127.0.0.1:${port}`,
    SEMANTIC_GATEWAY_API_KEY: serviceKey,
    SEMANTIC_GATEWAY_USER: 'stage20-synthetic-probe'
  };
  const { caseId, requirement, adapters } = buildCase();
  const started = Date.now();
  let result;
  try {
    const evaluator = createSemanticGatewayEvidenceSupportEvaluatorFromEnv({ env: gatewayEnv });
    result = await evaluator.assess({ requirement, adapters });
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
  const aggregate = aggregateEvidenceSufficiency(result.assessments);
  console.log(JSON.stringify({
    probe: 'stage20-evidence-support-direct-provider',
    case_id: caseId,
    provider: 'openai_compatible',
    provider_host: provider.host,
    provider_port: provider.port,
    model: provider.model,
    provider_calls: 1,
    dify_calls: 0,
    contract_version: EVIDENCE_SUPPORT_GATEWAY_CONTRACT_VERSION,
    envelope: 'validated',
    schema: 'validated',
    assessment_count: result.assessments.length,
    normalized_status: aggregate.status,
    warnings_count: result.warnings.length,
    elapsed_ms: Date.now() - started,
    no_business_state_mutation: true
  }));
}

try {
  await main();
} catch (error) {
  console.error(JSON.stringify({
    probe: 'stage20-evidence-support-direct-provider',
    status: 'FAILED',
    error_code: error?.code || error?.name || 'PROBE_FAILED',
    safe_message: error?.message || 'Provider probe failed.'
  }));
  process.exitCode = 1;
}
