import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzeAdvanced,
  advancedCharts,
  advancedSeries,
  ratio,
} from '../../src/features/deep-dive/domain/advanced.js';

const row = (mes, extra = {}) => ({
  cliente_id: 'A',
  cliente: 'Alfa',
  mes,
  dias_agente_inactivo: 0,
  errores_integracion: 0,
  mensajes_no_entregados: 0,
  sesiones_panel: 10,
  dias_activos_panel: 8,
  usuarios_activos_panel: 4,
  usuarios_cuenta: 5,
  cambios_configuracion: 1,
  conversaciones: 20,
  dias_pago_atrasado: 0,
  derivadas_a_humano: 10,
  derivadas_sin_respuesta: 0,
  horas_respuesta_equipo: 2,
  tickets_reabiertos: 0,
  ...extra,
});
const profile = {
  cliente_id: 'A',
  cliente: 'Alfa',
  fecha_checkout: '2026-05-01',
  estado: 'Activo',
};
const evaluate = (
  usage,
  {
    customers = [profile],
    ids = ['A'],
    month = '2026-08',
    latest = '2026-09',
    rules = {},
    settings,
  } = {},
) => analyzeAdvanced(usage, customers, ids, month, latest, rules, settings);
const absent = {
  sesiones_panel: 0,
  dias_activos_panel: 0,
  usuarios_activos_panel: 0,
};

test('service takes precedence over adoption and activation, including a partial month', () => {
  const data = [
    row('2026-06'),
    row('2026-07', absent),
    row('2026-08', absent),
    row('2026-09', { dias_agente_inactivo: 9 }),
  ];
  const result = evaluate(data, { month: '2026-09' });
  assert.equal(result.main, 'service');
  assert.equal(result.accounts[0].signals.service.severity, 3);
  assert.equal(result.accounts[0].signals.engagement.affected, true);
  assert.equal(result.end, '2026-08');
});

test('each service signal can confirm an incident but missing data cannot prove health', () => {
  for (const extra of [
    { dias_agente_inactivo: 3 },
    { errores_integracion: 5 },
    { mensajes_no_entregados: 10 },
  ]) {
    assert.equal(
      evaluate([row('2026-08', extra)]).accounts[0].signals.service.affected,
      true,
    );
  }
  assert.equal(
    evaluate([row('2026-08', { errores_integracion: null })]).accounts[0]
      .signals.service.affected,
    null,
  );
  assert.equal(
    evaluate([
      row('2026-08', { errores_integracion: null, dias_agente_inactivo: 3 }),
    ]).accounts[0].signals.service.affected,
    true,
  );
  assert.equal(
    evaluate([row('2026-08')]).accounts[0].signals.service.affected,
    false,
  );
  assert.equal(evaluate([]).accounts[0].signals.service.affected, null);
});

test('detects sustained participation decline across two intervals and two indicators', () => {
  const data = [
    row('2026-06', { sesiones_panel: 20, dias_activos_panel: 10 }),
    row('2026-07', { sesiones_panel: 12, dias_activos_panel: 7 }),
    row('2026-08', { sesiones_panel: 8, dias_activos_panel: 4 }),
  ];
  assert.equal(evaluate(data).accounts[0].signals.engagement.affected, true);
  assert.equal(
    evaluate(data, { settings: { engagementDrop: 70 } }).accounts[0].signals
      .engagement.affected,
    false,
  );
  assert.equal(
    evaluate([
      data[0],
      row('2026-07', { sesiones_panel: 22, dias_activos_panel: 12 }),
      data[2],
    ]).accounts[0].signals.engagement.affected,
    false,
  );
});

test('two zero participation months suffice; partial periods and gaps cannot establish disengagement', () => {
  assert.equal(
    evaluate([row('2026-07', absent), row('2026-08', absent)]).accounts[0]
      .signals.engagement.affected,
    true,
  );
  assert.equal(
    evaluate([row('2026-06', absent), row('2026-08', absent)]).accounts[0]
      .signals.engagement.affected,
    null,
  );
  const data = [row('2026-07'), row('2026-08'), row('2026-09', absent)];
  assert.equal(
    evaluate(data, { month: '2026-09' }).accounts[0].signals.engagement
      .affected,
    null,
  );
});

test('conversation seasonality and no configuration changes alone do not signal disengagement', () => {
  const data = [
    row('2026-06', { conversaciones: 100, cambios_configuracion: 0 }),
    row('2026-07', { conversaciones: 20, cambios_configuracion: 0 }),
    row('2026-08', { conversaciones: 0, cambios_configuracion: 0 }),
  ];
  assert.equal(evaluate(data).accounts[0].signals.engagement.affected, false);
});

