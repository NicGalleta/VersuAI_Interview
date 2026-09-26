<script>
  let { portfolio } = $props();
  const categories = [
    { kind: 'critical', name: 'Continuidad del agente', color: '#ee786e' },
    { kind: 'risk', name: 'Adopción y seguimiento', color: '#e9b551' },
    { kind: 'growth', name: 'Expansión de plan', color: '#8b70db' },
  ];
</script>

<section class="panel signal-panel">
  <div class="panel-heading">
    <h3>Señales de la cartera</h3>
    <span class="muted">{portfolio.queue.length} cuentas</span>
  </div>
  {#each categories as category}<button
      class="signal-bar-row"
      onclick={() => (portfolio.filter = category.kind)}
      ><div>
        <span><i style:background={category.color}></i>{category.name}</span
        ><strong>{portfolio.reasonCount(category.kind)}</strong>
      </div>
      <div class="bar-track">
        <div
          style:width={`${Math.max(0, (portfolio.reasonCount(category.kind) / Math.max(portfolio.queue.length, 1)) * 100)}%`}
          style:background={category.color}
        ></div>
      </div></button
    >{/each}
  <p class="micro">Una cuenta puede tener más de una señal.</p>
</section>
