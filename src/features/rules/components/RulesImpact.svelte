<script>
  import { ArrowRight, Activity } from 'lucide-svelte';

  let { navigation, portfolio } = $props();
</script>

<aside class="panel rules-impact">
  <span class="large-icon"><Activity size={24} /></span>
  <h3>Impacto en tiempo real</h3>
  <strong class="impact-number">{portfolio.queue.length}</strong>
  <p>cuentas en la lista semanal</p>
  <hr />
  <div><span>Urgentes</span><strong>{portfolio.critical.length}</strong></div>
  <div><span>Con riesgo</span><strong>{portfolio.risks.length}</strong></div>
  <div>
    <span>Con expansión</span><strong>{portfolio.growth.length}</strong>
  </div>
  <button class="button primary" onclick={() => navigation.navigate('overview')}
    >Ver prioridades<ArrowRight size={16} /></button
  >
  <p class="micro">
    No se alerta solo por una caída de volumen: puede ser estacional. La
    comparación por rubro queda pendiente.
  </p>
</aside>
