import { test, expect } from '@playwright/test';
import { initialPrompt } from '../../src/features/notco/data/prompt.js';
import { chatEndpoint } from '../../src/features/notco/chat.js';

async function openAgent(page) {
  await page.addInitScript(() =>
    localStorage.setItem('versu-prompt', 'Prompt de prueba'),
  );
  await page.goto('/');
  await page.getByRole('button', { name: 'Agente NotCo', exact: true }).click();
  await page.locator('.prompt-section summary').click();
  await page
    .getByRole('textbox', { name: 'Prompt de Nota' })
    .fill('Prompt de prueba');
}

test('chat sends the current prompt, preserves context and resets history', async ({
  page,
}) => {
  const requests = [];
  let release;
  const pending = new Promise((resolve) => {
    release = resolve;
  });
  await page.route(chatEndpoint, async (route) => {
    requests.push(route.request().postDataJSON());
    if (requests.length === 1) await pending;
    await route.fulfill({
      json: { response: 'Hola desde Nota\n¿Cómo te ayudo?' },
    });
  });
  await openAgent(page);
  const input = page.getByRole('textbox', { name: 'Mensaje de prueba' });
  await input.fill('Hola');
  await input.press('Enter');
  await expect(page.getByText('Nota está escribiendo…')).toBeVisible();
  await expect(input).toBeDisabled();
  await expect(
    page.getByRole('button', { name: 'Enviar mensaje' }),
  ).toBeDisabled();
  release();
  await expect(page.locator('.assistant-bubble')).toHaveText(
    'Hola desde Nota\n¿Cómo te ayudo?',
  );
  expect(requests[0]).toEqual({
    systemPrompt: expect.stringContaining(
      'Prompt de prueba\n\nFECHA Y HORA ACTUAL\n',
    ),
    messages: [{ role: 'user', content: 'Hola' }],
  });
  await page
    .getByRole('textbox', { name: 'Prompt de Nota' })
    .fill('Prompt actualizado');
  await input.fill('¿Qué venden?');
  await page.getByRole('button', { name: 'Enviar mensaje' }).click();
  await expect(page.locator('.assistant-bubble')).toHaveCount(2);
  expect(requests[1]).toEqual({
    systemPrompt: expect.stringContaining(
      'Prompt actualizado\n\nFECHA Y HORA ACTUAL\n',
    ),
    messages: [
      { role: 'user', content: 'Hola' },
      { role: 'assistant', content: 'Hola desde Nota\n¿Cómo te ayudo?' },
      { role: 'user', content: '¿Qué venden?' },
    ],
  });
  await page.getByRole('button', { name: 'Nueva conversación' }).click();
  await expect(page.locator('.assistant-bubble')).toHaveCount(0);
  await input.fill('Otra consulta');
  await input.press('Enter');
  await expect(page.locator('.assistant-bubble')).toHaveCount(1);
  expect(requests[2].messages).toEqual([
    { role: 'user', content: 'Otra consulta' },
  ]);
});

