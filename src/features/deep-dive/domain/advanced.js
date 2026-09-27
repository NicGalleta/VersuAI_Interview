import { normalize } from '../../../shared/utils/normalize.js';
import { defaults } from '../../rules/defaults.js';

export const advancedViews = [
  { id: 'overview', label: 'Panorama del cliente' },
  { id: 'service', label: 'Continuidad del servicio' },
  { id: 'engagement', label: 'Desenganche del cliente' },
  { id: 'activation', label: 'Activación inicial' },
];

export const advancedDefaults = {
  integrationErrors: 5,
  undelivered: 10,
  engagementDrop: 50,
  unansweredRate: 20,
  teamHours: 24,
  reopened: 3,
};

export const advancedControls = [
  {
    key: 'integrationErrors',
    label: 'Errores de integración',
    min: 1,
    max: 50,
    unit: 'errores',
  },
  {
    key: 'undelivered',
    label: 'Mensajes no entregados',
    min: 1,
    max: 100,
    unit: 'mensajes',
  },
  {
    key: 'engagementDrop',
    label: 'Caída sostenida del panel',
    min: 10,
    max: 100,
    unit: '%',
  },
  {
    key: 'unansweredRate',
    label: 'Derivaciones sin respuesta',
    min: 1,
    max: 100,
    unit: '%',
  },
  {
    key: 'teamHours',
    label: 'Respuesta del equipo',
    min: 1,
    max: 72,
    unit: 'horas',
  },
  {
    key: 'reopened',
    label: 'Tickets reabiertos',
    min: 1,
    max: 20,
    unit: 'tickets',
  },
];

