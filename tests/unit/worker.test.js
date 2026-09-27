import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../../worker/src/index.js';

const productionOrigin = 'https://versuai-interview.nicoversu.workers.dev';
function request(body, origin = productionOrigin) {
  return new Request('https://worker.example/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin },
    body: JSON.stringify(body),
  });
}
const validBody = {
  systemPrompt: 'Responde en español.',
  messages: [{ role: 'user', content: 'Hola' }],
};

test('preflight permits production and local frontend origins', async () => {
  for (const origin of [
    productionOrigin,
    'http://127.0.0.1:5173',
    'http://localhost:5173',
  ]) {
    const response = await worker.fetch(
      new Request('https://worker.example/chat', {
        method: 'OPTIONS',
        headers: {
          Origin: origin,
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'content-type',
        },
      }),
      {},
    );
    assert.equal(response.status, 204);
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), origin);
    assert.match(response.headers.get('Access-Control-Allow-Methods'), /POST/);
    assert.equal(
      response.headers.get('Access-Control-Allow-Headers'),
      'Content-Type',
    );
    assert.equal(response.headers.get('Vary'), 'Origin');
  }
});

test('origin allowlist can be configured and blocks other origins before inference', async () => {
  const env = { ALLOWED_ORIGINS: 'https://preview.example' };
  const denied = await worker.fetch(request(validBody), env);
  assert.equal(denied.status, 403);
  assert.equal(denied.headers.get('Access-Control-Allow-Origin'), null);
  const allowed = await worker.fetch(
    new Request('https://worker.example/', {
      headers: { Origin: 'https://preview.example' },
    }),
    env,
  );
  assert.equal(allowed.status, 200);
  assert.equal(
    allowed.headers.get('Access-Control-Allow-Origin'),
    'https://preview.example',
  );
});

test('chat forwards prompt and history to the configured model and returns text', async () => {
  let call;
  const body = {
    ...validBody,
    messages: [
      ...validBody.messages,
      { role: 'assistant', content: 'Hola, soy Nota.' },
      { role: 'user', content: '¿Qué venden?' },
    ],
  };
  const response = await worker.fetch(request(body), {
    AI_MODEL: 'test-model',
    AI: {
      run: async (...args) => {
        call = args;
        return { response: 'Productos NotCo' };
      },
    },
  });
  assert.equal(response.status, 200);
  assert.deepEqual(call, [
    'test-model',
    {
      messages: [
        { role: 'system', content: body.systemPrompt },
        ...body.messages,
      ],
    },
  ]);
  assert.deepEqual(await response.json(), { response: 'Productos NotCo' });
  assert.equal(
    response.headers.get('Access-Control-Allow-Origin'),
    productionOrigin,
  );
});

test('invalid JSON and payloads return 400 with CORS before inference', async () => {
  const invalidBodies = [
    null,
    [],
    {},
    { messages: [] },
    { messages: [null] },
    { messages: [{ role: 'system', content: 'bad role' }] },
    { messages: [{ role: 'user', content: 123 }] },
    { ...validBody, systemPrompt: {} },
  ];
  const requests = invalidBodies.map((body) => request(body));
  requests.push(
    new Request('https://worker.example/chat', {
      method: 'POST',
      headers: { Origin: productionOrigin },
      body: '{',
    }),
  );
  for (const input of requests) {
    const response = await worker.fetch(input, {});
    assert.equal(response.status, 400);
    assert.equal(
      response.headers.get('Access-Control-Allow-Origin'),
      productionOrigin,
    );
  }
});

test('AI failures retain CORS and omit internal error details', async () => {
  const response = await worker.fetch(request(validBody), {
    AI: {
      run: async () => {
        throw new Error('internal detail');
      },
    },
  });
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { error: 'AI inference failed' });
  assert.equal(
    response.headers.get('Access-Control-Allow-Origin'),
    productionOrigin,
  );
});

test('invalid model output returns 502', async () => {
  const response = await worker.fetch(request(validBody), {
    AI: { run: async () => ({ response: '' }) },
  });
  assert.equal(response.status, 502);
  assert.equal(
    response.headers.get('Access-Control-Allow-Origin'),
    productionOrigin,
  );
});

test('health check reports default model and unknown routes return JSON with CORS', async () => {
  const response = await worker.fetch(
    new Request('https://worker.example/'),
    {},
  );
  assert.deepEqual(await response.json(), {
    status: 'ok',
    model: '@cf/meta/llama-3.1-8b-instruct-fp8',
  });
  const missing = await worker.fetch(
    new Request('https://worker.example/missing', {
      headers: { Origin: productionOrigin },
    }),
    {},
  );
  assert.equal(missing.status, 404);
  assert.equal(
    missing.headers.get('Access-Control-Allow-Origin'),
    productionOrigin,
  );
});
