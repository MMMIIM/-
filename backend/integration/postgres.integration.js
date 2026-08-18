import test from 'node:test';
import assert from 'node:assert/strict';
import dotenv from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPool, PgRepository } from '../src/db.js';
import { createDifyClient } from '../src/dify.js';
import { GenerationService } from '../src/service.js';
import { DeterministicPipelineService } from '../src/pipeline/generation-audit.js';
import { RequirementParseService } from '../src/requirement-parse-service.js';
import { SemanticGatewayError } from '../src/pipeline/semantic-gateway-client.js';

const directory = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(directory, '../.env') });

const inputs = {
  project_name: 'PostgreSQL 失败审计集成测试',
  project_type: 'AI 应用',
  bid_need: '验证非法契约审计持久化',
  focus_points: '不得创建正式文档版本',
  output_mode: '技术标初稿'
};

const cases = [
  {
    name: 'missing',
    payload: { data: { outputs: {} } },
    expected: 'missing'
  },
  {
    name: 'wrong-type',
    payload: { data: { outputs: { response_payload_json: 42 } } },
    expected: 'jsonb'
  },
  {
    name: 'invalid-json',
    payload: { data: { outputs: { response_payload_json: '{bad-json' } } },
    expected: 'text'
  },
  {
    name: 'invalid-fields',
    payload: { data: { outputs: { response_payload_json: { risk_status: 'pass' } } } },
    expected: 'jsonb'
  }
];

