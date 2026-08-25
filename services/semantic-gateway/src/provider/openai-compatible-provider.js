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
    if (!this.configured) throw Object.assign(new Error('Provider is not configured'), { code: 'PROVIDER_UNAVAILABLE' });
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    const started = Date.now();
    try {
      const response = await this.fetchImpl(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: instruction },
            { role: 'user', content: JSON.stringify(payload) }
          ],
          response_format: { type: 'json_object' }
        }),
        signal: controller.signal
      });
      const providerAudit = {
        provider: 'openai_compatible',
        model: this.model,
        http_status: response.status,
        latency_ms: Date.now() - started
      };
      if (!response.ok) throw Object.assign(new Error('Provider returned a non-success status'), { code: 'PROVIDER_HTTP_FAILURE', httpStatus: response.status, provider_audit: providerAudit });
      const body = await response.json();
      const content = body?.choices?.[0]?.message?.content;
      if (typeof content !== 'string') throw Object.assign(new Error('Provider output is not text'), {
        code: 'PROVIDER_OUTPUT_INVALID',
        provider_audit: { ...providerAudit, json_parse_success: false, model_content: null }
      });
      try {
        const data = JSON.parse(content);
        return {
          data,
          provider_audit: {
            ...providerAudit,
            json_parse_success: true,
            markdown_fence_present: /^```(?:json)?(?:\s|$)/i.test(content.trim()),
            model_content: content,
            parsed_json: data
          }
        };
      } catch (_error) {
        throw Object.assign(new Error('Provider output is not valid JSON'), {
          code: 'PROVIDER_OUTPUT_INVALID',
          provider_audit: {
            ...providerAudit,
            json_parse_success: false,
            markdown_fence_present: /^```(?:json)?(?:\s|$)/i.test(content.trim()),
            model_content: content,
            parsed_json: null
          }
        });
      }
    } catch (error) {
      if (error?.name === 'AbortError') throw Object.assign(new Error('Provider request timed out'), { code: 'PROVIDER_TIMEOUT' });
      this.logger?.warn?.('Semantic provider diagnostic', { provider: 'openai_compatible', model: this.model, error_classification: error?.code || 'PROVIDER_FAILURE' });
      throw error?.code ? error : Object.assign(new Error('Provider request failed'), { code: 'PROVIDER_UNAVAILABLE' });
    } finally {
      clearTimeout(timer);
    }
  }
}
