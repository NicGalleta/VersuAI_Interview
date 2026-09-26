<script>
  import { Bot, Download } from 'lucide-svelte';
  let { agent } = $props();
</script>

<section class="panel chat-panel">
  <div class="panel-heading">
    <div class="chat-identity">
      <div class="avatar dark">N</div>
      <div>
        <strong>Nota</strong><small>Vista previa de conversación</small>
      </div>
    </div>
    <Bot size={19} />
  </div>
  <div class="chat-body">
    <span class="chat-date">ENTORNO DE PRUEBA</span>
    <div class="chat-placeholder">
      <Bot size={32} />
      <h3>Lista para conectar.</h3>
      <p>
        El prompt está preparado. Conecta un backend de IA para conversar y
        evaluar respuestas reales.
      </p>
      <span class="badge neutral">Sin respuestas simuladas</span>
    </div>
    {#if agent.query}<div class="user-bubble">{agent.query}</div>{/if}
  </div>
  <div class="chat-compose">
    <textarea
      aria-label="Mensaje de prueba"
      placeholder="Escribe un mensaje de prueba…"
      bind:value={agent.query}
      rows="2"></textarea><button
      class="icon-button"
      disabled={!agent.query.trim()}
      aria-label="Exportar consulta con el prompt actual"
      onclick={() => agent.testPayload([agent.query])}
      ><Download size={19} /></button
    >
  </div>
  <p class="chat-disclaimer">
    Exporta la consulta con el prompt actual. No se envía a un modelo.
  </p>
</section>
