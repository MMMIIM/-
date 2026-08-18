const VALID_GATEWAY_STATUSES = new Set(['success', 'failed']);

function normalizeBaseUrl(value) {
  return String(value || '').trim().replace(/\/+$/, '');
}

function positiveTimeout(value, fallback) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function parseSemanticGatewayConfig(env = {}) {
  const timeoutMs = positiveTimeout(env.V43_GATEWAY_TIMEOUT_MS, 30_000);
  return Object.freeze({
    apiBase: normalizeBaseUrl(env.V43_GATEWAY_API_BASE),
    apiKey: String(env.V43_GATEWAY_API_KEY || '').trim(),
    user: String(env.V43_GATEWAY_USER || '').trim(),
    timeoutMs,
    taskTimeouts: Object.freeze({
      healthcheck: positiveTimeout(env.V43_GATEWAY_HEALTHCHECK_TIMEOUT_MS, 15_000),
      requirement_extraction: positiveTimeout(
        env.V43_GATEWAY_REQUIREMENT_EXTRACTION_TIMEOUT_MS,
        120_000
      )
    })
  });
}

function safeGatewayTarget(apiBase) {
  try {
    const target = new URL(apiBase);
    return {
      gateway_host: target.hostname,
      gateway_port: target.port || (target.protocol === 'https:' ? '443' : '80')
    };
  } catch (_error) {
    return { gateway_host: 'invalid', gateway_port: 'unknown' };
  }
}

function auditFor(taskType, extras = {}) {
  return { provider: 'semantic_gateway', task_type: taskType, ...extras };
}

export class SemanticGatewayError extends Error {
  constructor(code, message, audit = {}, status = 502) {
    super(message);
    this.name = 'SemanticGatewayError';
    this.code = code;
    this.status = status;
    this.audit = { ...audit, error_code: code };
  }
}

export function normalizeGatewayTransport(raw) {
  if (typeof raw !== 'string') {
    throw new SemanticGatewayError(
      'GATEWAY_ENVELOPE_INVALID',
      'response_payload_json 必须是字符串。'
    );
  }
  if (!raw.startsWith('<think>')) return raw;
  const closingIndex = raw.indexOf('</think>', '<think>'.length);
  if (closingIndex === -1) return raw;
  return raw.slice(closingIndex + '</think>'.length).replace(/^\s+/, '');
}

function validateGatewayEnvelope(value, requestedTaskType, rawResponsePayloadJson) {
  const audit = auditFor(requestedTaskType, { raw_response_payload_json: rawResponsePayloadJson });
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new SemanticGatewayError('GATEWAY_ENVELOPE_INVALID', '网关 envelope 必须是对象。', audit);
  }
  if (value.schema_version !== '4.3-gateway') {
    throw new SemanticGatewayError('GATEWAY_ENVELOPE_INVALID', '网关 schema_version 无效。', audit);
  }
  if (value.task_type !== requestedTaskType) {
    throw new SemanticGatewayError('GATEWAY_TASK_TYPE_MISMATCH', '网关 task_type 与请求不一致。', {
      ...audit,
      received_task_type: typeof value.task_type === 'string' ? value.task_type : null
    });
  }
  if (!VALID_GATEWAY_STATUSES.has(value.status)) {
    throw new SemanticGatewayError('GATEWAY_ENVELOPE_INVALID', '网关 status 无效。', audit);
  }
  if (!value.data || typeof value.data !== 'object' || Array.isArray(value.data)) {
    throw new SemanticGatewayError('GATEWAY_ENVELOPE_INVALID', '网关 data 必须是对象。', audit);
  }
  if (!Array.isArray(value.warnings)) {
    throw new SemanticGatewayError('GATEWAY_ENVELOPE_INVALID', '网关 warnings 必须是数组。', audit);
  }
  return value;
}

export class SemanticGatewayClient {
  constructor({
    apiBase,
    apiKey,
    user,
    fetchImpl = fetch,
    timeoutMs = 30000,
    taskTimeouts = {},
    logger = null
  }) {
    this.apiBase = normalizeBaseUrl(apiBase);
    this.apiKey = String(apiKey || '').trim();
    this.user = String(user || '').trim();
    this.fetchImpl = fetchImpl;
    this.timeoutMs = timeoutMs;
    this.taskTimeouts = { ...taskTimeouts };
    this.logger = logger;
    this.gatewayTarget = safeGatewayTarget(this.apiBase);
  }

  diagnose(errorCode) {
    this.logger?.warn?.('Semantic Gateway transport diagnostic', {
      provider: 'semantic_gateway',
      ...this.gatewayTarget,
      error_classification: errorCode
    });
  }

  async run({ task_type: taskType, task_instruction: taskInstruction, task_payload_json: taskPayloadJson } = {}) {
    if (!this.apiBase || !this.apiKey || !this.user) {
      throw new SemanticGatewayError(
        'GATEWAY_NOT_CONFIGURED',
        'Semantic Gateway 环境变量未完整配置。',
        auditFor(taskType),
        500
      );
    }
    if (typeof taskType !== 'string' || !taskType.trim()
      || typeof taskInstruction !== 'string' || !taskInstruction.trim()
      || typeof taskPayloadJson !== 'string') {
      throw new SemanticGatewayError(
        'GATEWAY_REQUEST_INVALID',
        'Semantic Gateway 请求字段无效。',
        auditFor(taskType),
        400
      );
    }

    const controller = new AbortController();
    const requestTimeoutMs = this.taskTimeouts[taskType] || this.timeoutMs;
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, requestTimeoutMs);

