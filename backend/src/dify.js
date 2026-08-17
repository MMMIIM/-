import { extractResponsePayload } from './contract.js';
import { AppError, ERROR_MESSAGES } from './errors.js';

function normalizeBaseUrl(value) {
  return String(value || '').trim().replace(/\/+$/, '');
}

function extractFromSse(text) {
  let finishedPayload;
  for (const block of text.split(/\r?\n\r?\n/)) {
    const data = block.split(/\r?\n/)
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trimStart())
      .join('\n');
    if (!data || data === '[DONE]') continue;
    try {
      const payload = JSON.parse(data);
      if ((payload.event || '') === 'workflow_finished') finishedPayload = payload;
      if ((payload.event || '') === 'error') {
        throw new AppError('DIFY_CALL_FAILED', ERROR_MESSAGES.DIFY_CALL_FAILED, 502);
      }
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error;
    }
  }
  try {
    return extractResponsePayload(finishedPayload);
  } catch (error) {
    if (error instanceof AppError && error.code === 'CONTRACT_INVALID') {
      error.audit = {
        ...(error.audit || {}),
        rawDifyResponseJson: finishedPayload,
        rawResponseText: error.audit?.rawResponseText || (finishedPayload ? undefined : text)
      };
    }
    throw error;
  }
}

export function createDifyClient({ apiBase, apiKey, fetchImpl = fetch }) {
  const baseUrl = normalizeBaseUrl(apiBase);

  return {
    async run(inputs, user = 'bid-assistant-local') {
      if (!baseUrl || !apiKey) {
        throw new AppError('DIFY_NOT_CONFIGURED', ERROR_MESSAGES.DIFY_NOT_CONFIGURED, 500);
      }
      let response;
      try {
        response = await fetchImpl(`${baseUrl}/workflows/run`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ inputs, response_mode: 'streaming', user })
        });
      } catch (_error) {
        throw new AppError('DIFY_CALL_FAILED', ERROR_MESSAGES.DIFY_CALL_FAILED, 502);
      }
      if (!response.ok) {
        throw new AppError('DIFY_CALL_FAILED', ERROR_MESSAGES.DIFY_CALL_FAILED, response.status >= 500 ? 502 : 400);
      }
      const contentType = response.headers.get('content-type') || '';
      try {
        if (contentType.includes('text/event-stream')) return extractFromSse(await response.text());
        if (contentType.includes('application/json')) {
          const responseText = await response.text();
          let responseJson;
          try {
            responseJson = JSON.parse(responseText);
          } catch (_parseError) {
            const contractError = new AppError('CONTRACT_INVALID', ERROR_MESSAGES.CONTRACT_INVALID, 502);
            contractError.audit = { rawResponseText: responseText };
            throw contractError;
          }
          try {
            return extractResponsePayload(responseJson);
          } catch (error) {
            if (error instanceof AppError && error.code === 'CONTRACT_INVALID') {
              error.audit = { ...(error.audit || {}), rawDifyResponseJson: responseJson };
            }
            throw error;
          }
        }
      } catch (error) {
        if (error instanceof AppError) throw error;
        throw new AppError('CONTRACT_INVALID', ERROR_MESSAGES.CONTRACT_INVALID, 502);
      }
      throw new AppError('DIFY_CALL_FAILED', ERROR_MESSAGES.DIFY_CALL_FAILED, 502);
    }
  };
}
