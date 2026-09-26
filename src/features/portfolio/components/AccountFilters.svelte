<script>
  import { Search } from 'lucide-svelte';
  let { portfolio } = $props();
</script>

<div class="table-tools">
  <div class="tabs" aria-label="Filtrar cuentas">
    {#each [{ value: 'all', label: 'Todas' }, { value: 'critical', label: 'Urgentes' }, { value: 'risk', label: 'Seguimiento' }, { value: 'growth', label: 'Expansión' }] as tab}<button
        class:chosen={portfolio.filter === tab.value}
        onclick={() => (portfolio.filter = tab.value)}
        >{tab.label}{#if tab.value === 'critical'}<span
            >{portfolio.critical.length}</span
          >{/if}</button
      >{/each}
  </div>
  <div class="search-tools">
    <label class="search"
      ><Search size={15} /><input
        aria-label="Buscar cliente"
        placeholder="Buscar cliente…"
        bind:value={portfolio.search}
      /></label
    ><select aria-label="Responsable de Ops" bind:value={portfolio.owner}
      ><option value="all">Todos los responsables</option
      >{#each portfolio.owners as name}<option value={name}>{name}</option
        >{/each}</select
    >
  </div>
</div>
