<script>
  let { portfolio, rule } = $props();
</script>

<div class="rule">
  <div>
    <h3>{rule.title}</h3>
    <p>{rule.desc}</p>
  </div>
  <div class="range-control">
    <input
      type="range"
      min={rule.min}
      max={rule.max}
      bind:value={portfolio.rules[rule.key]}
      aria-label={rule.title}
    /><output>{portfolio.rules[rule.key]} {rule.unit}</output>
  </div>
</div>
