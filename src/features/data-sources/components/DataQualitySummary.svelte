<script>
  import { CircleHelp } from 'lucide-svelte';
  let { sources, portfolio } = $props();
</script>

<section class="panel information-panel">
  <h2>Calidad y alcance de los datos</h2>
  <div class="quality-grid">
    <div>
      <strong>{sources.warnings.length}</strong><span
        >Celdas numéricas vacías</span
      >
    </div>
    <div>
      <strong>{portfolio.accounts.filter((a) => !a.profile).length}</strong
      ><span>Cuentas sin ficha</span>
    </div>
    <div>
      <strong>{portfolio.accounts.filter((a) => !a.eligible).length}</strong
      ><span>Cuentas fuera de seguimiento</span>
    </div>
    <div>
      <strong
        >{sources.customers.filter(
          (c) => !portfolio.accounts.some((a) => a.id === c.cliente_id),
        ).length}</strong
      ><span>Fichas sin historial de uso</span>
    </div>
  </div>
  <div class="info-block">
    <CircleHelp size={18} />
    <p>
      Los contactos se cargan solo en memoria; no se suben ni se guardan en el
      navegador. Recargar la página restaura el ejemplo sin contactos. Las
      celdas vacías se conservan como desconocidas y los duplicados se rechazan.
    </p>
  </div>
  {#if sources.warnings.length}<details>
      <summary
        >Ver observaciones del archivo ({sources.warnings.length})</summary
      >
      <ul class="warning-list">
        {#each sources.warnings.slice(0, 100) as warning}<li>
            {warning}
          </li>{/each}
      </ul>
      {#if sources.warnings.length > 100}<p>
          Mostrando las primeras 100 observaciones.
        </p>{/if}
    </details>{/if}
  <p class="muted">
    Se normalizan encabezados, espacios y mayúsculas en IDs. No se cruzan
    clientes por nombre. Los archivos inválidos no reemplazan los datos
    anteriores.
  </p>
</section>