test('failed chat requests retain the draft and retry without duplicate turns', async ({
  page,
}) => {
  const requests = [];
  await page.route(chatEndpoint, async (route) => {
    requests.push(route.request().postDataJSON());
    await route.fulfill(
      requests.length === 1
        ? { status: 500, json: { error: 'AI inference failed' } }
        : { json: { response: '<script>alert("unsafe")</script>' } },
    );
  });
  await openAgent(page);
  const input = page.getByRole('textbox', { name: 'Mensaje de prueba' });
  await input.fill('Hola');
  await input.press('Enter');
  await expect(page.getByRole('alert')).toContainText('500');
  await expect(input).toHaveValue('Hola');
  await expect(page.locator('.user-bubble')).toHaveCount(0);
  await input.press('Enter');
  await expect(page.locator('.assistant-bubble')).toHaveText(
    '<script>alert("unsafe")</script>',
  );
  expect(requests[1].messages).toEqual(requests[0].messages);
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('test suite uses isolated conversations and exports results with its prompt snapshot', async ({
  page,
}) => {
  const requests = [];
  await page.route(chatEndpoint, async (route) => {
    requests.push(route.request().postDataJSON());
    if (requests.length > 8) {
      const cases = JSON.parse(requests.at(-1).messages[0].content).cases;
      await route.fulfill({
        json: {
          response: JSON.stringify({
            results: cases.map((item) => ({
              id: item.id,
              verdict: item.id === '3' ? 'fail' : 'pass',
              reason: `Motivo ${item.id}`,
            })),
          }),
        },
      });
      return;
    }
    await route.fulfill(
      requests.length === 2
        ? { status: 429, json: { error: 'busy' } }
        : { json: { response: `Respuesta ${requests.length}` } },
    );
  });
  await openAgent(page);
  await page.getByRole('button', { name: 'Batería de pruebas · 8' }).click();
  await page.getByRole('button', { name: 'Ejecutar pruebas' }).click();
  await expect(
    page.getByRole('button', { name: 'Ejecutar pruebas' }),
  ).toBeEnabled();
  await expect(
    page.locator('.test-card .badge').filter({ hasText: /^Cumple$/ }),
  ).toHaveCount(6);
  await expect(
    page.locator('.test-card .badge').filter({ hasText: 'Error' }),
  ).toHaveCount(1);
  expect(requests).toHaveLength(15);
  for (const request of requests.slice(8)) {
    expect(request.mode).toBe('evaluation');
    const data = JSON.parse(request.messages[0].content);
    expect(data.cases).toHaveLength(1);
    expect(data).not.toHaveProperty('referencePolicies');
  }
  expect(
    requests
      .slice(0, 8)
      .every(
        (r) =>
          r.messages.length === 1 &&
          r.systemPrompt.startsWith(
            'Prompt de prueba\n\nFECHA Y HORA ACTUAL\n',
          ),
      ),
  ).toBe(true);
  await page.getByRole('button', { name: 'Prompt y conversación' }).click();
  await page.locator('.prompt-section summary').click();
  await page
    .getByRole('textbox', { name: 'Prompt de Nota' })
    .fill('Otro prompt');
  await page.getByRole('button', { name: 'Batería de pruebas · 8' }).click();
  await expect(
    page.getByText('El prompt cambió desde la última ejecución.', {
      exact: false,
    }),
  ).toBeVisible();
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar batería' }).click();
  const stream = await (await downloading).createReadStream();
  let text = '';
  for await (const chunk of stream) text += chunk;
  const payload = JSON.parse(text);
  expect(payload.system).toBe('Prompt de prueba');
  expect(payload.cases).toHaveLength(8);
  expect(payload.cases[0].response).toBe('Respuesta 1');
  expect(payload.cases[1].verdict).toBe('error');
  expect(payload.cases[0].verdict).toBe('pass');
  expect(payload.cases[0].reason).toBe('Motivo 1');
  expect(payload.cases[2].verdict).toBe('fail');
  expect(payload.evaluation.referenceCatalog).toContain('sku');
});

test('collapsible prompt sections preserve the full prompt when editing and sending', async ({
  page,
}) => {
  const requests = [];
  await page.route(chatEndpoint, async (route) => {
    requests.push(route.request().postDataJSON());
    await route.fulfill({ json: { response: 'Hola' } });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Agente NotCo', exact: true }).click();
  await expect(page.locator('.prompt-section')).toHaveCount(8);
  await expect(
    page.getByRole('button', { name: 'Guardar versión' }),
  ).toBeDisabled();
  const original = initialPrompt;
  await page
    .locator('.prompt-section summary')
    .filter({ hasText: /^\s*IDENTIDAD(?:\s|$)/ })
    .click();
  const identity = page.getByRole('textbox', {
    name: 'IDENTIDAD',
    exact: true,
  });
  const oldIdentity = await identity.inputValue();
  await identity.fill('Identidad temporal.');
  await page.getByRole('button', { name: 'Guardar versión' }).click();
  await identity.fill('Identidad actualizada.');
  await identity.press('End');
  await identity.pressSequentially(' Otra frase.');
  await page
    .locator('.prompt-section summary')
    .filter({ hasText: /^\s*IDENTIDAD(?:\s|$)/ })
    .click();
  await expect(identity).toBeHidden();
  await page
    .locator('.prompt-section summary')
    .filter({ hasText: /^\s*PERSONALIDAD(?:\s|$)/ })
    .click();
  const personality = page.getByRole('textbox', {
    name: 'PERSONALIDAD',
    exact: true,
  });
  const oldPersonality = await personality.inputValue();
  await personality.fill('Tono cordial.');
  const expected = original
    .replace(oldIdentity, 'Identidad actualizada. Otra frase.')
    .replace(oldPersonality, 'Tono cordial.');
  await page.getByRole('button', { name: 'Guardar versión' }).click();
  expect(await page.evaluate(() => localStorage.getItem('versu-prompt'))).toBe(
    expected,
  );
  await page.getByRole('textbox', { name: 'Mensaje de prueba' }).fill('Hola');
  await page.getByRole('button', { name: 'Enviar mensaje' }).click();
  await expect(page.locator('.assistant-bubble')).toHaveCount(1);
  expect(requests[0].systemPrompt).toContain(
    `${expected}\n\nFECHA Y HORA ACTUAL\n`,
  );
  await page.reload();
  await page.getByRole('button', { name: 'Agente NotCo', exact: true }).click();
  await page
    .locator('.prompt-section summary')
    .filter({ hasText: /^\s*IDENTIDAD(?:\s|$)/ })
    .click();
  await expect(identity).toHaveValue('Identidad actualizada. Otra frase.');
  await page.locator('.revisions summary').click();
  await page.locator('.revisions button').last().click();
  await expect(identity).toHaveValue('Identidad temporal.');
  await expect(page.locator('.prompt-section')).toHaveCount(8);
});

for (const failure of ['invalid', 'network']) {
  test(`individual evaluation ${failure} preserves responses and continues without retrying`, async ({
    page,
  }) => {
    let count = 0;
    await page.route(chatEndpoint, async (route) => {
      count++;
      await route.fulfill(
        count === 9 && failure === 'network'
          ? { status: 502, json: { error: 'failed' } }
          : {
              json: {
                response:
                  count === 9
                    ? 'invalid JSON'
                    : count > 9
                      ? JSON.stringify({
                          results: [
                            {
                              id: String(count - 8),
                              verdict: 'pass',
                              reason: 'Cumple los criterios.',
                            },
                          ],
                        })
                      : `Respuesta ${count}`,
              },
            },
      );
    });
    await openAgent(page);
    await page.getByRole('button', { name: 'Batería de pruebas · 8' }).click();
    await page.getByRole('button', { name: 'Ejecutar pruebas' }).click();
    await expect(page.getByRole('alert')).toContainText(
      'No se pudieron evaluar algunas pruebas',
    );
    await expect(
      page.locator('.test-card .badge').filter({ hasText: 'No evaluable' }),
    ).toHaveCount(1);
    await expect(
      page.locator('.test-card .badge').filter({ hasText: /^Cumple$/ }),
    ).toHaveCount(7);
    await expect(page.locator('.test-response').first()).toHaveText(
      'Respuesta 1',
    );
    expect(count).toBe(16);
  });
}
