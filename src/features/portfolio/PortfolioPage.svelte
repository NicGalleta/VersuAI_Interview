<script>
  import {
    Database,
    ArrowUpRight,
    ArrowRight,
    CircleHelp,
    Clock,
  } from 'lucide-svelte';
  import { monthName } from '../../shared/utils/format.js';
  import PortfolioSummary from './components/PortfolioSummary.svelte';
  import AccountTable from './components/AccountTable.svelte';
  let { navigation, sources, portfolio } = $props();
</script>

<div class="period-row">
  <span class="period"
    ><Clock size={14} />Corte: 21 {monthName(portfolio.latest)}<span
      class="divider">|</span
    >{portfolio.rules.partial
      ? 'Mes en curso · parcial'
      : 'Último mes marcado completo'}</span
  ><button class="text-button" onclick={() => navigation.navigate('rules')}
    >Ver criterios<ArrowUpRight size={14} /></button
  >
</div>
{#if navigation.page !== 'overview' && !sources.customers.length}<div
    class="data-hint"
  >
    <span
      ><Database size={15} /><strong>Vista de ejemplo</strong> · Uso real del caso,
      sin fichas de contacto. Faltan responsables y señales de onboarding.</span
    ><button onclick={() => navigation.navigate('data')}
      >Completar datos<ArrowRight size={14} /></button
    >
  </div>{/if}
<PortfolioSummary {navigation} {portfolio} />

<AccountTable {navigation} {sources} {portfolio} />
<div class="bottom-note">
  <CircleHelp size={14} />Las señales orientan la revisión humana. El MRR en
  riesgo no es una predicción de pérdida.
</div>