test('activation requires active profile, valid checkout date and two complete post-checkout months', () => {
  const data = [row('2026-06'), row('2026-07'), row('2026-08')];
  assert.equal(evaluate(data).accounts[0].signals.activation.affected, null); // >120 days by August 31
  const recent = { ...profile, fecha_checkout: '2026-06-01' };
  assert.equal(
    evaluate(data, { customers: [recent] }).accounts[0].signals.activation
      .affected,
    true,
  );
  for (const date of ['', '2026-02-30', '2026-07-15', '2026-09-01']) {
    assert.equal(
      evaluate(data, { customers: [{ ...recent, fecha_checkout: date }] })
        .accounts[0].signals.activation.affected,
      null,
    );
  }
  assert.equal(
    evaluate(data, { customers: [] }).accounts[0].signals.activation.affected,
    null,
  );
  assert.equal(
    evaluate(data, { customers: [{ ...recent, estado: 'Implementación' }] })
      .accounts[0].signals.activation.affected,
    null,
  );
  assert.equal(
    evaluate(data, { customers: [{ ...recent, estado: 'Inactivo' }] })
      .accounts[0].signals.activation.affected,
    null,
  );
});

test('activation respects low-use rule, missing values and completed-month setting', () => {
  const customers = [{ ...profile, fecha_checkout: '2026-07-01' }];
  const data = [row('2026-07'), row('2026-08'), row('2026-09')];
  assert.equal(
    evaluate(data, { customers, month: '2026-09' }).accounts[0].signals
      .activation.affected,
    true,
  );
  assert.equal(
    evaluate(data, { customers, month: '2026-09', rules: { lowUsage: 10 } })
      .accounts[0].signals.activation.affected,
    false,
  );
  assert.equal(
    evaluate([data[0], row('2026-08', { conversaciones: null }), data[2]], {
      customers,
      month: '2026-09',
    }).accounts[0].signals.activation.affected,
    null,
  );
  const completed = evaluate(data, {
    customers,
    month: '2026-09',
    rules: { partial: false },
  });
  assert.equal(completed.end, '2026-09');
  assert.equal(completed.accounts[0].signals.activation.affected, true);
});

test('context enriches primary reasons without creating independent alerts', () => {
  const data = [
    row('2026-06'),
    row('2026-07'),
    row('2026-08', {
      dias_pago_atrasado: 20,
      derivadas_sin_respuesta: 4,
      horas_respuesta_equipo: 30,
      tickets_reabiertos: 4,
    }),
  ];
  const result = evaluate(data);
  assert.equal(result.main, null);
  assert.equal(result.accounts[0].elevated, 4);
  assert.equal(
    result.accounts[0].factors.find((item) => item.id === 'handoff').value,
    40,
  );
  assert.equal(ratio(0, 0), null);
  assert.equal(ratio(null, 10), null);
  assert.equal(ratio(11, 10), null);
  assert.equal(ratio(0, 10), 0);
});

test('sector diagnostics count affected clients rather than dilute incidents in means', () => {
  const data = [
    row('2026-08', { dias_agente_inactivo: 9 }),
    row('2026-08', { cliente_id: 'B' }),
    row('2026-08', { cliente_id: 'C', errores_integracion: null }),
  ];
  const result = evaluate(data, { ids: ['A', 'B', 'C', 'D'] });
  assert.deepEqual(
    result.groups.find((group) => group.id === 'service'),
    {
      id: 'service',
      label: 'Continuidad del servicio',
      affected: 1,
      evaluated: 2,
      expected: 4,
    },
  );
  assert.equal(result.accounts[0].id, 'A');
});

test('future rows do not affect historical diagnoses and additional context only breaks ties', () => {
  const data = [
    row('2026-08', { dias_agente_inactivo: 3 }),
    row('2026-08', {
      cliente_id: 'B',
      dias_agente_inactivo: 3,
      dias_pago_atrasado: 20,
    }),
    row('2026-09', { errores_integracion: 99 }),
  ];
  const result = evaluate(data, { ids: ['A', 'B'] });
  assert.equal(result.accounts[0].id, 'B');
  assert.ok(
    result.accounts
      .find((item) => item.id === 'A')
      .signals.service.evidence.includes('0 errores de integración'),
  );
});

test('trend charts preserve zeros, leave missing months as gaps and exclude partial adoption', () => {
  const data = [
    row('2026-06', { sesiones_panel: 0 }),
    row('2026-08'),
    row('2026-09', { sesiones_panel: 1 }),
  ];
  const series = advancedSeries(
    data,
    ['A'],
    '2026-09',
    '2026-09',
    true,
    advancedCharts.engagement[0],
    true,
  );
  assert.deepEqual(
    series.map((point) => point.value),
    [0, null, 10, null],
  );
  assert.equal(series.at(-1).excluded, true);
  const technical = advancedSeries(
    data,
    ['A'],
    '2026-09',
    '2026-09',
    true,
    advancedCharts.service[0],
  );
  assert.equal(technical.at(-1).value, 0);
  assert.equal(technical.at(-1).partial, true);
});

test('sector participation is a ratio of valid paired sums, not an average of percentages', () => {
  const data = [
    row('2026-08', { usuarios_activos_panel: 1, usuarios_cuenta: 2 }),
    row('2026-08', {
      cliente_id: 'B',
      usuarios_activos_panel: 1,
      usuarios_cuenta: 8,
    }),
    row('2026-08', { cliente_id: 'C', usuarios_cuenta: null }),
  ];
  const [point] = advancedSeries(
    data,
    ['A', 'B', 'C'],
    '2026-08',
    '2026-09',
    true,
    advancedCharts.engagement[3],
  );
  assert.equal(point.value, 20);
  assert.equal(point.count, 2);
  assert.equal(point.expected, 3);
});
