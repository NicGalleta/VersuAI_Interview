import { test } from 'node:test';
import assert from 'node:assert/strict';
import { requestReply } from '../../src/features/notco/chat.js';

for (const response of ['', '   ', null, {}, undefined]) {
  test(`rejects invalid reply ${JSON.stringify(response)}`, async (t) => {
    t.mock.method(globalThis, 'fetch', async () => ({
      ok: true,
      json: async () => ({ response }),
    }));
    await assert.rejects(requestReply('prompt', []), /vacía o inválida/);
  });
}

test('reports network errors without exposing raw errors', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => {
    throw new TypeError('Failed to fetch');
  });
  await assert.rejects(requestReply('prompt', []), /Revisa la conexión/);
});

test('aborts a request that exceeds the timeout', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let signal;
  t.mock.method(globalThis, 'fetch', (_url, options) => {
    signal = options.signal;
    return new Promise((_resolve, reject) =>
      signal.addEventListener('abort', () => reject(new Error('aborted'))),
    );
  });
  const request = requestReply('prompt', []);
  const rejected = assert.rejects(request, /tardó demasiado/);
  t.mock.timers.tick(60000);
  await rejected;
  assert.equal(signal.aborted, true);
});

test('outgoing requests refresh Santiago date and time without altering prompt or history', async (t) => {
  t.mock.timers.enable({
    apis: ['Date'],
    now: new Date('2026-01-15T02:30:00Z'),
  });
  const payloads = [];
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    payloads.push(JSON.parse(options.body));
    return { ok: true, json: async () => ({ response: 'Hola' }) };
  });
  const prompt = 'Responde en español.';
  const messages = [{ role: 'user', content: 'Hola' }];
  await requestReply(prompt, messages);
  assert.ok(
    payloads[0].systemPrompt.startsWith(`${prompt}\n\nFECHA Y HORA ACTUAL\n`),
  );
  assert.match(
    payloads[0].systemPrompt,
    /14 de enero de 2026.*23:30:00.*America\/Santiago/,
  );
  t.mock.timers.setTime(new Date('2026-07-15T02:30:00Z').getTime());
  await requestReply(prompt, messages);
  assert.match(
    payloads[1].systemPrompt,
    /14 de julio de 2026.*22:30:00.*America\/Santiago/,
  );
  assert.equal(payloads[1].systemPrompt.split('FECHA Y HORA ACTUAL').length, 2);
  assert.deepEqual(payloads[1].messages, messages);
  assert.equal(prompt, 'Responde en español.');
  await requestReply('', messages);
  assert.ok(payloads[2].systemPrompt.startsWith('FECHA Y HORA ACTUAL\n'));
});
