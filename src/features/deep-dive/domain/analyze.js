import { normalize } from '../../../shared/utils/normalize.js';

export function buildEntities(usage, customers) {
  const profiles = new Map(customers.map((row) => [row.cliente_id, row]));
  const clients = new Map();
  for (const row of usage) {
    const previous = clients.get(row.cliente_id);
    if (previous && previous.month > row.mes) continue;
    const profile = profiles.get(row.cliente_id);
    clients.set(row.cliente_id, {
      id: row.cliente_id,
      label: profile?.cliente || row.cliente,
      sector: normalize(profile?.rubro),
      sectorLabel: profile?.rubro?.trim() || '',
      month: row.mes,
    });
  }
  const sectors = new Map();
  for (const client of clients.values()) {
    if (!client.sector) continue;
    if (!sectors.has(client.sector)) {
      sectors.set(client.sector, {
        id: client.sector,
        label: client.sectorLabel,
        ids: [],
      });
    }
    sectors.get(client.sector).ids.push(client.id);
  }
  const byLabel = (a, b) => a.label.localeCompare(b.label, 'es');
  return {
    clients: [...clients.values()].sort(byLabel),
    sectors: [...sectors.values()].sort(byLabel),
  };
}

export function monthlySeries(usage, ids, months, metric) {
  const selected = new Set(ids);
  const byMonth = new Map(months.map((month) => [month, []]));
  for (const row of usage) {
    if (selected.has(row.cliente_id)) byMonth.get(row.mes)?.push(row);
  }
  return months.map((month) => {
    const rows = byMonth.get(month);
    return {
      month,
      ...metric.calculate(rows),
      reported: rows.length,
      expected: selected.size,
    };
  });
}