export function offsetMonth(month, offset) {
  const date = new Date(`${month}-01T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + offset);
  return date.toISOString().slice(0, 7);
}
const known = (value) => Number.isFinite(value);
const display = (value) =>
  known(value)
    ? new Intl.NumberFormat('es-CL', { maximumFractionDigits: 1 }).format(value)
    : 'sin dato';
export function ratio(numerator, denominator) {
  return known(numerator) &&
    known(denominator) &&
    denominator > 0 &&
    numerator <= denominator
    ? (numerator / denominator) * 100
    : null;
}
const result = (affected, label, evidence, severity = 0) => ({
  affected,
  label,
  evidence,
  severity,
});

function service(row, rules, settings) {
  const fields = [
    ['dias_agente_inactivo', 'días inactivo', rules.inactivity],
    [
      'errores_integracion',
      'errores de integración',
      settings.integrationErrors,
    ],
    ['mensajes_no_entregados', 'mensajes no entregados', settings.undelivered],
  ];
  const evidence = fields.map(
    ([key, label]) => `${display(row?.[key])} ${label}`,
  );
  const exceeded = fields.some(
    ([key, , limit]) => known(row?.[key]) && row[key] >= limit,
  );
  if (exceeded) return result(true, 'Revisión inmediata', evidence, 3);
  if (!fields.every(([key]) => known(row?.[key])))
    return result(null, 'Datos incompletos', evidence);
  return result(
    false,
    fields.some(([key]) => row[key] > 0)
      ? 'Incidentes bajo umbral'
      : 'Sin incidentes registrados',
    evidence,
  );
}

const panelFields = [
  ['sesiones_panel', 'sesiones'],
  ['dias_activos_panel', 'días de uso'],
  ['usuarios_activos_panel', 'usuarios activos'],
];
function engagement(rows, end, settings) {
  const window = [-2, -1, 0].map((offset) =>
    rows.get(offsetMonth(end, offset)),
  );
  const pair = window.slice(1);
  const pairKnown = pair.every((row) =>
    panelFields.every(([key]) => known(row?.[key])),
  );
  const absent =
    pairKnown &&
    pair.every((row) => panelFields.every(([key]) => row[key] === 0));
  const allKnown = window.every((row) =>
    panelFields.every(([key]) => known(row?.[key])),
  );
  const falling = panelFields.filter(([key]) => {
    const [a, b, c] = window.map((row) => row?.[key]);
    return (
      [a, b, c].every(known) &&
      a > b &&
      b > c &&
      ((a - c) / a) * 100 >= settings.engagementDrop
    );
  });
  const evidence = panelFields.map(
    ([key, label]) =>
      `${label}: ${window.map((row) => display(row?.[key])).join(' → ')}`,
  );
  evidence.push(
    `Cambios de configuración: ${window.map((row) => display(row?.cambios_configuracion)).join(' → ')} (solo contexto)`,
  );
  if (absent) return result(true, 'Dos meses sin participación', evidence, 2);
  if (falling.length >= 2)
    return result(
      true,
      `Caída sostenida en ${falling.length} indicadores`,
      evidence,
      2,
    );
  if (!allKnown) return result(null, 'Historial insuficiente', evidence);
  return result(false, 'Sin caída sostenida detectada', evidence);
}

function checkoutDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? '')) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(+date) && date.toISOString().slice(0, 10) === value
    ? date
    : null;
}
function activation(rows, profile, month, end, partial, rules) {
  const checkout = checkoutDate(profile?.fecha_checkout);
  if (!checkout)
    return result(null, 'Falta fecha de checkout válida', [
      'Carga la ficha del cliente para evaluar su antigüedad.',
    ]);
  if (normalize(profile.estado) !== 'activo')
    return result(null, 'Fuera de evaluación', [
      'La ficha debe indicar estado Activo; no se asume que una cuenta en implementación ya esté operativa.',
    ]);
  const cut = partial
    ? new Date(`${month}-21T00:00:00Z`)
    : new Date(`${offsetMonth(month, 1)}-01T00:00:00Z`);
  if (!partial) cut.setUTCDate(0);
  const age = Math.floor((+cut - +checkout) / 86400000);
  if (age < 30 || age > 120)
    return result(null, 'Fuera de ventana inicial', [
      `${age} días desde checkout; se evalúan entre 30 y 120 días.`,
    ]);
  const months = [offsetMonth(end, -1), end];
  // Only calendar months fully after checkout qualify; no comparison with an
  // incomplete implementation month or a partial export.
  if (months.some((period) => `${period}-01` < profile.fecha_checkout)) {
    return result(null, 'Aún sin dos meses completos', [
      `${age} días desde checkout; faltan meses completos posteriores a esa fecha.`,
    ]);
  }
  const values = months.map((period) => rows.get(period)?.conversaciones);
  const evidence = [
    `${age} días desde checkout`,
    `${values.map(display).join(' → ')} conversaciones en ${months.join(' y ')}`,
  ];
  if (!values.every(known))
    return result(null, 'Historial insuficiente', evidence);
  const low = values.every((value) => value <= rules.lowUsage);
  return result(
    low,
    low ? 'Actividad inicial estancada' : 'Actividad sobre el umbral inicial',
    evidence,
    low ? 1 : 0,
  );
}

function context(row, rules, settings) {
  const handoff = ratio(row?.derivadas_sin_respuesta, row?.derivadas_a_humano);
  return [
    {
      id: 'late',
      label: 'Pago atrasado',
      value: row?.dias_pago_atrasado ?? null,
      unit: 'días',
      limit: rules.late,
    },
    {
      id: 'handoff',
      label: 'Derivaciones sin respuesta',
      value: handoff,
      unit: '%',
      limit: settings.unansweredRate,
    },
    {
      id: 'response',
      label: 'Respuesta del equipo',
      value: row?.horas_respuesta_equipo ?? null,
      unit: 'h',
      limit: settings.teamHours,
    },
    {
      id: 'reopened',
      label: 'Tickets reabiertos',
      value: row?.tickets_reabiertos ?? null,
      unit: 'tickets',
      limit: settings.reopened,
    },
  ].map((item) => ({
    ...item,
    elevated: known(item.value) && item.value >= item.limit,
  }));
}

export function analyzeAdvanced(
  usage,
  customers,
  ids,
  month,
  latest,
  rules = defaults,
  settings = advancedDefaults,
) {
  if (!month)
    return {
      accounts: [],
      groups: [],
      context: [],
      end: '',
      partial: false,
      main: null,
    };
  const config = { ...advancedDefaults, ...settings };
  const criteria = { ...defaults, ...rules };
  const partial = criteria.partial && month === latest;
  const end = partial ? offsetMonth(month, -1) : month;
  const selected = new Set(ids);
  const histories = new Map(ids.map((id) => [id, new Map()]));
  for (const row of usage)
    if (selected.has(row.cliente_id) && row.mes <= month)
      histories.get(row.cliente_id).set(row.mes, row);
  const profiles = new Map(
    customers.map((profile) => [profile.cliente_id, profile]),
  );
  const accounts = ids
    .map((id) => {
      const rows = histories.get(id);
      const row = rows.get(month);
      const signals = {
        service: service(row, criteria, config),
        engagement: engagement(rows, end, config),
        activation: activation(
          rows,
          profiles.get(id),
          month,
          end,
          partial,
          criteria,
        ),
      };
      const factors = context(row, criteria, config);
      const primary = Object.entries(signals)
        .filter(([, signal]) => signal.affected)
        .sort((a, b) => b[1].severity - a[1].severity)[0];
      return {
        id,
        name:
          profiles.get(id)?.cliente ||
          row?.cliente ||
          [...rows.values()].at(-1)?.cliente ||
          id,
        signals,
        factors,
        primary: primary?.[0] ?? null,
        severity: primary?.[1].severity ?? 0,
        elevated: factors.filter((item) => item.elevated).length,
      };
    })
    .sort(
      (a, b) =>
        b.severity - a.severity ||
        b.elevated - a.elevated ||
        a.name.localeCompare(b.name, 'es'),
    );
  const groups = advancedViews.slice(1).map((definition) => {
    const evaluated = accounts.filter(
      (account) => account.signals[definition.id].affected !== null,
    );
    const affected = evaluated.filter(
      (account) => account.signals[definition.id].affected,
    );
    return {
      ...definition,
      affected: affected.length,
      evaluated: evaluated.length,
      expected: ids.length,
    };
  });
  const factors = ['late', 'handoff', 'response', 'reopened'].map((id) => {
    const items = accounts.map((account) =>
      account.factors.find((factor) => factor.id === id),
    );
    return {
      ...items[0],
      id,
      elevatedCount: items.filter((item) => item.elevated).length,
      evaluated: items.filter((item) => known(item.value)).length,
      expected: ids.length,
    };
  });
  return {
    accounts,
    groups,
    context: factors,
    end,
    partial,
    main: accounts.find((account) => account.primary)?.primary ?? null,
  };
}

// Charts retain their own units; never add days, people and errors into a score.
export const advancedCharts = {
  service: [
    {
      id: 'inactive',
      title: 'Días de agente inactivo',
      field: 'dias_agente_inactivo',
      unit: 'días',
      kind: 'bar',
      aggregate: 'mean',
    },
    {
      id: 'errors',
      title: 'Errores de integración',
      field: 'errores_integracion',
      unit: 'errores',
      kind: 'bar',
      aggregate: 'sum',
    },
    {
      id: 'undelivered',
      title: 'Mensajes no entregados',
      field: 'mensajes_no_entregados',
      unit: 'mensajes',
      kind: 'bar',
      aggregate: 'sum',
    },
  ],
  engagement: [
    {
      id: 'sessions',
      title: 'Sesiones en el panel',
      field: 'sesiones_panel',
      unit: 'sesiones',
      kind: 'line',
      aggregate: 'mean',
    },
    {
      id: 'days',
      title: 'Días activos en el panel',
      field: 'dias_activos_panel',
      unit: 'días',
      kind: 'line',
      aggregate: 'mean',
    },
    {
      id: 'users',
      title: 'Usuarios activos en el panel',
      field: 'usuarios_activos_panel',
      unit: 'usuarios',
      kind: 'line',
      aggregate: 'mean',
    },
    {
      id: 'breadth',
      title: 'Participación del equipo',
      numerator: 'usuarios_activos_panel',
      denominator: 'usuarios_cuenta',
      unit: '%',
      kind: 'line',
      aggregate: 'ratio',
    },
  ],
  activation: [
    {
      id: 'conversations',
      title: 'Conversaciones',
      field: 'conversaciones',
      unit: 'conversaciones',
      kind: 'bar',
      aggregate: 'mean',
    },
  ],
};

export function advancedSeries(
  usage,
  ids,
  month,
  latest,
  partial,
  definition,
  completeOnly = false,
) {
  if (!month) return [];
  const selected = new Set(ids);
  const months = [
    ...new Set(usage.filter((row) => row.mes <= month).map((row) => row.mes)),
  ].sort();
  if (!months.length) return [];
  const calendar = [];
  // Include missing calendar months as gaps, capped to the last 12 months.
  const start =
    months[0] > offsetMonth(month, -11) ? months[0] : offsetMonth(month, -11);
  for (let current = start; current <= month; current = offsetMonth(current, 1))
    calendar.push(current);
  return calendar.map((period) => {
    const rows = usage.filter(
      (row) => selected.has(row.cliente_id) && row.mes === period,
    );
    const isPartial = partial && period === latest;
    const valid = rows.filter((row) =>
      definition.aggregate === 'ratio'
        ? ratio(row[definition.numerator], row[definition.denominator]) !== null
        : known(row[definition.field]),
    );
    let value = null;
    if (valid.length && !(completeOnly && isPartial)) {
      const sum = (field) =>
        valid.reduce((total, row) => total + row[field], 0);
      value =
        definition.aggregate === 'ratio'
          ? ratio(sum(definition.numerator), sum(definition.denominator))
          : sum(definition.field) /
            (definition.aggregate === 'mean' ? valid.length : 1);
    }
    return {
      month: period,
      value,
      count: valid.length,
      expected: ids.length,
      partial: isPartial,
      excluded: completeOnly && isPartial,
    };
  });
}
