<script>
  import { Download, Check, Copy } from 'lucide-svelte';
  import { download } from '../../../shared/utils/download.js';
  let { portfolio } = $props();
</script>

<section class="drawer-section">
  <div class="panel-heading">
    <h3>Mensaje sugerido</h3>
    <span class="badge neutral">Revisión humana</span>
  </div>
  <div class="message-draft">{portfolio.selectedDraft}</div>
  <div class="draft-actions">
    <button class="button primary" onclick={portfolio.copyDraft}
      >{#if portfolio.copied}<Check size={15} />{:else}<Copy
          size={15}
        />{/if}{portfolio.copied ? 'Copiado' : 'Copiar borrador'}</button
    ><button
      class="button"
      onclick={() =>
        download(
          `${portfolio.selected.id}-mensaje.txt`,
          portfolio.selectedDraft,
        )}><Download size={15} />Descargar</button
    >
  </div>
  <p class="micro">
    Revisa y envía desde tu canal habitual. La herramienta no envía mensajes.
  </p>
</section>
