<script>
  import focusDrawer from '../../../shared/actions/focusDrawer.js';
  import { X, ArrowUpRight } from 'lucide-svelte';
  import MessageDraft from './MessageDraft.svelte';

  let { portfolio, onDeepDive } = $props();
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
      <div class="drawer-title-row">
        <h2>{portfolio.selected.name}</h2>
        <button
          class="button primary"
          aria-label={`Ver Deep Dive de ${portfolio.selected.name}`}
          onclick={() => onDeepDive(portfolio.selected.id)}
          >Deep Dive <ArrowUpRight size={16} /></button
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
    <MessageDraft {portfolio} />
  </div>
{/if}
