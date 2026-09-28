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
    CATALOGUE_DB: { prepare: () => ({ all: async () => ({ results: [] }) }) },
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

for (const asObject of [true, false]) {
  test(`evaluation requests JSON and normalizes ${asObject ? 'object' : 'string'} output without querying D1`, async () => {
    const evaluation = {
      results: [{ id: '1', verdict: 'pass', reason: 'Cumple.' }],
    };
    let options;
    const body = {
      mode: 'evaluation',
      systemPrompt: 'Evalúa y devuelve JSON.',
      messages: [
        {
          role: 'user',
          content: JSON.stringify({
            cases: [
              { id: '1', message: 'precio notmilk', response: 'Sin stock.' },
            ],
          }),
        },
      ],
    };
    const response = await worker.fetch(request(body), {
      CATALOGUE_DB: {
        prepare: () => {
          assert.fail('Evaluation must not query D1');
        },
      },
      AI: {
        run: async (_model, input) => {
          options = input;
          return {
            response: asObject ? evaluation : JSON.stringify(evaluation),
          };
        },
      },
    });
    assert.equal(response.status, 200);
    assert.deepEqual(JSON.parse((await response.json()).response), evaluation);
    assert.equal(options.response_format.type, 'json_schema');
    assert.equal(options.max_tokens, 512);
    assert.equal(options.temperature, 0);
    assert.deepEqual(options.messages, [
      { role: 'system', content: body.systemPrompt },
      ...body.messages,
    ]);
  });
}

test('product chat still injects D1 catalogue and does not request JSON mode', async () => {
  let options;
  const response = await worker.fetch(
    request({
      ...validBody,
      messages: [{ role: 'user', content: 'precio notmilk' }],
    }),
    {
      CATALOGUE_DB: {
        prepare: () => ({
          all: async () => ({
            results: [
              {
                sku: 'NM-1',
                producto: 'NotMilk',
                categoria: 'Leche',
                formato: '1 L',
                precio_clp: 2000,
                stock: 4,
                activo: 1,
              },
            ],
          }),
        }),
      },
      AI: {
        run: async (_model, input) => {
          options = input;
          return { response: 'Cuesta $2.000.' };
        },
      },
    },
  );
  assert.equal(response.status, 200);
  assert.match(options.messages[0].content, /NM-1.*NotMilk.*2000/);
  assert.equal(options.response_format, undefined);
});

test('catalogue errors retain CORS and have a distinct error code', async () => {
  const response = await worker.fetch(
    request({ ...validBody, messages: [{ role: 'user', content: 'NotMilk' }] }),
    {
      CATALOGUE_DB: {
        prepare: () => {
          throw new Error('db failed');
        },
      },
      AI: { run: () => assert.fail('Must not infer without catalogue') },
    },
  );
  assert.equal(response.status, 503);
  assert.equal((await response.json()).code, 'CATALOGUE_FAILED');
  assert.equal(
    response.headers.get('Access-Control-Allow-Origin'),
    productionOrigin,
  );
});

test('unsupported modes are rejected before inference', async () => {
  const response = await worker.fetch(
    request({ ...validBody, mode: 'invalid' }),
    {},
  );
  assert.equal(response.status, 400);
});