    let response;
    try {
      response = await this.fetchImpl(`${this.apiBase}/workflows/run`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: {
            task_type: taskType,
            task_instruction: taskInstruction,
            task_payload_json: taskPayloadJson
          },
          response_mode: 'blocking',
          user: this.user
        }),
        signal: controller.signal
      });
    } catch (error) {
      if (timedOut || error?.name === 'AbortError') {
        this.diagnose('GATEWAY_TIMEOUT');
        throw new SemanticGatewayError(
          'GATEWAY_TIMEOUT',
          'Semantic Gateway 请求超时。',
          auditFor(taskType, { timeout_ms: requestTimeoutMs }),
          504
        );
      }
      this.diagnose('GATEWAY_NETWORK_ERROR');
      throw new SemanticGatewayError('GATEWAY_NETWORK_ERROR', 'Semantic Gateway 网络请求失败。', auditFor(taskType));
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      this.diagnose('GATEWAY_HTTP_ERROR');
      throw new SemanticGatewayError(
        'GATEWAY_HTTP_ERROR',
        'Semantic Gateway 返回非成功 HTTP 状态。',
        auditFor(taskType, { http_status: response.status }),
        response.status >= 500 ? 502 : 400
      );
    }

    let outerPayload;
    try {
      outerPayload = await response.json();
    } catch (_error) {
      throw new SemanticGatewayError(
        'GATEWAY_ENVELOPE_INVALID',
        'Semantic Gateway 外层响应不是合法 JSON。',
        auditFor(taskType)
      );
    }

    const outputs = outerPayload?.data?.outputs;
    const hasAllowedField = outputs
      && typeof outputs === 'object'
      && Object.prototype.hasOwnProperty.call(outputs, 'response_payload_json');
    if (!hasAllowedField) {
      throw new SemanticGatewayError(
        'GATEWAY_RESPONSE_PAYLOAD_MISSING',
        'Semantic Gateway 缺少 response_payload_json。',
        auditFor(taskType)
      );
    }

    const rawResponsePayloadJson = outputs.response_payload_json;
    const audit = auditFor(taskType, { raw_response_payload_json: rawResponsePayloadJson });
    let normalized;
    try {
      normalized = normalizeGatewayTransport(rawResponsePayloadJson);
    } catch (error) {
      if (error instanceof SemanticGatewayError) {
        error.audit = { ...audit, error_code: error.code };
        throw error;
      }
      throw error;
    }

    let envelope;
    try {
      envelope = JSON.parse(normalized);
    } catch (_error) {
      throw new SemanticGatewayError(
        'GATEWAY_INVALID_JSON',
        'response_payload_json 不是可整体解析的 JSON。',
        audit
      );
    }
    validateGatewayEnvelope(envelope, taskType, rawResponsePayloadJson);
    return { envelope, audit };
  }
}

export function createSemanticGatewayClientFromEnv({
  env = process.env,
  fetchImpl = fetch,
  timeoutMs,
  logger
} = {}) {
  const config = parseSemanticGatewayConfig(env);
  return new SemanticGatewayClient({
    ...config,
    fetchImpl,
    timeoutMs: timeoutMs ?? config.timeoutMs,
    logger
  });
}

export function createSemanticGatewayWriter(client) {
  return {
    async write(context) {
      const gatewayResponse = await client.run({
        task_type: 'draft_sections',
        task_instruction: '仅根据后端提供的 canonical requirements 与章节计划生成章节草稿。',
        task_payload_json: JSON.stringify(context)
      });
      if (gatewayResponse.envelope.status !== 'success' || !Array.isArray(gatewayResponse.envelope.data.sections)) {
        throw new SemanticGatewayError(
          'GATEWAY_ENVELOPE_INVALID',
          'draft_sections 网关响应缺少 data.sections。',
          gatewayResponse.audit
        );
      }
      return {
        sections: gatewayResponse.envelope.data.sections,
        provider_audit: gatewayResponse.audit
      };
    }
  };
}

export function createGenerationProvider({
  provider,
  mockWriter,
  env = process.env,
  fetchImpl = fetch,
  timeoutMs
} = {}) {
  const selectedProvider = provider || env.GENERATION_PROVIDER || 'mock';
  if (selectedProvider === 'mock') {
    if (!mockWriter?.write) throw new Error('mock provider requires mockWriter');
    return mockWriter;
  }
  if (selectedProvider === 'semantic_gateway') {
    return createSemanticGatewayWriter(createSemanticGatewayClientFromEnv({ env, fetchImpl, timeoutMs }));
  }
  throw Object.assign(new Error(`不支持的 GENERATION_PROVIDER：${selectedProvider}`), { code: 'GENERATION_PROVIDER_INVALID' });
}
