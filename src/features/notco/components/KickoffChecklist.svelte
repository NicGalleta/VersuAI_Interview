<script>
  import { CircleHelp } from 'lucide-svelte';
  import { questions } from '../data/questions.js';
</script>

<section class="panel information-panel">
  <h2>Pendientes para el kickoff</h2>
  <p class="muted">
    Preguntas abiertas del levantamiento. No habilitar el agente sin
    resolverlas.
  </p>
  {#each questions as question, i}<div class="question-row">
      <span>{String(i + 1).padStart(2, '0')}</span>
      <p>{question}</p>
      <span class="badge risk">Por confirmar</span>
    </div>{/each}
  <div class="info-block">
    <CircleHelp size={18} />
    <p>
      Este borrador usa compra en el sitio como limitación del prototipo. El
      carrito, los tickets, las imágenes, la consulta de pedidos y las
      derivaciones necesitan integraciones confirmadas. Las políticas y el
      saludo viven en ajustes; los disparadores, en intervenciones.
    </p>
  </div>
</section>
