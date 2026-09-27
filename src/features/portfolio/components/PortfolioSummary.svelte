<script>
  import { Users, AlertTriangle, Activity, TrendingUp } from 'lucide-svelte';
  import { money } from '../../../shared/utils/format.js';
  import SignalOverview from './SignalOverview.svelte';
  let { navigation, portfolio } = $props();
</script>

<div class="stats-grid">
  {#if navigation.page === 'overview'}
    <SignalOverview {portfolio} />
  {:else}
    <button
      class="stat-card"
      onclick={() => {
        portfolio.filter = 'all';
        navigation.page = 'accounts';
      }}
      ><div>
        <span>Cuentas en cartera</span><span class="stat-icon neutral"
          ><Users size={18} /></span
        >
      </div>
      <strong>{portfolio.accounts.length}<small>cuentas</small></strong>
      <p>
        <span class="tiny-dot green"></span>{portfolio.accounts.filter(
          (a) => a.fresh,
        ).length} con datos del último corte
      </p></button
    >
  {/if}
  <button
    class="stat-card"
    onclick={() => {
      portfolio.filter = 'critical';
      navigation.page = 'overview';
    }}
    ><div>
      <span>Atención prioritaria</span><span class="stat-icon coral"
        ><Activity size={18} /></span
      >
    </div>
    <strong>{portfolio.critical.length}<small>cuentas</small></strong>
    <p>
      <span class="stat-chip coral">Revisar primero</span> Continuidad del agente
    </p></button
  >
  <button
    class="stat-card"
    onclick={() => {
      portfolio.filter = 'risk';
      navigation.page = 'overview';
    }}
    ><div>
      <span>MRR con señales de riesgo</span><span class="stat-icon amber"
        ><AlertTriangle size={18} /></span
      >
    </div>
    <strong>{money(portfolio.riskMRR)}<small>USD</small></strong>
    <p>
      {portfolio.risks.length} cuentas · incluye incidentes técnicos
    </p></button
  >
  <button
    class="stat-card"
    onclick={() => {
      portfolio.filter = 'growth';
      navigation.page = 'overview';
    }}
    ><div>
      <span>Potencial de expansión</span><span class="stat-icon purple"
        ><TrendingUp size={18} /></span
      >
    </div>
    <strong>+{money(portfolio.growthMRR)}<small>USD/mes</small></strong>
    <p>
      <span class="tiny-dot purple-dot"></span>{portfolio.growth.length} cuentas para
      revisar su plan
    </p></button
  >
</div>
