<script>
  import { monthName, number } from '../../../shared/utils/format.js';
  let { chart, sector } = $props();
  const max = $derived(
    Math.max(1, ...chart.points.map((point) => point.value ?? 0)),
  );
  const x = (index) => 48 + ((index + 0.5) / chart.points.length) * 464;
  const y = (value) => 148 - (value / max) * 116;
  const formatted = (value) =>
    value == null
      ? 'Sin dato'
      : `${number(Math.round(value * 10) / 10)} ${chart.unit}`;
</script>

<section class="advanced-chart">
  <h3>{chart.title}</h3>
  <p>
    {sector
      ? chart.aggregate === 'mean'
        ? 'Promedio por cliente con dato'
        : chart.aggregate === 'ratio'
          ? 'Usuarios activos / usuarios de cuentas con ambos datos'
          : 'Suma de clientes con dato'
      : chart.aggregate === 'ratio'
        ? 'Usuarios activos / usuarios de la cuenta'
        : 'Valor del cliente'} · {chart.unit}
  </p>
  {#if chart.points.some((point) => point.value !== null)}
    <svg
      viewBox="0 0 560 185"
      role="img"
      aria-label={`${chart.title}: evolución mensual; valores y cobertura disponibles en la tabla inferior`}
    >
      {#each [0, 0.5, 1] as step}
        <line
          x1="48"
          x2="512"
          y1={y(max * step)}
          y2={y(max * step)}
          stroke="#eae6f1"
        />
        <text
          x="40"
          y={y(max * step) + 4}
          text-anchor="end"
          fill="#686575"
          font-size="10">{number(Math.round(max * step * 10) / 10)}</text
        >
      {/each}
      {#each chart.points as point, index}
        {#if point.value !== null}
          {#if chart.kind === 'line'}
            {#if index > 0 && chart.points[index - 1].value !== null}
              <line
                x1={x(index - 1)}
                y1={y(chart.points[index - 1].value)}
                x2={x(index)}
                y2={y(point.value)}
                stroke="#7655cf"
                stroke-width="2.5"
              />
            {/if}
            <circle cx={x(index)} cy={y(point.value)} r="4" fill="#7655cf"
              ><title
                >{monthName(point.month)}: {formatted(point.value)} · {point.count}/{point.expected}
                con dato</title
              ></circle
            >
          {:else}
            <rect
              x={x(index) - Math.min(22, 170 / chart.points.length)}
              y={y(point.value)}
              width={Math.min(44, 340 / chart.points.length)}
              height={148 - y(point.value)}
              rx="3"
              fill={point.partial ? '#c9b7e9' : '#7655cf'}
              stroke={point.partial ? '#7655cf' : 'none'}
              stroke-dasharray={point.partial ? '3 3' : undefined}
              ><title
                >{monthName(point.month)}: {formatted(
                  point.value,
                )}{point.partial ? ' · Parcial' : ''} · {point.count}/{point.expected}
                con dato</title
              ></rect
            >
          {/if}
        {/if}
        <text
          x={x(index)}
          y="170"
          text-anchor="middle"
          fill="#686575"
          font-size="9">{point.month.slice(5)}{point.partial ? '*' : ''}</text
        >
      {/each}
    </svg>
  {:else}
    <p class="advanced-chart-empty">Sin datos comparables para este período.</p>
  {/if}
  <p class="advanced-chart-period">
    {monthName(chart.points[0]?.month)} — {monthName(
      chart.points.at(-1)?.month,
    )} · hasta 12 meses. * Mes parcial: {chart.points.some(
      (point) => point.excluded,
    )
      ? 'excluido de la tendencia'
      : 'valor observado'}.
  </p>
  <details>
    <summary>Ver datos de {chart.title.toLowerCase()}</summary>
    <div class="dd-table-scroll">
      <table>
        <caption>{chart.title} · datos por mes</caption>
        <thead
          ><tr
            ><th scope="col">Mes</th><th scope="col">Valor</th><th scope="col"
              >Con dato</th
            ></tr
          ></thead
        >
        <tbody>
          {#each chart.points as point}
            <tr
              ><th scope="row">{monthName(point.month)}</th><td
                >{point.excluded
                  ? 'Parcial · excluido'
                  : formatted(point.value)}</td
              ><td>{point.count}/{point.expected}</td></tr
            >
          {/each}
        </tbody>
      </table>
    </div>
  </details>
</section>
