import { test, expect } from '@playwright/test';
import {
  usageColumns,
  customerColumns,
} from '../../src/features/data-sources/csv/schema.js';

const csvFile = (columns, rows) => ({
  name: 'fixture.csv',
  mimeType: 'text/csv',
  buffer: Buffer.from(
    [
      columns.join(','),
      ...rows.map((row) => columns.map((key) => row[key] ?? '').join(',')),
    ].join('\n'),
  ),
});
const usage = [
  {
    cliente_id: 'A',
    cliente: 'Alfa',
    mes: '2026-07',
    plan: 'Starter',
    conversaciones: 10,
    seg_respuesta_agente: 2,
  },
  {
    cliente_id: 'B',
    cliente: 'Beta',
    mes: '2026-07',
    plan: 'Pro',
    conversaciones: 20,
    seg_respuesta_agente: 8,
  },
  {
    cliente_id: 'A',
    cliente: 'Alfa',
    mes: '2026-08',
    plan: 'Starter',
    conversaciones: 0,
  },
];

test('Deep Dive supports client history, sector sums and means, and upload changes', async ({
  page,
}) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Deep Dive', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Deep Dive', exact: true }),
  ).toBeVisible();
  await expect(page.locator('.dd-metric')).toHaveCount(21);
  await page.getByRole('button', { name: 'Rubro', exact: true }).click();
  await expect(
    page.getByText('Agrega rubros para ampliar el análisis'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Ir a fuentes de datos' }).click();
  await page
    .getByLabel('Cargar Uso mensual')
    .setInputFiles(csvFile(usageColumns, usage));
  await page.getByLabel('Cargar Ficha de clientes').setInputFiles(
    csvFile(customerColumns, [
      { cliente_id: 'A', cliente: 'Alfa', rubro: 'Retail', estado: 'Activo' },
      { cliente_id: 'B', cliente: 'Beta', rubro: 'Retail', estado: 'Inactivo' },
    ]),
  );
  await page.getByRole('button', { name: 'Deep Dive', exact: true }).click();
  await page.getByLabel('Mes de análisis').selectOption('2026-07');
  await expect(page.locator('.dd-context')).toContainText(
    '2 de 2 clientes con registro',
  );
  await expect(
    page.locator('.dd-metric').filter({ hasText: /^Conversaciones/ }),
  ).toContainText('30');
  await expect(
    page.locator('.dd-metric').filter({ hasText: /^Respuesta del agente/ }),
  ).toContainText('5 s');
  await page
    .getByRole('combobox', { name: 'Métrica', exact: true })
    .selectOption('seg_respuesta_agente');
  await expect(
    page.getByRole('heading', { name: 'Respuesta del agente', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Resumen', exact: true }).click();
  await page.getByRole('button', { name: 'Deep Dive', exact: true }).click();
  await expect(page.getByLabel('Mes de análisis')).toHaveValue('2026-07');
  await expect(
    page.getByRole('combobox', { name: 'Métrica', exact: true }),
  ).toHaveValue('seg_respuesta_agente');
  await page.getByLabel('Mes de análisis').selectOption('2026-08');
  await expect(page.locator('.dd-context')).toContainText(
    '1 de 2 clientes con registro',
  );
  await expect(
    page.locator('.dd-metric').filter({ hasText: /^Respuesta del agente/ }),
  ).toContainText('Sin dato');
  await expect(
    page.locator('.dd-metric').filter({ hasText: /^Conversaciones/ }),
  ).toContainText('1/2 con dato');
  await page.getByRole('button', { name: 'Cliente', exact: true }).click();
  await page
    .getByRole('combobox', { name: 'Cliente', exact: true })
    .selectOption('B');
  await expect(page.locator('.deep-dive').getByRole('status')).toContainText(
    'No hay registros',
  );
  await page.getByRole('button', { name: 'Fuentes de datos' }).click();
  await page.getByLabel('Cargar Uso mensual').setInputFiles(
    csvFile(usageColumns, [
      {
        cliente_id: 'C',
        cliente: 'Gamma',
        mes: '2026-09',
        plan: 'Max',
        conversaciones: 42,
      },
    ]),
  );
  await page.getByRole('button', { name: 'Deep Dive', exact: true }).click();
  await expect(
    page.getByRole('combobox', { name: 'Cliente', exact: true }),
  ).toHaveValue('C');
  await expect(page.getByLabel('Mes de análisis')).toHaveValue('2026-09');
  expect(errors).toEqual([]);
});

test('Deep Dive remains usable on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Deep Dive', exact: true }).click();
  await expect(page.getByLabel('Mes de análisis')).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.screenshot({
    path: '/tmp/versu-deep-dive-mobile.png',
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.screenshot({
    path: '/tmp/versu-deep-dive-desktop.png',
    fullPage: true,
  });
});
