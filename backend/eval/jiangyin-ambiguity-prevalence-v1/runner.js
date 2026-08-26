import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import pg from 'pg';
import {
  adaptRetrievalCandidate
} from '../../src/pipeline/evidence-support-assessment-contract-v1.js';
import {
  routeEvidenceSupport,
  runDeterministicEvidenceChecks
} from '../../src/pipeline/evidence-support-responsibility.js';

const { Pool } = pg;
const directory = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(directory, '../../..');
const defaultReportPath = path.resolve(repoRoot, 'backend/eval/reports/jiangyin-ambiguity-prevalence-v1.json');
const targetFileName = '江阴市国有企业集中采购.pdf';
const targetProjectName = '江阴市城市运营“一网统管”项目一期之联勤联动统一事件';
const sha256 = value => createHash('sha256').update(value).digest('hex');

function safeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function safeRate(numerator, denominator) {
  return denominator > 0 ? numerator / denominator : null;
}

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function percentile(values, p) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * p) - 1))];
}

function increment(map, key, amount = 1) {
  if (!key) return;
  map[key] = (map[key] || 0) + amount;
}

function storagePath(storageKey) {
  return path.resolve(repoRoot, 'uploads', ...String(storageKey || '').split('/'));
}

function fileSnapshot(row) {
  const filePath = storagePath(row.storage_key);
  if (!row.storage_key || !fs.existsSync(filePath)) {
    return { ...row, file_path_exists: false, file_sha256: null };
  }
  const buffer = fs.readFileSync(filePath);
  return { ...row, file_path_exists: true, file_sha256: sha256(buffer) };
}

function chooseSnapshot(projectFiles) {
  const target = projectFiles.find(item => item.original_name === targetFileName);
  if (!target?.file_sha256) {
    throw new Error('JIANGYIN_SOURCE_FILE_NOT_FOUND');
  }
  const matching = projectFiles
    .filter(item => item.file_sha256 && item.file_sha256 === target.file_sha256)
    .filter(item => item.confirmed_requirements > 0 && item.material_count > 0 && item.succeeded_runs > 0)
    .sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0));
  if (!matching.length) throw new Error('JIANGYIN_COMPLETE_SNAPSHOT_NOT_FOUND');
  return { target, snapshot: matching[0], candidates: matching };
}

function buildAdapter(requirement, row) {
  return adaptRetrievalCandidate({
    requirement: {
      req_id: requirement.req_id,
      text: requirement.content
    },
    candidate: {
      candidate_id: row.chunk_id,
      metadata: {
        proof_eligibility: row.candidate_eligibility === 'CONTEXT_ONLY' ? 'REFERENCE_CONTEXT' : null,
        source_origin: row.source_origin || row.source_type || null,
        persisted_evidence_source_eligible: row.evidence_source_eligible,
        persisted_evidence_source_class: row.evidence_source_class,
        persisted_evidence_source_reason: row.evidence_source_reason,
        content_role: row.content_role,
        chunk_role: row.chunk_role
      }
    },
    sourceSpan: {
      source_span_id: row.chunk_id,
      source_text: row.source_text
    },
    material: {
      material_id: row.material_id,
      material_type: row.material_type,
      source_type: row.source_type,
      authority_level: row.authority_level,
      corpus_scope: row.corpus_scope,
      project_id: row.material_project_id
    },
    lineage: {
      project_id: row.project_id,
      retrieval_run_id: row.retrieval_run_id,
      chunk_id: row.chunk_id,
      raw_rank: row.rank,
      reranked_rank: row.reranked_rank
    }
  });
}

function classifyRows(requirement, rows) {
  const pairResults = [];
  for (const row of rows) {
    const candidateEligible = row.candidate_eligibility === 'EVIDENCE_ELIGIBLE'
      && row.substantive_candidate === true;
    if (!candidateEligible) {
      pairResults.push({ row, route: 'DROPPED_OR_INELIGIBLE', check: null, candidateEligible: false });
      continue;
    }
    try {
      const adapter = buildAdapter(requirement, row);
      const check = runDeterministicEvidenceChecks({ requirement: adapter.requirement, adapter });
      pairResults.push({ row, route: check.decision, check, candidateEligible: true, adapter });
    } catch (error) {
      pairResults.push({
        row,
        route: 'DROPPED_OR_INELIGIBLE',
        check: null,
        candidateEligible: false,
        error_code: String(error?.code || 'ADAPTER_INVALID').slice(0, 80)
      });
    }
  }
  return pairResults;
}

