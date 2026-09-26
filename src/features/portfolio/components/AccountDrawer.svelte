<script>
  import focusDrawer from '../../../shared/actions/focusDrawer.js';
  import { X } from 'lucide-svelte';
  import { money } from '../../../shared/utils/format.js';
  import AccountHistory from './AccountHistory.svelte';
  import MessageDraft from './MessageDraft.svelte';

  let { portfolio } = $props();
</script>

<svelte:window
  onkeydown={(event) => {
    if (event.key === 'Escape') portfolio.selectedId = null;
  }}
/>
{#if portfolio.selected}
  <div
    class="drawer-backdrop"
    role="presentation"
    onclick={(e) => {
      if (e.target === e.currentTarget) portfolio.selectedId = null;
    }}
  ></div>
  <div
    class="account-drawer"
    role="dialog"
    aria-modal="true"
    aria-label={`Detalle de ${portfolio.selected.name}`}
    tabindex="-1"
    use:focusDrawer
  >
    <div class="drawer-top">
      <span>DETALLE DE CUENTA</span><button
        class="icon-button"
        aria-label="Cerrar detalle"
        onclick={() => (portfolio.selectedId = null)}><X size={21} /></button
      >
    </div>
    <div class="drawer-title">
      <div class="account-avatar big">
        {portfolio.selected.name.slice(0, 2).toUpperCase()}
      </div>
      <h2>{portfolio.selected.name}</h2>
      <p>
        {portfolio.selected.id} · {portfolio.selected.profile?.pais ||
          'País sin ficha'} · {portfolio.selected.current.plan}
      </p>
    </div>
    <div class="drawer-metrics">
      <div>
        <span>MRR actual</span><strong
          >{money(portfolio.selected.current.mrr_usd)}</strong
        >
      </div>
      <div>
        <span>Responsable</span><strong
          >{portfolio.selected.profile?.ops_owner || 'Sin ficha'}</strong
        >
      </div>
      <div>
        <span>Estado</span><strong
          >{portfolio.selected.profile?.estado || 'Sin confirmar'}</strong
        >
      </div>
    </div>
    <section class="drawer-section">
      <h3>Por qué revisar esta cuenta</h3>
      {#each portfolio.selected.signals as signal, i}<button
          class="reason-card"
          class:selected-reason={portfolio.selectedReason === i}
          onclick={() => {
            portfolio.selectedReason = i;
            portfolio.copied = false;
          }}
          ><span class={`badge ${signal.kind}`}>{signal.label}</span>
          <p>{signal.evidence}</p>
          <small>{signal.action}</small></button
        >{/each}{#if !portfolio.selected.signals.length}<p class="muted">
          Sin señales con las reglas actuales. Los datos faltantes no equivalen
          a una cuenta sana.
        </p>{/if}
    </section>
    <AccountHistory {portfolio} />
    <MessageDraft {portfolio} />
    {#if portfolio.selected.profile}<section class="drawer-section">
        <h3>Contacto</h3>
        <p>
          {portfolio.selected.profile.contacto_nombre || 'Sin nombre'} · {portfolio
            .selected.profile.contacto_email || 'Sin correo'}
        </p>
        <p class="muted">
          {portfolio.selected.profile.telefono || 'Sin teléfono'}
        </p>
      </section>{/if}
  </div>
{/if}
