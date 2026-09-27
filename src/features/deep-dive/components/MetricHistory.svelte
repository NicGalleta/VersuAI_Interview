<script>
  import { formatMetric, historyMetrics } from '../domain/metrics.js';
  import { monthName } from '../../../shared/utils/format.js';
  import { advancedViews } from '../domain/advanced.js';
  import AdvancedAnalysis from './AdvancedAnalysis.svelte';
  let { dive, partial } = $props();
  const maximum = $derived(
    Math.max(1, ...dive.series.map((point) => point.value ?? 0)),
  );
</script>

<section class="dd-panel dd-history" aria-labelledby="history-title">
  <div class="dd-section-heading">
    <div>
      <span class="dd-kicker"
        >{dive.advancedId ? 'ANÁLISIS AVANZADO' : 'EVOLUCIÓN MENSUAL'}</span
      >
      <h2 id="history-title">
        {dive.advancedId
          ? dive.advancedId === 'overview' && dive.mode === 'sector'
            ? 'Panorama del rubro'
            : advancedViews.find((view) => view.id === dive.advancedId)?.label
          : dive.metric.label}
      </h2>
      <p>
        {dive.advancedId
          ? 'Señales, evidencia y evolución para decidir qué revisar primero.'
          : 'Selecciona una métrica para explorar su historia. Cada barra representa un mes.'}
      </p>
    </div>
    <div class="dd-history-selectors">
      <label
        >Métrica
        <select
          value={dive.advancedId ? '' : dive.metricId}
          onchange={(event) => (dive.metricId = event.currentTarget.value)}
        >
          <option value="" disabled>Seleccionar métrica</option>
          {#each historyMetrics as metric}<option value={metric.id}
              >{metric.label}</option
            >{/each}
        </select>
      </label>
      <label
        >Análisis avanzado
        <select bind:value={dive.advancedId}>
          <option value="">Ver panorama y señales</option>
          {#each advancedViews as view}<option value={view.id}
              >{view.id === 'overview' && dive.mode === 'sector'
                ? 'Panorama del rubro'
                : view.label}</option
            >{/each}
        </select>
      </label>
    </div>
  </div>
  {#if dive.advancedId}
    <AdvancedAnalysis {dive} />
  {:else}
    <div class="dd-chart" aria-label={`Evolución de ${dive.metric.label}`}>
      {#each dive.series as point}
        <button
          class="dd-bar-column"
          class:chosen={point.month === dive.month}
          class:partial={partial && point.month === dive.months.at(-1)}
          aria-pressed={point.month === dive.month}
          aria-label={`${monthName(point.month)}: ${formatMetric(dive.metric, point.value)}${partial && point.month === dive.months.at(-1) ? ', mes parcial' : ''}, ${point.count} de ${point.expected} clientes con dato`}
          onclick={() => (dive.month = point.month)}
        >
          <span class="dd-bar-value"
            >{formatMetric(dive.metric, point.value)}</span
          >
          <span class="dd-bar-track"
            ><span
              class="dd-bar"
              style:height={`${point.value == null ? 0 : Math.max(2, (point.value / maximum) * 100)}%`}
            ></span></span
          >
          <span>{monthName(point.month)}</span>
          <small
            >{partial && point.month === dive.months.at(-1)
              ? 'Parcial'
              : `${point.count}/${point.expected} con dato`}</small
          >
        </button>
      {/each}
    </div>
    <details class="dd-history-data">
      <summary>Ver valores y cobertura por mes</summary>
      <div class="dd-table-scroll">
        <table>
          <caption
            >{dive.metric.label} · {dive.mode === 'sector'
              ? dive.metric.aggregation === 'mean'
                ? 'Promedio por cliente con dato'
                : 'Suma de clientes con dato'
              : 'Valor del cliente'}</caption
          >
          <thead
            ><tr
              ><th scope="col">Mes</th><th scope="col">Valor</th><th scope="col"
                >Clientes con dato</th
              ></tr
            ></thead
          >
          <tbody>
            {#each dive.series as point}
              <tr
                ><th scope="row"
                  >{monthName(point.month)}{partial &&
                  point.month === dive.months.at(-1)
                    ? ' · Parcial'
                    : ''}</th
                ><td>{formatMetric(dive.metric, point.value)}</td><td
                  >{point.count} de {point.expected}</td
                ></tr
              >
            {/each}
          </tbody>
        </table>
      </div>
    </details>
  {/if}
</section>
