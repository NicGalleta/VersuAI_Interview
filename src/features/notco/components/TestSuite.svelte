<script>
  import { Download } from 'lucide-svelte';

  import { testCases } from '../data/testCases.js';
  let { agent } = $props();
</script>

<section class="panel information-panel">
  <div class="panel-heading">
    <div>
      <h2>Ocho conversaciones. Cero supuestos.</h2>
      <p class="muted">
        Casos originales del archivo; respuestas y veredictos pendientes del
        backend.
      </p>
    </div>
    <button class="button primary" onclick={() => agent.testPayload()}
      ><Download size={16} />Exportar batería</button
    >
  </div>
  <div class="test-list">
    {#each testCases as test}<article class="test-card">
        <div class="test-number">{test.id.padStart(2, '0')}</div>
        <div>
          <h3>“{test.message}”</h3>
          <p><span class="expected">Debe</span>{test.should}</p>
          <p><span class="forbidden">Evitar</span>{test.shouldNot}</p>
          <div class="test-response">
            Sin ejecutar · se necesita un modelo conectado
          </div>
        </div>
        <span class="badge neutral">Pendiente</span>
      </article>{/each}
  </div>
</section>
