<script>
  import { Bot, Send, RotateCcw } from 'lucide-svelte';
  let { agent } = $props();
  function scrollToLatest(node) {
    const observer = new MutationObserver(() => {
      node.scrollTop = node.scrollHeight;
    });
    observer.observe(node, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    node.scrollTop = node.scrollHeight;
    return { destroy: () => observer.disconnect() };
  }
</script>

<section class="panel chat-panel">
  <div class="panel-heading">
    <div class="chat-identity">
      <div class="avatar dark">N</div>
      <div>
        <strong>Nota</strong><small>Vista previa de conversación</small>
      </div>
    </div>
    <button
      class="icon-button"
      aria-label="Nueva conversación"
      disabled={agent.sending}
      onclick={agent.resetChat}><RotateCcw size={19} /></button
    >
  </div>
  <div
    class="chat-body"
    role="log"
    aria-label="Conversación con Nota"
    aria-live="polite"
    use:scrollToLatest
  >
    <span class="chat-date">ENTORNO DE PRUEBA</span>
    {#if !agent.messages.length}
      <div class="chat-placeholder">
        <Bot size={32} />
        <h3>Prueba el prompt con Nota.</h3>
        <p>
          Escribe un mensaje para recibir una respuesta con las instrucciones
          actuales del editor.
        </p>
      </div>
    {/if}
    {#each agent.messages as message}
      <div class={message.role === 'user' ? 'user-bubble' : 'assistant-bubble'}>
        {message.content}
      </div>
    {/each}
    {#if agent.sending}<p class="chat-loading">Nota está escribiendo…</p>{/if}
  </div>
  {#if agent.chatError}<p class="chat-error" role="alert">
      {agent.chatError} Tu mensaje está listo para reenviar.
    </p>{/if}
  <form
    class="chat-compose"
    onsubmit={(event) => {
      event.preventDefault();
      agent.sendMessage();
    }}
  >
    <textarea
      aria-label="Mensaje de prueba"
      placeholder="Escribe un mensaje de prueba…"
      bind:value={agent.query}
      disabled={agent.sending}
      onkeydown={(event) => {
        if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
          event.preventDefault();
          agent.sendMessage();
        }
      }}
      rows="2"></textarea>
    <button
      type="submit"
      class="icon-button"
      disabled={agent.sending || !agent.query.trim()}
      aria-label="Enviar mensaje"><Send size={19} /></button
    >
  </form>
  <p class="chat-disclaimer">
    El prompt y esta conversación se envían a Cloudflare Workers AI. Las
    respuestas pueden contener errores. Nueva conversación borra el historial de
    esta sesión.
  </p>
</section>