function deterministicOutcomeForNecessary(pairResults, requirement) {
  const resolved = pairResults.filter(item => item.route === 'DETERMINISTIC_RESOLUTION' && item.adapter);
  if (!resolved.length) return null;
  // Reuse the existing aggregation path on only the already-resolved subset.
  // This does not infer sufficiency from ranking and does not invoke a model.
  return routeEvidenceSupport({
    requirement: { requirement_id: requirement.req_id, text: requirement.content },
    adapters: resolved.map(item => item.adapter)
  }).aggregate;
}

function analyzeSnapshot({ project, tenderFile, requirements, runs, candidateRows, fileHash }) {
  const latestRunByRequirement = new Map();
  for (const run of runs) {
    const current = latestRunByRequirement.get(run.requirement_id);
    if (current && new Date(run.started_at || 0) < new Date(current.started_at || 0)) continue;
    latestRunByRequirement.set(run.requirement_id, run);
  }
  const rowsByRun = new Map();
  for (const row of candidateRows) {
    const list = rowsByRun.get(row.retrieval_run_id) || [];
    list.push(row);
    rowsByRun.set(row.retrieval_run_id, list);
  }
  const requirementById = new Map(requirements.map(item => [item.id, item]));
  const analyzed = [];
  const droppedReasonCodes = {};
  const ambiguityReasonCodes = {};
  const bearingReasonCodes = {};
  let sourceEligibilityDriftCount = 0;
  let adapterFailureCount = 0;
  let totalPairs = 0;
  let deterministicResolved = 0;
  let ambiguous = 0;
  let dropped = 0;
  let requirementsWithRawCandidates = 0;
  let requirementsWithUsableCandidates = 0;
  let requirementsWithAmbiguous = 0;
  let requirementsReallyNeed = 0;
  let necessaryPairs = 0;
  let ambiguousButNotNecessaryPairs = 0;
  const ambiguousCounts = [];
  const candidateBearingAmbiguousCounts = [];
  const categoryStats = new Map();

  for (const requirement of requirements) {
    const run = latestRunByRequirement.get(requirement.id);
    const rows = run ? (rowsByRun.get(run.retrieval_run_id) || []) : [];
    const pairResults = classifyRows(requirement, rows);
    const eligible = pairResults.filter(item => item.candidateEligible);
    const ambiguousRows = eligible.filter(item => item.route === 'NEEDS_SEMANTIC_ADJUDICATION');
    const resolvedRows = eligible.filter(item => item.route === 'DETERMINISTIC_RESOLUTION');
    const droppedRows = pairResults.filter(item => item.route === 'DROPPED_OR_INELIGIBLE');
    if (rows.length) requirementsWithRawCandidates += 1;
    if (eligible.length) requirementsWithUsableCandidates += 1;
    if (ambiguousRows.length) requirementsWithAmbiguous += 1;
    totalPairs += rows.length;
    deterministicResolved += resolvedRows.length;
    ambiguous += ambiguousRows.length;
    dropped += droppedRows.length;
    if (ambiguousRows.length) ambiguousCounts.push(ambiguousRows.length);
    else ambiguousCounts.push(0);
    if (eligible.length) candidateBearingAmbiguousCounts.push(ambiguousRows.length);
    const aggregate = deterministicOutcomeForNecessary(pairResults, requirement);
    const deterministicAlreadyDecisive = ambiguousRows.length > 0
      && ['EVIDENCE_REVIEW_READY', 'CONFLICTING_EVIDENCE'].includes(aggregate?.status);
    if (ambiguousRows.length && deterministicAlreadyDecisive) {
      ambiguousButNotNecessaryPairs += ambiguousRows.length;
    } else if (ambiguousRows.length) {
      requirementsReallyNeed += 1;
      necessaryPairs += ambiguousRows.length;
    }
    for (const item of pairResults) {
      if (item.check?.eligibility?.evidence_source_eligible !== item.row.evidence_source_eligible) sourceEligibilityDriftCount += 1;
      if (item.error_code) {
        adapterFailureCount += 1;
        increment(droppedReasonCodes, item.error_code);
      }
      for (const code of item.check?.reason_codes || []) {
        if (item.route === 'NEEDS_SEMANTIC_ADJUDICATION') increment(ambiguityReasonCodes, code);
        else if (item.route === 'DROPPED_OR_INELIGIBLE') increment(droppedReasonCodes, code);
      }
      for (const code of item.check?.bearing?.reason_codes || []) {
        if (item.route === 'NEEDS_SEMANTIC_ADJUDICATION') increment(bearingReasonCodes, code);
      }
    }
    const category = requirement.requirement_category || requirement.category || 'uncategorized';
    const stat = categoryStats.get(category) || {
      category,
      requirements: 0,
      requirements_with_candidates: 0,
      requirements_with_usable_candidates: 0,
      candidate_pairs: 0,
      ambiguous_pairs: 0,
      necessary_requirements: 0,
      necessary_ambiguous_pairs: 0
    };
    stat.requirements += 1;
    if (rows.length) stat.requirements_with_candidates += 1;
    if (eligible.length) stat.requirements_with_usable_candidates += 1;
    stat.candidate_pairs += eligible.length;
    stat.ambiguous_pairs += ambiguousRows.length;
    if (ambiguousRows.length && !deterministicAlreadyDecisive) {
      stat.necessary_requirements += 1;
      stat.necessary_ambiguous_pairs += ambiguousRows.length;
    }
    categoryStats.set(category, stat);
    analyzed.push({
      requirement_id: requirement.req_id,
      category,
      raw_candidate_count: rows.length,
      usable_candidate_count: eligible.length,
      deterministic_resolved_count: resolvedRows.length,
      ambiguous_count: ambiguousRows.length,
      dropped_or_ineligible_count: droppedRows.length,
      necessary_ambiguous_count: ambiguousRows.length && !deterministicAlreadyDecisive ? ambiguousRows.length : 0,
      deterministic_aggregate_status: aggregate?.status || null
    });
  }

  const eligiblePairs = deterministicResolved + ambiguous;
  const requirementDistribution = { '0': 0, '1': 0, '2': 0, '3': 0, '4': 0, '5+': 0 };
  for (const count of ambiguousCounts) increment(requirementDistribution, count >= 5 ? '5+' : String(count));
  const category = [...categoryStats.values()].map(stat => ({
    ...stat,
    ambiguity_rate: safeRate(stat.ambiguous_pairs, stat.candidate_pairs),
    necessary_rate: safeRate(stat.necessary_requirements, stat.requirements_with_usable_candidates)
  })).sort((a, b) => a.category.localeCompare(b.category));
  const necessaryRequirementRate = safeRate(requirementsReallyNeed, requirementsWithUsableCandidates);
  const candidateAmbiguityRate = safeRate(ambiguous, eligiblePairs);
  let band = 'UNDETERMINED';
  if (necessaryRequirementRate != null) {
    band = necessaryRequirementRate <= 0.05 ? 'LOW' : necessaryRequirementRate <= 0.2 ? 'MODERATE' : 'HIGH';
  }
  return {
    schema_version: 'jiangyin-ambiguity-prevalence-v1',
    source: {
      target_file_name: targetFileName,
      target_project_name: targetProjectName,
      snapshot_project_id: project.id,
      snapshot_project_name: project.name,
      snapshot_status: project.status,
      tender_file_id: tenderFile.tender_file_id,
      snapshot_file_name: tenderFile.original_name,
      file_size_bytes: Number(tenderFile.size_bytes),
      file_sha256: fileHash,
      canonical_requirement_count: requirements.length,
      enterprise_material_count: Number(project.material_count),
      retrieval_run_count_used: latestRunByRequirement.size,
      snapshot_selection: 'latest_same_hash_complete_read_only_instance'
    },
    pollution: {
      production_db_writes: 0,
      knowledge_base_writes: 0,
      vector_store_writes: 0,
      formal_state_writes: 0,
      production_business_files_changed: 0,
      eval_write_capable_production_dependency_count: 0,
      database_transaction_mode: 'READ ONLY',
      adapter_failure_count: adapterFailureCount,
      source_eligibility_drift_count: sourceEligibilityDriftCount
    },
    retrieval: {
      total_requirements: requirements.length,
      usable_requirements: requirements.length,
      requirements_with_candidates: requirementsWithRawCandidates,
      requirements_without_candidates: requirements.length - requirementsWithRawCandidates,
      requirements_with_usable_candidate_evidence: requirementsWithUsableCandidates,
      top_k_distribution: Object.fromEntries([...new Set(runs.map(run => String(run.top_k ?? 'unknown')))].map(topK => [topK, runs.filter(run => String(run.top_k ?? 'unknown') === topK).length])),
      candidate_material_types: Object.fromEntries([...new Set(candidateRows.map(row => row.material_type || 'unknown'))].map(type => [type, candidateRows.filter(row => (row.material_type || 'unknown') === type).length])),
      no_candidate_requirement_ids: analyzed.filter(item => item.raw_candidate_count === 0).map(item => item.requirement_id)
    },
    pair_level: {
      total_candidate_pairs: totalPairs,
      eligible_candidate_pairs: eligiblePairs,
      deterministic_resolved_pairs: deterministicResolved,
      needs_semantic_adjudication_pairs: ambiguous,
      dropped_or_ineligible_pairs: dropped,
      candidate_ambiguity_rate: candidateAmbiguityRate
    },
    requirement_level: {
      requirements_with_any_ambiguous_pair: requirementsWithAmbiguous,
      requirements_with_zero_ambiguous_pairs: requirements.length - requirementsWithAmbiguous,
      requirement_ambiguity_rate: safeRate(requirementsWithAmbiguous, requirementsWithUsableCandidates)
    },
    necessity: {
      requirements_really_need_semantic_adjudication: requirementsReallyNeed,
      necessary_ambiguous_pairs: necessaryPairs,
      ambiguous_but_not_necessary_pairs: ambiguousButNotNecessaryPairs,
      necessary_requirement_rate: necessaryRequirementRate,
      theoretical_llm_calls: necessaryPairs,
      llm_calls_per_requirement: safeRate(necessaryPairs, requirementsReallyNeed)
    },
    distribution: {
      ambiguous_pairs_per_requirement: requirementDistribution,
      all_usable_requirements: {
        mean: ambiguousCounts.length ? ambiguousCounts.reduce((sum, value) => sum + value, 0) / ambiguousCounts.length : null,
        median: median(ambiguousCounts),
        p95: percentile(ambiguousCounts, 0.95)
      },
      candidate_bearing_requirements: {
        count: candidateBearingAmbiguousCounts.length,
        mean: candidateBearingAmbiguousCounts.length ? candidateBearingAmbiguousCounts.reduce((sum, value) => sum + value, 0) / candidateBearingAmbiguousCounts.length : null,
        median: median(candidateBearingAmbiguousCounts),
        p95: percentile(candidateBearingAmbiguousCounts, 0.95)
      }
    },
    by_requirement_category: category,
    ambiguity_causes: {
      router_reason_codes: ambiguityReasonCodes,
      bearing_reason_codes: bearingReasonCodes,
      dropped_or_ineligible_reason_codes: droppedReasonCodes
    },
    retrieval_insufficiency: {
      no_candidate_requirements: requirements.length - requirementsWithRawCandidates,
      no_candidate_is_not_semantic_ambiguity: true
    },
    requirement_level_audit: analyzed,
    external_calls: {
      llm_calls: 0,
      provider_calls: 0,
      dify_calls: 0,
      embedding_calls: 0,
      retries: 0
    },
    final: {
      ambiguity_prevalence: band,
      semantic_adjudication_usage_pattern: band === 'LOW' ? 'RARE_EXCEPTION' : band === 'MODERATE' ? 'SELECTIVE' : band === 'HIGH' ? 'MAJOR_PATH' : 'UNDETERMINED',
      ready_for_semantic_value_validation: false,
      stop_reason: 'PREVALENCE_EVIDENCE_FIRST_NO_LLM'
    },
    completed_at: new Date().toISOString()
  };
}

