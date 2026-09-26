<script>
  import { X, AlertTriangle, CheckCircle2 } from 'lucide-svelte';
  let { feedback } = $props();
</script>

{#if feedback.notice}<div class="notice" role="status">
    <CheckCircle2 size={17} />{feedback.notice}<button
      aria-label="Cerrar aviso"
      onclick={() => (feedback.notice = '')}><X size={15} /></button
    >
  </div>{/if}
{#if feedback.error}<div class="notice error" role="alert">
    <AlertTriangle size={17} />{feedback.error}
  </div>{/if}
