<script>
  import { ChartNoAxesCombined, ArrowRight } from 'lucide-svelte';
  import { metricGroups, formatMetric } from './domain/metrics.js';
  import { monthName } from '../../shared/utils/format.js';
  import MetricHistory from './components/MetricHistory.svelte';
  let { dive, partial, onUpload } = $props();
  const isPartial = $derived(partial && dive.month === dive.months.at(-1));
  const unclassified = $derived(
    dive.entities.clients.filter((client) => !client.sector).length,
  );
</script>

<div class="deep-dive">
  <section class="dd-panel dd-controls" aria-label="Filtros de Deep Dive">
    <div class="dd-mode" role="group" aria-label="Analizar por">
      <button
        class:active={dive.mode === 'client'}
        aria-pressed={dive.mode === 'client'}
        onclick={() => (dive.mode = 'client')}>Cliente</button
      >
      <button
        class:active={dive.mode === 'sector'}
        aria-pressed={dive.mode === 'sector'}
        onclick={() => (dive.mode = 'sector')}>Rubro</button
      >
    </div>
    <label class="dd-entity"
      >{dive.mode === 'client' ? 'Cliente' : 'Rubro'}
      <select bind:value={dive.entityId} disabled={!dive.options.length}>
        {#if !dive.options.length}<option value=""
            >Sin opciones disponibles</option
          >{/if}
        {#each dive.options as option}<option value={option.id}
            >{option.label}{dive.mode === 'client'
              ? ` · ${option.id}`
              : ` · ${option.ids.length} clientes`}</option
          >{/each}
      </select>
    </label>
    <label
      >Mes de análisis
      <select bind:value={dive.month} disabled={!dive.months.length}>
        {#each dive.months as month}<option value={month}
            >{monthName(month)}{partial && month === dive.months.at(-1)
              ? ' · Parcial'
              : ''}</option
          >{/each}
      </select>
    </label>
  </section>

  {#if !dive.entity}
    <section class="dd-panel dd-empty">
      <ChartNoAxesCombined size={32} />
      <h2>
        {dive.mode === 'sector'
          ? 'Agrega rubros para ampliar el análisis'
          : 'Todavía no hay datos de uso'}
      </h2>
      <p>
        {dive.mode === 'sector'
          ? 'Carga clientes.csv con el rubro y el mismo cliente_id del archivo de uso mensual. Los clientes sin rubro no se incluyen en los agregados.'
          : 'Carga uso_mensual.csv para explorar las métricas de tus clientes.'}
      </p>
      <button class="button primary" onclick={onUpload}
        >Ir a fuentes de datos <ArrowRight size={16} /></button
      >
    </section>
  {:else}
    <section class="dd-context" aria-label="Contexto del análisis">
      <div>
        <span class="dd-kicker"
          >{dive.mode === 'client' ? 'CLIENTE' : 'RUBRO AGREGADO'}</span
        >
        <h2>{dive.entity.label}</h2>
        <p>
          {dive.mode === 'client'
            ? `${dive.entity.id} · ${dive.entity.sectorLabel || 'Sin rubro asignado'}`
            : `${dive.ids.length} clientes con historial de uso · Todas las cuentas, sin filtro de estado`}
        </p>
        {#if dive.mode === 'client' && dive.rows[0]}<p>
            Plan: {dive.rows[0].plan || 'Sin dato'} · Canales activos: {dive
              .rows[0].canales_activos || 'Sin dato'}
          </p>{/if}
      </div>
      <div class="dd-period">
        <strong>{monthName(dive.month)}</strong><span
          >{dive.rows.length} de {dive.ids.length} clientes con registro</span
        >{#if isPartial}<span class="dd-partial-badge">Mes parcial</span>{/if}
      </div>
    </section>
    <div class="dd-method">
      <p>
        {dive.mode === 'sector'
          ? 'Volúmenes e importes: suma. Tiempos y días: promedio simple por cliente con dato, sin ponderar por conversaciones. La cobertura puede variar entre meses.'
          : 'Valores mensuales del archivo de uso. Selecciona una tarjeta para ver su evolución.'}
        Los vacíos se muestran como «Sin dato»; nunca como cero.
      </p>
      {#if isPartial}<p>
          El último mes está marcado como parcial en Reglas y criterios. Se
          muestran valores observados, sin proyección ni comparación porcentual.
        </p>{/if}
      {#if dive.mode === 'sector' && unclassified}<p>
          {unclassified} clientes del archivo de uso no tienen rubro y quedan fuera
          de los agregados.
        </p>{/if}
      {#if !dive.rows.length}<p role="status">
          No hay registros para esta selección en {monthName(dive.month)}.
          Puedes explorar otros meses en el historial.
        </p>{/if}
    </div>

    <MetricHistory {dive} {partial} />

    <div class="dd-section-heading">
      <div>
        <span class="dd-kicker">MÉTRICAS DEL MES</span>
        <h2>El detalle, por área</h2>
        <p>Selecciona una métrica para actualizar la evolución mensual.</p>
      </div>
    </div>
    {#each metricGroups as group}
      <section class="dd-group" aria-label={group}>
        <h3>{group}</h3>
        <div class="dd-metrics">
          {#each dive.cards.filter((card) => card.definition.group === group) as card}
            {#snippet metricContent(card)}
              <span>{card.definition.label}</span>
              <strong>{formatMetric(card.definition, card.value)}</strong>
              <small
                >{dive.mode === 'sector'
                  ? card.definition.aggregation === 'mean'
                    ? 'Promedio por cliente'
                    : 'Suma del rubro'
                  : 'Valor del mes'} · {card.count}/{dive.ids.length} con dato</small
              >
            {/snippet}
            {#if card.definition.id === 'mrr_usd'}
              <article class="dd-metric">{@render metricContent(card)}</article>
            {:else}
              <button
                class="dd-metric"
                class:selected={!dive.advancedId &&
                  dive.metricId === card.definition.id}
                aria-pressed={!dive.advancedId &&
                  dive.metricId === card.definition.id}
                onclick={() => (dive.metricId = card.definition.id)}
              >
                {@render metricContent(card)}
              </button>
            {/if}
          {/each}
        </div>
      </section>
    {/each}
  {/if}
</div>
