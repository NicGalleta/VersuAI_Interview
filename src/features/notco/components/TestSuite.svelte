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
        Ejecuta cada caso por separado con el prompt actual y revisa las
        respuestas.
      </p>
    </div>
    <button
      class="button primary"
      disabled={agent.testing}
      onclick={agent.runTests}
    >
      {agent.testing
        ? `Ejecutando ${agent.testResults.length}/8…`
        : 'Ejecutar pruebas'}
    </button>
    <button
      disabled={agent.testing}
      class="button primary"
      onclick={() => agent.testPayload()}
      ><Download size={16} />Exportar batería</button
    >
  </div>
  {#if agent.testsStale}<p role="status">
      El prompt cambió desde la última ejecución. Ejecuta nuevamente para
      evaluar los cambios.
    </p>{/if}
  <div class="test-list">
    {#each testCases as test, index}<article class="test-card">
        <div class="test-number">{test.id.padStart(2, '0')}</div>
        <div>
          <h3>“{test.message}”</h3>
          <p><span class="expected">Debe</span>{test.should}</p>
          <p><span class="forbidden">Evitar</span>{test.shouldNot}</p>
          <div class="test-response">
            {agent.testResults[index]?.response ||
              agent.testResults[index]?.error ||
              'Sin ejecutar'}
          </div>
        </div>
        <span class="badge neutral"
          >{agent.testResults[index]?.verdict === 'error'
            ? 'Error'
            : agent.testResults[index]
              ? 'Revisar'
              : 'Pendiente'}</span
        >
      </article>{/each}
  </div>
</section>
