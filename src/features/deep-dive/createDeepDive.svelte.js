import { buildEntities, monthlySeries } from './domain/analyze.js';
import { metrics, historyMetrics, defaultMetricId } from './domain/metrics.js';
import {
  advancedDefaults,
  analyzeAdvanced,
  advancedCharts,
  advancedSeries,
} from './domain/advanced.js';
import { defaults } from '../rules/defaults.js';

export function createDeepDive(sources, getRules = () => defaults) {
  let mode = $state('client');
  let clientId = $state('');
  let sectorId = $state('');
  let selectedMonth = $state('');
  let metricId = $state(defaultMetricId);
  let advancedId = $state('');
  let advancedSettings = $state({ ...advancedDefaults });
  const entities = $derived(buildEntities(sources.usage, sources.customers));
  const options = $derived(
    mode === 'client' ? entities.clients : entities.sectors,
  );
  const entity = $derived(
    options.find(
      (item) => item.id === (mode === 'client' ? clientId : sectorId),
    ) ?? options[0],
  );
  const ids = $derived(
    entity ? (mode === 'client' ? [entity.id] : entity.ids) : [],
  );
  const months = $derived(
    [...new Set(sources.usage.map((row) => row.mes))].sort(),
  );
  const month = $derived(
    months.includes(selectedMonth) ? selectedMonth : months.at(-1),
  );
  const rows = $derived(
    sources.usage.filter(
      (row) => ids.includes(row.cliente_id) && row.mes === month,
    ),
  );
  const metric = $derived(
    historyMetrics.find((item) => item.id === metricId) ?? historyMetrics[0],
  );
  const series = $derived(monthlySeries(sources.usage, ids, months, metric));
  const cards = $derived(
    metrics.map((definition) => ({
      definition,
      ...definition.calculate(rows),
    })),
  );
  const advanced = $derived(
    analyzeAdvanced(
      sources.usage,
      sources.customers,
      ids,
      month,
      months.at(-1),
      getRules(),
      advancedSettings,
    ),
  );
  const chartDefinitions = $derived(
    advancedId === 'overview'
      ? [
          advancedCharts.service[0],
          advancedCharts.engagement[0],
          advancedCharts.activation[0],
        ]
      : (advancedCharts[advancedId] ?? []),
  );
  const charts = $derived(
    chartDefinitions.map((definition) => ({
      ...definition,
      points: advancedSeries(
        sources.usage,
        ids,
        month,
        months.at(-1),
        getRules().partial,
        definition,
        !advancedCharts.service.includes(definition),
      ),
    })),
  );

  return {
    get mode() {
      return mode;
    },
    set mode(value) {
      mode = value;
    },
    get entityId() {
      return entity?.id ?? '';
    },
    set entityId(value) {
      if (mode === 'client') clientId = value;
      else sectorId = value;
    },
    get month() {
      return month;
    },
    set month(value) {
      selectedMonth = value;
    },
    get metricId() {
      return metric.id;
    },
    set metricId(value) {
      metricId = value;
      advancedId = '';
    },
    get advancedId() {
      return advancedId;
    },
    set advancedId(value) {
      advancedId = value;
    },
    get advanced() {
      return advanced;
    },
    get charts() {
      return charts;
    },
    get advancedSettings() {
      return advancedSettings;
    },
    set advancedSettings(value) {
      advancedSettings = value;
    },
    get rules() {
      return getRules();
    },
    get entities() {
      return entities;
    },
    get options() {
      return options;
    },
    get entity() {
      return entity;
    },
    get ids() {
      return ids;
    },
    get months() {
      return months;
    },
    get rows() {
      return rows;
    },
    get metric() {
      return metric;
    },
    get series() {
      return series;
    },
    get cards() {
      return cards;
    },
  };
}