async function readOnlySnapshot({ connectionString, projectId } = {}) {
  const pool = new Pool({ connectionString });
  const client = await pool.connect();
  try {
    await client.query('BEGIN TRANSACTION READ ONLY');
    const projects = (await client.query(`
      SELECT p.id,p.name,p.status,p.updated_at,tf.id AS tender_file_id,tf.original_name,
             tf.storage_key,tf.size_bytes,COUNT(DISTINCT rb.id)::int AS confirmed_requirements,
             COUNT(DISTINCT cm.id)::int AS material_count,
             COUNT(DISTINCT er.retrieval_run_id)::int AS succeeded_runs
      FROM projects p
      LEFT JOIN tender_files tf ON tf.project_id=p.id
      LEFT JOIN requirements r ON r.project_id=p.id
      LEFT JOIN requirement_baselines rb ON rb.id=r.baseline_id AND rb.status='confirmed'
      LEFT JOIN company_materials cm ON cm.project_id=p.id
      LEFT JOIN enterprise_retrieval_runs er ON er.project_id=p.id AND er.status='succeeded'
      GROUP BY p.id,p.name,p.status,p.updated_at,tf.id,tf.original_name,tf.storage_key,tf.size_bytes
    `)).rows.map(fileSnapshot);
    const selected = chooseSnapshot(projects);
    const snapshot = selected.snapshot;
    if (projectId && snapshot.id !== projectId) throw new Error('SNAPSHOT_PROJECT_MISMATCH');
    const requirements = (await client.query(`
      SELECT r.id,r.req_id,r.content,r.requirement_category,r.category,r.ordinal
      FROM requirements r JOIN requirement_baselines rb ON rb.id=r.baseline_id AND rb.status='confirmed'
      WHERE r.project_id=$1 ORDER BY r.ordinal,r.req_id
    `, [snapshot.id])).rows;
    const runs = (await client.query(`
      SELECT * FROM enterprise_retrieval_runs WHERE project_id=$1 AND status='succeeded'
    `, [snapshot.id])).rows;
    const candidateRows = (await client.query(`
      SELECT er.retrieval_run_id,er.requirement_id,er.requirement_ref,er.top_k,er.started_at,
             rr.rank,rr.reranked_rank,rr.similarity_score,rr.chunk_id,rr.content_role,rr.chunk_role,
             rr.candidate_eligibility,rr.substantive_candidate,rr.evidence_source_eligible,
             rr.evidence_source_class,rr.evidence_source_reason,rr.substantive_class,rr.substantive_reason,
             c.source_text,c.material_id,c.page_start,c.page_end,c.paragraph_start,c.paragraph_end,
             c.section,c.chunk_hash,m.project_id AS material_project_id,m.material_type,m.source_type,
             m.authority_level,m.corpus_scope
      FROM enterprise_retrieval_runs er
      JOIN enterprise_retrieval_results rr ON rr.retrieval_run_id=er.retrieval_run_id
      JOIN material_chunks c ON c.chunk_id=rr.chunk_id
      JOIN company_materials m ON m.id=c.material_id
      WHERE er.project_id=$1 AND er.status='succeeded'
      ORDER BY er.started_at,rr.rank
    `, [snapshot.id])).rows;
    const tableNames = ['projects','tender_parse_jobs','requirements','company_materials','evidence_candidate_reviews','evidence_source_facts','requirement_evidence_fact_mappings','claims','document_versions'];
    const counts = {};
    for (const table of tableNames) counts[table] = Number((await client.query(`SELECT count(*)::int AS count FROM ${table}`)).rows[0].count);
    await client.query('ROLLBACK');
    return { selected, snapshot, requirements, runs, candidateRows, countsBeforeAfter: { before: counts, after: { ...counts } } };
  } finally {
    client.release();
    await pool.end();
  }
}

