<script>
  let { page, children } = $props();
</script>

<div class="page-heading">
  <div>
    <div class="eyebrow">{page.eyebrow}</div>
    <h1>{page.title}</h1>
    <p>{page.description}</p>
  </div>
  <div class="heading-actions">{@render children?.()}</div>
</div>
