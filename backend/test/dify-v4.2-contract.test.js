import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { extractResponsePayload } from '../src/contract.js';

const fixture = JSON.parse(readFileSync(
  new URL('./fixtures/dify-v4.2-real-response.json', import.meta.url),
  'utf8'
));

test('真实 Dify v4.2 脱敏 fixture 缺失 response_payload_json 时严格拒绝 result 兜底', () => {
  assert.deepEqual(Object.keys(fixture.data.outputs), ['result']);
  assert.throws(() => extractResponsePayload(fixture), (error) => {
    assert.equal(error.code, 'CONTRACT_INVALID');
    assert.equal(error.audit?.responsePayloadMissing, true);
    return true;
  });
});
