const PUBLIC_PROVIDER_ERROR_CODES = new Set([
  'PROVIDER_UNAVAILABLE',
  'PROVIDER_TIMEOUT',
  'PROVIDER_HTTP_FAILURE',
  'PROVIDER_OUTPUT_INVALID'
]);

const PROVIDER_STAGES = Object.freeze({
  CONFIG_RESOLVED: 'CONFIG_RESOLVED',
  REQUEST_URL_BUILT: 'REQUEST_URL_BUILT',
  REQUEST_BODY_BUILT: 'REQUEST_BODY_BUILT',
  REQUEST_BODY_SERIALIZED: 'REQUEST_BODY_SERIALIZED',
  FETCH_INVOKED: 'FETCH_INVOKED',
  HTTP_RESPONSE_RECEIVED: 'HTTP_RESPONSE_RECEIVED',
  RESPONSE_BODY_READ: 'RESPONSE_BODY_READ',
  MODEL_CONTENT_EXTRACTED: 'MODEL_CONTENT_EXTRACTED'
});

function safeCode(value) {
  const candidate = String(value || '').trim();
  return /^[A-Z0-9_:-]{1,80}$/.test(candidate) ? candidate : null;
}

function safeMessage(value) {
  return String(value || '')
    .replace(/Bearer\s+[^\s"']+/gi, 'Bearer [REDACTED]')
    .replace(/(authorization|api[_-]?key|token)\s*[:=]\s*[^\s,;}]+/gi, '$1=[REDACTED]')
    .replace(/https?:\/\/[^\s"']+/gi, '[URL_REDACTED]')
    .slice(0, 240);
}

function safeCause(error) {
  const cause = error?.cause || error;
  return {
    cause_name: safeCode(cause?.name) || (cause?.name ? String(cause.name).slice(0, 80) : null),
    cause_code: safeCode(cause?.code),
    cause_message: cause?.message ? safeMessage(cause.message) : null
  };
}

function createAudit(model, started) {
  return {
    provider: 'openai_compatible',
    model,
    http_status: null,
    latency_ms: null,
    provider_adapter_invoked: true,
    fetch_invoked: false,
    provider_http_reached: false,
    current_stage: null,
    failure_stage: null,
    error_name: null,
    safe_error_code: null,
    safe_error_message: null,
    cause_name: null,
    cause_code: null,
    cause_message: null,
    started_at_ms: started
  };
}

function finalizeAudit(audit, started) {
  const finalized = { ...audit, latency_ms: Math.max(0, Date.now() - started) };
  delete finalized.started_at_ms;
  return finalized;
}

function attachAudit(error, audit, started, {
  safeErrorCode = null,
  safeErrorMessage = null,
  failureStage = audit.failure_stage || audit.current_stage,
  cause = error
} = {}) {
  const details = safeCause(cause);
  error.provider_audit = finalizeAudit({
    ...audit,
    failure_stage: failureStage || null,
    error_name: error?.name ? String(error.name).slice(0, 80) : null,
    safe_error_code: safeCode(safeErrorCode),
    safe_error_message: safeErrorMessage ? safeMessage(safeErrorMessage) : null,
    ...details
  }, started);
  return error;
}

export class OpenAICompatibleProvider {
  constructor({ baseUrl, apiKey, model, timeoutMs = 120000, fetchImpl = fetch, logger = console } = {}) {
    this.baseUrl = String(baseUrl || '').trim().replace(/\/+$/, '');
    this.apiKey = String(apiKey || '').trim();
    this.model = String(model || '').trim();
    this.timeoutMs = Number.isInteger(Number(timeoutMs)) && Number(timeoutMs) > 0 ? Number(timeoutMs) : 120000;
    this.fetchImpl = fetchImpl;
    this.logger = logger;
  }

  get configured() {
    return Boolean(this.baseUrl && this.apiKey && this.model);
  }

  async invoke({ instruction, payload }) {
    const started = Date.now();
    const audit = createAudit(this.model, started);
    if (!this.configured) {
      audit.current_stage = PROVIDER_STAGES.CONFIG_RESOLVED;
      throw attachAudit(
        Object.assign(new Error('Provider is not configured'), { code: 'PROVIDER_UNAVAILABLE' }),
        audit,
        started,
        { safeErrorCode: 'CONFIG_MISSING', safeErrorMessage: 'Provider configuration is incomplete.' }
      );
    }
    audit.current_stage = PROVIDER_STAGES.CONFIG_RESOLVED;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      let requestUrl;
      try {
        requestUrl = `${this.baseUrl}/chat/completions`;
        new URL(requestUrl);
        audit.current_stage = PROVIDER_STAGES.REQUEST_URL_BUILT;
      } catch (error) {
        audit.current_stage = PROVIDER_STAGES.REQUEST_URL_BUILT;
        throw attachAudit(
          Object.assign(new Error('Provider request URL could not be built'), { code: 'PROVIDER_UNAVAILABLE' }),
          audit,
          started,
          { safeErrorCode: 'REQUEST_BUILD_FAILED', safeErrorMessage: 'Provider request URL construction failed.', cause: error }
        );
      }

      let requestBody;
      try {
        requestBody = {
          model: this.model,
          messages: [
            { role: 'system', content: instruction },
            { role: 'user', content: JSON.stringify(payload) }
          ],
          response_format: { type: 'json_object' }
        };
        audit.current_stage = PROVIDER_STAGES.REQUEST_BODY_BUILT;
      } catch (error) {
        audit.current_stage = PROVIDER_STAGES.REQUEST_BODY_BUILT;
        throw attachAudit(
          Object.assign(new Error('Provider request body could not be built'), { code: 'PROVIDER_UNAVAILABLE' }),
          audit,
          started,
          { safeErrorCode: 'REQUEST_BUILD_FAILED', safeErrorMessage: 'Provider request body construction failed.', cause: error }
        );
      }

      let serializedBody;
      try {
        serializedBody = JSON.stringify(requestBody);
        audit.current_stage = PROVIDER_STAGES.REQUEST_BODY_SERIALIZED;
      } catch (error) {
        audit.current_stage = PROVIDER_STAGES.REQUEST_BODY_SERIALIZED;
        throw attachAudit(
          Object.assign(new Error('Provider request body could not be serialized'), { code: 'PROVIDER_UNAVAILABLE' }),
          audit,
          started,
          { safeErrorCode: 'REQUEST_SERIALIZATION_FAILED', safeErrorMessage: 'Provider request body serialization failed.', cause: error }
        );
      }

      audit.fetch_invoked = true;
      audit.current_stage = PROVIDER_STAGES.FETCH_INVOKED;
      const response = await this.fetchImpl(requestUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: serializedBody,
        signal: controller.signal
      });
      audit.provider_http_reached = true;
      audit.current_stage = PROVIDER_STAGES.HTTP_RESPONSE_RECEIVED;
      const providerAudit = {
        ...audit,
        http_status: response.status,
        latency_ms: Date.now() - started
      };
      if (!response.ok) {
        throw attachAudit(
          Object.assign(new Error('Provider returned a non-success status'), { code: 'PROVIDER_HTTP_FAILURE', httpStatus: response.status }),
          providerAudit,
          started,
          { safeErrorCode: 'PROVIDER_HTTP_ERROR', safeErrorMessage: 'Provider returned a non-success HTTP status.', failureStage: PROVIDER_STAGES.HTTP_RESPONSE_RECEIVED }
        );
      }
      let body;
      try {
        body = await response.json();
        audit.current_stage = PROVIDER_STAGES.RESPONSE_BODY_READ;
      } catch (error) {
        throw attachAudit(
          Object.assign(new Error('Provider response body could not be read'), { code: 'PROVIDER_OUTPUT_INVALID' }),
          { ...audit, http_status: response.status },
          started,
          { safeErrorCode: 'RESPONSE_READ_FAILED', safeErrorMessage: 'Provider response body could not be read.', failureStage: PROVIDER_STAGES.RESPONSE_BODY_READ, cause: error }
        );
      }
      const content = body?.choices?.[0]?.message?.content;
      audit.current_stage = PROVIDER_STAGES.MODEL_CONTENT_EXTRACTED;
      if (typeof content !== 'string') {
        throw attachAudit(
          Object.assign(new Error('Provider output is not text'), { code: 'PROVIDER_OUTPUT_INVALID' }),
          { ...audit, http_status: response.status, json_parse_success: false, model_content: null },
          started,
          { safeErrorCode: 'PROVIDER_OUTPUT_INVALID', safeErrorMessage: 'Provider response did not contain text content.', failureStage: PROVIDER_STAGES.MODEL_CONTENT_EXTRACTED }
        );
      }
      try {
        const data = JSON.parse(content);
        return {
          data,
          provider_audit: {
            ...finalizeAudit({ ...audit, http_status: response.status, current_stage: PROVIDER_STAGES.MODEL_CONTENT_EXTRACTED }, started),
            json_parse_success: true,
            markdown_fence_present: /^```(?:json)?(?:\s|$)/i.test(content.trim()),
            model_content: content,
            parsed_json: data
          }
        };
      } catch (_error) {
        throw attachAudit(
          Object.assign(new Error('Provider output is not valid JSON'), { code: 'PROVIDER_OUTPUT_INVALID' }),
          {
            ...audit,
            http_status: response.status,
            json_parse_success: false,
            markdown_fence_present: /^```(?:json)?(?:\s|$)/i.test(content.trim()),
            model_content: content,
            parsed_json: null
          },
          started,
          { safeErrorCode: 'PROVIDER_OUTPUT_INVALID', safeErrorMessage: 'Provider response content was not valid JSON.', failureStage: PROVIDER_STAGES.MODEL_CONTENT_EXTRACTED }
        );
      }
    } catch (error) {
      if (error?.code === 'PROVIDER_TIMEOUT') throw error;
      if (error?.name === 'AbortError') {
        throw attachAudit(
          Object.assign(new Error('Provider request timed out'), { code: 'PROVIDER_TIMEOUT' }),
          error.provider_audit || audit,
          started,
          { safeErrorCode: 'TIMEOUT', safeErrorMessage: 'Provider request timed out.', failureStage: PROVIDER_STAGES.FETCH_INVOKED, cause: error }
        );
      }
      this.logger?.warn?.('Semantic provider diagnostic', { provider: 'openai_compatible', model: this.model, error_classification: error?.code || 'PROVIDER_FAILURE' });
      if (PUBLIC_PROVIDER_ERROR_CODES.has(error?.code)) throw error;
      throw attachAudit(
        Object.assign(new Error('Provider request failed'), { code: 'PROVIDER_UNAVAILABLE' }),
        error.provider_audit || audit,
        started,
        {
          safeErrorCode: error?.provider_audit?.safe_error_code || 'FETCH_FAILED',
          safeErrorMessage: error?.provider_audit?.safe_error_message || 'Provider request failed before an HTTP response.',
          failureStage: error?.provider_audit?.failure_stage || PROVIDER_STAGES.FETCH_INVOKED,
          cause: error
        }
      );
    } finally {
      clearTimeout(timer);
    }
  }
}
