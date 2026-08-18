import test from 'node:test';
import assert from 'node:assert/strict';
import dotenv from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPool, PgRepository } from '../src/db.js';
import { createDifyClient } from '../src/dify.js';
import { GenerationService } from '../src/service.js';

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
