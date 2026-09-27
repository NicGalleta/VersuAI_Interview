<script>
  import { Search } from 'lucide-svelte';
  import AccountFilters from './AccountFilters.svelte';
  import AccountRow from './AccountRow.svelte';
  let { navigation, sources, portfolio } = $props();
</script>

<section class="panel queue-panel" id="queue">
  <div class="queue-heading">
    <div>
      <h2>
        {navigation.page === 'accounts'
          ? 'Cartera de clientes'
          : 'Cuentas con señales'}<span class="count-pill"
          >{portfolio.visible.length}</span
        >
      </h2>
      <p>
        {navigation.page === 'accounts'
          ? 'Estado, señales y responsables de la cartera.'
          : 'Señales de continuidad, adopción y expansión.'}
      </p>
    </div>
  </div>
  <AccountFilters {portfolio} />
  <div class="table-scroll">
    <table>
      <thead
        ><tr
          ><th>CLIENTE</th><th>SEÑAL / EVIDENCIA</th><th
            >MRR <span>USD</span></th
          ><th>RESPONSABLE</th><th></th></tr
        ></thead
      ><tbody
        >{#each portfolio.visible as account}<AccountRow
            {account}
            onOpen={portfolio.openAccount}
          />{/each}</tbody
      >
    </table>
    {#if !portfolio.visible.length}<div class="empty">
        <Search size={28} />
        <h3>Sin resultados</h3>
        <p>No hay cuentas que coincidan con los filtros actuales.</p>
        <button
          class="button"
          onclick={() => {
            portfolio.filter = 'all';
            portfolio.search = '';
            portfolio.owner = 'all';
          }}>Limpiar filtros</button
        >
      </div>{/if}
  </div>
  <div class="table-footer">
    <span
      >{portfolio.visible.length} cuentas · {sources.usage.length} registros analizados</span
    ><span><span class="tiny-dot green"></span>Recalculado en tu navegador</span
    >
  </div>
</section>
