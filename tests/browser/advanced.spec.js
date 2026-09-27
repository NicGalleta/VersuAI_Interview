import { test, expect } from '@playwright/test';
import {
  usageColumns,
  customerColumns,
  textColumns,
} from '../../src/features/data-sources/csv/schema.js';
const file = (columns, rows) => ({
  name: 'fixture.csv',
  mimeType: 'text/csv',
  buffer: Buffer.from(
    [
      columns.join(','),
      ...rows.map((row) => columns.map((key) => row[key] ?? '').join(',')),
    ].join('\n'),
  ),
});
const usage = ['2026-06', '2026-07', '2026-08', '2026-09'].flatMap((mes) =>
  ['A', 'B'].map((id) => ({
    ...Object.fromEntries(
      usageColumns.map((key) => [key, textColumns.has(key) ? '' : 0]),
    ),
    cliente_id: id,
    cliente: id === 'A' ? 'Alfa' : 'Beta',
    mes,
    plan: 'Starter',
    conversaciones: id === 'A' ? 10 : 200,
    sesiones_panel: id === 'A' && mes > '2026-06' ? 0 : 20,
    dias_activos_panel: id === 'A' && mes > '2026-06' ? 0 : 10,
    usuarios_activos_panel: id === 'A' && mes > '2026-06' ? 0 : 3,
    usuarios_cuenta: 4,
    dias_agente_inactivo: id === 'A' && mes === '2026-09' ? 3 : 0,
    errores_integracion: id === 'A' && mes === '2026-08' ? 6 : 0,
    derivadas_a_humano: 10,
    derivadas_sin_respuesta: id === 'A' ? 4 : 0,
  })),
);
const profiles = ['A', 'B'].map((id) => ({
  cliente_id: id,
  cliente: id === 'A' ? 'Alfa' : 'Beta',
  rubro: 'Retail',
  fecha_checkout: '2026-06-01',
  estado: 'Activo',
}));

async function load(page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Fuentes de datos' }).click();
  await page
    .getByLabel('Cargar Uso mensual')
    .setInputFiles(file(usageColumns, usage));
  await page
    .getByLabel('Cargar Ficha de clientes')
    .setInputFiles(file(customerColumns, profiles));
  await page.getByRole('button', { name: 'Deep Dive', exact: true }).click();
}

test('advanced analysis prioritizes service, explains adoption and activation, and reacts to criteria', async ({
  page,
}) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await load(page);
  const advanced = page.getByRole('combobox', {
    name: 'Análisis avanzado',
    exact: true,
  });
  await advanced.selectOption('overview');
  await expect(page.locator('.advanced-priority')).toContainText(
    'PRIORIDAD MÁXIMA',
  );
  await expect(
    page
      .locator('.advanced-card')
      .filter({ hasText: 'Desenganche del cliente' }),
  ).toContainText('Dos meses sin participación');
  await expect(
    page.locator('.advanced-card').filter({ hasText: 'Activación inicial' }),
  ).toContainText('Actividad inicial estancada');
  await expect(page.locator('.advanced-factors')).toContainText('40 %');
  await advanced.selectOption('engagement');
  await expect(page.locator('.advanced-chart')).toHaveCount(4);
  await page
    .getByText('Ver datos de sesiones en el panel', { exact: true })
    .click();
  await expect(page.locator('.advanced-chart').first()).toContainText(
    'Parcial · excluido',
  );
  await advanced.selectOption('service');
  await page.getByLabel('Mes de análisis').selectOption('2026-08');
  await expect(page.locator('.advanced-card')).toContainText(
    'Revisión inmediata',
  );
  await page
    .getByText('Criterios y umbrales de este análisis', { exact: true })
    .click();
  await page.getByRole('slider', { name: 'Errores de integración' }).fill('10');
  await expect(page.locator('.advanced-card')).toContainText(
    'Incidentes bajo umbral',
  );
  await expect(page.locator('.advanced-priority')).toContainText('desenganche');
  await page.getByRole('button', { name: 'Resumen', exact: true }).click();
  await page.getByRole('button', { name: 'Deep Dive', exact: true }).click();
  await expect(advanced).toHaveValue('service');
  await page
    .getByRole('combobox', { name: 'Métrica', exact: true })
    .selectOption('conversaciones');
  await expect(page.locator('.advanced-analysis')).toHaveCount(0);
  await expect(
    page.getByRole('heading', { name: 'Conversaciones', exact: true }).first(),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test('sector panorama counts incidents per account and fits mobile', async ({
  page,
}) => {
  await load(page);
  await page.getByRole('button', { name: 'Rubro', exact: true }).click();
  await page
    .getByRole('combobox', { name: 'Análisis avanzado', exact: true })
    .selectOption('overview');
  await expect(
    page.getByRole('heading', { name: 'Panorama del rubro', exact: true }),
  ).toBeVisible();
  await expect(
    page
      .locator('.advanced-card')
      .filter({ hasText: 'Continuidad del servicio' }),
  ).toContainText('1 de 2 evaluables');
  await page
    .getByText('Ver diagnóstico de las 2 cuentas del rubro', { exact: true })
    .click();
  await expect(page.locator('.advanced-accounts tbody tr')).toHaveCount(2);
  await expect(
    page.locator('.advanced-accounts tbody tr').first(),
  ).toContainText('Alfa');
  await page.screenshot({
    path: '/tmp/versu-advanced-desktop.png',
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.getByRole('button', { name: 'Cliente', exact: true }).click();
  await page.screenshot({
    path: '/tmp/versu-advanced-mobile.png',
    fullPage: true,
  });
});

test('missing profiles leave activation unknown and ordinary metrics stay available', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Deep Dive', exact: true }).click();
  await page
    .getByRole('combobox', { name: 'Análisis avanzado', exact: true })
    .selectOption('activation');
  await expect(page.locator('.advanced-card')).toContainText(
    'Falta fecha de checkout válida',
  );
  await page
    .locator('button.dd-metric')
    .filter({ hasText: /^Conversaciones/ })
    .click();
  await expect(page.locator('.advanced-analysis')).toHaveCount(0);
  await expect(
    page.getByRole('combobox', { name: 'Métrica', exact: true }),
  ).toHaveValue('conversaciones');
});
