<script>
  import { ArrowRight, Activity } from 'lucide-svelte';
  let { portfolio } = $props();
</script>

<section class="panel focus-panel">
  <div class="section-kicker">
    <span class="pulse-dot"></span> EL FOCO DE ESTA SEMANA
  </div>
  <h2>
    {portfolio.critical.length
      ? 'Primero, que el agente esté ahí.'
      : 'Una buena conversación cambia la semana.'}
  </h2>
  <p>
    {portfolio.critical.length
      ? `${portfolio.critical.length} cuentas superan el umbral de inactividad. Revisa qué se rompió antes de hablar de adopción o crecimiento.`
      : 'Revisa las señales persistentes y acompaña a las cuentas que necesitan el siguiente paso.'}
  </p>
  <button
    onclick={() => {
      portfolio.filter = portfolio.critical.length ? 'critical' : 'all';
      document.getElementById('queue')?.scrollIntoView({ behavior: 'smooth' });
    }}>Ver cuentas prioritarias<ArrowRight size={16} /></button
  >
  <div class="focus-art" aria-hidden="true">
    <div></div>
    <div></div>
    <Activity size={40} />
  </div>
</section>
