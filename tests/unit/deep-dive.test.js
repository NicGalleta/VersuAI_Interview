import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildEntities,
  monthlySeries,
} from '../../src/features/deep-dive/domain/analyze.js';
import { metrics } from '../../src/features/deep-dive/domain/metrics.js';
import {
  usageColumns,
  textColumns,
} from '../../src/features/data-sources/csv/schema.js';

test('every numeric usage column has a metric definition', () => {
  assert.deepEqual(
    metrics.map((metric) => metric.id).sort(),
    usageColumns.filter((column) => !textColumns.has(column)).sort(),
  );
});

test('joins sectors by ID, normalizes labels, and includes historical and inactive clients', () => {
  const usage = [
    { cliente_id: 'A', cliente: 'Actual', mes: '2026-08' },
    { cliente_id: 'A', cliente: 'Anterior', mes: '2026-07' },
    { cliente_id: 'B', cliente: 'Segundo', mes: '2026-07' },
    { cliente_id: 'C', cliente: 'Sin ficha', mes: '2026-08' },
  ];
  const customers = [
    {
      cliente_id: 'A',
      cliente: 'Ficha actual',
      rubro: ' Óptica ',
      estado: 'Inactivo',
    },
    { cliente_id: 'B', rubro: 'optica' },
    { cliente_id: 'D', rubro: 'Otro' },
  ];
  const { clients, sectors } = buildEntities(usage, customers);
  assert.equal(clients.length, 3);
  assert.equal(
    clients.find((client) => client.id === 'A').label,
    'Ficha actual',
  );
  assert.equal(sectors.length, 1);
  assert.deepEqual(sectors[0].ids.sort(), ['A', 'B']);
  assert.equal(buildEntities(usage, []).sectors.length, 0);
});

test('monthly sums distinguish zero, missing values, missing rows and unrelated clients', () => {
  const metric = metrics.find((item) => item.id === 'conversaciones');
  const usage = [
    { cliente_id: 'A', mes: '2026-07', conversaciones: 10 },
    { cliente_id: 'B', mes: '2026-07', conversaciones: 20 },
    { cliente_id: 'C', mes: '2026-07', conversaciones: 999 },
    { cliente_id: 'A', mes: '2026-08', conversaciones: 0 },
    { cliente_id: 'B', mes: '2026-08', conversaciones: null },
  ];
  const series = monthlySeries(
    usage,
    ['A', 'B'],
    ['2026-07', '2026-08', '2026-09'],
    metric,
  );
  assert.deepEqual(
    series.map(({ value, count, expected }) => ({ value, count, expected })),
    [
      { value: 30, count: 2, expected: 2 },
      { value: 0, count: 1, expected: 2 },
      { value: null, count: 0, expected: 2 },
    ],
  );
});

test('averages use only known values, with equal weight per client', () => {
  const metric = metrics.find((item) => item.id === 'seg_respuesta_agente');
  assert.deepEqual(
    metric.calculate([
      { seg_respuesta_agente: 2, conversaciones: 100 },
      { seg_respuesta_agente: 8, conversaciones: 1 },
      { seg_respuesta_agente: null },
    ]),
    { value: 5, count: 2 },
  );
  assert.deepEqual(metric.calculate([]), { value: null, count: 0 });
});
