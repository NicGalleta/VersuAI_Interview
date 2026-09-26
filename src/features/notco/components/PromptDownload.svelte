<script>
  import { Download } from 'lucide-svelte';
  import { download } from '../../../shared/utils/download.js';
  let { agent } = $props();
</script>

<button class="button" onclick={() => download('nota-prompt.txt', agent.prompt)}
  ><Download size={16} />Descargar prompt</button
>
