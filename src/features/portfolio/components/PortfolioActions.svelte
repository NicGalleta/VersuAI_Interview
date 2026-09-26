<script>
  import { Download, Upload } from 'lucide-svelte';
  import { download } from '../../../shared/utils/download.js';
  import { exportQueue } from '../domain/exportQueue.js';
  let { portfolio, onUpload } = $props();
</script>

<button
  class="button"
  onclick={() =>
    download(
      'prioridades-versu.csv',
      exportQueue(portfolio.visible),
      'text/csv;charset=utf-8',
    )}><Download size={16} />Exportar lista</button
>
<button class="button primary" onclick={onUpload}
  ><Upload size={16} />Cargar datos</button
>
