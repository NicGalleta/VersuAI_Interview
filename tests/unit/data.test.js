import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseCSV } from '../../src/features/data-sources/csv/parseCSV.js';
import { usageColumns } from '../../src/features/data-sources/csv/schema.js';
import { analyze } from '../../src/features/portfolio/domain/analyze.js';
import { defaults } from '../../src/features/rules/defaults.js';
import { exportQueue } from '../../src/features/portfolio/domain/exportQueue.js';
const csv = readFileSync(
  new URL('../../datos/uso_mensual.csv', import.meta.url),
  'utf8',
);
const base = {
  cliente_id: 'VSU-1',
  cliente: 'Prueba',
  plan: 'Starter',
  mrr_usd: 149,
  sesiones_panel: 10,
  conversaciones: 500,
  dias_agente_inactivo: 0,
  dias_pago_atrasado: 0,
};
const row = (mes, extra = {}) => ({ ...base, mes, ...extra });
test('reads original data and rejects missing headers, empty files, and duplicate keys', () => {
  const data = parseCSV(csv, 'usage');
  assert.equal(data.rows.length, 606);
  assert.throws(
    () => parseCSV('cliente_id,cliente\n1,a', 'usage'),
    /Faltan columnas/,
  );
  assert.throws(() => parseCSV(usageColumns.join(','), 'usage'), /vacío/);
  const lines = csv.trim().split(/\r?\n/);
  assert.throws(
    () => parseCSV([lines[0], lines[1], lines[1]].join('\n'), 'usage'),
    /duplicado/,
  );
});
test('keeps missing values unknown instead of creating false zero-adoption alarms', () => {
  const accounts = analyze(
    [
      row('2026-07', { sesiones_panel: null }),
      row('2026-08', { sesiones_panel: 0 }),
      row('2026-09'),
    ],
    [],
  );
  assert.equal(
    accounts[0].signals.some((s) => s.label === 'Baja adopción'),
    false,
  );
});
test('ignores partial month volume but prioritizes current downtime', () => {
  const [account] = analyze(
    [
      row('2026-07'),
      row('2026-08'),
      row('2026-09', { conversaciones: 2, dias_agente_inactivo: 9 }),
    ],
    [],
  );
  assert.equal(account.signals[0].kind, 'critical');
  assert.equal(account.opportunity, 150);
});
test('requires consecutive months and unchanged plan for expansion', () => {
  assert.equal(
    analyze([row('2026-06'), row('2026-08'), row('2026-09')], [])[0]
      .opportunity,
    0,
  );
  assert.equal(
    analyze(
      [
        row('2026-07'),
        row('2026-08', { plan: 'Pro' }),
        row('2026-09', { plan: 'Pro' }),
      ],
      [],
    )[0].opportunity,
    0,
  );
});
test('excludes implementation and stale accounts from priorities', () => {
  const data = [
    row('2026-08', { dias_agente_inactivo: 10 }),
    row('2026-09', { cliente_id: 'VSU-2', dias_agente_inactivo: 10 }),
  ];
  const accounts = analyze(data, [
    { cliente_id: 'VSU-2', estado: 'En implementación' },
  ]);
  assert.equal(accounts.flatMap((a) => a.signals).length, 0);
});
test('editable rules recalculate priorities and CSV export escapes formula injection', () => {
  const data = [
    row('2026-09', { cliente: '=HYPERLINK("x")', dias_agente_inactivo: 4 }),
  ];
  const accounts = analyze(data, []);
  assert.equal(accounts[0].signals.length, 1);
  assert.equal(
    analyze(data, [], { ...defaults, inactivity: 5 })[0].signals.length,
    0,
  );
  assert.ok(exportQueue(accounts).includes("'=HYPERLINK"));
});
