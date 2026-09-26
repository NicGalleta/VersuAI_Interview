<script>
  import { Check, RotateCcw } from 'lucide-svelte';
  let { agent } = $props();
</script>

<section class="panel editor-panel">
  <div class="panel-heading">
    <h3>Instrucciones de Nota</h3>
    <span class="muted"
      >{agent.prompt.length.toLocaleString('es-CL')} caracteres</span
    >
  </div>
  <textarea
    class="prompt-editor"
    aria-label="Prompt de Nota"
    bind:value={agent.prompt}
    oninput={() => (agent.saved = false)}
    spellcheck="false"></textarea>
  <div class="editor-footer">
    <span>Incluye el catálogo del archivo</span><button
      class="button primary"
      onclick={agent.savePrompt}
      ><Check size={15} />{agent.saved
        ? 'Guardado localmente'
        : 'Guardar versión'}</button
    >
  </div>
  {#if agent.revisions.length}<details class="revisions">
      <summary>Historial local · {agent.revisions.length} versiones</summary
      >{#each agent.revisions as revision}<button
          class="text-button"
          onclick={() => {
            agent.prompt = revision.text;
            agent.saved = false;
          }}>Restaurar {revision.date}<RotateCcw size={12} /></button
        >{/each}
    </details>{/if}
</section>
