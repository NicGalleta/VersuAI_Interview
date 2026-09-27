import { test, expect } from '@playwright/test';

test('dashboard filters, account drawer and draft export work', async ({
  page,
}) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Resumen de cartera' }),
  ).toBeVisible();
  await expect(page.locator('tbody tr').first()).toBeVisible();
  await page.screenshot({ path: '/tmp/versu-desktop.png', fullPage: false });
  const name = await page.locator('.account-cell strong').first().textContent();
  await page.getByRole('textbox', { name: 'Buscar cliente' }).fill(name);
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await page.locator('.row-action').first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('dialog')).toContainText(name);
  await expect(page.locator('.message-draft')).toContainText(
    'Queremos revisar con ustedes la continuidad del agente.',
  );
  await expect(
    page.getByRole('heading', { name: 'Por qué revisar esta cuenta' }),
  ).toBeVisible();
  await expect(page.locator('.history-chart, .drawer-metrics')).toHaveCount(0);
  const downloading = page.waitForEvent('download');
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Descargar', exact: true })
    .click();
  const filename = (await downloading).suggestedFilename();
  expect(filename).toMatch(/-mensaje.txt$/);
  const clientId = filename.replace(/-mensaje.txt$/, '');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.locator('.account-cell').first().click();
  await page.getByRole('button', { name: `Ver Deep Dive de ${name}` }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(
    page.getByRole('combobox', { name: 'Cliente', exact: true }),
  ).toHaveValue(clientId);
  await expect(page.locator('.dd-context h2')).toHaveText(name);
  await page.getByRole('button', { name: 'Resumen', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'Buscar cliente' })
    .fill('no-such-client');
  await expect(
    page.getByRole('heading', { name: 'Sin resultados' }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test('CSV validation preserves previous data and accepts a private profile upload', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Fuentes de datos' }).click();
  await page.getByLabel('Cargar Uso mensual').setInputFiles({
    name: 'bad.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('cliente_id,cliente\n1,Prueba'),
  });
  await expect(page.getByRole('alert')).toContainText('Faltan columnas');
  await expect(page.getByText('606 filas')).toBeVisible();
  const profile =
    'cliente_id,cliente,rubro,pais,cms,plan_actual,fecha_checkout,ops_owner,estado,contacto_nombre,contacto_email,telefono\nVSU-0001,Prueba privada,mascotas,Chile,Shopify,Starter,2026-05-01,Ops 1,Activo,Persona Demo,demo@example.com,\n';
  await page.getByLabel('Cargar Ficha de clientes').setInputFiles({
    name: 'clientes.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(profile),
  });
  await expect(page.getByRole('status')).toContainText('1 filas cargadas');
  await page.getByRole('button', { name: 'Cartera de clientes' }).click();
  await page
    .getByRole('textbox', { name: 'Buscar cliente' })
    .fill('Prueba privada');
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await page.locator('.row-action').click();
  await expect(page.locator('.message-draft')).toContainText('Hola Persona');
  await page.reload();
  await page.getByRole('button', { name: 'Cartera de clientes' }).click();
  await expect(page.getByText('Vista de ejemplo')).toBeVisible();
  await expect(page.getByText('Prueba privada')).toHaveCount(0);
});

test('criteria recalculate and NotCo exports current prompt with all eight tests', async ({
  page,
}) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('versu-prompt'))
      localStorage.setItem('versu-prompt', 'Prompt de prueba');
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Reglas y criterios' }).click();
  const before = await page.locator('.impact-number').textContent();
  await page
    .getByRole('slider', { name: 'Inactividad del agente', exact: true })
    .fill('15');
  await page
    .getByRole('slider', { name: 'Atraso en el pago', exact: true })
    .fill('60');
  await expect(page.locator('.impact-number')).not.toHaveText(before);
  await page.getByRole('button', { name: 'Agente NotCo', exact: true }).click();
  await page.locator('.prompt-section summary').click();
  await page
    .getByRole('textbox', { name: 'Prompt de Nota' })
    .fill('PROMPT EDITADO PARA PRUEBA');
  await page.getByRole('button', { name: 'Guardar versión' }).click();
  await page.getByRole('button', { name: 'Batería de pruebas · 8' }).click();
  await expect(page.locator('.test-card')).toHaveCount(8);
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar batería' }).click();
  const download = await downloading;
  const stream = await download.createReadStream();
  let text = '';
  for await (const chunk of stream) text += chunk;
  const payload = JSON.parse(text);
  expect(payload.system).toBe('PROMPT EDITADO PARA PRUEBA');
  expect(payload.cases).toHaveLength(8);
  expect(payload.cases.every((c) => c.response === null)).toBe(true);
  await page.reload();
  await page.getByRole('button', { name: 'Agente NotCo', exact: true }).click();
  await page.locator('.prompt-section summary').click();
  await expect(
    page.getByRole('textbox', { name: 'Prompt de Nota' }),
  ).toHaveValue('PROMPT EDITADO PARA PRUEBA');
});

test('mobile layout stays within viewport and navigation remains available', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.screenshot({ path: '/tmp/versu-mobile.png', fullPage: false });
  await page.getByRole('button', { name: 'Agente NotCo', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Agente NotCo', exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
});

test('feature state survives page and tab changes without saving', async ({
  page,
}) => {
  const warnings = [];
  page.on('console', (message) => {
    if (message.type() === 'warning' || message.type() === 'error') {
      warnings.push(message.text());
    }
  });
  await page.addInitScript(() => {
    if (!localStorage.getItem('versu-prompt'))
      localStorage.setItem('versu-prompt', 'Prompt de prueba');
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Agente NotCo', exact: true }).click();
  await page.locator('.prompt-section summary').click();
  await page
    .getByRole('textbox', { name: 'Prompt de Nota' })
    .fill('Unsaved prompt');
  await page
    .getByRole('textbox', { name: 'Mensaje de prueba' })
    .fill('Unsaved query');
  await page.getByRole('button', { name: 'Batería de pruebas · 8' }).click();
  await page.getByRole('button', { name: 'Reglas y criterios' }).click();
  await page
    .getByRole('slider', { name: 'Inactividad del agente', exact: true })
    .fill('12');
  await page.getByRole('button', { name: 'Agente NotCo', exact: true }).click();
  await expect(page.locator('.test-card')).toHaveCount(8);
  await page.getByRole('button', { name: 'Prompt y conversación' }).click();
  await page.locator('.prompt-section summary').click();
  await expect(
    page.getByRole('textbox', { name: 'Prompt de Nota' }),
  ).toHaveValue('Unsaved prompt');
  await expect(
    page.getByRole('textbox', { name: 'Mensaje de prueba' }),
  ).toHaveValue('Unsaved query');
  await expect(
    page.getByRole('button', { name: 'Guardar versión' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Reglas y criterios' }).click();
  await expect(
    page.getByRole('slider', { name: 'Inactividad del agente', exact: true }),
  ).toHaveValue('12');
  expect(warnings.filter((message) => message.includes('ownership'))).toEqual(
    [],
  );
});
