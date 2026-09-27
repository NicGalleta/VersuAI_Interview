import { test, expect } from '@playwright/test';
import { chatEndpoint } from '../../src/features/notco/chat.js';

async function openAgent(page) {
  await page.addInitScript(() =>
    localStorage.setItem('versu-prompt', 'Prompt de prueba'),
  );
  await page.goto('/');
  await page.getByRole('button', { name: 'Agente NotCo', exact: true }).click();
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
    page.locator('.test-card .badge').filter({ hasText: 'Revisar' }),
  ).toHaveCount(7);
  await expect(
    page.locator('.test-card .badge').filter({ hasText: 'Error' }),
  ).toHaveCount(1);
  expect(requests).toHaveLength(8);
  expect(
    requests.every(
      (r) =>
        r.messages.length === 1 &&
        r.systemPrompt.startsWith('Prompt de prueba\n\nFECHA Y HORA ACTUAL\n'),
    ),
  ).toBe(true);
  await page.getByRole('button', { name: 'Prompt y conversación' }).click();
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
});