test('PostgreSQL 持久化四类 CONTRACT_INVALID，且不创建 DocumentVersion', async () => {
  assert.ok(process.env.DATABASE_URL, 'DATABASE_URL is required for PostgreSQL integration tests');
  const pool = createPool();
  const repository = new PgRepository(pool);
  const project = await repository.createProject({ name: `失败审计集成测试 ${Date.now()}` });
  let example;

  try {
    for (const scenario of cases) {
      const difyClient = createDifyClient({
        apiBase: 'https://dify.invalid/v1',
        apiKey: 'integration-test-only',
        fetchImpl: async () => new Response(JSON.stringify(scenario.payload), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      });
      const service = new GenerationService({
        repository,
        difyClient,
        workflowVersion: '4.2',
        logger: { error: () => {} }
      });

      await assert.rejects(
        () => service.generate({ projectId: project.id, inputs: { ...inputs, project_name: `${inputs.project_name}-${scenario.name}` } }),
        (error) => error.code === 'CONTRACT_INVALID'
      );

      const { rows } = await pool.query(`
        SELECT g.id, g.job_id, g.status, g.error_code, g.error_message,
          g.workflow_version, g.runtime_ms, g.response_payload_json,
          g.raw_dify_response_json, g.raw_response_text,
          (SELECT count(*)::int FROM document_versions v WHERE v.generation_id = g.id) AS version_count
        FROM generations g
        WHERE g.project_id = $1
        ORDER BY g.created_at DESC
        LIMIT 1
      `, [project.id]);
      const audit = rows[0];
      assert.ok(audit?.id, `${scenario.name}: failed Generation was not created`);
      assert.equal(audit.status, 'failed');
      assert.equal(audit.error_code, 'CONTRACT_INVALID');
      assert.equal(audit.error_message, '生成结果格式校验失败，请联系管理员检查 Dify Workflow 输出契约。');
      assert.equal(audit.workflow_version, '4.2');
      assert.ok(audit.runtime_ms >= 0);
      assert.ok(audit.raw_dify_response_json);
      assert.equal(audit.version_count, 0);

      if (scenario.expected === 'text') {
        assert.equal(audit.response_payload_json, null);
        assert.match(audit.raw_response_text, /^\[redacted raw text; length=\d+\]$/);
      } else if (scenario.expected === 'jsonb') {
        assert.notEqual(audit.response_payload_json, null);
        assert.equal(audit.raw_response_text, null);
      } else {
        assert.equal(audit.response_payload_json, null);
        assert.equal(audit.raw_response_text, null);
      }

      if (scenario.name === 'invalid-json') {
        example = {
          id: audit.id,
          job_id: audit.job_id,
          status: audit.status,
          error_code: audit.error_code,
          workflow_version: audit.workflow_version,
          runtime_ms: audit.runtime_ms,
          has_json_payload: audit.response_payload_json !== null,
          has_raw_text: audit.raw_response_text !== null,
          has_raw_dify_json: audit.raw_dify_response_json !== null,
          version_count: audit.version_count
        };
      }
    }

    const { rows: versionRows } = await pool.query(
      `SELECT count(*)::int AS count FROM document_versions WHERE project_id = $1`,
      [project.id]
    );
    assert.equal(versionRows[0].count, 0);
    console.log(`FAILED_GENERATION_EXAMPLE=${JSON.stringify(example)}`);
  } finally {
    await pool.query(`DELETE FROM projects WHERE id = $1`, [project.id]);
    await pool.end();
  }
});

test('PostgreSQL 持久化合法 Dify 外层审计并创建 DocumentVersion', async () => {
  assert.ok(process.env.DATABASE_URL, 'DATABASE_URL is required for PostgreSQL integration tests');
  const pool = createPool();
  const repository = new PgRepository(pool);
  const project = await repository.createProject({ name: `成功归档集成测试 ${Date.now()}` });
  const response = { data: { outputs: { response_payload_json: JSON.stringify({
    document: {
      title: '脱敏技术响应',
      markdown: '# 脱敏技术响应\n\n测试正文',
      sections: [{ id: 'overview', title: '项目概述' }]
    },
    warnings: [],
    risk_status: 'pass'
  }) } } };

  try {
    const difyClient = createDifyClient({
      apiBase: 'https://dify.invalid/v1',
      apiKey: 'integration-test-only',
      fetchImpl: async () => new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    });
    const service = new GenerationService({ repository, difyClient, workflowVersion: '4.2' });
    const result = await service.generate({ projectId: project.id, inputs });

    assert.equal(result.generation.status, 'succeeded');
    assert.equal(result.version.risk_status, 'pass');
    assert.ok(result.generation.raw_dify_response_json);
    assert.equal(result.generation.raw_response_text, null);
    assert.equal(result.generation.error_code, null);

    const generations = await repository.listGenerations(project.id);
    assert.equal(generations.length, 1);
    assert.equal(generations[0].has_response_payload_json, true);
    assert.equal(generations[0].has_raw_dify_response_json, true);
  } finally {
    await pool.query(`DELETE FROM projects WHERE id = $1`, [project.id]);
    await pool.end();
  }
});

const pipelineRequirements = [
  { req_id: 'REQ-001', text: '支持通过标准接口完成第三方系统数据接入。' },
  { req_id: 'REQ-002', text: '方案应说明访问权限控制和安全审计机制。' }
];

test('4.3 critical 终检持久化 failed Generation 且不创建 DocumentVersion', async () => {
  assert.ok(process.env.DATABASE_URL, 'DATABASE_URL is required for PostgreSQL integration tests');
  const pool = createPool();
  const repository = new PgRepository(pool);
  const project = await repository.createProject({ name: `4.3 critical 集成测试 ${Date.now()}` });
  const service = new DeterministicPipelineService({
    repository,
    writer: {
      async write() {
        return [{
          id: 'data-integration',
          title: '数据接入与集成',
          requirement_ids: ['REQ-001'],
          draft_text: '平台支持通过标准接口完成第三方系统数据接入。'
        }];
      }
    },
    logger: { error: () => {} }
  });

  try {
    await assert.rejects(
      () => service.generate({ projectId: project.id, requirements: pipelineRequirements }),
      (error) => error.code === 'DOCUMENT_VALIDATION_FAILED'
    );
    const { rows } = await pool.query(`
      SELECT g.status, g.error_code, g.workflow_version, g.response_payload_json,
        (SELECT count(*)::int FROM document_versions v WHERE v.generation_id = g.id) AS version_count
      FROM generations g
      WHERE g.project_id = $1
      ORDER BY g.created_at DESC
      LIMIT 1
    `, [project.id]);
    const audit = rows[0];
    assert.equal(audit.status, 'failed');
    assert.equal(audit.error_code, 'DOCUMENT_VALIDATION_FAILED');
    assert.equal(audit.workflow_version, '4.3');
    assert.equal(audit.response_payload_json.schema_version, '4.3');
    assert.equal(audit.response_payload_json.risk_status, 'critical');
    assert.equal(audit.response_payload_json.generation_audit.state, 'failed');
    assert.equal(audit.version_count, 0);
  } finally {
    await pool.query(`DELETE FROM projects WHERE id = $1`, [project.id]);
    await pool.end();
  }
});

test('4.3 writer 阶段失败必须落库审计', async () => {
  assert.ok(process.env.DATABASE_URL, 'DATABASE_URL is required for PostgreSQL integration tests');
  const pool = createPool();
  const repository = new PgRepository(pool);
  const project = await repository.createProject({ name: `4.3 writer 失败审计 ${Date.now()}` });
  const service = new DeterministicPipelineService({
    repository,
    writer: { async write() { throw Object.assign(new Error('mock writer failed'), { code: 'WRITER_FAILED' }); } },
    logger: { error: () => {} }
  });

  try {
    await assert.rejects(
      () => service.generate({ projectId: project.id, requirements: [pipelineRequirements[0]] }),
      (error) => error.code === 'WRITER_FAILED'
    );
    const { rows } = await pool.query(`
      SELECT status, error_code, workflow_version, response_payload_json
      FROM generations WHERE project_id = $1 ORDER BY created_at DESC LIMIT 1
    `, [project.id]);
    assert.equal(rows[0].status, 'failed');
    assert.equal(rows[0].error_code, 'WRITER_FAILED');
    assert.equal(rows[0].workflow_version, '4.3');
    assert.deepEqual(
      rows[0].response_payload_json.generation_audit.events.map((event) => event.state),
      ['created', 'canonicalized', 'planned', 'claims_gated', 'failed']
    );
  } finally {
    await pool.query(`DELETE FROM projects WHERE id = $1`, [project.id]);
    await pool.end();
  }
});

test('4.3 合法 envelope 持久化 Generation 并创建 DocumentVersion', async () => {
  assert.ok(process.env.DATABASE_URL, 'DATABASE_URL is required for PostgreSQL integration tests');
  const pool = createPool();
  const repository = new PgRepository(pool);
  const project = await repository.createProject({ name: `4.3 成功归档 ${Date.now()}` });
  const service = new DeterministicPipelineService({
    repository,
    writer: {
      async write() {
        return [
          {
            id: 'data-integration', title: '数据接入与集成', requirement_ids: ['REQ-001'],
            draft_text: '平台支持通过标准接口完成第三方系统数据接入。'
          },
          {
            id: 'security-compliance', title: '安全与合规', requirement_ids: ['REQ-002'],
            draft_text: '平台采用最小权限原则，并记录关键操作审计日志。'
          }
        ];
      }
    }
  });

  try {
    const result = await service.generate({ projectId: project.id, requirements: pipelineRequirements });
    assert.equal(result.generation.status, 'succeeded');
    assert.equal(result.version.risk_status, 'pass');
    assert.equal(result.envelope.schema_version, '4.3');
    assert.equal(result.envelope.generation_audit.state, 'finalized');
    const { rows } = await pool.query(`
      SELECT response_payload_json, workflow_version
      FROM generations WHERE id = $1
    `, [result.generation.id]);
    assert.equal(rows[0].workflow_version, '4.3');
    assert.equal(rows[0].response_payload_json.schema_version, '4.3');
    assert.ok(rows[0].response_payload_json.document.markdown.includes('第三方系统数据接入'));
  } finally {
    await pool.query(`DELETE FROM projects WHERE id = $1`, [project.id]);
    await pool.end();
  }
});

test('PostgreSQL 确认 Requirement 基线后禁止增删改合并', async () => {
  assert.ok(process.env.DATABASE_URL, 'DATABASE_URL is required for PostgreSQL integration tests');
  const pool = createPool();
  const repository = new PgRepository(pool);
  const project = await repository.createProject({ name: `Requirement 冻结集成测试 ${Date.now()}` });
  const tenderFile = await repository.addTenderFile({
    projectId: project.id,
    originalName: 'tender.txt',
    storageKey: `${project.id}/integration-${Date.now()}.txt`,
    mimeType: 'text/plain',
    sizeBytes: 30
  });
  const service = new RequirementParseService({
    repository,
    storage: { read: async () => Buffer.from('★系统应支持标准接口并提供安全审计，详见第 3.2 条。') },
    textExtractor: async () => ({
      text: '★系统应支持标准接口并提供安全审计，详见第 3.2 条。',
      paragraphs: [{ paragraph: 1, page: null, text: '★系统应支持标准接口并提供安全审计，详见第 3.2 条。' }],
      pages: [],
      warnings: []
    }),
    extractionGateway: {
      extract: async () => ({
        candidates: [{
          content: '系统应支持标准接口并提供安全审计。',
          source_excerpt: '★系统应支持标准接口并提供安全审计，详见第 3.2 条。', source_page: null,
          source_paragraph: 1
        }],
        warnings: [],
        audit: { provider: 'semantic_gateway', task_type: 'requirement_extraction' }
      })
    }
  });

  try {
    const parseJob = await service.start({
      projectId: project.id, tenderFileId: tenderFile.id, waitForCompletion: true
    });
    assert.equal(parseJob.status, 'succeeded');
    assert.equal(parseJob.candidates[0].req_id, 'REQ-001');
    assert.equal(parseJob.candidates[0].is_mandatory, true);
    assert.equal(parseJob.candidates[0].mandatory_marker, '★');
    assert.match(parseJob.candidates[0].source_text, /★.*第 3\.2 条/);
    assert.equal(parseJob.phase, 'succeeded');
    assert.equal(parseJob.total_chunks, 1);
    assert.equal(parseJob.chunks[0].status, 'succeeded');
    await pool.query(`
      UPDATE requirement_candidates
      SET is_mandatory = false, mandatory_marker = NULL
      WHERE id = $1
    `, [parseJob.candidates[0].id]);
    await assert.rejects(
      () => service.confirm(parseJob.id),
      (error) => error.code === 'REQUIREMENT_MANDATORY_METADATA_CONFLICT'
    );
    assert.equal(await repository.getRequirementBaseline(project.id), null);
    await pool.query(`
      UPDATE requirement_candidates
      SET is_mandatory = true, mandatory_marker = '★'
      WHERE id = $1
    `, [parseJob.candidates[0].id]);
    const confirmed = await service.confirm(parseJob.id);
    assert.equal(confirmed.baseline.status, 'confirmed');
    const baseline = await repository.getRequirementBaseline(project.id);
    assert.equal(baseline.requirements.length, 1);
    assert.equal(baseline.requirements[0].is_mandatory, true);
    assert.equal(baseline.requirements[0].mandatory_marker, '★');
    assert.match(baseline.requirements[0].source_text, /★.*第 3\.2 条/);
    assert.deepEqual(baseline.requirements[0].target_sections, [
      'data-integration', 'solution-design', 'security-compliance'
    ]);

    await assert.rejects(
      () => pool.query(`UPDATE requirements SET content = 'mutated' WHERE id = $1`, [baseline.requirements[0].id]),
      (error) => error.code === '55000'
    );
    await assert.rejects(
      () => pool.query(`DELETE FROM requirements WHERE id = $1`, [baseline.requirements[0].id]),
      (error) => error.code === '55000'
    );
    await assert.rejects(
      () => pool.query(`
        INSERT INTO requirements
          (baseline_id, project_id, req_id, content, source_excerpt, target_sections, ordinal)
        VALUES ($1, $2, 'REQ-002', 'new', 'new', '[]'::jsonb, 2)
      `, [baseline.id, project.id]),
      (error) => error.code === '55000'
    );
    await assert.rejects(
      () => pool.query(`UPDATE requirement_baselines SET status = 'building' WHERE id = $1`, [baseline.id]),
      (error) => error.code === '55000'
    );
    const { rows: versions } = await pool.query(
      `SELECT count(*)::int AS count FROM document_versions WHERE project_id = $1`, [project.id]
    );
    assert.equal(versions[0].count, 0);
  } finally {
    await pool.query(`DELETE FROM projects WHERE id = $1`, [project.id]);
    await pool.end();
  }
});

test('PostgreSQL 解析契约失败只创建 failed 解析审计，不创建 Requirement 基线', async () => {
  assert.ok(process.env.DATABASE_URL, 'DATABASE_URL is required for PostgreSQL integration tests');
  const pool = createPool();
  const repository = new PgRepository(pool);
  const project = await repository.createProject({ name: `Requirement 失败集成测试 ${Date.now()}` });
  const tenderFile = await repository.addTenderFile({
    projectId: project.id,
    originalName: 'invalid.txt',
    storageKey: `${project.id}/invalid-${Date.now()}.txt`,
    mimeType: 'text/plain',
    sizeBytes: 10
  });
  const service = new RequirementParseService({
    repository,
    storage: { read: async () => Buffer.from('requirement') },
    textExtractor: async () => ({
      text: 'requirement', paragraphs: [{ paragraph: 1, page: null, text: 'requirement' }],
      pages: [], warnings: []
    }),
    extractionGateway: {
      extract: async () => {
        throw new SemanticGatewayError(
          'GATEWAY_REQUIREMENTS_INVALID', '候选需求输出契约无效。',
          { raw_response_payload_json: '{invalid' }, 422
        );
      }
    },
    logger: { error: () => {} }
  });

  try {
    await assert.rejects(
      () => service.start({
        projectId: project.id, tenderFileId: tenderFile.id, waitForCompletion: true
      }),
      (error) => error.code === 'GATEWAY_REQUIREMENTS_INVALID'
    );
    const jobs = await repository.listParseJobs(project.id);
    assert.equal(jobs[0].status, 'failed');
    assert.equal(jobs[0].phase, 'failed');
    assert.equal(jobs[0].error_code, 'GATEWAY_REQUIREMENTS_INVALID');
    assert.equal(jobs[0].failed_chunk_number, 1);
    assert.equal(jobs[0].requirement_count, 0);
    const failedJob = await repository.getParseJob(jobs[0].id);
    assert.equal(failedJob.chunks[0].status, 'failed');
    assert.equal(failedJob.chunks[0].error_code, 'GATEWAY_REQUIREMENTS_INVALID');
    assert.equal(await repository.getRequirementBaseline(project.id), null);
  } finally {
    await pool.query(`DELETE FROM projects WHERE id = $1`, [project.id]);
    await pool.end();
  }
});

test('PostgreSQL 持久化章节、succeeded_empty 与章节级 mandatory scope', async () => {
  assert.ok(process.env.DATABASE_URL, 'DATABASE_URL is required for PostgreSQL integration tests');
  const pool = createPool();
  const repository = new PgRepository(pool);
  const project = await repository.createProject({ name: `PDF 章节集成测试 ${Date.now()}` });
  const tenderFile = await repository.addTenderFile({
    projectId: project.id,
    originalName: 'section-fixture.pdf',
    storageKey: `${project.id}/section-${Date.now()}.pdf`,
    mimeType: 'application/pdf',
    sizeBytes: 100
  });
  const values = [
    '第一章 投标邀请', '邀请内容。',
    '第二章 投标人须知前附表', '前附表。',
    '第三章 投标人须知', '须知内容。',
    '第四章 项目要求和有关说明',
    '以下除5.2.6外，其余均为实质性要求。',
    `5.2.1 ${'审计要求。'.repeat(35)}`,
    `5.2.6 ${'例外要求。'.repeat(35)}`,
    '第五章 评标方法和评标标准', '评标内容。',
    '第六章 合同书（格式）', '合同内容。',
    '第七章 投标文件的组成和格式', '格式内容。'
  ];
  const text = values.join('\n');
  const paragraphs = values.map((value, index) => ({ paragraph: index + 1, page: index + 1, text: value }));
  const service = new RequirementParseService({
    repository,
    storage: { read: async () => Buffer.from('fixture') },
    textExtractor: async () => ({ text, paragraphs, pages: [], warnings: [] }),
    chunkBudget: { singleCallThreshold: 1, characterBudget: 120, tokenBudget: 120 },
    extractionGateway: {
      extract: async ({ chunk }) => {
        const requirements = [];
        const mandatory = chunk.segments.find((segment) => segment.source_clause_id === '5.2.1');
        const exception = chunk.segments.find((segment) => segment.source_clause_id === '5.2.6');
        if (mandatory) requirements.push({
          content: '提供审计能力。', source_excerpt: '5.2.1 审计要求。',
          source_page: mandatory.page, source_paragraph: mandatory.paragraph
        });
        if (exception) requirements.push({
          content: '提供例外能力。', source_excerpt: '5.2.6 例外要求。',
          source_page: exception.page, source_paragraph: exception.paragraph
        });
        return { candidates: requirements, warnings: [], audit: { provider: 'semantic_gateway' } };
      }
    }
  });

  try {
    const job = await service.start({
      projectId: project.id, tenderFileId: tenderFile.id, waitForCompletion: true
    });
    assert.equal(job.status, 'succeeded');
    assert.equal(job.document_sections.length, 6);
    assert.equal(job.mandatory_scope_rules.length, 1);
    assert.deepEqual(job.mandatory_scope_rules[0].exception_clause_ids, ['5.2.6']);
    assert.ok(job.chunks.some((chunk) => chunk.status === 'succeeded_empty'));
    const mandatory = job.candidates.find((candidate) => candidate.source_clause_id === '5.2.1');
    const exception = job.candidates.find((candidate) => candidate.source_clause_id === '5.2.6');
    assert.equal(mandatory.is_mandatory, true);
    assert.equal(mandatory.mandatory_scope_section, '项目要求和有关说明');
    assert.equal(exception.is_mandatory, false);
    assert.equal(await repository.getRequirementBaseline(project.id), null);
  } finally {
    await pool.query(`DELETE FROM projects WHERE id = $1`, [project.id]);
    await pool.end();
  }
});

test('PostgreSQL 对历史 Latin-1 乱码文件名只修复 API 展示，不改持久化字段', async () => {
  assert.ok(process.env.DATABASE_URL, 'DATABASE_URL is required for PostgreSQL integration tests');
  const pool = createPool();
  const repository = new PgRepository(pool);
  const project = await repository.createProject({ name: `文件名编码集成测试 ${Date.now()}` });
  const chineseName = '正常中文招标文件.docx';
  const mojibakeName = Buffer.from(chineseName, 'utf8').toString('latin1');
  const file = await repository.addTenderFile({
    projectId: project.id,
    originalName: mojibakeName,
    storageKey: `${project.id}/filename-${Date.now()}.docx`,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    sizeBytes: 1
  });

  try {
    const listed = await repository.listTenderFiles(project.id);
    assert.equal(listed[0].original_name, chineseName);
    const fetched = await repository.getTenderFile(file.id);
    assert.equal(fetched.original_name, chineseName);
    const { rows } = await pool.query(`SELECT original_name FROM tender_files WHERE id = $1`, [file.id]);
    assert.equal(rows[0].original_name, mojibakeName);
  } finally {
    await pool.query(`DELETE FROM projects WHERE id = $1`, [project.id]);
    await pool.end();
  }
});
