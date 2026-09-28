<script>
  import { Download } from 'lucide-svelte';

  import { testCases } from '../data/testCases.js';
  let { agent } = $props();
  const verdicts = {
    pass: { label: 'Cumple', tone: 'passed' },
    fail: { label: 'No cumple', tone: 'critical' },
    inconclusive: { label: 'No evaluable', tone: 'neutral' },
    error: { label: 'Error de respuesta', tone: 'critical' },
    pending_evaluation: { label: 'Por evaluar', tone: 'neutral' },
  };
</script>

<section class="panel information-panel">
  <div class="panel-heading">
    <div>
      <h2>Ocho conversaciones. Cero supuestos.</h2>
      <p class="muted">
        Ocho respuestas independientes, evaluadas una por una con IA. Cada
        veredicto incluye su motivo y usa el catálogo y los criterios de cada
        prueba.
      </p>
    </div>
    <button
      class="button primary"
      disabled={agent.testing}
      onclick={agent.runTests}
    >
      {agent.evaluating
        ? `Evaluando ${agent.evaluationProgress}…`
        : agent.testing
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
  {#if agent.evaluationError}<p role="alert">
      No se pudieron evaluar algunas pruebas. Las respuestas se conservaron. {agent.evaluationError}
    </p>{/if}
  {#if agent.testResults.length && !agent.testing}
    <p role="status">
      {agent.testResults.filter((r) => r.verdict === 'pass').length} cumplen ·
      {agent.testResults.filter((r) => r.verdict === 'fail').length} no cumplen ·
      {agent.testResults.filter((r) => r.verdict === 'inconclusive').length} no evaluables
      ·
      {agent.testResults.filter((r) => r.verdict === 'error').length} errores de respuesta.
      Evaluación automática con IA; revisa los motivos.
    </p>
  {/if}
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
          {#if agent.testResults[index]?.reason}<p class="test-reason">
              {agent.testResults[index].reason}
            </p>{/if}
        </div>
        <span
          class="badge {verdicts[agent.testResults[index]?.verdict]?.tone ||
            'neutral'}"
          >{verdicts[agent.testResults[index]?.verdict]?.label ||
            'Pendiente'}</span
        >
      </article>{/each}
  </div>
</section>
