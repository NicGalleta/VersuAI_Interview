<script>
  import { number, monthName } from '../../../shared/utils/format.js';
  let { portfolio } = $props();
</script>

<section class="drawer-section">
  <div class="panel-heading">
    <h3>Historia de conversaciones</h3>
    <span class="muted">{portfolio.selected.history.length} meses</span>
  </div>
  <div class="history-chart">
    {#each portfolio.selected.history as record}<div>
        <span>{number(record.conversaciones)}</span>
        <div
          class="chart-column"
          class:partial={portfolio.rules.partial &&
            record.mes === portfolio.latest}
          style:height={`${Math.max(3, ((record.conversaciones ?? 0) / Math.max(1, ...portfolio.selected.history.map((r) => r.conversaciones ?? 0))) * 95)}px`}
        ></div>
        <small>{monthName(record.mes).split(' ')[0]}</small>
      </div>{/each}
  </div>
  <p class="micro">
    {portfolio.rules.partial
      ? 'Último mes parcial: no comparable con meses cerrados.'
      : 'Todos los meses se consideran completos.'}
  </p>
</section>
