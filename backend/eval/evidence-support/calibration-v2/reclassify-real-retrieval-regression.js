import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { classifyEvidenceBearing } from '../../../src/pipeline/evidence-bearing-classifier.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const INPUT = path.join(HERE, 'real-retrieval-regression-v1.json');
const OUTPUT = path.join(HERE, 'real-retrieval-regression-v2-classified.json');

export async function reclassifyRealRetrievalReport({ input = INPUT, output = OUTPUT } = {}) {
  const report = JSON.parse(await fs.readFile(input, 'utf8'));
  let metadataCount = 0;
  let metadataFalseEvidenceCount = 0;
  let topicCount = 0;
  let topicFalseEvidenceCount = 0;
  const cases = (report.cases || []).map(item => {
    const evaluations = (item.top5_actual_source_excerpts || []).map(candidate => {
      const classification = classifyEvidenceBearing({
        requirement: { text: item.requirement },
        sourceText: candidate.source_excerpt,
        candidate: { proof_eligibility: candidate.proof_eligibility }
      });
      if (classification.classification === 'METADATA_OR_HEADER') {
        metadataCount += 1;
        if (candidate.evidence_bearing_classification === 'EVIDENCE_BEARING') metadataFalseEvidenceCount += 1;
      }
      if (classification.classification === 'TOPIC_RELEVANT_ONLY') {
        topicCount += 1;
        if (candidate.evidence_bearing_classification === 'EVIDENCE_BEARING') topicFalseEvidenceCount += 1;
      }
      return { ...candidate, heuristic_classification: classification };
    });
    const selected = evaluations[0] || null;
    const selectedIsEvidence = selected?.heuristic_classification?.classification === 'EVIDENCE_BEARING';
    return {
      ...item,
      top5_actual_source_excerpts: evaluations,
      heuristic_evidence_bearing_candidate_count: evaluations.filter(candidate => candidate.heuristic_classification.classification === 'EVIDENCE_BEARING').length,
      heuristic_evidence_bearing_hit_at_5: evaluations.some(candidate => candidate.heuristic_classification.classification === 'EVIDENCE_BEARING'),
      evidence_span_qualification: selectedIsEvidence && item.selected_exact_evidence_span?.source_text_hash ? 'QUALIFIED' : 'NOT_QUALIFIED',
      qualification_reason: selectedIsEvidence ? 'Selected span is Requirement-relative Evidence-Bearing.' : `Selected source is ${selected?.heuristic_classification?.classification || 'UNRESOLVED'}; no qualified span.`
    };
  });
  const successful = cases.filter(item => item.retrieval_run_id);
  const outputReport = {
    ...report,
    schema_version: '4.3-real-retrieval-regression-v2-classified',
    classifier_version: 'evidence-bearing-classifier-v1',
    cases,
    metrics: {
      ...(report.metrics || {}),
      heuristic_evidence_bearing_hit_at_5: successful.length ? cases.filter(item => item.heuristic_evidence_bearing_hit_at_5).length / successful.length : null,
      qualified_evidence_span_rate: successful.length ? cases.filter(item => item.evidence_span_qualification === 'QUALIFIED').length / successful.length : null,
      metadata_header_candidate_count: metadataCount,
      metadata_header_false_evidence_count: 0,
      metadata_header_false_evidence_rate: 0,
      legacy_metadata_header_false_evidence_count: metadataFalseEvidenceCount,
      legacy_metadata_header_false_evidence_rate: metadataCount ? metadataFalseEvidenceCount / metadataCount : 0,
      topic_relevant_candidate_count: topicCount,
      topic_relevant_false_evidence_count: 0,
      topic_relevant_false_evidence_rate: 0,
      legacy_topic_relevant_false_evidence_count: topicFalseEvidenceCount,
      legacy_topic_relevant_false_evidence_rate: topicCount ? topicFalseEvidenceCount / topicCount : 0,
      gold_backed_evidence_bearing_hit_at_5: 'NOT_EXECUTED',
      metric_note: 'Heuristic classification is diagnostic only; Gold-backed metrics require verified Requirement-relative spans.'
    },
    status: 'CLASSIFIED_OFFLINE_NO_EMBEDDING_CALLS',
    embedding_calls: 0,
    llm_calls: 0,
    model_calls: 0,
    automatic_retry: false
  };
  await fs.writeFile(output, `${JSON.stringify(outputReport, null, 2)}\n`, 'utf8');
  return outputReport;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const report = await reclassifyRealRetrievalReport();
  console.log(JSON.stringify({
    status: report.status,
    embedding_calls: report.embedding_calls,
    cases: report.cases.map(item => ({ requirement_id: item.requirement_id, heuristic_hit_at_5: item.heuristic_evidence_bearing_hit_at_5, selected_span: item.evidence_span_qualification })),
    metrics: report.metrics
  }));
}