export { analyzeSnapshot, classifyRows, readOnlySnapshot };

export async function runJiangyinAmbiguityPrevalenceV1({
  env = process.env,
  resultPath = defaultReportPath,
  stdout = console.log,
  projectId = null
} = {}) {
  dotenv.config({ path: path.resolve(repoRoot, 'backend/.env'), processEnv: env });
  if (!env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  const snapshot = await readOnlySnapshot({ connectionString: env.DATABASE_URL, projectId });
  const result = analyzeSnapshot({
    project: snapshot.snapshot,
    tenderFile: snapshot.snapshot,
    requirements: snapshot.requirements,
    runs: snapshot.runs,
    candidateRows: snapshot.candidateRows,
    fileHash: snapshot.snapshot.file_sha256
  });
  result.pollution.row_counts_before_after = snapshot.countsBeforeAfter;
  fs.mkdirSync(path.dirname(resultPath), { recursive: true });
  fs.writeFileSync(resultPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  stdout(JSON.stringify({
    source_project_id: result.source.snapshot_project_id,
    total_requirements: result.retrieval.total_requirements,
    candidate_pairs: result.pair_level.total_candidate_pairs,
    eligible_candidate_pairs: result.pair_level.eligible_candidate_pairs,
    ambiguous_pairs: result.pair_level.needs_semantic_adjudication_pairs,
    requirements_without_candidates: result.retrieval.requirements_without_candidates,
    necessary_requirements: result.necessity.requirements_really_need_semantic_adjudication,
    ambiguity_prevalence: result.final.ambiguity_prevalence,
    llm_calls: 0
  }));
  return result;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    await runJiangyinAmbiguityPrevalenceV1({ projectId: process.env.JIANGYIN_AUDIT_PROJECT_ID || null });
  } catch (error) {
    console.error(JSON.stringify({ error_code: error?.code || 'JIANGYIN_AMBIGUITY_AUDIT_FAILED', message: String(error?.message || 'audit failed').slice(0, 200) }));
    process.exitCode = 1;
  }
}
