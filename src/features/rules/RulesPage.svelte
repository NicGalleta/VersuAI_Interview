<script>
  import { ruleDefinitions } from './ruleDefinitions.js';
  import { RotateCcw } from 'lucide-svelte';
  import { defaults } from './defaults.js';
  import RulesImpact from './components/RulesImpact.svelte';
  import RuleControl from './components/RuleControl.svelte';
  let { portfolio, navigation } = $props();
</script>

<div class="rules-layout">
  <section class="panel information-panel">
    <div class="panel-heading">
      <h2>Criterios de seguimiento</h2>
      <button
        class="text-button"
        onclick={() => (portfolio.rules = { ...defaults })}
        ><RotateCcw size={14} />Restablecer</button
      >
    </div>
    {#each ruleDefinitions as rule}<RuleControl
        {portfolio}
        {rule}
      />{/each}<label class="checkbox"
      ><input type="checkbox" bind:checked={portfolio.rules.partial} /><span
        ><strong>El último mes es parcial</strong><small
          >No comparar su volumen con meses cerrados. Los incidentes técnicos y
          el atraso sí se revisan.</small
        ></span
      ></label
    >
  </section>
  <RulesImpact {navigation} {portfolio} />
</div>
